# Multi-ORM Adapters Guide (Drizzle, Mongoose, Prisma, TypeORM)

This guide shows how Full-Stack Orchestra provides **100% ORM portability**. A project configured for any ORM adheres to the exact same domain contracts, repository interfaces, and NestJS dependency injection architecture.

---

## 1. ORM Configuration Matrix (`orchestra.config.json`)

To target a specific database stack in your repository, simply update `config.stack` in `.claude/orchestra.config.json`:

```json
// Example 1: CosmonyX Mongoose Standard (MongoDB)
{
  "stack": {
    "framework": "nestjs",
    "language": "typescript",
    "orm": "mongoose",
    "database": "mongodb"
  },
  "database": {
    "schemaDir": "src/database/schemas",
    "repositoriesDir": "src/database/repositories"
  }
}

// Example 2: Drizzle ORM Standard (PostgreSQL)
{
  "stack": {
    "framework": "nestjs",
    "language": "typescript",
    "orm": "drizzle",
    "database": "postgres"
  },
  "database": {
    "migrationsDir": "drizzle",
    "schemaDir": "src/database/schema",
    "repositoriesDir": "src/database/repositories"
  }
}

// Example 3: Prisma Standard (PostgreSQL / MySQL)
{
  "stack": {
    "framework": "nestjs",
    "language": "typescript",
    "orm": "prisma",
    "database": "postgres"
  },
  "database": {
    "schemaDir": "prisma",
    "repositoriesDir": "src/database/repositories"
  }
}

// Example 4: TypeORM Standard (PostgreSQL / MySQL)
{
  "stack": {
    "framework": "nestjs",
    "language": "typescript",
    "orm": "typeorm",
    "database": "postgres"
  },
  "database": {
    "migrationsDir": "src/database/migrations",
    "schemaDir": "src/database/entities",
    "repositoriesDir": "src/database/repositories"
  }
}
```

---

## 2. The Universal Domain Port Interface

The service layer **NEVER imports any ORM package**. It interacts exclusively with pure domain contracts:

```typescript
// domain/user.repository.interface.ts
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

export interface IUserRepository extends IRepository<UserDomainEntity, string> {
  findByEmail(email: string): Promise<UserDomainEntity | null>;
}
```

---

## 3. Side-by-Side Schema Comparison

| Concept | Drizzle ORM | Mongoose (CosmonyX) | Prisma | TypeORM |
|---|---|---|---|---|
| **Definition Style** | Code-first schema files | Class decorators (`@Schema`) | DSL in `schema.prisma` | Class decorators (`@Entity`) |
| **Primary Key** | `uuid('id').defaultRandom().primaryKey()` | `_id: Types.ObjectId` (mapped to `id`) | `id String @id @default(uuid())` | `@PrimaryGeneratedColumn('uuid') id: string;` |
| **Timestamps** | `timestamp('created_at').defaultNow()` | `@Schema({ timestamps: true })` | `createdAt DateTime @default(now())` | `@CreateDateColumn() createdAt: Date;` |
| **Arrays (roles)** | `text('roles').array().notNull()` | `@Prop({ type: [String], default: ['member'] })` | `roles String[]` | `@Column('text', { array: true }) roles: string[];` |
| **Nested / JSON** | `jsonb('preferences').$type<Preferences>()` | `@Prop({ type: Preferences })` (embedded) | `preferences Json` | `@Column('jsonb') preferences: Preferences;` |
| **Foreign Key** | `references(() => companies.id)` | `@Prop({ type: SchemaTypes.ObjectId, ref: 'Company' })` | `company Company @relation(fields: [companyId], references: [id])` | `@ManyToOne(() => Company) company: Company;` |

---

## 4. Concrete Repository Implementations

### 4.1 Mongoose Concrete Repository (CosmonyX Standard)

