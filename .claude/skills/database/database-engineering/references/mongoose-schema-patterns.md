# Mongoose & MongoDB Pragmatic Schema Patterns (CosmonyX Standard)

This reference provides production-ready, battle-tested Mongoose ODM patterns for NestJS applications, modeled directly after the **CosmonyX Enterprise Architecture** (`COSMONYX-BE-001/libs/shared/src/common/abstracts`).

It demonstrates pragmatic document modeling, subdocument embedding, schema indexing, lean query optimization, transactions, and the CosmonyX `AbstractRepository` pattern.

---

## 1. The CosmonyX Base Schema Standard

Every document schema extends `AbstractSchema` to guarantee standardized primary keys, timestamps, and clean JSON/Object serialization without leaking MongoDB internal fields (`_id`, `__v`) into domain layers.

```typescript
// libs/shared/src/common/abstracts/schema/abstract.schema.ts
// or src/database/schemas/abstract.schema.ts
import { Prop, Schema } from '@nestjs/mongoose';
import { SchemaTypes, Types } from 'mongoose';

@Schema({
  timestamps: true,
  toJSON: {
    virtuals: true,
    transform: (doc, ret) => {
      ret.id = ret._id.toString();
      delete ret._id;
      delete ret.__v;
      return ret;
    },
  },
  toObject: {
    virtuals: true,
    transform: (doc, ret) => {
      ret.id = ret._id.toString();
      delete ret._id;
      delete ret.__v;
      return ret;
    },
  },
})
export class AbstractSchema<T = Types.ObjectId | string> {
  @Prop({ type: SchemaTypes.ObjectId, default: () => new Types.ObjectId() })
  _id?: T | Types.ObjectId;

  createdAt?: Date;
  updatedAt?: Date;
}
```

---

## 2. Document Modeling: Embedding vs. Referencing

### 2.1 Pragmatic Document Justification Test

In MongoDB, **over-normalization (creating 20+ separate collections and using `$lookup` joins) destroys NoSQL performance and scalability**.

| Modeling Decision | Rule | Examples |
|---|---|---|
| **Embed Subdocument** | Data is bounded (< 100 items), tightly coupled to parent lifecycle, and almost always read/updated with parent. | User Profile, Settings/Preferences, Postal Addresses, Order Line Items, OAuth Provider Tokens. |
| **Reference Collection** | Relationship is unbounded (hundreds to millions of records), parent and child are queried independently, or child is an independent aggregate root. | User $\rightarrow$ AuditLogs, Company $\rightarrow$ Invoices, User $\rightarrow$ Transactions. |

### 2.2 Embedded Subdocuments Example

```typescript
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';

@Schema({ _id: false })
export class UserPreferences {
  @Prop({ default: 'system' })
  theme: 'light' | 'dark' | 'system';

  @Prop({ default: true })
  emailNotifications: boolean;

  @Prop({ default: 'en' })
  locale: string;
}

@Schema({ _id: false })
export class Address {
  @Prop({ required: true })
  street: string;

  @Prop({ required: true })
  city: string;

  @Prop({ required: true })
  country: string;

  @Prop({ required: true })
  postalCode: string;
}
```

### 2.3 Aggregate Root Schema (CosmonyX User Pattern)

```typescript
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, SchemaTypes, Types } from 'mongoose';
import { AbstractSchema } from './abstract.schema';
import { UserPreferences, Address } from './subdocuments';

export type UserDocument = HydratedDocument<User>;

@Schema({ collection: 'users', timestamps: true })
export class User extends AbstractSchema {
  @Prop({ required: true, trim: true, lowercase: true, unique: true, index: true })
  email: string;

  @Prop({ required: true })
  passwordHash: string;

  @Prop({ required: true, trim: true })
  firstName: string;

  @Prop({ required: true, trim: true })
  lastName: string;

  // Bounded primitive lists: Native string array (never a join table!)
  @Prop({ type: [String], default: ['member'], index: true })
  roles: string[];

  @Prop({ type: String, enum: ['ACTIVE', 'SUSPENDED', 'PENDING'], default: 'PENDING', index: true })
  status: string;

  // Embedded tightly-coupled attributes
  @Prop({ type: UserPreferences, default: () => ({}) })
  preferences: UserPreferences;

  @Prop({ type: Address, required: false })
  address?: Address;

  // Referenced Aggregate Root (Foreign Key)
  @Prop({ type: SchemaTypes.ObjectId, ref: 'Company', index: true, required: false })
  companyId?: Types.ObjectId;

  // Extensible metadata envelope for agile sprint changes
  @Prop({ type: SchemaTypes.Mixed, default: {} })
  metadata?: Record<string, any>;
}

export const UserSchema = SchemaFactory.createForClass(User);

// Compound indexes for high-frequency queries
UserSchema.index({ companyId: 1, status: 1, createdAt: -1 });
UserSchema.index({ firstName: 'text', lastName: 'text', email: 'text' });
```

