---
name: repository-pattern
description: Rules and implementation templates for all data-access work across any ORM (Mongoose, Drizzle, Prisma, TypeORM). Covers port interfaces, CosmonyX AbstractRepository (Mongoose) and BaseRepository (Drizzle), pagination, tenant isolation, and mock setup. Hook hard-blocks ORM imports in service files.
---

# Repository Pattern (Universal Multi-ORM & CosmonyX Standard)

All data access goes strictly through a typed domain repository interface (`IRepository<T, ID>`). Services inject the interface via a typed `Symbol` token — **NEVER the ORM/ODM directly**. Concrete implementations live exclusively in infrastructure; port interfaces live in domain.

```
Service → @Inject(USER_REPOSITORY) → IUserRepository  ← implements ← ConcreteRepo (Mongoose/Drizzle/Prisma/TypeORM) → Database
```

---

## 1. Universal Domain Port Interface (`IRepository<T, ID>`)

```typescript
// Monolith: src/database/repositories/repository.interface.ts
// Microservices (CosmonyX): libs/shared/src/repository/repository.interface.ts

export interface FindOptions<T> {
  where?: Partial<T>;
  order?: Partial<Record<keyof T, 'ASC' | 'DESC' | 'asc' | 'desc'>>;
  skip?: number;
  take?: number;
}

export interface PaginatedResult<T> {
  records: T[];
  meta: {
    total: number;
    page: number;
    limit: number;
    pages: number;
  };
}

export interface IRepository<T, ID = string> {
  findById(id: ID): Promise<T | null>;
  findOne(filter: Partial<T>): Promise<T | null>;
  findMany(filter?: Partial<T>): Promise<T[]>;
  paginate(options: {
    filter?: Partial<T>;
    search?: string;
    searchBy?: (keyof T)[];
    page?: number;
    limit?: number;
    sort?: Record<string, 'asc' | 'desc'>;
  }): Promise<PaginatedResult<T>>;
  create(data: Partial<T>): Promise<T>;
  createMany(items: Partial<T>[]): Promise<T[]>;
  update(id: ID, data: Partial<T>): Promise<T | null>;
  delete(id: ID): Promise<boolean>;
  count(filter?: Partial<T>): Promise<number>;
  exists(filter: Partial<T>): Promise<boolean>;
}
```

---

## 2. Pluggable Base Repositories by Stack

### 2.1 Mongoose Base Repository (CosmonyX `AbstractRepository` Standard)

Modeled directly after `COSMONYX-BE-001/libs/shared/src/common/abstracts/repository/abstract.repository.ts`:

