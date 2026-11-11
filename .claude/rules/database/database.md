---
paths:
  - "**/src/database/**"
  - "**/libs/shared/src/schemas/**"
  - "**/libs/shared/src/repository/**"
  - "**/src/**/*.repository.ts"
  - "**/src/**/*.schema.ts"
  - "**/src/**/*.model.ts"
  - "**/drizzle/**"
  - "**/drizzle.config.ts"
  - "**/prisma/**"
---

# Database Change Rules (Universal & Multi-ORM)

Apply to all database, ORM, ODM, repository, schema, and migration changes across any configured stack (Drizzle, Mongoose, Prisma, TypeORM).

## Before changing code

1. Read `.claude/orchestra.config.json` to inspect `config.stack.orm` and `config.stack.database`.
2. Load [database-engineering](../../skills/database/database-engineering/SKILL.md), [schema-design-pragmatics](../../skills/database/database-engineering/references/schema-design-pragmatics.md), and [repository-pattern](../../skills/database/repository-pattern/SKILL.md).
3. If ORM is Drizzle: load [drizzle-schema-patterns](../../skills/database/database-engineering/references/drizzle-schema-patterns.md).
4. If ORM is Mongoose: load [mongoose-schema-patterns](../../skills/database/database-engineering/references/mongoose-schema-patterns.md).
5. For multi-ORM wiring comparisons: load [orm-adapters-guide](../../skills/database/database-engineering/references/orm-adapters-guide.md).

## Required Checkpoints

- **Pre-Backend Approval Gate:** For any feature requiring data persistence, the schema MUST be planned by `database-architect`, verified by `database-verifier`, and approved by the user BEFORE writing any backend services, controllers, DTOs, or migration files.
- **Anti-Over-Normalization & Sizing Budgets:**
  - *Relational (Drizzle, TypeORM, Prisma + PostgreSQL/MySQL):*
    - Every proposed table must pass the Table Justification Test (Independent Aggregate Root, Unbounded 1:N Growth, True M:N with Metadata, Independent High-Frequency Mutation).
    - Strict Table Budgets: Auth is 2-3 tables max (`users`, `sessions`, optional `oauth_accounts`). Standard features are 1-3 tables max.
    - No 1-to-1 table splits (`user_profile`, `user_settings`). Embed as columns or typed `jsonb`.
    - Use native arrays (`text[]`, `uuid[]`) for small, bounded sets (roles, tags, scopes) instead of join tables.
    - Use native enums (`pgEnum`) for discrete state machines instead of 3-row lookup tables.
  - *Document (Mongoose + MongoDB - CosmonyX Standard):*
    - Apply Document Justification: embed subdocuments when data is bounded, tightly coupled, and queried together (profiles, preferences, addresses).
    - Use separate referenced collections ONLY for unbounded 1:N growth or independent aggregate roots.
    - Strict Collection Budget: Auth is 1-2 collections max (`users`, `sessions`). Avoid creating 20+ collections requiring `$lookup`.
- **Storage Tiering:**
  - Ephemeral tokens, rate-limit buckets, distributed locks, and transient verification OTPs belong in Redis/cache, NEVER in PostgreSQL tables or MongoDB collections.
- **Repository Boundary:**
  - Services and controllers NEVER import or call the ORM/ODM directly (`drizzle-orm`, `mongoose`, `@nestjs/mongoose`, `@prisma/client`, `typeorm`). All database access must be encapsulated behind a repository interface (`IRepository<T>`) and injected via a typed `Symbol` token.
- **ORM Types Isolation:**
  - ORM table types and Mongoose `Document` types stay strictly inside the repository layer. The repository must map database records/documents to clean domain entities before returning them to callers.
- **Safe Queries & Parameterization:**
  - SQL: Zero raw SQL string concatenation. All queries must use parameterized bindings through the ORM query builders.
  - MongoDB/Mongoose: Sanitize filter inputs to prevent NoSQL injection. Always use `.lean()` on read queries for optimal memory and CPU performance.
- **Migration & Schema Safety:**
  - Drizzle: Migrations generated via `npm run db:generate`, inspected, and applied via `npm run db:migrate`. Never run `drizzle-kit push` in production.
  - Mongoose: Schemas defined with TypeScript classes (`@Schema()`, `@Prop()`). Data migrations handled via versioned migration scripts.
  - Prisma: Migrations generated via `npx prisma migrate dev`.
  - TypeORM: Migrations generated via `typeorm migration:generate`.
  - Breaking schema changes must follow the expand-and-contract pattern.
- **Transactions:**
  - Multi-table writes (SQL) or multi-document writes (MongoDB) must run within an explicit transaction block (`db.transaction()` or Mongoose `withTransaction()`). Automatically rollback on uncaught domain exceptions.
- **Index Enforcement:**
  - Every foreign key, referenced ID, and frequently filtered field (`status`, `created_at`, `email`) must have an index defined in the schema.
  - GIN indexes for PostgreSQL arrays and JSONB paths; compound indexes for MongoDB queries filtering on multiple fields.
- **Universal Pagination:**
  - Multi-row queries must enforce pagination with `limit` and `page`/`offset`. Unbounded queries without limits are strictly prohibited.
  - Repositories standardize response envelopes: `{ records: T[], meta: { total, page, limit, pages } }` or `{ data, total, page, pageSize, totalPages }`.