---

## 3. The CosmonyX `AbstractRepository<TDocument>` Pattern

The CosmonyX `AbstractRepository` provides a robust, reusable base class implementing standard CRUD, pagination with regex search and filtering, aggregation, and atomic transactions.

```typescript
// libs/shared/src/common/abstracts/repository/abstract.repository.ts
import {
  BadRequestException,
  ConflictException,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import {
  FilterQuery,
  Model,
  Types,
  UpdateQuery,
  SaveOptions,
  Connection,
  ProjectionType,
  QueryOptions,
  ClientSession,
} from 'mongoose';
import { AbstractSchema } from '../schema/abstract.schema';

export interface PaginateOptions<TDocument> {
  filterQuery?: FilterQuery<TDocument>;
  search?: string;
  searchBy?: string[];
  limit?: number;
  offset?: number;
  page?: number;
  sort?: Record<string, 1 | -1 | 'asc' | 'desc'>;
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

export abstract class AbstractRepository<TDocument extends AbstractSchema> {
  protected abstract readonly logger: Logger;

  constructor(
    protected readonly model: Model<TDocument>,
    protected readonly connection: Connection
  ) {}

  async create(document: Partial<TDocument>, options?: SaveOptions): Promise<TDocument> {
    try {
      const createdDocument = new this.model({
        ...(!document._id && { _id: new Types.ObjectId() }),
        ...document,
      });
      const saved = await createdDocument.save(options);
      return saved.toObject() as unknown as TDocument;
    } catch (err: any) {
      if (err.message?.includes('duplicate') || err.code === 11000) {
        throw new ConflictException(`Record already exists.`);
      }
      throw new BadRequestException(`Invalid record data: ${err.message}`);
    }
  }

  async createMany(documents: Partial<TDocument>[]): Promise<TDocument[]> {
    try {
      const inserted = await this.model.insertMany(documents);
      return inserted.map((doc) => doc.toObject() as unknown as TDocument);
    } catch (err: any) {
      throw new BadRequestException(`Failed to insert records: ${err.message}`);
    }
  }

  async findById(
    id: string | Types.ObjectId,
    projection?: ProjectionType<TDocument>
  ): Promise<TDocument | null> {
    return this.model
      .findById(id, projection, { lean: true })
      .exec() as Promise<TDocument | null>;
  }

  async findOne(
    filterQuery: FilterQuery<TDocument>,
    projection?: ProjectionType<TDocument>
  ): Promise<TDocument | null> {
    return this.model
      .findOne(filterQuery, projection, { lean: true })
      .exec() as Promise<TDocument | null>;
  }

  async find(
    filterQuery?: FilterQuery<TDocument>,
    projection?: ProjectionType<TDocument>,
    options?: QueryOptions<TDocument>
  ): Promise<TDocument[]> {
    return this.model
      .find(filterQuery || {}, projection, { ...options, lean: true })
      .exec() as Promise<TDocument[]>;
  }

  async update(
    id: string | Types.ObjectId,
    update: UpdateQuery<TDocument>
  ): Promise<TDocument | null> {
    return this.model
      .findByIdAndUpdate(id, update, { new: true, lean: true })
      .exec() as Promise<TDocument | null>;
  }

  async delete(id: string | Types.ObjectId): Promise<boolean> {
    const res = await this.model.deleteOne({ _id: id } as FilterQuery<TDocument>);
    return (res.deletedCount ?? 0) > 0;
  }

  async count(filterQuery?: FilterQuery<TDocument>): Promise<number> {
    return this.model.countDocuments(filterQuery || {}).exec();
  }

  async exists(filterQuery: FilterQuery<TDocument>): Promise<boolean> {
    const res = await this.model.exists(filterQuery);
    return res !== null;
  }

  /**
   * CosmonyX Standard Pagination with multi-field search and sorting
   */
  async paginate(options: PaginateOptions<TDocument>): Promise<PaginatedResult<TDocument>> {
    const {
      filterQuery = {},
      search = '',
      searchBy = [],
      limit = 10,
      page = 1,
      offset = (page - 1) * limit,
      sort = { createdAt: -1 },
    } = options;

    const query: FilterQuery<TDocument> = { ...filterQuery };

    if (search.trim() && searchBy.length > 0) {
      const regex = new RegExp(search.trim(), 'i');
      query.$or = searchBy.map((field) => ({ [field]: regex })) as any;
    }

    const [records, total] = await Promise.all([
      this.model
        .find(query, {}, { lean: true })
        .sort(sort as any)
        .skip(offset)
        .limit(limit)
        .exec(),
      this.model.countDocuments(query).exec(),
    ]);

    return {
      records: records as unknown as TDocument[],
      meta: {
        total,
        page: Math.floor(offset / limit) + 1,
        limit,
        pages: Math.ceil(total / limit) || 1,
      },
    };
  }

  /**
   * Run operations within an ACID transaction session
   */
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

## 4. Concrete Repository Implementation (Domain Decoupling)

```typescript
// src/database/repositories/user.mongoose.repository.ts
// or libs/shared/src/repository/user.repository.ts
import { Injectable, Logger } from '@nestjs/common';
import { InjectModel, InjectConnection } from '@nestjs/mongoose';
import { Model, Connection } from 'mongoose';
import { AbstractRepository } from '../common/abstracts/repository/abstract.repository';
import { User, UserDocument } from '../schemas/user.schema';
import { IUserRepository, UserDomainEntity } from '../../modules/users/domain/user.repository.interface';