```typescript
// infrastructure/repositories/mongoose-base.repository.ts
import { Logger, ConflictException, BadRequestException } from '@nestjs/common';
import { Model, Connection, FilterQuery, Types, ClientSession } from 'mongoose';
import { PaginatedResult } from './repository.interface';

export abstract class MongooseBaseRepository<TDocument extends { _id?: any }> {
  protected abstract readonly logger: Logger;

  constructor(
    protected readonly model: Model<TDocument>,
    protected readonly connection: Connection
  ) {}

  async findById(id: string | Types.ObjectId): Promise<TDocument | null> {
    return this.model.findById(id, {}, { lean: true }).exec() as Promise<TDocument | null>;
  }

  async findOne(filter: FilterQuery<TDocument>): Promise<TDocument | null> {
    return this.model.findOne(filter, {}, { lean: true }).exec() as Promise<TDocument | null>;
  }

  async findMany(filter?: FilterQuery<TDocument>): Promise<TDocument[]> {
    return this.model.find(filter || {}, {}, { lean: true }).exec() as Promise<TDocument[]>;
  }

  async create(data: Partial<TDocument>): Promise<TDocument> {
    try {
      const created = new this.model({
        ...(!data._id && { _id: new Types.ObjectId() }),
        ...data,
      });
      const saved = await created.save();
      return saved.toObject() as unknown as TDocument;
    } catch (err: any) {
      if (err.code === 11000 || err.message?.includes('duplicate')) {
        throw new ConflictException('Record already exists.');
      }
      throw new BadRequestException(`Validation error: ${err.message}`);
    }
  }

  async createMany(items: Partial<TDocument>[]): Promise<TDocument[]> {
    const inserted = await this.model.insertMany(items);
    return inserted.map((doc) => doc.toObject() as unknown as TDocument);
  }

  async update(id: string | Types.ObjectId, data: any): Promise<TDocument | null> {
    return this.model
      .findByIdAndUpdate(id, data, { new: true, lean: true })
      .exec() as Promise<TDocument | null>;
  }

  async delete(id: string | Types.ObjectId): Promise<boolean> {
    const res = await this.model.deleteOne({ _id: id } as FilterQuery<TDocument>);
    return (res.deletedCount ?? 0) > 0;
  }

  async count(filter?: FilterQuery<TDocument>): Promise<number> {
    return this.model.countDocuments(filter || {}).exec();
  }

  async exists(filter: FilterQuery<TDocument>): Promise<boolean> {
    const res = await this.model.exists(filter);
    return res !== null;
  }

  async paginate(options: {
    filter?: FilterQuery<TDocument>;
    search?: string;
    searchBy?: string[];
    page?: number;
    limit?: number;
    sort?: Record<string, 1 | -1 | 'asc' | 'desc'>;
  }): Promise<PaginatedResult<TDocument>> {
    const { filter = {}, search = '', searchBy = [], page = 1, limit = 10, sort = { createdAt: -1 } } = options;
    const offset = (page - 1) * limit;
    const query: FilterQuery<TDocument> = { ...filter };

    if (search.trim() && searchBy.length > 0) {
      const regex = new RegExp(search.trim(), 'i');
      query.$or = searchBy.map((field) => ({ [field]: regex })) as any;
    }

    const [records, total] = await Promise.all([
      this.model.find(query, {}, { lean: true }).sort(sort as any).skip(offset).limit(limit).exec(),
      this.model.countDocuments(query).exec(),
    ]);

    return {
      records: records as unknown as TDocument[],
      meta: { total, page, limit, pages: Math.ceil(total / limit) || 1 },
    };
  }

  async withTransaction<R>(operation: (session: ClientSession) => Promise<R>): Promise<R> {
    const session = await this.connection.startSession();
    try {
      let result: R;
      await session.withTransaction(async () => {
        result = await operation(session);
      });
      return result!;
    } finally {
      await session.endSession();
    }
  }
}
```

---

### 2.2 Drizzle Base Repository (CosmonyX Flat Standard)

Modeled directly after `COSMONYX-BE-001/libs/shared/src/repository/base.repository.ts`:

```typescript
// infrastructure/repositories/drizzle-base.repository.ts
import { Table, eq, sql, SQL, desc, asc } from 'drizzle-orm';
import { NodePgDatabase } from 'drizzle-orm/node-postgres';
import { PaginatedResult } from './repository.interface';

export abstract class DrizzleBaseRepository<TTable extends Table> {
  constructor(
    protected readonly db: NodePgDatabase<any>,
    protected readonly table: TTable
  ) {}

  async findById(id: string): Promise<any | null> {
    const [record] = await this.db
      .select()
      .from(this.table)
      .where(eq((this.table as any).id, id))
      .limit(1);
    return record ?? null;
  }

  async findMany(whereClause?: SQL): Promise<any[]> {
    let query = this.db.select().from(this.table);
    if (whereClause) query = query.where(whereClause) as any;
    return query;
  }

  async create(data: any): Promise<any> {
    const [inserted] = await this.db
      .insert(this.table)
      .values(data)
      .returning();
    return inserted;
  }

  async createMany(items: any[]): Promise<any[]> {
    return this.db.insert(this.table).values(items).returning();
  }

  async update(id: string, data: any): Promise<any | null> {
    const [updated] = await this.db
      .update(this.table)
      .set({ ...data, updatedAt: new Date() })
      .where(eq((this.table as any).id, id))
      .returning();
    return updated ?? null;
  }

  async delete(id: string): Promise<boolean> {
    const deleted = await this.db
      .delete(this.table)
      .where(eq((this.table as any).id, id))
      .returning();
    return deleted.length > 0;
  }

  async count(whereClause?: SQL): Promise<number> {
    let query = this.db.select({ count: sql<number>`count(*)::int` }).from(this.table);
    if (whereClause) query = query.where(whereClause) as any;
    const [result] = await query;
    return result?.count ?? 0;
  }

  async paginate(options: {
    whereClause?: SQL;
    page?: number;
    limit?: number;
    orderBy?: SQL;
  }): Promise<PaginatedResult<any>> {
    const { whereClause, page = 1, limit = 10, orderBy } = options;
    const offset = (page - 1) * limit;

    let dataQuery = this.db.select().from(this.table).limit(limit).offset(offset);
    if (whereClause) dataQuery = dataQuery.where(whereClause) as any;
    if (orderBy) dataQuery = dataQuery.orderBy(orderBy) as any;

    const [records, total] = await Promise.all([
      dataQuery,
      this.count(whereClause),
    ]);

    return {
      records,
      meta: { total, page, limit, pages: Math.ceil(total / limit) || 1 },
    };
  }
}
```

---

### 2.3 Prisma Base Repository

```typescript
// infrastructure/repositories/prisma-base.repository.ts
import { PaginatedResult } from './repository.interface';

export abstract class PrismaBaseRepository<TDelegate extends {
  findUnique: Function;
  findMany: Function;
  create: Function;
  createMany?: Function;
  update: Function;
  delete: Function;
  count: Function;
}> {
  constructor(protected readonly delegate: TDelegate) {}

  async findById(id: string): Promise<any | null> {
    return this.delegate.findUnique({ where: { id } });
  }

  async findOne(where: any): Promise<any | null> {
    return this.delegate.findUnique({ where });
  }

  async findMany(where?: any): Promise<any[]> {
    return this.delegate.findMany({ where });
  }

  async create(data: any): Promise<any> {
    return this.delegate.create({ data });
  }

  async createMany(items: any[]): Promise<any[]> {
    if (this.delegate.createMany) {
      return this.delegate.createMany({ data: items });
    }
    return Promise.all(items.map((data) => this.delegate.create({ data })));
  }

  async update(id: string, data: any): Promise<any | null> {
    return this.delegate.update({ where: { id }, data });
  }

  async delete(id: string): Promise<boolean> {
    const res = await this.delegate.delete({ where: { id } });
    return !!res;
  }

  async count(where?: any): Promise<number> {
    return this.delegate.count({ where });
  }

  async exists(where: any): Promise<boolean> {
    const count = await this.count(where);
    return count > 0;
  }

  async paginate(options: {
    where?: any;
    page?: number;
    limit?: number;
    orderBy?: any;
  }): Promise<PaginatedResult<any>> {
    const { where, page = 1, limit = 10, orderBy = { createdAt: 'desc' } } = options;
    const skip = (page - 1) * limit;

    const [records, total] = await Promise.all([
      this.delegate.findMany({ where, skip, take: limit, orderBy }),
      this.delegate.count({ where }),
    ]);

    return {
      records,
      meta: { total, page, limit, pages: Math.ceil(total / limit) || 1 },
    };
  }
}
```

---

### 2.4 TypeORM Base Repository

