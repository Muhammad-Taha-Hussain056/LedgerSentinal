---
description: Create a database repository interface, concrete ORM/ODM implementation (Mongoose, Drizzle, Prisma, TypeORM), Symbol token wiring, and domain mapping
argument-hint: "<entity-name> <feature-module>"
---

Create database repository for: $ARGUMENTS

## Step 1: Check Configured Stack
Read `.claude/orchestra.config.json` to inspect `config.stack.orm` (`mongoose`, `drizzle`, `prisma`, `typeorm`).
Load [repository-pattern](../../skills/database/repository-pattern/SKILL.md) and [orm-adapters-guide](../../skills/database/database-engineering/references/orm-adapters-guide.md).

## Step 2: Define the Domain Port Interface
Create in `src/modules/<feature>/domain/repositories/<entity>.repository.interface.ts` (or `src/database/repositories/<entity>.interface.ts`):
- Pure TypeScript interface extending `IRepository<<Entity>DomainEntity>`.
- Zero ORM / Mongoose imports.
- Standard methods: `findById`, `findOne`, `findMany`, `paginate`, `create`, `createMany`, `update`, `delete`, `count`, `exists`.
- Input and return types are domain models or DTOs, never raw Mongoose Documents or ORM table rows.

## Step 3: Define the Symbol Token
Create in `src/modules/<feature>/constants/<feature>.constants.ts` or domain tokens:
```typescript
export const <ENTITY>_REPOSITORY = Symbol('<ENTITY>_REPOSITORY');
```

## Step 4: Implement Concrete Repository
Create in `src/modules/<feature>/infrastructure/repositories/<entity>.<orm>.repository.ts`:
- Implements `I<Entity>Repository`.
- Extends the appropriate Base Repository:
  - **Mongoose (CosmonyX Pattern):** Extends `AbstractRepository<<Entity>Document>` or `MongooseBaseRepository`. Injects `@InjectModel(<Entity>.name)` and `@InjectConnection()`.
  - **Drizzle:** Extends `DrizzleBaseRepository<typeof <entities>>`. Injects `@Inject(DRIZZLE_TOKEN)`.
  - **Prisma:** Implements interface and injects `PrismaService`.
  - **TypeORM:** Extends `TypeOrmBaseRepository<<Entity>Entity>`. Injects `@InjectRepository(<Entity>Entity)`.
- Explicitly maps internal DB documents/rows to domain entities using `.toDomain()` before returning to callers.

## Step 5: Wire in Module
In `<feature>.module.ts`:
```typescript
{
  provide: <ENTITY>_REPOSITORY,
  useClass: <Entity><Orm>Repository, // e.g. UserMongooseRepository or UserDrizzleRepository
}
```
Add `<ENTITY>_REPOSITORY` to `exports` if other modules require queries from this repository.

## Step 6: Verification
1. Run `npm run build` to ensure type-checking passes.
2. Delegate to `repository-builder` agent for integration/unit test scaffolding.
3. Run `npm run test` for repository test execution.