```typescript
// infrastructure/repositories/user.mongoose.repository.ts
@Injectable()
export class UserMongooseRepository
  extends AbstractRepository<UserDocument>
  implements IUserRepository
{
  protected readonly logger = new Logger(UserMongooseRepository.name);

  constructor(
    @InjectModel(User.name) model: Model<UserDocument>,
    @InjectConnection() connection: Connection
  ) {
    super(model, connection);
  }

  async findByEmail(email: string): Promise<UserDomainEntity | null> {
    const doc = await this.findOne({ email: email.toLowerCase() });
    return doc ? this.mapToDomain(doc) : null;
  }

  private mapToDomain(doc: any): UserDomainEntity {
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

### 4.2 Drizzle Concrete Repository (CosmonyX Flat Pattern)

```typescript
// infrastructure/repositories/user.drizzle.repository.ts
@Injectable()
export class UserDrizzleRepository
  extends DrizzleBaseRepository<typeof users>
  implements IUserRepository
{
  constructor(@Inject(DRIZZLE_TOKEN) db: NodePgDatabase<any>) {
    super(db, users);
  }

  async findByEmail(email: string): Promise<UserDomainEntity | null> {
    const [row] = await this.db
      .select()
      .from(users)
      .where(eq(users.email, email.toLowerCase()))
      .limit(1);
    return row ? this.mapToDomain(row) : null;
  }

  private mapToDomain(row: any): UserDomainEntity {
    return {
      id: row.id,
      email: row.email,
      firstName: row.firstName,
      lastName: row.lastName,
      roles: row.roles,
      status: row.status,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
    };
  }
}
```

### 4.3 Prisma Concrete Repository

```typescript
// infrastructure/repositories/user.prisma.repository.ts
@Injectable()
export class UserPrismaRepository implements IUserRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findById(id: string): Promise<UserDomainEntity | null> {
    const row = await this.prisma.user.findUnique({ where: { id } });
    return row ? this.mapToDomain(row) : null;
  }

  async findByEmail(email: string): Promise<UserDomainEntity | null> {
    const row = await this.prisma.user.findUnique({ where: { email: email.toLowerCase() } });
    return row ? this.mapToDomain(row) : null;
  }

  async paginate(options: any): Promise<PaginatedResult<UserDomainEntity>> {
    const { page = 1, limit = 10, filter = {} } = options;
    const skip = (page - 1) * limit;
    const [rows, total] = await Promise.all([
      this.prisma.user.findMany({ where: filter, skip, take: limit, orderBy: { createdAt: 'desc' } }),
      this.prisma.user.count({ where: filter }),
    ]);
    return {
      records: rows.map(this.mapToDomain),
      meta: { total, page, limit, pages: Math.ceil(total / limit) || 1 },
    };
  }
  // Other methods...
  private mapToDomain(row: any): UserDomainEntity {
    return { ...row };
  }
}
```

### 4.4 TypeORM Concrete Repository

```typescript
// infrastructure/repositories/user.typeorm.repository.ts
@Injectable()
export class UserTypeOrmRepository implements IUserRepository {
  constructor(
    @InjectRepository(UserEntity)
    private readonly repo: Repository<UserEntity>
  ) {}

  async findById(id: string): Promise<UserDomainEntity | null> {
    const row = await this.repo.findOne({ where: { id } });
    return row ? this.mapToDomain(row) : null;
  }

  async findByEmail(email: string): Promise<UserDomainEntity | null> {
    const row = await this.repo.findOne({ where: { email: email.toLowerCase() } });
    return row ? this.mapToDomain(row) : null;
  }

  async paginate(options: any): Promise<PaginatedResult<UserDomainEntity>> {
    const { page = 1, limit = 10, filter = {} } = options;
    const skip = (page - 1) * limit;
    const [rows, total] = await this.repo.findAndCount({
      where: filter,
      skip,
      take: limit,
      order: { createdAt: 'DESC' as any },
    });
    return {
      records: rows.map(this.mapToDomain),
      meta: { total, page, limit, pages: Math.ceil(total / limit) || 1 },
    };
  }
  // Other methods...
  private mapToDomain(row: any): UserDomainEntity {
    return { ...row };
  }
}
```

---

## 5. Dependency Injection Wiring (Swapping Without Service Changes)

To swap an entire project from Drizzle to Mongoose or Prisma:
**The service file NEVER changes a single line of code!** Only the module's provider registration updates:

```typescript
// users.module.ts
providers: [
  UsersService,
  {
    provide: USER_REPOSITORY,
    // Swap this class based on config.stack.orm:
    useClass: UserMongooseRepository,   // Mongoose (CosmonyX)
    // useClass: UserDrizzleRepository, // Drizzle
    // useClass: UserPrismaRepository,  // Prisma
    // useClass: UserTypeOrmRepository, // TypeORM
  },
]
```

```typescript
// users.service.ts
@Injectable()
export class UsersService {
  constructor(
    @Inject(USER_REPOSITORY)
    private readonly userRepo: IUserRepository // Zero ORM types!
  ) {}
}
```

---

## 6. CLI Commands & Migration Tooling

| ORM | Generate Schema / Migration | Run Migration | Schema Config File |
|---|---|---|---|
| **Drizzle** | `npm run db:generate` (`drizzle-kit generate`) | `npm run db:migrate` | `drizzle.config.ts` |
| **Mongoose** | Code-first schemas (`@Schema`); data migrations via migration runner | `npm run db:migrate` (e.g. `migrate-mongo up`) | NestJS `MongooseModule.forRoot()` |
| **Prisma** | `npx prisma migrate dev --name <name>` | `npx prisma migrate deploy` | `prisma/schema.prisma` |
| **TypeORM** | `npm run typeorm migration:generate` | `npm run typeorm migration:run` | `data-source.ts` |
