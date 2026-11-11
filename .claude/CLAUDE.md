# Full-Stack Orchestra

Standards, skills, agents, commands and rules for NestJS + Next.js projects.
Clear structural separation across **Backend**, **Frontend**, **Database**, and **Fullstack**.
Project-specific values live in `.claude/orchestra.config.json`. Pinned library versions are printed at session start.

## Stack (fixed defaults — override in config)

**Backend:** NestJS 10+ · TypeScript strict · npm · class-validator + class-transformer · JWT + Passport · Jest + @nestjs/testing · Swagger · EventEmitter2 · @nestjs/cqrs.
**Frontend:** Next.js App Router · TypeScript strict · pnpm + Turborepo · TanStack Query + TanStack Table · Zustand · React Hook Form + Zod · Tailwind + shadcn/ui + Radix · Vitest + React Testing Library + Playwright + MSW.
**Database & ORM (Pluggable):** Configured in `.claude/orchestra.config.json` (`stack.orm` & `stack.database`):
- Supported ORMs: **Drizzle ORM** · **Mongoose / MongoDB** (CosmonyX Base Pattern) · **Prisma** · **TypeORM**.
- Supported Databases: PostgreSQL · MongoDB · MySQL.
- Architectural Core: Strict **Repository Pattern** with typed `Symbol` tokens (`IRepository<T>` port). Services and controllers are 100% ORM-agnostic; swapping the ORM only changes the concrete infrastructure repository class.
Contracts shared via published `@scope/contracts` package or internal workspace package.

---

## Directory Architecture (`.claude/`)

```
.claude/
├── agents/
│   ├── backend/       # backend-architect, api-builder, service-builder, cqrs-handler, verifier, reviewer, contract-reviewer
│   ├── frontend/      # frontend-architect, feature-builder, ui-builder, verifier, standards-reviewer, a11y-reviewer
│   ├── database/      # database-architect, repository-builder, database-verifier
│   └── fullstack/     # fullstack-agent, security-reviewer, performance-reviewer, test-writer
├── skills/
│   ├── backend/       # nestjs-engineering, backend-patterns (adapter, builder, cqrs, decorator, di, factory, observer, singleton, strategy)
│   ├── frontend/      # nextjs-engineering, arch-*, data-*, form-*, next-*, ui-a11y-checklist
│   ├── database/      # database-engineering, repository-pattern
│   └── fullstack/     # system-architecture, project-discovery, tool-testing
├── commands/
│   ├── backend/       # /new-module, /add-integration
│   ├── frontend/      # /new-page, /new-form, /new-table, /new-modal
│   ├── database/      # /db-design, /new-migration, /new-repository
│   └── fullstack/     # /new-feature, /review, /pr-review, /debug-fix, /hotfix, /refactor, /explain, /ship
├── rules/
│   ├── backend/       # backend.md
│   ├── frontend/      # frontend.md
│   ├── database/      # database.md
│   └── fullstack/     # security.md, code-style.md
├── hooks/             # guard-bash, guard-write, protect-files, scan-secrets, format-on-edit, session-start
├── orchestra.config.json
└── settings.json
```

---

## Backend golden rules (never break)

1. **npm only.** `npm run <script>`. Never yarn, bun, or npx for installs.
2. **Repository pattern always.** Services never call ORM directly. All data access through injected repository interfaces.
3. **Constructor injection always.** No property injection. Constructor parameters only.
4. **Custom tokens for interfaces.** `Symbol` token + `useClass`. Never inject concrete classes where an interface should own the contract.
5. **No business logic in controllers.** Validate (pipe + DTO), delegate (service), return (response DTO). Nothing else.
6. **No ORM types in service or controller.** ORM types stay in the repository layer.
7. **DTOs validate everything at the boundary.** `ValidationPipe` with `whitelist: true, forbidNonWhitelisted: true` globally.
8. **Guards before services.** Auth in guards; services assume verified actor context.
9. **Events fire after persistence.** `emit()` only after `await repo.create()` succeeds.
10. **Typed domain exceptions.** Never `throw new Error('string')` from a service.
11. **CQRS separates reads from writes.** Commands return void/ID. Queries return projections. Never mix.
12. **No cross-module file imports.** DI via module imports/exports only.
13. **Never commit secrets.** All credentials via `ConfigService`. Never hardcode.
14. **Never invent** libraries, APIs or options. Check the docs for the pinned version, or ask.
15. **Gateway & security core placement.** All cross-cutting security, guards, interceptors, filters, pipes, decorators, and middleware reside strictly in dedicated folders (`src/decorators/`, `src/filters/`, `src/guards/`, `src/interceptors/`, `src/interfaces/`, `src/middleware/`, `src/pipes/`) and wire globally in `app.module.ts` / `gateway.module.ts` via `APP_GUARD`, `APP_FILTER`, and `APP_INTERCEPTOR`. Never scatter or bury guards in feature subfolders.