@Injectable()
export class UserMongooseRepository
  extends AbstractRepository<UserDocument>
  implements IUserRepository
{
  protected readonly logger = new Logger(UserMongooseRepository.name);

  constructor(
    @InjectModel(User.name) userModel: Model<UserDocument>,
    @InjectConnection() connection: Connection
  ) {
    super(userModel, connection);
  }

  async findByEmail(email: string): Promise<UserDomainEntity | null> {
    const doc = await this.findOne({ email: email.toLowerCase() });
    return doc ? this.toDomain(doc) : null;
  }

  // Map Mongoose Document -> Domain Entity (Zero Mongoose Leakage)
  private toDomain(doc: any): UserDomainEntity {
    return {
      id: doc.id || doc._id?.toString(),
      email: doc.email,
      firstName: doc.firstName,
      lastName: doc.lastName,
      roles: doc.roles || [],
      status: doc.status,
      createdAt: doc.createdAt,
      updatedAt: doc.updatedAt,
    };
  }
}
```

---

## 5. Module Wiring & Dependency Injection

```typescript
// users.module.ts
import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { User, UserSchema } from './schemas/user.schema';
import { UserMongooseRepository } from './infrastructure/user.mongoose.repository';
import { USER_REPOSITORY } from './constants/user.constants';
import { UsersService } from './services/users.service';
import { UsersController } from './controllers/users.controller';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: User.name, schema: UserSchema }]),
  ],
  controllers: [UsersController],
  providers: [
    UsersService,
    {
      provide: USER_REPOSITORY,
      useClass: UserMongooseRepository,
    },
  ],
  exports: [USER_REPOSITORY, UsersService],
})
export class UsersModule {}
```

```typescript
// users.service.ts — 100% ORM-Agnostic! Zero Mongoose types!
@Injectable()
export class UsersService {
  constructor(
    @Inject(USER_REPOSITORY)
    private readonly userRepo: IUserRepository
  ) {}

  async getUser(id: string) {
    const user = await this.userRepo.findById(id);
    if (!user) throw new NotFoundException('User not found');
    return user;
  }
}
```
