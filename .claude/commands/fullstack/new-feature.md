---
description: Plan and build a new feature end to end (frontend, backend, or fullstack) following orchestra standards
argument-hint: "<scope: frontend | backend | fullstack> <feature-name> <short description>"
---

Build the feature: $ARGUMENTS

## Step 1: Architect Planning & Database Design (Mandatory Approval First)
Determine the scope from arguments or context:

- **If the feature requires database persistence (new tables or schema changes):**
  1. Load [schema-design-pragmatics](../../skills/database/database-engineering/references/schema-design-pragmatics.md).
  2. Delegate to `database/database-architect` to produce the **Pragmatic Database Design Specification** (table budget, justification matrix, arrays/JSONB vs tables, storage tiering, Drizzle schema, Mermaid ER diagram).
  3. Ensure table count is right-sized (Auth <= 3 tables, Feature <= 3 tables; no runaway AI micro-tables).

- **Backend feature:** Delegate to `backend/backend-architect` for a plan (module placement, layers, design pattern selection, contracts, risks).
- **Frontend feature:** Delegate to `frontend/frontend-architect` for a plan (feature placement, server vs client rendering, TanStack Query keys, RHF/Zod schema, risks).
- **Fullstack feature:** Delegate to `fullstack/fullstack-agent` to align the shared contract first, then coordinate backend API and frontend UI plans.

**Stop and present the plan (including the Database Design Specification) to the user. Wait for explicit approval before writing any code or migrations.**

## Step 2: Implementation (After Approval)

### If Backend:
1. If schema changes exist: Delegate to `database/database-verifier` to audit the approved design, then delegate to `database/repository-builder` for repository interfaces, Drizzle schemas, migrations (`npm run db:generate`), and Symbol DI tokens.
2. Delegate to `backend/service-builder` for domain services and business logic consuming the repository interfaces.
3. If CQRS toggle is active, delegate to `backend/cqrs-handler` for commands, queries, handlers, and events.
4. Delegate to `backend/api-builder` for controllers, DTO validation, guards, and Swagger decorators.
5. Delegate to `fullstack/test-writer` for unit and integration tests.

### If Frontend:
1. Verify contracts in `packages/contracts` (or published contract package).
2. Delegate to `frontend/feature-builder` to implement components, hooks, and BFF proxy routes.
3. If new shared UI primitives are needed, delegate to `frontend/ui-builder` in `packages/ui`.
4. Delegate to `fullstack/test-writer` for component tests and integration tests.

### If Fullstack:
1. Build contract in `packages/contracts`.
2. Execute Backend steps 1-5 above (Database schemas/repos first, then services, then API).
3. Execute Frontend steps 1-4 above.

## Step 3: Automated Verification
- Backend: Delegate to `backend/backend-verifier` to run `npm run build && npm run lint && npm run test`.
- Frontend: Delegate to `frontend/frontend-verifier` to run `pnpm turbo run typecheck lint test --filter=...[HEAD]`.
- Report all test and build results verbatim.

## Step 4: Quality & Security Reviews
- Backend: Delegate to `backend/backend-reviewer`, `backend/contract-reviewer`, and `fullstack/security-reviewer`.
- Frontend: Delegate to `frontend/standards-reviewer`, `frontend/a11y-reviewer`, and `fullstack/performance-reviewer`.
- Hard-stop on any Blocker. List any Warnings.

## Step 5: Summary Report
Finish with:
- Files created and modified (with clickable file links).
- Commands executed and verbatim test results.
- Open questions, migration notes, or follow-ups.