## Frontend golden rules (never break)

1. **pnpm only.** `pnpm --filter <pkg> <script>`, `pnpm turbo run <task>`. Never npm, yarn, bun.
2. **Server Components by default.** `'use client'` on the smallest leaf only.
3. **Code placement is mechanical.** Feature → app shared → packages, promoted only when a second consumer exists.
4. **Features never import other features.** Compose in routes; share via `src/lib`, `src/components` or packages.
5. **Server data in TanStack Query.** Server prefetch + `HydrationBoundary`. Never copy into Zustand.
6. **Browser never calls NestJS directly.** Reads and mutations through BFF proxy.
7. **Mutations** are `useMutation` → BFF → NestJS, then invalidate Query keys and cache tags.
8. **Forms** are React Hook Form + Zod, schemas derived from `@scope/contracts`.
9. **UI from `@scope/ui` only.** Semantic tokens; no raw colors.
10. **Never cache per-user data in shared caches.** Anything reading cookies/headers is dynamic.
11. **Dates** are UTC ISO strings on the wire; format at display only.
12. **User-facing copy** in per-feature `messages.ts`, never inline.
13. **TypeScript:** no `any`, no `@ts-ignore`, no unexplained `!`.
14. **Auth:** middleware is optimistic redirect only. Real authorization in the server data layer.
15. **Never invent** libraries, APIs or options. If a skill doesn't cover it, check the docs or ask.

## Database golden rules (never break)

1. **All queries through repositories.** Controllers and services never import or call the ORM/ODM directly (`drizzle-orm`, `mongoose`, `@nestjs/mongoose`, `@prisma/client`, `typeorm`). All queries flow strictly through injected repository interfaces (`Symbol` token + `useClass`).
2. **ORM type isolation.** ORM table types and Mongoose Document types stay strictly inside the repository implementation. Repositories must map database records/documents to clean domain entities before returning them to callers.
3. **Universal pagination contract.** Multi-row queries must enforce pagination with `limit` and `page`/`offset`. Unbounded `SELECT *` or unbounded `.find()` without limits is strictly prohibited. Repositories return `{ records: T[], meta: { total, page, limit, pages } }` or `{ data, total, page, pageSize, totalPages }`.
4. **Anti-over-normalization & right-sizing.**
   - *Relational (Postgres/MySQL with Drizzle/TypeORM/Prisma):* Every table must pass the Table Justification Test. Do not create micro-tables for 1-to-1 attributes. Use native arrays (`text[]`) for bounded primitive lists and typed `jsonb` with Zod validation for semi-structured metadata. Domain budget: Auth <= 3 tables, Feature <= 3 tables.
   - *Document (MongoDB with Mongoose - CosmonyX Standard):* Apply Document Justification. Embed subdocuments when data is bounded, tightly coupled, and queried together (e.g., user profiles, addresses, preferences). Reference separate collections only for unbounded 1:N or independent aggregate roots. Never create 20+ collections with `$lookup`. Domain budget: Auth <= 3 collections.
