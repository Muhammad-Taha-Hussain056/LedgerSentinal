---
description: Generate, review, and safely apply a database migration or schema update across configured ORMs (Drizzle, Mongoose, Prisma, TypeORM)
argument-hint: "<migration-name> <short description of schema change>"
---

Generate and apply database migration: $ARGUMENTS

## Step 1: Inspect Configured Stack
Read `.claude/orchestra.config.json` to inspect `config.stack.orm` (`drizzle`, `mongoose`, `prisma`, `typeorm`).

## Step 2: Schema Definition
1. Update or create the schema file in the configured directory (`schemaDir`):
   - **Mongoose:** `@Schema()` and `@Prop()` in `src/database/schemas/<name>.schema.ts` (extend `AbstractSchema`).
   - **Drizzle:** `pgTable` in `src/database/schema/<name>.ts`.
   - **Prisma:** Models in `prisma/schema.prisma`.
   - **TypeORM:** `@Entity()` in `src/database/entities/<name>.entity.ts`.
2. Adhere to [database-engineering](../../skills/database/database-engineering/SKILL.md) and sizing budgets.

## Step 3: Migration Generation
Execute the command matching `config.stack.orm`:
- **Drizzle:**
  ```bash
  npm run db:generate
  ```
- **Mongoose (Data Migration):**
  If schema changes require historical data migration, create a versioned script in `migrations/`:
  ```bash
  npm run migrate:create -- $ARGUMENTS
  ```
- **Prisma:**
  ```bash
  npx prisma migrate dev --name $ARGUMENTS
  ```
- **TypeORM:**
  ```bash
  npm run typeorm migration:generate -- -n $ARGUMENTS
  ```

## Step 4: Safety Inspection
Inspect the generated migration output:
- Confirm no unintended drop of tables, collections, or columns.
- Confirm column/field modifications are backwards-compatible (expand-and-contract pattern).
- If adding required fields/columns, verify a default value or backfill step exists.

## Step 5: Apply Migration
Run migration in local development:
- **Drizzle / TypeORM / Mongoose:** `npm run db:migrate`
- **Prisma:** `npx prisma migrate deploy`

## Step 6: Verification
1. Run backend build to ensure TypeScript types compile cleanly:
   ```bash
   npm run build
   ```
2. Run database/repository tests:
   ```bash
   npm run test
   ```
3. Report: migration created, statements executed, verification results verbatim.
