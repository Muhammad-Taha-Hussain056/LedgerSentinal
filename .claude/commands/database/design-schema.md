---
description: Design a pragmatic, right-sized database schema (Mongoose, Drizzle, Prisma, TypeORM) from rough or clear agile requirements before backend implementation
argument-hint: "<feature-name> <rough-or-clear-requirements>"
---

Design database schema for: $ARGUMENTS

## Step 1: Pragmatic Schema Architecture Planning
1. Read `.claude/orchestra.config.json` to inspect `config.stack.orm` (`mongoose`, `drizzle`, `prisma`, `typeorm`) and `config.stack.database`.
2. Load [database-engineering](../../skills/database/database-engineering/SKILL.md) and [schema-design-pragmatics](../../skills/database/database-engineering/references/schema-design-pragmatics.md).
   - If ORM is Mongoose: load [mongoose-schema-patterns](../../skills/database/database-engineering/references/mongoose-schema-patterns.md).
   - If ORM is Drizzle: load [drizzle-schema-patterns](../../skills/database/database-engineering/references/drizzle-schema-patterns.md).
3. Delegate to `database/database-architect` to produce the **Pragmatic Database Design Specification**:
   - Scope and entity boundary definitions from the provided rough or clear requirements.
   - **Entity Budget & Sizing Audit:** Target count vs budget (Auth <= 2-3 entities, Feature <= 1-3 entities).
   - **Justification Matrix:**
     - Relational (SQL): 4 Table Justification criteria (Aggregate Root, Unbounded 1:N, True M:N, Independent Mutation).
     - Document (MongoDB / CosmonyX): Document Justification (Embedded Subdocument vs Referenced Collection).
   - **Postgres Rich Types / MongoDB Subdocuments:** Arrays for bounded sets, typed JSONB / subdocuments for settings and metadata.
   - **Storage Tiering:** Offload ephemeral state (rate limits, OTPs, session blacklists) to Redis; durable domain records to primary DB.
   - **Mermaid ER Diagram** illustrating entities, relations, embedding, and cardinalities.
   - **Schema / Model Draft** tailored to the configured ORM with types, constraints, defaults, and indexes.
   - **Agile Evolution Plan:** How the schema absorbs future requirement iterations without breaking migrations.

## Step 2: User Approval Gate (Mandatory Stop)
**Stop and present the database design specification to the user. Wait for explicit approval before creating schema files, running migrations, or writing any backend code.**

## Step 3: Schema Verification
After user approval:
1. Delegate to `database/database-verifier` to audit the design against:
   - Over-normalization flags.
   - Missing foreign key, lookup, or compound indexes.
   - Storage tiering compliance.
2. Report the audit results verbatim.

## Step 4: Implementation Handoff
Once verified:
1. Delegate to `database/repository-builder` to implement:
   - Schema file in `src/database/schema/` or `src/database/schemas/` (or feature module).
   - Domain entity class + repository interface (`IRepository<T>`) + Symbol token.
   - Concrete repository implementation extending the corresponding Base Repository (`MongooseBaseRepository` / `AbstractRepository` or `DrizzleBaseRepository`).
2. Run database migration or schema validation command matching the configured ORM.
3. Proceed to backend service and API development (`service-builder`, `api-builder`).