5. **Storage tiering.** Durable domain records belong in the primary database; ephemeral counters, rate-limit buckets, distributed locks, and transient verification OTPs belong in Redis/cache, never in database tables or document collections.
6. **Safe queries & parameterization.** Zero raw SQL string concatenation. SQL ORMs must use parameterized query builders; Mongoose queries must sanitize inputs and use lean queries (`.lean()`) for read operations.
7. **Migration & schema safety.** Migrations and schema changes must be versioned, reviewed, and tested according to the configured ORM (e.g. `npm run db:generate` for Drizzle, Mongoose schema definitions with validation plugins, Prisma migrate, TypeORM migrations). Destructive push/sync commands are strictly prohibited in production.
8. **Transactions for multi-record writes.** Multi-table or multi-collection mutations must run inside an explicit transaction block (e.g. `db.transaction()` for Drizzle/TypeORM/Prisma, Mongoose ClientSession with `withTransaction()`). Automatically rollback on uncaught domain exceptions.
9. **Mandatory indexing.** Foreign keys/referenced IDs and frequently filtered fields (`status`, `created_at`, `email`) must have explicit indexes defined in the schema.
10. **Database design approval gate.** Before writing any backend service, controller, DTO, or schema migration, design the schema via `database-architect`, obtain user approval, and verify the design with `database-verifier`.

---

## Skill routing (load before acting)

### Backend skills (`skills/backend/`)
| When the task involves | Load skill |
|---|---|
| Module anatomy, feature boundaries, shared modules | `skills/backend/nestjs-engineering/references/nestjs-module-architecture.md` |
| Request pipeline, guards, interceptors, pipes | `skills/backend/nestjs-engineering/references/nestjs-request-lifecycle.md` |
| DTOs, class-validator, response shaping | `skills/backend/nestjs-engineering/references/nestjs-dto-validation.md` |
| JWT, AuthN, AuthZ, RBAC, `@CurrentUser` | `skills/backend/nestjs-engineering/references/nestjs-auth-guards.md` |
| Unit tests, integration tests, `@nestjs/testing` | `skills/backend/nestjs-engineering/references/nestjs-testing-patterns.md` |
| Exception filters, typed errors, response envelope | `skills/backend/nestjs-engineering/references/nestjs-error-handling.md` |
| File naming, class naming, folder structure | `skills/backend/nestjs-engineering/references/nestjs-naming-conventions.md` |
| Monolith track | `skills/backend/nestjs-engineering/references/nestjs-monolith-track.md` |
| Microservices track (RabbitMQ, TCP) | `skills/backend/nestjs-engineering/references/nestjs-microservices-track.md` |
| Agent handoff contracts | `skills/backend/nestjs-engineering/references/nestjs-handoffs.md` |
| Which design pattern to use | `skills/backend/backend-patterns/PATTERNS.md` |
| Adapter, Builder, CQRS, Decorator, DI, Factory, Observer, Singleton, Strategy | `skills/backend/backend-patterns/<pattern>/SKILL.md` |

### Database skills (`skills/database/`)
| When the task involves | Load skill |
|---|---|
| Master database engineering, multi-ORM stack, connection pooling, ACID, migrations | `skills/database/database-engineering/SKILL.md` |
| Pragmatic schema design, anti-over-normalization, table/collection budgets, arrays/subdocuments vs join tables, storage tiering, agile evolution | `skills/database/database-engineering/references/schema-design-pragmatics.md` |
| Drizzle ORM schema patterns, base columns, array queries, JSONB types, GIN indexing | `skills/database/database-engineering/references/drizzle-schema-patterns.md` |
| Mongoose & MongoDB schema patterns, CosmonyX base schema, embedded documents, lean queries, indexing | `skills/database/database-engineering/references/mongoose-schema-patterns.md` |
| Multi-ORM adapters guide (Drizzle, Mongoose, Prisma, TypeORM comparison and wiring) | `skills/database/database-engineering/references/orm-adapters-guide.md` |
| Repository pattern, Symbol token wiring, CosmonyX BaseRepository/AbstractRepository, domain entity mapping | `skills/database/repository-pattern/SKILL.md` |

