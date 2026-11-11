---
name: database-engineering
description: Standards, patterns, and architectural rules for pragmatic database design, multi-ORM schemas (Drizzle, Mongoose/MongoDB, Prisma, TypeORM), migrations, transactions, indexing, and storage tiering in NestJS. Load before designing or modifying schemas, repositories, or migrations.
---

# Database Engineering Standards (Multi-ORM & Universal)

This skill defines data persistence architecture for full-stack NestJS applications across relational databases (PostgreSQL, MySQL) and document databases (MongoDB). It supports **Drizzle ORM**, **Mongoose** (CosmonyX Enterprise Pattern), **Prisma**, and **TypeORM**.

## Master Principle: Pragmatic Modeling & Right-Sizing
Always design right-sized schemas. Avoid academic over-normalization (e.g. creating 20+ tables or collections for simple features like auth). Leverage modern database rich features (PostgreSQL arrays and JSONB, MongoDB embedded subdocuments), and strictly offload ephemeral data (rate limits, OTPs) to Redis/cache.

---

## Skill Routing (Load Before Acting)

| When the task involves | Load reference |
|---|---|
| Anti-over-normalization, table/collection sizing budgets, arrays vs. join tables, embedding vs referencing, storage tiering, agile schema evolution | `references/schema-design-pragmatics.md` |
| Concrete Drizzle ORM schema patterns, typed JSONB, array queries, base columns, GIN indexing | `references/drizzle-schema-patterns.md` |
| Concrete Mongoose & MongoDB patterns (CosmonyX Base Pattern), abstract schema, subdocuments, lean queries | `references/mongoose-schema-patterns.md` |
| Multi-ORM comparison and adapters guide (Drizzle, Mongoose, Prisma, TypeORM side-by-side) | `references/orm-adapters-guide.md` |
| Repository pattern, Symbol token wiring, CosmonyX BaseRepository/AbstractRepository, domain entity mapping | `../repository-pattern/SKILL.md` |

---

## 1. Stack & Persistence Architecture

Always check `.claude/orchestra.config.json` before writing code:
- **Configured ORM (`stack.orm`):** `"drizzle"` | `"mongoose"` | `"prisma"` | `"typeorm"`
- **Configured Database (`stack.database`):** `"postgres"` | `"mongodb"` | `"mysql"`
- **Cache / Ephemeral Tier:** Redis (or Valkey) for rate-limiting, transient OTPs, and distributed state.
- **Data Access Boundary:** Repository Pattern always. Services never import ORM/ODM instances (`db`, `Model`, `prisma`) directly; all queries are encapsulated in repositories injected via Symbol tokens.

---

## 2. Pragmatic Schema Sizing & Justification Gate

### 2.1 For Relational Databases (Drizzle, TypeORM, Prisma + Postgres/MySQL)
1. **Table Justification Gate:** Every table must pass at least one of the 4 justification criteria (Aggregate Root, Unbounded 1:N, True M:N, Independent Mutation).
2. **Table Budgets:** Auth <= 3 tables (`users`, `sessions`, optional `oauth_accounts`). Standard features <= 3 tables.
3. **PostgreSQL Rich Types:** Use native arrays (`text[]`) for bounded lists (roles, tags) and typed `jsonb` for semi-structured metadata. Avoid 1-to-1 table splits.
4. **Enums for States:** Use native `pgEnum` for finite state machines instead of single-column lookup tables.

### 2.2 For Document Databases (Mongoose + MongoDB - CosmonyX Standard)
1. **Document Justification Gate:** Embed subdocuments when data is bounded, tightly coupled, and queried together (e.g. user profile, address, preferences, order line items).
2. **Collection Budgets:** Auth is 1-2 collections max (`users`, `sessions`). Avoid creating 20+ collections requiring `$lookup`.
3. **Reference Collections Only When Unbounded:** Use referenced ObjectIds only for independent aggregate roots or unbounded collections (audit logs, invoices).
4. **Lean Reads:** Always use `.lean()` on read queries for zero Mongoose overhead and optimal memory/CPU performance.

### 2.3 Storage Tiering Rule (Both SQL & NoSQL)
Ephemeral tokens, rate-limit buckets, distributed locks, and transient verification codes belong in Redis, NEVER in PostgreSQL tables or MongoDB collections.

---

## 3. Mandatory Workflow: Database Design Before Backend Work

For any feature or module requiring data persistence:
1. **Design Phase (`database-architect`):** Run schema sizing and produce the Pragmatic DB Design Spec with Mermaid ER diagram and schema draft tailored to `config.stack.orm`.
2. **User Approval Gate (STOP & WAIT):** Present the DB design to the user. **No backend service, controller, or migration may be written before explicit user approval.**
3. **Verification (`database-verifier`):** Verify the schema complies with entity budgets, indexing rules, and zero raw SQL or un-sanitized queries.
4. **Implementation (`repository-builder`):** Generate schema/model files, run migrations (if SQL) or register schemas (if Mongoose), and implement the repository interface and concrete implementation.
5. **Backend Implementation:** Only now do `service-builder` and `api-builder` begin work.

---

## 4. Migration Safety & ACID Guarantees

1. **Relational Migrations (Drizzle, Prisma, TypeORM):**
   - Drizzle: Run `npm run db:generate` into `drizzle/`. Manually review every `.sql` file before running `npm run db:migrate`.
   - Never run `drizzle-kit push` in staging or production.
   - Breaking column changes must follow expand-and-contract pattern.
2. **Document Migrations (Mongoose):**
   - Schema evolves code-first via NestJS schema definitions.
   - Heavy data backfills run through versioned migration scripts (e.g., `migrate-mongo`).
3. **Transactions:**
   - Multi-record mutations must execute inside an atomic transaction block:
     - Drizzle: `await db.transaction(async (tx) => { ... })`
     - Mongoose: `await repo.withTransaction(async (session) => { ... })`
     - Prisma: `await prisma.$transaction(async (tx) => { ... })`
   - Any uncaught domain exception automatically triggers a `ROLLBACK` / aborts transaction.

---

## 5. Indexing & Query Rules

- **Foreign Keys & References:** Index every foreign key column (`user_id`, `company_id`) or referenced ObjectId.
- **Lookup Columns:** Index frequently filtered fields (`status`, `email`, `created_at`).
- **Compound Indexes:** Order from highest to lowest cardinality: `(company_id, status, created_at)`.
- **Specialized Indexes:** GIN indexes for Postgres arrays/JSONB; Compound/text indexes for MongoDB.
- **Mandatory Pagination:** Enforce `limit` and `offset`/`page` on all multi-row queries. Unbounded queries are strictly prohibited.

---

## 6. Hard Checkpoints
1. Repository pattern strictly isolates all database/ODM code from services.
2. Entity count strictly respects the Domain Budget.
3. Zero ephemeral data (rate limits, OTPs) in database tables or document collections.
4. Safe queries only: parameterized SQL bindings or sanitized Mongoose filters.
5. Every database entity/document maps to a domain DTO/Entity before leaving the repository boundary.
