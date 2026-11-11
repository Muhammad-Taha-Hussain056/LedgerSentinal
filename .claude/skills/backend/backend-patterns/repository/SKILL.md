---
name: repository-pattern
description: Rules for all data-access work — new entities, ORM queries, pagination, tenant isolation, mock setup. Load alongside nestjs-engineering whenever the task touches persistence. Hook hard-blocks ORM imports in service files.
---

# Repository pattern

All data access goes through a typed repository interface. Services inject the interface via a `Symbol` token — never the ORM directly. Concrete implementations live in infrastructure; port interfaces live in domain.

```
Service → @Inject(REPO_TOKEN) → IRepository<Entity>  ← implements ← ConcreteRepo → ORM
```

## Interface and base class

```ts
// Monolith: src/database/repositories/repository.interface.ts
// Microservices (CosmonyX): libs/shared/src/repository/repository.interface.ts
export interface FindOptions<T> { where?: Partial<T>; order?: Partial<Record<keyof T, 'ASC'|'DESC'>>; skip?: number; take?: number; }
export interface Page<T> { data: T[]; total: number; page: number; pageSize: number; totalPages: number; }

export interface IRepository<T, ID = string> {
  findById(id: ID): Promise<T | null>;
  findOne(opts: FindOptions<T>): Promise<T | null>;
  findMany(opts?: FindOptions<T>): Promise<T[]>;
  findPaginated(page: number, size: number, opts?: FindOptions<T>): Promise<Page<T>>;
  create(data: Partial<T>): Promise<T>;
  update(id: ID, data: Partial<T>): Promise<T>;
  delete(id: ID): Promise<void>;
  exists(opts: FindOptions<T>): Promise<boolean>;
  count(opts?: FindOptions<T>): Promise<number>;
}

// Monolith: src/database/repositories/base.repository.ts
// Microservices (CosmonyX): libs/shared/src/repository/base.repository.ts
export abstract class BaseRepository<T, ID = string> implements IRepository<T, ID> {
  abstract findById(id: ID): Promise<T | null>;
  abstract findOne(opts: FindOptions<T>): Promise<T | null>;
  abstract findMany(opts?: FindOptions<T>): Promise<T[]>;
  abstract create(data: Partial<T>): Promise<T>;
  abstract update(id: ID, data: Partial<T>): Promise<T>;
  abstract delete(id: ID): Promise<void>;
  abstract exists(opts: FindOptions<T>): Promise<boolean>;
  abstract count(opts?: FindOptions<T>): Promise<number>;

  async findPaginated(page: number, size: number, opts?: FindOptions<T>): Promise<Page<T>> {
    const skip = (page - 1) * size;
    const [data, total] = await Promise.all([
      this.findMany({ ...opts, skip, take: size }),
      this.count(opts),
    ]);
    return { data, total, page, pageSize: size, totalPages: Math.ceil(total / size) };
  }
}
```

## Token + module wiring

```ts
// tokens.ts
export const USER_REPOSITORY = Symbol('USER_REPOSITORY');

// users.module.ts  — swap ORM without touching UsersService
{ provide: USER_REPOSITORY, useClass: UserDrizzleRepository }   // or UserTypeOrmRepository

// users.service.ts
constructor(@Inject(USER_REPOSITORY) private readonly repo: IRepository<User>) {}
```

## Mock in unit tests

```ts
const mockRepo: jest.Mocked<IRepository<User>> = {
  findById: jest.fn(), findOne: jest.fn(), findMany: jest.fn(),
  findPaginated: jest.fn(), create: jest.fn(), update: jest.fn(),
  delete: jest.fn(), exists: jest.fn(), count: jest.fn(),
};
{ provide: USER_REPOSITORY, useValue: mockRepo }
```

## Tenant isolation

```ts
// Every query adds the tenant predicate before returning data
async findManyForTenant(tenantId: string, opts?: FindOptions<User>): Promise<User[]> {
  return this.findMany({ ...opts, where: { ...opts?.where, tenantId } as any });
}
```

## Anti-patterns

| Anti-pattern | Fix |
|---|---|
| `drizzle`/`EntityManager` called in a service | Go through the repository interface |
| Returning ORM entity type to the service | Map to domain entity inside the concrete repo |
| Using concrete class as injection token | Use a `Symbol` token + `useClass` |
| Business logic inside a repository method | Repository does data access only |
| One repository for all entities | One repository per aggregate root |
| Missing tenant predicate | Apply `tenantId` in every query method that returns data |