### Frontend skills (`skills/frontend/`)
| When the task involves | Load skill |
|---|---|
| Adding app/package, `turbo.json`, workspace config | `skills/frontend/arch-monorepo-layout/SKILL.md` |
| Creating or restructuring a feature; cross-feature deps | `skills/frontend/arch-feature-boundaries/SKILL.md` |
| "Where does this file go?", naming, imports | `skills/frontend/arch-code-placement/SKILL.md` |
| `'use client'`, passing props server→client, providers | `skills/frontend/next-server-vs-client/SKILL.md` |
| Static/ISR/dynamic/streaming, caching, `loading.tsx` | `skills/frontend/next-rendering-modes/SKILL.md` |
| Middleware, protected routes, login/logout, 401 | `skills/frontend/next-middleware-auth/SKILL.md` |
| `next/image`, `next/font`, `next/script` | `skills/frontend/next-assets/SKILL.md` |
| Page titles, OG, sitemap, robots, JSON-LD | `skills/frontend/next-metadata-seo/SKILL.md` |
| TanStack Query, query keys, staleTime, prefetch | `skills/frontend/data-tanstack-query/SKILL.md` |
| Backend calls, BFF proxy, cookies, cache tags | `skills/frontend/data-bff-proxy/SKILL.md` |
| Any create/update/delete from UI, mutations | `skills/frontend/data-mutations/SKILL.md` |
| Client state, Zustand, URL state, "should this be Redux?" | `skills/frontend/data-client-state/SKILL.md` |
| Any form, validation, wizard, field array | `skills/frontend/form-rhf-zod/SKILL.md` |
| API errors, RFC 9457, toasts vs field errors | `skills/frontend/form-error-mapping/SKILL.md` |
| WCAG 2.2 AA manual accessibility verification | `skills/frontend/ui-a11y-checklist/SKILL.md` |

### Fullstack skills (`skills/fullstack/`)
| When the task involves | Load skill |
|---|---|
| System architecture topologies (F1 single app, F2 multi-app, F3 microfrontends) | `skills/fullstack/system-architecture/SKILL.md` |
| Project discovery, requirements quality, user journey mapping | `skills/fullstack/project-discovery/SKILL.md` |
| Tool and infrastructure testing | `skills/fullstack/tool-testing/SKILL.md` |

---

## Agents (delegate by role)

### Backend agents (`agents/backend/`)
| Agent | Tools | Use for |
|---|---|---|
| `backend/backend-architect` | Read, Grep, Glob | Read-only plan before any non-trivial backend build |
| `backend/api-builder` | Read, Write, Edit, Bash | Controllers, DTOs, guards, Swagger |
| `backend/service-builder` | Read, Write, Edit, Bash | Domain services, business logic |
| `backend/cqrs-handler` | Read, Write, Edit, Bash | Commands, queries, events, sagas |
| `backend/backend-verifier` | Read, Bash | Run build + lint + test; report verbatim |
| `backend/backend-reviewer` | Read, Grep, Glob, Bash | Architecture and pattern compliance review |
| `backend/contract-reviewer` | Read, Grep, Glob | API contract review (DTOs, guards, response shape) |

### Database agents (`agents/database/`)
| Agent | Tools | Use for |
|---|---|---|
| `database/database-architect` | Read, Grep, Glob | Read-only schema planner; enforces table sizing and produces DB design before backend work |
| `database/repository-builder` | Read, Write, Edit, Bash | Repository interfaces, ORM schemas, migrations, DB tokens |
| `database/database-verifier` | Read, Bash, Grep, Glob | Audit schemas against over-normalization, table budgets, and missing indexes |

### Frontend agents (`agents/frontend/`)
| Agent | Tools | Use for |
|---|---|---|
| `frontend/frontend-architect` | Read, Grep, Glob | Read-only placement and data-flow plan |
| `frontend/feature-builder` | Read, Write, Edit, Bash | Build a feature end to end from approved plan |
| `frontend/ui-builder` | Read, Write, Edit, Bash | Components in `packages/ui` with stories |
| `frontend/frontend-verifier` | Read, Bash | Run build + typecheck + lint + test; report verbatim |
| `frontend/standards-reviewer` | Read, Grep, Glob, Bash | Review diff against skills (blocker/warn report) |
| `frontend/a11y-reviewer` | Read, Grep, Glob, Bash | WCAG 2.2 AA manual checklist pass |