```typescript
// infrastructure/repositories/typeorm-base.repository.ts
import { Repository, FindOptionsWhere, FindManyOptions } from 'typeorm';
import { PaginatedResult } from './repository.interface';

export abstract class TypeOrmBaseRepository<TEntity extends { id?: any }> {
  constructor(protected readonly repo: Repository<TEntity>) {}

  async findById(id: any): Promise<TEntity | null> {
    return this.repo.findOne({ where: { id } as any });
  }

  async findOne(where: FindOptionsWhere<TEntity>): Promise<TEntity | null> {
    return this.repo.findOne({ where });
  }

  async findMany(where?: FindOptionsWhere<TEntity>): Promise<TEntity[]> {
    return this.repo.find({ where });
  }

  async create(data: Partial<TEntity>): Promise<TEntity> {
    const entity = this.repo.create(data as any);
    return this.repo.save(entity as any);
  }

  async createMany(items: Partial<TEntity>[]): Promise<TEntity[]> {
    const entities = this.repo.create(items as any);
    return this.repo.save(entities as any);
  }

  async update(id: any, data: Partial<TEntity>): Promise<TEntity | null> {
    await this.repo.update(id, data as any);
    return this.findById(id);
  }

  async delete(id: any): Promise<boolean> {
    const res = await this.repo.delete(id);
    return (res.affected ?? 0) > 0;
  }

  async count(where?: FindOptionsWhere<TEntity>): Promise<number> {
    return this.repo.count({ where });
  }

  async exists(where: FindOptionsWhere<TEntity>): Promise<boolean> {
    const count = await this.count(where);
    return count > 0;
  }

  async paginate(options: {
    where?: FindOptionsWhere<TEntity>;
    page?: number;
    limit?: number;
    order?: any;
  }): Promise<PaginatedResult<TEntity>> {
    const { where, page = 1, limit = 10, order = { createdAt: 'DESC' } } = options;
    const skip = (page - 1) * limit;

    const [records, total] = await this.repo.findAndCount({
      where,
      skip,
      take: limit,
      order,
    });

    return {
      records,
      meta: { total, page, limit, pages: Math.ceil(total / limit) || 1 },
    };
  }
}
```

---

## 3. Token Wiring & Module Registration

Decouple your service completely from concrete database implementations:

```typescript
// tokens.ts
export const USER_REPOSITORY = Symbol('USER_REPOSITORY');

// users.module.ts — swap ORM with zero changes to UsersService!
@Module({
  providers: [
    UsersService,
    {
      provide: USER_REPOSITORY,
      useClass: UserMongooseRepository, // or UserDrizzleRepository, UserPrismaRepository, UserTypeOrmRepository
    },
  ],
  exports: [USER_REPOSITORY],
})
export class UsersModule {}

// users.service.ts
@Injectable()
export class UsersService {
  constructor(
    @Inject(USER_REPOSITORY)
    private readonly userRepo: IUserRepository // Clean domain interface!
  ) {}
}
```

---

## 4. Mock in Unit Tests

Testing services requires zero database dependencies or containers:

```typescript
const mockUserRepo: jest.Mocked<IUserRepository> = {
  findById: jest.fn(),
  findOne: jest.fn(),
  findMany: jest.fn(),
  paginate: jest.fn(),
  create: jest.fn(),
  createMany: jest.fn(),
  update: jest.fn(),
  delete: jest.fn(),
  count: jest.fn(),
  exists: jest.fn(),
  findByEmail: jest.fn(),
};

const module = await Test.createTestingModule({
  providers: [
    UsersService,
    { provide: USER_REPOSITORY, useValue: mockUserRepo },
  ],
}).compile();
```

---

## 5. Anti-Patterns & Hard Rules

| Anti-Pattern | Violation | The Orchestra Fix |
|---|---|---|
| `from 'mongoose'` or `from 'drizzle-orm'` in service | Leaks DB implementation into business domain | Inject `Symbol` token with `IRepository<T>` interface |
| Returning raw Mongoose `Document` to service | Exposes MongoDB internal methods (`.save()`, `.populate()`) | Map to pure domain entity inside repository using `.lean()` / `.toObject()` |
| Using concrete repository class as DI token | Prevents swapping or mocking implementations | Always use `Symbol('NAME_REPOSITORY')` token |
| Business logic inside repository methods | Muddy separation of concerns | Repositories do persistence only; services do domain rules |
| Unbounded queries (`SELECT *` or `.find()`) | Memory bloat & DOS risk | Always paginate using `{ records, meta }` envelope |
