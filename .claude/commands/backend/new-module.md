---
description: Scaffold a new NestJS module with all layers following the orchestra pattern
argument-hint: "<module-name> [monolith|microservice]"
---

Scaffold the module: $ARGUMENTS

## Step 1: Pre-requisite Database Design (If Data Persistence Required)
If the module introduces new entities, tables, or schema modifications:
1. Load [database-engineering](../../skills/database/database-engineering/SKILL.md) and [schema-design-pragmatics](../../skills/database/database-engineering/references/schema-design-pragmatics.md).
2. Delegate to `database/database-architect` to produce the **Pragmatic Database Design Specification**.
3. **Mandatory Approval:** Present the database design to the user. Do not scaffold backend files until the schema design is approved.
4. Delegate to `database/database-verifier` to audit schema sizing and indexes.

## Step 2: Module Scaffolding
1. Read `orchestra.config.json` to determine ORM, auth strategy, and toggles.
2. Create the flat module folder structure (see `nestjs-engineering` skill for layout):
   `apps/api/src/modules/<module-name>/` (controllers/, services/, dto/, constants/, <module-name>.module.ts).
   *Never create academic Hexagonal folders (/presentation, /application) or local guards inside the module.*
3. Generate in order:
   - Drizzle schema file in `src/database/schema/`
   - Domain entity class + repository port interface + Symbol injection token in `constants/`
   - Concrete repository implementation in `src/database/repositories/`
   - DTOs (Create, Update, Filter, Response) with class-validator decorators in `dto/`
   - Service class with constructor injection in `services/`
   - Module file wiring everything together in `<module-name>.module.ts`
   - Controller in `controllers/` consuming central Gateway decorators (`@ApiRoute`, `@AuthN`, `@AuthZ`, `@CurrentUser`, `@Public` from `src/decorators/`)
   - `spec` files for service and repository
4. If `toggles.cqrs` is true, generate the command/query/event shells alongside the service.
5. Run `npm run db:generate` to generate migration SQL.

## Step 3: Verification
Run backend verification:
```bash
npm run build && npm run lint && npm run test
```
Report all created files and test results.