### Fullstack & Specialist Reviewers (`agents/fullstack/`)
| Agent | Tools | Use for |
|---|---|---|
| `fullstack/fullstack-agent` | Read, Write, Edit, Bash | NestJS ↔ Next.js integration under approved contract |
| `fullstack/security-reviewer` | Read, Grep, Glob, Bash | Audit for XSS, auth bypass, token handling, secrets, injection |
| `fullstack/performance-reviewer` | Read, Grep, Glob, Bash | Audit for re-renders, N+1 queries, memory leaks, bundle size |
| `fullstack/test-writer` | Read, Write, Edit, Bash | Fullstack tests: Jest backend + Vitest/Playwright frontend |

---

## Commands (`commands/`)

### Backend commands (`commands/backend/`)
- `/new-module`: Scaffold a NestJS module with all layers (controller, service, repository, DTOs).
- `/add-integration`: Add an external service using the Adapter pattern.

### Database commands (`commands/database/`)
- `/db-design`: Design a pragmatic, right-sized database schema from rough or clear agile requirements before backend implementation.
- `/new-migration`: Generate, review, and apply Drizzle database migration.
- `/new-repository`: Create repository interface, concrete ORM implementation, and token wiring.

### Frontend commands (`commands/frontend/`)
- `/new-page`: Scaffold Next.js App Router page (route, layout, section, metadata, loading skeleton).
- `/new-form`: Create a form (schema, component, mutation hook, tests).
- `/new-table`: Build a data table with TanStack Table, pagination, sorting, filters.
- `/new-modal`: Build an accessible modal/dialog/sheet with open state and focus trap.

### Fullstack commands (`commands/fullstack/`)
- `/new-feature`: Plan and build an end-to-end feature (frontend, backend, or fullstack).
- `/review`: Review current changes against orchestra standards.
- `/pr-review`: Multi-agent PR review (code standards + security + performance).
- `/debug-fix`: Structured bug diagnosis and fix workflow.
- `/hotfix`: Emergency minimal production fix workflow.
- `/refactor`: Safe refactoring workflow with test safety net.
- `/explain`: Code and architecture explanation with ASCII diagrams and mental models.
- `/ship`: Scan, test, commit, push, and PR with step-by-step confirmation.

---

## Rules enforcement (`.claude/rules/`)

- `rules/backend/backend.md`: NestJS architecture, module boundaries, exception filters, DTO validation.
- `rules/frontend/frontend.md`: Next.js App Router, Server Components leaf pattern, BFF proxy, TanStack Query.
- `rules/database/database.md`: Database access, repository isolation, migration safety, transactions, indexing.
- `rules/fullstack/security.md`: Authentication, JWT verification, XSS prevention, open redirect checks, secrets.
- `rules/fullstack/code-style.md`: Strict TypeScript (no `any`), kebab-case filenames, import grouping, complexity limits.

---

## How to work

1. Read `orchestra.config.json` and the session-start version list.
2. For anything beyond a one-file edit, get a plan from the appropriate architect first (`backend-architect`, `frontend-architect`, or `fullstack-agent`).
3. **Database-first gate:** For any task requiring data persistence, produce a pragmatic schema plan with `database-architect` first. Present it and wait for user approval before writing migrations, repositories, services, or APIs.
4. Load only the skills the routing table names. Missing skill from `.claude/skills`? Say so; never improvise its rules.
5. Backend: verify with `npm run build && npm run lint && npm run test`.
6. Frontend: verify with `pnpm turbo run typecheck lint test --filter=...[HEAD]`.
7. Database: verify with `npm run db:generate && npm run db:migrate && npm run test`.
8. Run `standards-reviewer` (frontend) or `backend-reviewer` + `contract-reviewer` (backend), plus `security-reviewer`, `performance-reviewer`, and `database-verifier` before reporting done.
9. Hooks auto-format and hard-block: wrong package managers, real `.env` reads, `--no-verify`, ORM in services, repos in controllers, cross-module imports, secrets, cross-feature imports, force-push. A block is a rule violation — fix the cause.
