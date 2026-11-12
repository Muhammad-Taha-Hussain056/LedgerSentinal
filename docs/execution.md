# LedgerSentinel Implementation Plan

> **For agentic workers:** Use `superpowers:executing-plans` for task-by-task work, or `superpowers:subagent-driven-development` only if selected. Checkboxes and evidence record actual progress. The user authorized SETUP-01.1 through SETUP-02 and their development integrations, then SETUP-03.1 and SETUP-03.2 with successive “go on” instructions on 2026-11-12. Continue the established task-branch/development workflow and stop before SETUP-04.

**Goal:** Deliver the local, synthetic-data LedgerSentinel portfolio MVP without expanding its financial or security scope.  
**Architecture:** One Next.js app consumes allowlisted NestJS HTTP endpoints. A NestJS modular monolith owns PostgreSQL through repositories; Redis/BullMQ delivers work recoverable from a durable PostgreSQL inbox. Financial writes and reconciliation actions preserve exact money, immutable history, and transactional consistency.  
**Tech stack:** TypeScript, NestJS, PostgreSQL, Drizzle, Redis/BullMQ, Next.js, shared Zod contracts, shadcn UI, TanStack Query, React Hook Form, Jest, Vitest, and Playwright.  
**Spec:** [product.md](product.md) and [architecture.md](architecture.md). Read both before executing any task.  
**Status:** SETUP-01.1 through SETUP-03.2 implemented and verified. Evidence updated 2026-11-12. Stop before SETUP-04. Infrastructure startup, migration execution, and deployment remain unapproved; database schema approval is not inferred from these transport-contract tasks.

## 1. Baseline, corrections, and execution gates

The attached task-template request guides the slicing format. Where its examples conflict with the product/architecture, the baseline wins:

- Candidate discovery is exact amount/currency eligibility with reference/date evidence, not four-factor weighted scoring.
- Ingestion screens show processing records with manual refresh; no sockets or realtime telemetry.
- Operator retry targets a durable failed inbox record, not a new dead-letter queue product.
- PostgreSQL uniqueness and transactional state own idempotency. Redis check-and-set locks are optional contention optimizations, not a required financial guard.
- Preserve the architecture's five modules. Feature UI tasks belong to M4 even though their IDs retain each feature's `-05` suffix. Integration/packaging is M5; do not accidentally omit M4 by renumbering the attachment's example.
- Immutable financial/history records have no generic update/delete CRUD. Repository tasks implement only approved semantic operations.
- Database migrations follow actual dependencies, not filename examples. The inbox table must exist before a ledger foreign key references it.
- HTTP reads from Server Components use the server-only Nest adapter; browser operations use the allowlisted BFF. Neither path accesses PostgreSQL or Redis from Next.js.

**Gate A — Baseline review:** Confirm product scope, schema, technical choices, and package-manager resolution before implementation. Drafting this roadmap does not silently freeze those documents.

**Gate B — Toolchain/environment:** Approve the compatible exact-version matrix and the disposable local environment. The attachment requests PostgreSQL 16 and Redis 7.2; treat those as proposed major/minor container targets, with supported patch/image digests checked before pinning. Preserve Node 24.10.x–24.x and pnpm 10.24.0 unless explicitly revised.

**Gate C — Database:** Review generated SQL, custom invariant migrations, privileges, and the target environment before applying migrations. No migration execution is authorized now.

**Gate D — Feature completion:** Complete the feature's tests, typecheck/build, lint, and bounded diff review before advancing. Schema/contract changes have one owner each. Use specialist review at the schema and final integration gates rather than for each small task.

**Gate E — Public deployment:** Outside this roadmap's execution authority. A local-only BFF/operator trust model must not be published unchanged.

## 2. Global constraints and task rules

- One local workspace; one operator; synthetic records only. No tenant/user/session tables, login product, real payments, OCR, PDFs, FastAPI, automatic matching, write-offs, or public deployment.
- USD only, at most two decimal places; decimal strings on the wire; exact integer-cent arithmetic internally; no floating-point money or silent rounding.
- Two fixed accounts, exactly two journal postings, exact zero balance, one full reversal with a required reason; ON DELETE RESTRICT for all financial/history relationships.
- Database balance checks cover header insertion as well as posting insertion. Engine protections prevent later append, UPDATE, DELETE, and runtime TRUNCATE/DDL.
- Use repository interfaces, Symbol injection tokens, constructor injection, clean domain projections, and parameterized queries. ORM types stay inside database infrastructure.
- Financial/approval/reversal transactions are SERIALIZABLE with bounded whole-transaction retries. Lock the original journal before an affected invoice. No network calls inside these transactions.
- All cross-cutting artifacts stay in `apps/api/src/{decorators,filters,guards,interceptors,interfaces,middleware,pipes}` and are globally wired as specified.
- Unknown input fields are rejected. Invoice imports validate the envelope first and each row independently so partial-success reporting works.
- Protected API responses use verified actor context, never caller-supplied actor/workspace/permissions. Errors use RFC-9457, not the success envelope.
- Frontend features do not import sibling features. Thin routes compose public feature exports. Server data belongs in TanStack Query; forms use RHF/Zod; text lives in feature `messages.ts`.
- Root workspace installation uses the proposed pnpm exception; backend scripts use `npm --prefix apps/api run ...`. Do not produce a second npm lockfile. This remains gated by A.
- Estimate **15–20 minutes per task as a planning target**, not a guarantee. If the failing test plus deliverable cannot fit one focused session, split it into named child tasks here before implementation. Never declare a stub or skipped test a completed slice just to meet the estimate.
- For behavior: write the named failing tests, confirm the expected failure, implement the smallest complete interface/export, then run the stated command. For configuration, validate the real configuration/build rather than adding tests that merely echo its text.
- Each task ends with its verification command, recorded result, diff review, and a focused commit only when commits are authorized. Do not stage unrelated toolkit files. Git was initialized with documentation baseline `8da956a`; `development` is the integration branch and task branches start from it.

### 2.1 Command and test conventions

All commands below run from the repository root in PowerShell unless stated otherwise. They are **future commands**, becoming runnable only when their owning setup task creates the named script/configuration and implementation is authorized. None were run to verify an application during planning.

| Command family | Established by | Contract |
| --- | --- | --- |
| `npm --prefix apps/api run typecheck`, `build`, `lint` | SETUP-01.2 | Local installed compilers/linter, no hidden network installs. |
| `npm --prefix apps/api run test -- --runInBand --runTestsByPath <path>` | SETUP-01.2 | Jest config rooted at `apps/api`; accepts explicit unit, DB-integration, and HTTP spec paths. Missing tests fail; no pass-with-no-tests. |
| `pnpm --filter @project/contracts run typecheck` / `exec vitest run <path>` | SETUP-03.1 | Workspace package with explicit exports and compatible runtime consumption. |
| `pnpm --filter @project/web run typecheck` / `build` / `lint` | SETUP-01.3 | Next package scripts with strict TypeScript and local dependencies. |
| `pnpm --filter @project/web exec vitest run <path>` | SETUP-01.3 | Frontend unit/component verification with network fixtures through MSW. |
| `npm --prefix apps/api run db:generate`, `db:migrate` | SETUP-04 | Generation targets reviewed schema; migration execution requires disposable test-DB configuration and Gate C. Never production or an unspecified database. |
| `pnpm exec playwright test tests/e2e/<file>` | SETUP-01.3 | Root Playwright config with `tests/e2e`, API/web readiness, isolated fixtures, and cleanup limited to disposable environments. |
| `node --test tools/verification/<file>.test.mjs` | Named setup task | Real validation of the named configuration/architecture contract; Node test runner, no downloaded tools. |

Database integration tests require PostgreSQL and migrations at their named dependency revision. Their harness must refuse non-test databases. Unit tests do not require Redis/PostgreSQL. Fault tests start/stop only their owned disposable services; never flush a shared Redis instance or remove a developer's volumes.

**Dependency bootstrap:** During authorized implementation, every setup task that creates or changes a package manifest runs root `pnpm install` before its verification commands and records the lockfile change. Introduce `workspace:` dependencies only after their target package manifests exist: API does not import contracts in SETUP-01.2, and SETUP-03.2 adds the API/web contract dependencies. Root Playwright/TS-runner dependencies are declared before their named commands are used. Do not solve bootstrap failures with global installs, `npx` downloads, fake tests, or empty-package fallback.

### 2.2 Fixed interface ownership

| Owner / file | Interface consumed by later tasks |
| --- | --- |
| Contracts: `packages/contracts/src/index.ts` | Public money, pagination, problem, simulator-event, ledger, invoice, candidate, approval, and processing schemas/types; explicit safe exports. |
| Database: `apps/api/src/database/financial-unit-of-work.port.ts` | Semantic atomic settlement/reversal/approval operations and their domain inputs/results. No exported Drizzle transaction type. |
| Ledger: `apps/api/src/ledger/domain/ledger.port.ts` | `PostSettledPayment`, `ReversePayment`, `ReadLedger` use-case contracts matching architecture M1. |
| Ingestion: `apps/api/src/ingestion/domain/webhook-events.repository.port.ts` | Accept/find, due-page, locked processing, guarded failure recording, and guarded manual retry. No identity/payload mutation methods. |
| Reconciliation: `apps/api/src/reconciliation/domain/reconciliation.repository.port.ts` | Row import, bounded invoice/candidate/history queries, and atomic approval; no ledger ORM access. |
| Web: `apps/web/src/lib/api/server-api.ts`, `browser-api.ts` | Server-only Nest HTTP adapter and browser same-origin BFF client; preserve named contract/status/problem semantics. |

Signatures use named input/result objects, not positional parameter lists. Freeze the following declarations in the owning files before dependent work: `PostSettledPayment.execute(input: PostSettledPaymentInput): Promise<PostSettledPaymentResult>`, `ReversePayment.execute(input: ReversePaymentInput): Promise<ReversalResult>`, `ImportInvoices.execute(input: InvoiceImport): Promise<ImportResult>`, and `ApproveMatch.execute(input: ApproveMatchInput): Promise<ApprovalView>`. Post-settlement input names `sourceEventId` and the normalized SimulatorEvent; its result names `journalEntryId` and `created`. Reversal input names verified `actor`, `originalJournalEntryId`, and `reason`. Approval input names verified `actor`, `invoiceId`, and `journalEntryId`. The wire result fields come from architecture §7.1. Actor is internal-only and is never part of a browser body.

The shared financial unit of work owns the complete worker transaction, including inbox outcome and journal writes. Reuse M1's pure money/mapping policy inside it; never call an independently committing M1 service from an outer worker transaction and assume the two commits are atomic. Other API use cases invoke their own semantic atomic operations on that same infrastructure adapter. Do not invent a second interface with a similar name in another module.

## 3. Review focus

| High-risk condition | Required expected behavior | Owning tests |
| --- | --- | --- |
| Same settlement arrives under different event IDs | Existing result for identical normalized financial fields; permanent conflict for changed fields | INGESTION-03.4 |
| Old worker fails after another succeeds or manual retry starts | Stale failure cannot overwrite terminal outcome or new processing version | INGESTION-02.2, INGESTION-03.5 |
| Approval and reversal race | One consistent invoice/payment outcome; no active link to a reversed payment | RECONCILIATION-03.4, E2E-01.3 |
| One invalid row in a valid import | Per-row INVALID result while independent valid rows import | RECONCILIATION-03.1, RECONCILIATION-04.1 |
| Queue loses accepted work or worker crashes after commit | Durable redispatch and existing-result recovery; no duplicate money | INGESTION-03.3, E2E-01.2 |

## 4. Ordered phase map

| Order | Phase | Deliverable / dependency rule |
| --- | --- | --- |
| 0 | SETUP | Workspace, test harnesses, local service definition, shared contracts, pool, gateway |
| 1 | INGESTION-01 | Inbox schema prerequisite only; needed before ledger's source-event FK |
| 2 | M1 / LEDGER-01 through LEDGER-04.3 | Tested core financial records and API |
| 3 | M2 / INGESTION-02 through INGESTION-04.3 | Verified recoverable webhook processing |
| 4 | M3 / RECONCILIATION-01 through RECONCILIATION-04.3 | Invoice intake, human approval, reversal coordination |
| 5 | M4 / WEB, feature -05 tasks | Operator dashboard against the stable domain APIs |
| 6 | M5 / E2E | Cross-module evidence and reproducible local portfolio package |

The inbox prerequisite does not move M2's security/queue behavior ahead of M1. Ledger reversal initially has no invoice relations; M3 extends the shared atomic adapter with invoice coordination before reconciliation is exposed.

## 5. SETUP — Workspace, infrastructure definition, contracts, gateway

### SETUP-01.1 — Record toolchain and workspace configuration
- [x] **Goal / dependency:** After A/B, establish actual package boundaries and an exact compatible version matrix; do not copy unsupported sample versions blindly.
- **Files:** Root `package.json`, `pnpm-workspace.yaml`, `turbo.json`, `tsconfig.base.json`, `.gitignore`; `docs/toolchain.md`; `tools/verification/workspace.test.mjs`.
- **Deliverable:** Reserve package locations/names `@project/api`, `@project/web`, `@project/contracts`, `@project/ui`; manifests arrive in the following owning setup tasks. Declare workspace member patterns, dependency-direction policy and task graph; check Node/pnpm and document versions. No secret values or application behavior.
- **Verification:** `node --test tools/verification/workspace.test.mjs` — succeeds with valid declared member patterns, pinned package manager and build task graph; it does not falsely require later package manifests to exist yet. Revalidate actual package links in SETUP-03.2.
- **Evidence (2026-11-11; integration updated 2026-11-12):** Branch `chore/setup-01-1-workspace`, based on `development` at `8da956a`; committed as `98c3b92`, merged into development at `2043b44`, and pushed with explicit user authorization. Added the listed configuration, toolchain document, and six verification tests; generated `pnpm-lock.yaml` using root `pnpm install` (exit 0). Observed Node 24.10.0 and pnpm 10.24.0; installed Turbo 2.11.10, TypeScript 5.9.3, and YAML 2.9.1. Initial test run failed 6/6 because configuration/tool dependencies did not exist; GREEN command exited 0: 6 passed, 0 failed, 0 skipped. Rechecked after the harness installation: 6/6 passed. This is tooling evidence, not application readiness.
- **Scope ruling:** The user-approved setup uses root pnpm installation with npm backend script invocation. Later schema/migration gates and infrastructure startup remain separate. No SETUP-03 work is authorized by this continuation.

### SETUP-01.2 — Create the API compilation and Jest harness
- [x] **Goal / dependency:** SETUP-01.1; make backend checks real before feature work.
- **Files:** `apps/api/package.json`, `tsconfig.json`, `tsconfig.build.json`, `nest-cli.json`, `jest.config.cjs`, `eslint.config.mjs`, `src/app.module.ts`, `test/harness.spec.ts`.
- **Deliverable:** Strict Nest compilation; declared build/typecheck/lint/test scripts; unit and integration spec discovery; a real module-container smoke test. No feature placeholders counted as completed behavior.
- **Verification:** `npm --prefix apps/api run test -- --runInBand --runTestsByPath test/harness.spec.ts` — module boot succeeds; also `npm --prefix apps/api run typecheck`.
- **Evidence (2026-11-12):** `chore/setup-01-harnesses` from development `2043b44`; committed with SETUP-01.3 as `3df9279`, merged into development at `9c5d2d0`, and pushed. RED failed with TS2307 for absent AppModule; GREEN initialized/resolved/closed the real Nest container, 1/1 test passed. API typecheck, production compilation, ESLint and full Jest discovery all exited 0; exact harness command rechecked after the final dependency install, 1/1 passed. Windows execution used `npm.cmd` to preserve the `--` separator. Backend architect/reviewer found no blockers; an explicit nonexistent-test probe exited 1. Build emits AppModule and its map only, excluding tests. No HTTP listener, application services, contracts, persistence or security behavior was added. `build`/`dev` use the installed TypeScript compiler; Nest CLI metadata is reserved for the later bootstrap.

### SETUP-01.3 — Create frontend and browser-test harnesses
- [x] **Goal / dependency:** SETUP-01.1; provide one compilable Next app and reusable UI package.
- **Files:** `apps/web/package.json`, `next.config.ts`, `tsconfig.json`, `vitest.config.ts`, `src/app/layout.tsx`, `src/app/page.tsx`; `packages/ui/package.json`, `src/index.ts`; root `playwright.config.ts`; `apps/web/src/app/page.test.tsx`.
- **Deliverable:** Local typecheck/build/lint scripts, Vitest/RTL/MSW and root Playwright dependencies; semantic UI tokens and one exported primitive; route smoke test. Declare shared packages explicitly and avoid duplicate React runtimes.
- **Verification:** `pnpm --filter @project/web exec vitest run src/app/page.test.tsx` — route renders; also `pnpm --filter @project/web run build`.
- **Evidence (2026-11-12):** Same harness branch. RED failed on the absent shared UI export; GREEN passed 3 tests (route, Surface semantics/attributes, real MSW interception). Required Next production build exited 0 and prerendered `/`. Web and UI typecheck/lint exited 0. Typecheck generates Next route definitions before checking; generated next-env.d.ts stays ignored. `PLAYWRIGHT_CHANNEL=chrome pnpm exec playwright test tests/e2e/foundation.spec.ts` passed 2/2 using the installed Chrome and an owned loopback production server; desktop (1280px) and narrow (390px) screenshots were visually inspected, with no overflow or page errors. The channel is optional; default Playwright Chromium remains supported when installed. Strict premium static audit reported 0 findings. Frontend standards/a11y review found no blockers. Static foundation only: no financial data, BFF, auth, inactive actions, network providers, or feature screens. Browser API readiness is deferred to the actual HTTP bootstrap task.
- **Environment ruling:** Root `.npmrc` places this repository's npm/pnpm caches on D after C-drive ENOSPC interrupted installation. Task processes also use `.superpowers/tmp` on D. Root install completed successfully with the pinned versions. Latest MSW's transitive CLI dependency required a newer Node patch, so MSW 2.12.3 was selected for Node 24.10 compatibility; engine checks remain enabled. No unrelated user cache was deleted.

### SETUP-02 — Define the disposable local service environment
- [x] **Goal / dependency:** SETUP-01.1 and B; define PostgreSQL/Redis services without starting them in this planning phase.
- **Files:** `docker-compose.yml`, `.env.example`, `tools/verification/compose.test.mjs`.
- **Deliverable:** Proposed PostgreSQL 16/Redis 7.2 targets pinned to checked patch/digests; health checks, test-only database naming, loopback ports and isolated volumes; documented variable names without usable credentials. No app containers yet.
- **Verification:** `docker compose config --quiet` and `node --test tools/verification/compose.test.mjs` — valid configuration, bounded exposure, distinct test data location. Future startup requires explicit execution/environment authorization.
- **Evidence (2026-11-12):** Branch `chore/setup-02-local-services` was created from latest development `9c5d2d0` after the Setup 1 merge/push. Official PostgreSQL 16.15/Alpine 3.24 and Redis 7.2.17/Alpine 3.22 manifest-index digests were reverified against Docker's registry, including linux/amd64 and linux/arm64. RED policy suite failed 6/6 before the configuration existed; GREEN passed 6/6 with 0 skipped. Docker Compose v2.32.4 accepted `docker compose config --quiet` (exit 0), with `.env.example` selected and a process-only nonsecret validation marker. Tests parse both source YAML and normalized real Compose output, assert loopback ports/owned test volumes/health probes, reject missing or empty password, and check empty environment-variable examples. Bounded architecture/review found no blockers. No image pulls, container startup, database connection, schema or migration execution occurred.
- **Limits:** This is configuration verification, not database/queue runtime readiness. The initialization account is a disposable test superuser; later runtime access requires a separate restricted role. Fixed project names identify one owned test stack; concurrent disposable runs need separately owned project namespaces in their future harness. Never delete/reset shared resources automatically.

### SETUP-03.1 — Publish exact-money and common transport contracts
- [x] **Goal / dependency:** SETUP-01.1; establish serialization and public contract exports.
- **Files:** `packages/contracts/package.json`, `tsconfig.json`, `src/money.ts`, `pagination.ts`, `problem.ts`, `index.ts`, `src/common.test.ts`.
- **Deliverable:** Money strings reject exponents, extra decimals, nonfinite and out-of-range values; canonical output has two decimals. Pagination defaults 1/20, maximum limit 100; RFC-9457 extensions and success/list metadata. Explicit package exports work in both API and Next production builds.
- **Verification:** `pnpm --filter @project/contracts exec vitest run src/common.test.ts` — boundary-value cases pass; also `pnpm --filter @project/contracts run typecheck`.
- **Evidence (2026-11-12):** Branch `chore/setup-03-1-common-contracts` from latest development `1b6d5d9`. Root pnpm install exited 0 and generated the lockfile change. Initial RED failed on the absent public index; GREEN passed 73 common-contract tests. Typecheck, ESLint and tsup dual ESM/CJS/declaration build exited 0. `pnpm --filter @project/contracts run verify:exports` compiled real .mts/.cts consumers and passed 3 Node export tests, including private-subpath rejection. Bounded review identified oversized/inconsistent list acceptance; three explicit regression cases failed before the fix and the whole suite passed afterward. Runtime dependencies are Zod only. No API/web dependencies, endpoint/domain schemas, persistence, migrations or infrastructure were changed.
- **Contract rulings:** Leading-zero input normalizes rather than introducing an extra financial rejection rule; negative zero serializes as 0.00. Common money is signed/zero-capable; positive/nonzero domain rules remain SETUP-03.2. Pagination fields live in meta, empty results have pages 0, and list length cannot exceed limit/total. Field errors use path/code/message with an empty path allowed for root errors. Correlation IDs are safe 1–128-character tokens; problem schemas permit the named project extensions, not arbitrary diagnostics. See packages/contracts/README.md. The package stays private/workspace-based despite the toolkit's separate-repository publication example. Actual API/Next consumer builds remain SETUP-03.2.

### SETUP-03.2 — Publish the domain transport contracts
- [x] **Goal / dependency:** SETUP-03.1; serialize architecture §7.1 without ORM leakage.
- **Files:** `packages/contracts/src/ledger.ts`, `ingestion.ts`, `reconciliation.ts`, `index.ts`, `domain.test.ts`; consuming API/web manifests and build configuration.
- **Deliverable:** All named API request/response schemas; settled-only required financial fields; optional references; per-row import result; candidate evidence without scores; immutable resource/actor fields excluded from input. Unknown fields rejected at the correct envelope/row boundary.
- **Verification:** `pnpm --filter @project/contracts exec vitest run src/domain.test.ts` — known examples accepted, invalid enum/shape/identity fields rejected, pending events need no settlement timestamp. Also `npm --prefix apps/api run build` and `pnpm --filter @project/web run build` verify actual cross-package runtime/module consumption, not just TS aliases.
- **Evidence (2026-11-12):** `chore/setup-03-2-domain-contracts` from development `d99dd94`. RED failed 41/41 on absent schemas; final domain suite passed 53/53 and full common/domain suite passed 126/126. Contracts typecheck/build/ESLint and 3 compiled-export tests exited 0. Root pnpm install updated only the real API/web workspace links. Required API build compiled/executed a test-only CommonJS consumer; required web build compiled the actual app plus an isolated Next production fixture that parses a settled event during prerender and verifies canonical output in HTML. API regression passed 1/1; web regression passed 3/3; API/web typecheck and lint, and workspace 6/6 passed. Bounded contract review found no blockers. Public application modules/screens, endpoints, database schemas, migrations and infrastructure were not changed.
- **Contract rulings:** Invoice envelope records remain unknown until per-row validation, preserving partial outcomes; import results use ordered 1-based rows and checked lower-case outcome counts. Optional blank references normalize absent on input and explicit null on output. Actor attribution is a bounded trusted string, not UUID input. Common primitive definitions prevent cycles/duplication. Request/response money schemas remain distinct. Unknown event types remain valid ignored candidates, not a promise of processing effects. Signature verification, raw body-size limits, transaction/financial invariants, authorization and disclosure sanitization remain later tasks. Build fixtures are test-only, outside production source/output; direct builds require contracts built first.

### SETUP-04 — Add the database provider and safe test harness
- [ ] **Goal / dependency:** SETUP-01.2, SETUP-02; establish owned pooling and a disposable DB boundary before tables.
- **Files:** `apps/api/src/database/database.module.ts`, `database.provider.ts`, `financial-unit-of-work.port.ts`; `drizzle.config.ts`; `test/database-harness.ts`, `test/database-health.int.spec.ts`; API package scripts.
- **Deliverable:** ConfigService-managed pool, graceful close, parameterized health probe, db:generate/db:migrate scripts, migration-role separation, and test harness that refuses non-test targets. Port exports clean atomic-operation shapes. No migration application without C.
- **Verification:** `npm --prefix apps/api run test -- --runInBand --runTestsByPath test/database-health.int.spec.ts` — authorized disposable DB connects/closes; unsafe target configuration is refused.

### SETUP-05.1 — Add request context and raw-byte capture
- [ ] **Goal / dependency:** SETUP-01.2, SETUP-03.1.
- **Files:** `apps/api/src/main.ts`, `interfaces/request-context.interface.ts`, `middleware/correlation-id.middleware.ts`, `test/request-boundary.spec.ts`.
- **Deliverable:** Bounded correlation IDs, safe generation/response header, native raw-body capture, body-size limits; no duplicate parser. Exact signed bytes remain available before guard validation.
- **Verification:** `npm --prefix apps/api run test -- --runInBand --runTestsByPath test/request-boundary.spec.ts` — original whitespace/Unicode bytes survive capture; invalid IDs and oversized bodies have safe outcomes.

### SETUP-05.2 — Add response and logging interceptors
- [ ] **Goal / dependency:** SETUP-05.1, SETUP-03.1.
- **Files:** `apps/api/src/interceptors/response.interceptor.ts`, `logging.interceptor.ts`, `gateway.module.ts`; `test/interceptors.spec.ts`.
- **Deliverable:** Global APP_INTERCEPTOR wiring, single success envelope, pagination metadata, correlation-aware sanitized logs; problems are never wrapped as success.
- **Verification:** `npm --prefix apps/api run test -- --runInBand --runTestsByPath test/interceptors.spec.ts` — no duplicate envelope; no token/raw-body/secret content logged.

### SETUP-06.1 — Add local operator authentication and authorization
- [ ] **Goal / dependency:** A confirms architecture §9.1; SETUP-05.1.
- **Files:** `apps/api/src/guards/auth-n.guard.ts`, `auth-z.guard.ts`; `decorators/auth-n.decorator.ts`, `auth-z.decorator.ts`, `current-user.decorator.ts`, `public.decorator.ts`; `interfaces/actor-context.interface.ts`; `test/operator-auth.spec.ts`.
- **Deliverable:** Verify configured issuer/audience/signature/expiry; resolve fixed demo actor/capabilities; global AuthN then AuthZ; public route metadata is explicit. No login, refresh, registration, browser token storage, or client actor-header trust.
- **Verification:** `npm --prefix apps/api run test -- --runInBand --runTestsByPath test/operator-auth.spec.ts` — missing/expired/wrong-audience credentials denied; missing capability forbidden; body/header identity cannot escalate authority.

### SETUP-06.2 — Add validation, problems, route metadata, and health
- [ ] **Goal / dependency:** SETUP-04, SETUP-05.2, SETUP-06.1.
- **Files:** `apps/api/src/pipes/validation.pipe.ts`, `required.pipe.ts` only if needed; `filters/exceptions.filter.ts`; `decorators/api-route.decorator.ts`, `api-pagination.decorator.ts`; `operations/health.controller.ts`; `test/gateway-http.spec.ts`.
- **Deliverable:** Global strict validation and APP_FILTER; RFC-9457 status/content type and safe details; documentation metadata; minimal GET `/v1/health`. No unused multipart decorator. Configure import-envelope exception to recursive whole-batch validation without bypassing per-row validation later.
- **Verification:** `npm --prefix apps/api run test -- --runInBand --runTestsByPath test/gateway-http.spec.ts` — 400/401/403/503 contract and correlation hold; no raw stack/SQL; health exposes no credentials.

## 6. Shared schema prerequisite — INGESTION-01

### INGESTION-01 — Define the durable inbox schema first
- [ ] **Goal / dependency:** SETUP-04, SETUP-03.2; schema approval A/C.
- **Files:** `apps/api/src/database/schema/webhook-events.schema.ts`, `schema/index.ts`; generated `apps/api/drizzle/` artifacts; `test/inbox-schema.int.spec.ts`.
- **Deliverable:** Every architecture §5.4 column, including processing_version; immutable event identity/content, status and due-work indexes, uniqueness, nonnegative counters; explicit exports and reviewed generated SQL. This precedes the ledger's source-event FK.
- **Verification:** `npm --prefix apps/api run db:generate`; after C-authorized application to the disposable DB, `npm --prefix apps/api run test -- --runInBand --runTestsByPath test/inbox-schema.int.spec.ts` — duplicate identity and forbidden payload mutation fail.

## 7. M1 — Double-entry ledger engine

### LEDGER-01.1 — Define accounts and journals
- [ ] **Goal / dependency:** INGESTION-01; schema approval A/C.
- **Files:** `apps/api/src/database/schema/accounts.schema.ts`, `journal-entries.schema.ts`, `schema/index.ts`; generated migrations; `test/journal-schema.int.spec.ts`.
- **Deliverable:** Architecture §5.3/5.5 columns, USD/sign/precision/kind checks, fixed account codes, source-event/external-payment/reversal uniqueness, RESTRICT FKs and query indexes. Do not silently substitute rounding numeric(18,2).
- **Verification:** `npm --prefix apps/api run db:generate`; after reviewed test migration, `npm --prefix apps/api run test -- --runInBand --runTestsByPath test/journal-schema.int.spec.ts` — kind/identity/precision violations rejected.

### LEDGER-01.2 — Define postings and immutable history protections
- [ ] **Goal / dependency:** LEDGER-01.1.
- **Files:** `apps/api/src/database/schema/postings.schema.ts`, `schema/index.ts`; reviewed `apps/api/drizzle/` posting/protection migration; `test/ledger-immutability.int.spec.ts`.
- **Deliverable:** Signed exact amount checks; unique entry/account pair; indexed RESTRICT relations; journal/posting UPDATE/DELETE engine blocks; runtime account and TRUNCATE/DDL restrictions. Controlled two-account initializer is not a public CRUD API.
- **Verification:** `npm --prefix apps/api run db:generate`; after C, `npm --prefix apps/api run test -- --runInBand --runTestsByPath test/ledger-immutability.int.spec.ts` — runtime mutations/deletes/truncate and invalid precision fail.

### LEDGER-01.3 — Enforce deferred completeness and exact reversal
- [ ] **Goal / dependency:** LEDGER-01.2; reviewed migration owner only.
- **Files:** Reviewed `apps/api/drizzle/` invariant migration; `apps/api/test/ledger-balance.int.spec.ts`, `ledger-reversal-invariant.int.spec.ts`.
- **Deliverable:** Header and posting insertion trigger coverage; exactly two correct account/sign legs and zero sum; exact inverse reversal of a PAYMENT; one reversal only. Existing completed journals cannot gain new legs. Review schema with the database verifier before applying.
- **Verification:** `npm --prefix apps/api run test -- --runInBand --runTestsByPath test/ledger-balance.int.spec.ts test/ledger-reversal-invariant.int.spec.ts` — empty/one-leg/imbalanced/wrong-account/later-append and reversal-of-reversal cases roll back in PostgreSQL.

### LEDGER-02.1 — Implement immutable ledger repositories and projections
- [ ] **Goal / dependency:** LEDGER-01.3, SETUP-03.2.
- **Files:** `apps/api/src/ledger/domain/ledger.port.ts`, `ledger.repository.port.ts`; `database/repositories/accounts.repository.ts`, `journal-entries.repository.ts`; `test/ledger-repositories.int.spec.ts`.
- **Deliverable:** Symbol-bound ports; paginated account/journal/detail projections; signed net-debit balance; original/reversal relationships; exact string mapping. No generic ledger update/delete methods or ORM types outside infrastructure.
- **Verification:** `npm --prefix apps/api run test -- --runInBand --runTestsByPath test/ledger-repositories.int.spec.ts` — pagination/order, exact balances, missing-resource and mapping cases pass.

### LEDGER-02.2 — Implement the atomic financial unit of work
- [ ] **Goal / dependency:** LEDGER-02.1, SETUP-04.
- **Files:** `apps/api/src/database/repositories/financial-unit-of-work.ts`, `database.module.ts`; `test/financial-unit-of-work.int.spec.ts`.
- **Deliverable:** SERIALIZABLE writes and whole-transaction retry maximum three; lock-order contract; rollback; typed exception mapping; post-settlement and reversal result shapes. Reserve a semantic reconciliation-coordination operation for M3, with no imported reconciliation schema until it exists.
- **Verification:** `npm --prefix apps/api run test -- --runInBand --runTestsByPath test/financial-unit-of-work.int.spec.ts` — injected retryable failure retries whole unit, exhaustion maps safely, partial entries never survive.

### LEDGER-03.1 — Implement PostSettledPayment
- [ ] **Goal / dependency:** LEDGER-02.2.
- **Files:** `apps/api/src/ledger/domain/money.ts`, `exceptions.ts`; `application/post-settled-payment.ts`; `application/post-settled-payment.spec.ts`.
- **Deliverable:** Trusted settled-event input, strict exact-cent validation, fixed bank debit/unapplied-receipts credit mapping, idempotent existing-result projection. Accept no arbitrary posting arrays from an HTTP client.
- **Verification:** `npm --prefix apps/api run test -- --runInBand --runTestsByPath src/ledger/application/post-settled-payment.spec.ts` — exact 0.10/0.20, bad precision/currency/sign, and existing-settlement cases pass.

### LEDGER-03.2 — Implement ReversePayment
- [ ] **Goal / dependency:** LEDGER-03.1.
- **Files:** `apps/api/src/ledger/application/reverse-payment.ts`, `reverse-payment.spec.ts`; `test/reversal-concurrency.int.spec.ts`.
- **Deliverable:** Verified actor, original PAYMENT, required reason, exact inverse; repeated same reason returns original reversal; changed reason conflicts; reversal-of-reversal rejected. No invoice behavior claimed before M3.
- **Verification:** `npm --prefix apps/api run test -- --runInBand --runTestsByPath src/ledger/application/reverse-payment.spec.ts test/reversal-concurrency.int.spec.ts` — concurrent calls create one reversal and preserve original data.

### LEDGER-03.3 — Implement read use cases
- [ ] **Goal / dependency:** LEDGER-02.1.
- **Files:** `apps/api/src/ledger/application/read-ledger.ts`, `read-ledger.spec.ts`.
- **Deliverable:** Bounded filters, account views, journal summaries/details, typed not-found errors; show positive payment magnitude separately from zero-sum posting totals.
- **Verification:** `npm --prefix apps/api run test -- --runInBand --runTestsByPath src/ledger/application/read-ledger.spec.ts` — correct limits, missing IDs, reversal projection, and signed balance interpretation.

### LEDGER-04.1 — Add ledger DTO and OpenAPI parity
- [ ] **Goal / dependency:** LEDGER-03.1–03.3, SETUP-06.2.
- **Files:** `apps/api/src/ledger/dto/ledger-query.dto.ts`, `reversal.dto.ts`, `ledger-response.dto.ts`; `test/ledger-dto.spec.ts`.
- **Deliverable:** Shared-contract parity, UUID/enum/page validation, nonblank bounded reason, exact string response docs; no actor or account assignment in mutation input.
- **Verification:** `npm --prefix apps/api run test -- --runInBand --runTestsByPath test/ledger-dto.spec.ts` — overposting and blank reasons rejected; wire examples match contracts.

### LEDGER-04.2 — Implement the ledger controllers
- [ ] **Goal / dependency:** LEDGER-04.1, SETUP-06.1.
- **Files:** `apps/api/src/ledger/ledger.controller.ts`; `test/ledger-http.spec.ts`.
- **Deliverable:** Four architecture ledger endpoints with required capabilities, exact 200/201 duplicate semantics and RFC problems. Boundary tests use a test module with explicit use-case providers. No repository access from controller.
- **Verification:** `npm --prefix apps/api run test -- --runInBand --runTestsByPath test/ledger-http.spec.ts` — routes, denied credentials/capabilities, not-found, and repeated reversal behavior.

### LEDGER-04.3 — Compose and verify LedgerModule
- [ ] **Goal / dependency:** LEDGER-04.2.
- **Files:** `apps/api/src/ledger/ledger.module.ts`, `app.module.ts`; `test/ledger-module.int.spec.ts`.
- **Deliverable:** Symbol bindings, controller/use-case/repository composition and narrow public module exports. Verify real provider wiring against the disposable database rather than relying only on mocked HTTP tests.
- **Verification:** `npm --prefix apps/api run test -- --runInBand --runTestsByPath test/ledger-module.int.spec.ts` and `npm --prefix apps/api run build` — actual module resolves and ledger read/reversal use cases work through its providers.

## 8. M2 — Security, durable ingestion, and queue delivery

### INGESTION-02.1 — Implement inbox acceptance and due-work repository
- [ ] **Goal / dependency:** INGESTION-01, LEDGER-04.3.
- **Files:** `apps/api/src/ingestion/domain/webhook-events.repository.port.ts`; `database/repositories/webhook-events.repository.ts`; `test/inbox-repository.int.spec.ts`.
- **Deliverable:** Atomic insert-or-read by provider/event identity; same-hash duplicate versus conflict; paginated outcomes and due rows; immutable payload; verified identity/context only. No Redis dependency for accepted-work ownership.
- **Verification:** `npm --prefix apps/api run test -- --runInBand --runTestsByPath test/inbox-repository.int.spec.ts` — concurrent acceptance preserves one row and conflicts do not mutate it.

### INGESTION-02.2 — Implement guarded processing-state updates
- [ ] **Goal / dependency:** INGESTION-02.1.
- **Files:** `apps/api/src/database/repositories/webhook-events.repository.ts`; `test/inbox-state-races.int.spec.ts`.
- **Deliverable:** Locked terminal/due checks; version-conditioned failure recording after rollback; counters/due times; retryable FAILED→PENDING reset/version increment. A stale failure cannot overwrite completion or a new retry cycle.
- **Verification:** `npm --prefix apps/api run test -- --runInBand --runTestsByPath test/inbox-state-races.int.spec.ts` — old failure/new success, manual retry/old worker, and premature duplicate delivery cases pass.

### INGESTION-03.1 — Implement the simulator HMAC boundary
- [ ] **Goal / dependency:** SETUP-05.1, SETUP-03.2, INGESTION-02.1.
- **Files:** `apps/api/src/guards/hmac-signature.guard.ts`; `ingestion/adapters/simulator-event.adapter.ts`; `test/hmac-signature.spec.ts`.
- **Deliverable:** ASCII timestamp + period byte + original body bytes; strict milliseconds and ±300-second window; lowercase hex/length checks and timing-safe digest comparison; validated canonical event hash; no default secret.
- **Verification:** `npm --prefix apps/api run test -- --runInBand --runTestsByPath test/hmac-signature.spec.ts` — byte mutation, Unicode/whitespace, malformed/multiple headers, boundary timestamps, missing secret, and semantic-hash stability.

### INGESTION-03.2 — Implement queue adapter and bounded dispatcher
- [ ] **Goal / dependency:** INGESTION-02.2, SETUP-02, INGESTION-03.1.
- **Files:** `apps/api/src/ingestion/adapters/bullmq.adapter.ts`; `domain/queue.port.ts`; `application/dispatch-due-events.ts`; `test/dispatcher.int.spec.ts`.
- **Deliverable:** Constructor-injected configured Redis/BullMQ connection; bounded due-page scans; queue payload is inbox ID; queue failures leave due work recoverable. Any duplicate suppression has bounded TTL and cannot mark work completed or suppress redispatch indefinitely; stable job IDs must permit later due/manual-retry cycles.
- **Verification:** `npm --prefix apps/api run test -- --runInBand --runTestsByPath test/dispatcher.int.spec.ts` — unavailable Redis, duplicate enqueue, completed-job reuse, and later due-cycle delivery work safely.

### INGESTION-03.3 — Implement atomic settled-event processing
- [ ] **Goal / dependency:** INGESTION-03.2, LEDGER-03.1, LEDGER-02.2.
- **Files:** `apps/api/src/ingestion/application/process-event.ts`; `database/repositories/financial-unit-of-work.ts`; `test/event-processing.int.spec.ts`.
- **Deliverable:** Lock inbox, recheck terminal state/due time, read authoritative payload; journal+postings+COMPLETED commit together; pending/failed/unsupported provider types become IGNORED. No early financial success event.
- **Verification:** `npm --prefix apps/api run test -- --runInBand --runTestsByPath test/event-processing.int.spec.ts` — precommit rollback and postcommit redelivery preserve one entry; ignored events create none.

### INGESTION-03.4 — Resolve repeated settlement identities
- [ ] **Goal / dependency:** INGESTION-03.3.
- **Files:** `apps/api/src/ingestion/application/process-event.ts`; `test/settlement-identity.int.spec.ts`.
- **Deliverable:** On concurrent external-payment unique collision, roll back, reload winner, compare canonical amount/currency/reference/payer/time, then complete against its existing result or record permanent PAYMENT_CONTENT_CONFLICT. Do not retry all unique violations as transient failures.
- **Verification:** `npm --prefix apps/api run test -- --runInBand --runTestsByPath test/settlement-identity.int.spec.ts` — different event IDs/same payment create one journal; changed content creates no second credit.

### INGESTION-03.5 — Implement durable retry policy
- [ ] **Goal / dependency:** INGESTION-03.4, INGESTION-02.2.
- **Files:** `apps/api/src/ingestion/application/retry-policy.ts`, `retry-failed-event.ts`; `test/processing-retry.spec.ts`, `test/processing-retry.int.spec.ts`.
- **Deliverable:** Five recorded logical attempts/cycle, 1/2/4/8-second delays with bounded jitter, authoritative inbox version/due-time guards, separate safe postrollback failure recording, terminal permanent errors, and explicit eligible manual retry. Do not layer a second autonomous BullMQ retry budget over this policy.
- **Verification:** `npm --prefix apps/api run test -- --runInBand --runTestsByPath test/processing-retry.spec.ts test/processing-retry.int.spec.ts` — fake-clock boundaries, exhaustion, stale failure, forbidden retry, and duplicate pending retry outcomes.

### INGESTION-04.1 — Define and validate ingestion transport DTOs
- [ ] **Goal / dependency:** INGESTION-03.5, SETUP-03.2.
- **Files:** `apps/api/src/ingestion/dto/simulator-event.dto.ts`, `event-query.dto.ts`, `event-outcome.dto.ts`; `test/ingestion-dto.spec.ts`.
- **Deliverable:** Architecture §7.1 parity, settled-only required fields, unknown-field rejection, status/page validation, safe retryability/outcome projection. Signature validation still executes on raw bytes before these DTO pipes.
- **Verification:** `npm --prefix apps/api run test -- --runInBand --runTestsByPath test/ingestion-dto.spec.ts` — pending events need no fake settled time; malformed settled data fails; no payload/secrets in output.

### INGESTION-04.2 — Implement webhook and processing controllers
- [ ] **Goal / dependency:** INGESTION-04.1, SETUP-06.2.
- **Files:** `apps/api/src/ingestion/webhook.controller.ts`, `ingestion.controller.ts`; `test/ingestion-http.spec.ts`.
- **Deliverable:** Four architecture ingestion routes; public operator exemption does not bypass HMAC; 202 only after inbox persistence; duplicate200/conflict409; processing read/retry capabilities. Test module declares explicit use-case providers.
- **Verification:** `npm --prefix apps/api run test -- --runInBand --runTestsByPath test/ingestion-http.spec.ts` — all route statuses/auth boundaries and durable acknowledgement semantics.

### INGESTION-04.3 — Compose ingestion and the worker entry point
- [ ] **Goal / dependency:** INGESTION-04.2, LEDGER-04.3.
- **Files:** `apps/api/src/ingestion/ingestion.module.ts`, `src/worker.ts`, `src/app.module.ts`; `test/ingestion-module.int.spec.ts`.
- **Deliverable:** Actual inbox/queue/use-case bindings; separate HTTP and worker bootstraps; graceful queue/pool close; public ledger imports only, with no second transaction boundary around settlement processing.
- **Verification:** `npm --prefix apps/api run test -- --runInBand --runTestsByPath test/ingestion-module.int.spec.ts` and `npm --prefix apps/api run build` — real module dispatch/process smoke test and shutdown pass in owned test services.

## 9. M3 — Structured invoices and reconciliation

### RECONCILIATION-01.1 — Define invoice schema and indexes
- [ ] **Goal / dependency:** M2 gate passed; A/C-approved schema.
- **Files:** `apps/api/src/database/schema/invoices.schema.ts`, `schema/index.ts`; generated migrations; `test/invoice-schema.int.spec.ts`.
- **Deliverable:** Architecture §5.7 columns, exact positive USD amount, trimmed case-sensitive number identity, optional reference, current allocation uniqueness, status-pointer consistency, RESTRICT FK and filter/candidate indexes. Imported business content immutable.
- **Verification:** `npm --prefix apps/api run db:generate`; after C, `npm --prefix apps/api run test -- --runInBand --runTestsByPath test/invoice-schema.int.spec.ts` — identity/precision/status and competing-current-pointer checks.

### RECONCILIATION-01.2 — Define approval history and cross-record invariants
- [ ] **Goal / dependency:** RECONCILIATION-01.1.
- **Files:** `apps/api/src/database/schema/reconciliation-links.schema.ts`, `schema/index.ts`; reviewed generated/custom migration; `test/reconciliation-invariants.int.spec.ts`.
- **Deliverable:** Architecture §5.8 link schema, pair uniqueness, indexed RESTRICT FKs, append-only history. Deferred validation activates on invoice changes, new approvals, and reversal insertion. Current pointers require eligible equal-amount/currency payment and approval history; new links cannot target reversals. Keep old historical links after later reversal.
- **Verification:** `npm --prefix apps/api run db:generate`; after schema review/C, `npm --prefix apps/api run test -- --runInBand --runTestsByPath test/reconciliation-invariants.int.spec.ts` — invalid pointer/link and uncoordinated reversal roll back.

### RECONCILIATION-02.1 — Implement invoice and history repositories
- [ ] **Goal / dependency:** RECONCILIATION-01.2.
- **Files:** `apps/api/src/reconciliation/domain/reconciliation.repository.port.ts`; `database/repositories/invoices.repository.ts`, `reconciliation-links.repository.ts`; `test/reconciliation-repositories.int.spec.ts`.
- **Deliverable:** Row import with content-hash duplicate/conflict results; bounded invoice/history queries; historical reversal validity; current allocation projection. No generic content update/delete or mutable approval-row methods.
- **Verification:** `npm --prefix apps/api run test -- --runInBand --runTestsByPath test/reconciliation-repositories.int.spec.ts` — duplicate import, content immutability, history preservation, and stable pagination.

### RECONCILIATION-02.2 — Implement candidate query and evidence projection
- [ ] **Goal / dependency:** RECONCILIATION-02.1, LEDGER-02.1.
- **Files:** `apps/api/src/database/repositories/reconciliation-candidates.repository.ts`; `test/candidate-query.int.spec.ts`.
- **Deliverable:** Exact amount/currency, unreversed PAYMENT, unallocated payment; no candidate for currently matched invoice; optional reference evidence and date difference. Order exact reference first, then absolute date distance, then ID; bound all results. Do not sum postings as payment amount.
- **Verification:** `npm --prefix apps/api run test -- --runInBand --runTestsByPath test/candidate-query.int.spec.ts` — missing/different references remain eligible, reversed/allocated excluded, ties stable.

### RECONCILIATION-03.1 — Implement per-row structured import
- [ ] **Goal / dependency:** RECONCILIATION-02.1, SETUP-03.2.
- **Files:** `apps/api/src/reconciliation/application/import-invoices.ts`, `import-invoices.spec.ts`; `test/invoice-import.int.spec.ts`.
- **Deliverable:** 1–100-row envelope; independent row validation and atomic import; ordered CREATED/DUPLICATE/CONFLICT/INVALID outcomes with counts; no invoice edit, revenue posting, or required reference. Recover identical retries without replacement.
- **Verification:** `npm --prefix apps/api run test -- --runInBand --runTestsByPath src/reconciliation/application/import-invoices.spec.ts test/invoice-import.int.spec.ts` — valid+invalid mixed batch imports valid rows, preserves row numbers, and reports conflict safely.

### RECONCILIATION-03.2 — Implement candidate and history read workflows
- [ ] **Goal / dependency:** RECONCILIATION-02.2.
- **Files:** `apps/api/src/reconciliation/application/find-candidates.ts`, `read-invoices.ts`, `read-match-history.ts`; `test/reconciliation-reads.spec.ts`.
- **Deliverable:** Explicit missing invoice, empty candidates, bounded pagination, explainable reference/date facts and historical approval status; no score, match side effect, or vendor/date eligibility cutoff.
- **Verification:** `npm --prefix apps/api run test -- --runInBand --runTestsByPath test/reconciliation-reads.spec.ts` — empty/ambiguous results, optional reference and historical validity project correctly.

### RECONCILIATION-03.3 — Implement atomic human match approval
- [ ] **Goal / dependency:** RECONCILIATION-03.2, LEDGER-02.2.
- **Files:** `apps/api/src/reconciliation/application/approve-match.ts`; `database/repositories/financial-unit-of-work.ts`; `test/match-approval.int.spec.ts`.
- **Deliverable:** Lock journal then invoice; recheck unreversed kind, amount/currency and free allocation; append approval and update pointer/status atomically. Identical active pair returns existing result; missing/different reference never blocks; no additional ledger entry.
- **Verification:** `npm --prefix apps/api run test -- --runInBand --runTestsByPath test/match-approval.int.spec.ts` — two invoices/one payment, one invoice/two payments, repeated pair, mismatched currency/amount and changed reference cases.

### RECONCILIATION-03.4 — Complete reversal coordination with invoice history
- [ ] **Goal / dependency:** RECONCILIATION-03.3, LEDGER-03.2.
- **Files:** `apps/api/src/database/repositories/financial-unit-of-work.ts`; `test/reversal-match-races.int.spec.ts`.
- **Deliverable:** Same lock order for reversal and approval; exact reverse plus clear current pointer/set NEEDS_REVIEW in one transaction; retain approval history; exclude reversed payment from candidates; permit later manual match to another eligible payment. No cross-module internal imports.
- **Verification:** `npm --prefix apps/api run test -- --runInBand --runTestsByPath test/reversal-match-races.int.spec.ts` — both controlled interleavings preserve invariants; history survives; no automatic match appears.

### RECONCILIATION-04.1 — Define import, approval, and read DTOs
- [ ] **Goal / dependency:** RECONCILIATION-03.4.
- **Files:** `apps/api/src/reconciliation/dto/invoice-import.dto.ts`, `invoice-query.dto.ts`, `approval.dto.ts`, `reconciliation-response.dto.ts`; `test/reconciliation-dto.spec.ts`.
- **Deliverable:** Envelope-only global batch validation and explicit per-row validation; exact shared DTO parity, UUID/page/status limits, safe per-row field errors; optional reference. Document partial success accurately in Swagger.
- **Verification:** `npm --prefix apps/api run test -- --runInBand --runTestsByPath test/reconciliation-dto.spec.ts` — one invalid nested row does not throw whole-batch400; invalid envelope does.

### RECONCILIATION-04.2 — Implement reconciliation controllers
- [ ] **Goal / dependency:** RECONCILIATION-04.1.
- **Files:** `apps/api/src/reconciliation/invoices.controller.ts`, `reconciliation.controller.ts`; `test/reconciliation-http.spec.ts`.
- **Deliverable:** Six architecture invoice/reconciliation endpoints, capabilities, OpenAPI shapes, per-row import200, approval201/duplicate200 and safe conflict409; test module uses explicit application providers.
- **Verification:** `npm --prefix apps/api run test -- --runInBand --runTestsByPath test/reconciliation-http.spec.ts` — all six contracts/auth cases and reference-less approval.

### RECONCILIATION-04.3 — Compose reconciliation and the complete domain graph
- [ ] **Goal / dependency:** RECONCILIATION-04.2, INGESTION-04.3.
- **Files:** `apps/api/src/reconciliation/reconciliation.module.ts`, `app.module.ts`, `database/database.module.ts`; `test/reconciliation-module.int.spec.ts`.
- **Deliverable:** Narrow public module exports, real repository/unit-of-work bindings and final reversal coordination; no cyclic module internals or separately committed invoice updates.
- **Verification:** `npm --prefix apps/api run test -- --runInBand --runTestsByPath test/reconciliation-module.int.spec.ts` and `npm --prefix apps/api run build` — import→approve→reverse works through the composed providers and atomic adapter.

## 10. M4 — Operator dashboard and BFF

### WEB-01 — Establish the allowlisted server/BFF boundary
- [ ] **Goal / dependency:** SETUP-01.3, SETUP-06.1 and stable domain API contracts.
- **Files:** `apps/web/src/lib/api/server-api.ts`, `browser-api.ts`, `allowed-routes.ts`; `app/api/v1/[...path]/route.ts`; `src/lib/api/bff.test.ts`.
- **Deliverable:** Server-only Nest URL/operator JWT; browser same-origin client; fixed route+method allowlist excluding webhook; Host/Origin/content-type checks; filtered headers; preserved success/problems/status/correlation; bounded upstream timeout; no arbitrary URL proxy or DB/Redis dependency.
- **Verification:** `pnpm --filter @project/web exec vitest run src/lib/api/bff.test.ts` — forbidden path/method/origin denied, token never exposed, upstream409/503 preserved.

### WEB-02 — Establish shared workspace/query/form behavior
- [ ] **Goal / dependency:** WEB-01, SETUP-03.2.
- **Files:** `apps/web/src/app/layout.tsx`; `lib/query/provider.tsx`, `query-keys.ts`; `lib/forms/problem-errors.ts`; `components/workspace-nav.tsx`; `src/lib/query/workspace.test.tsx`.
- **Deliverable:** Request-isolated server QueryClient, hydration boundary pattern, semantic UI primitives, navigation, URL-backed page/filter state, field/root problem mapping, dynamic/no-store finance pages. No process-global financial query client or mirrored Zustand data.
- **Verification:** `pnpm --filter @project/web exec vitest run src/lib/query/workspace.test.tsx` — separate requests have isolated cache, error mapping retains input, loading/error/empty shell states render.

### LEDGER-05.1 — Add ledger HTTP hooks and server prefetch
- [ ] **Goal / dependency:** WEB-02, LEDGER-04.2.
- **Files:** `apps/web/src/features/ledger/api.ts`, `queries.ts`, `server.ts`, `index.ts`, `messages.ts`, `api.test.ts`.
- **Deliverable:** Accounts/journals/detail/reversal calls using contracts; browser through BFF and server prefetch through server adapter; exact query keys and post-reversal invalidation map. No sibling-feature imports.
- **Verification:** `pnpm --filter @project/web exec vitest run src/features/ledger/api.test.ts` — request shape, duplicate response, RFC problem mapping, and invalidation scopes.

### LEDGER-05.2 — Build ledger account and journal inspection
- [ ] **Goal / dependency:** LEDGER-05.1.
- **Files:** `apps/web/src/app/ledger/page.tsx`; `features/ledger/ledger-screen.tsx`, `ledger-screen.test.tsx`, `messages.ts`.
- **Deliverable:** Account signed balances and paginated journal table, URL filters, exact cents formatting, original/reversal indicators, empty/loading/error states. Initial server prefetch hydrates the same query keys.
- **Verification:** `pnpm --filter @project/web exec vitest run src/features/ledger/ledger-screen.test.tsx` — paging/filter rendering, negative liability net debit display, safe long text and failed load.

### LEDGER-05.3 — Build journal detail and confirmed reversal
- [ ] **Goal / dependency:** LEDGER-05.2, RECONCILIATION-03.4.
- **Files:** `apps/web/src/app/ledger/[id]/page.tsx`; `features/ledger/journal-detail.tsx`, `reversal-dialog.tsx`, `reversal-dialog.test.tsx`, `messages.ts`.
- **Deliverable:** Two signed postings and immutable history; reason validation and explicit full-reversal confirmation; pending-button protection; conflict/existing-result recovery; original/reversal navigation and affected-invoice review message. No optimistic financial success.
- **Verification:** `pnpm --filter @project/web exec vitest run src/features/ledger/reversal-dialog.test.tsx` — blank reason denied, double submit guarded, ambiguous/conflict outcome handled, focus restored after cancel/success.

### INGESTION-05.1 — Add processing read/retry HTTP integration
- [ ] **Goal / dependency:** WEB-02, INGESTION-04.2.
- **Files:** `apps/web/src/features/ingestion/api.ts`, `queries.ts`, `server.ts`, `index.ts`, `messages.ts`, `api.test.ts`.
- **Deliverable:** Status-filtered list/detail and explicit retry; shared EventOutcome DTO; current processing version stays server-owned; retry invalidates processing records, not a fake completion state.
- **Verification:** `pnpm --filter @project/web exec vitest run src/features/ingestion/api.test.ts` — pending/completed/ignored/failed outcomes and forbidden retry errors preserved.

### INGESTION-05.2 — Build the processing list
- [ ] **Goal / dependency:** INGESTION-05.1.
- **Files:** `apps/web/src/app/ingestion/page.tsx`; `features/ingestion/event-list.tsx`, `event-list.test.tsx`, `messages.ts`.
- **Deliverable:** Paginated status filter, explicit manual refresh, attempt/outcome labels, safe errors and empty state. No realtime/socket dependencies and no PENDING-as-completed-money display.
- **Verification:** `pnpm --filter @project/web exec vitest run src/features/ingestion/event-list.test.tsx` — status/filter/page/manual refresh and disabled/retryable states are correct.

### INGESTION-05.3 — Build event detail and durable retry control
- [ ] **Goal / dependency:** INGESTION-05.2.
- **Files:** `apps/web/src/app/ingestion/[id]/page.tsx`; `features/ingestion/event-detail.tsx`, `retry-dialog.tsx`, `retry-dialog.test.tsx`, `messages.ts`.
- **Deliverable:** Processing timestamps, safe failure code, linked journal when completed, confirmation for eligible manual retry; permanent conflicts explain why retry is unavailable. No raw payload/secret trace display or separate DLQ UI.
- **Verification:** `pnpm --filter @project/web exec vitest run src/features/ingestion/retry-dialog.test.tsx` — forbidden retry, repeated pending result, 503 and successful requeue retain truthful state.

### RECONCILIATION-05.1 — Add invoice/matching HTTP integration
- [ ] **Goal / dependency:** WEB-02, RECONCILIATION-04.2.
- **Files:** `apps/web/src/features/reconciliation/api.ts`, `queries.ts`, `server.ts`, `index.ts`, `messages.ts`, `api.test.ts`.
- **Deliverable:** Invoice import/list/detail/candidates/history/approval clients; shared schemas; post-approval invalidation of correct invoice/candidate/history/list keys; preserve per-row import results and conflict semantics.
- **Verification:** `pnpm --filter @project/web exec vitest run src/features/reconciliation/api.test.ts` — six endpoint shapes, optional reference, partial import, and precise invalidation.

### RECONCILIATION-05.2 — Build invoice list and import screen
- [ ] **Goal / dependency:** RECONCILIATION-05.1.
- **Files:** `apps/web/src/app/invoices/page.tsx`, `invoices/import/page.tsx`; `features/reconciliation/invoice-list.tsx`, `invoice-import.tsx`, `invoice-import.test.tsx`, `messages.ts`.
- **Deliverable:** Status/pagination, structured JSON batch input with clear example/help, missing reference allowed, ordered row results and retained rejected rows for correction. No PDF/file upload. Do not infer successful batch import from HTTP200 alone.
- **Verification:** `pnpm --filter @project/web exec vitest run src/features/reconciliation/invoice-import.test.tsx` — mixed outcomes, malformed envelope, duplicate/conflict feedback, input preservation and accessible errors.

### RECONCILIATION-05.3 — Build comparison and explicit approval workspace
- [ ] **Goal / dependency:** RECONCILIATION-05.2.
- **Files:** `apps/web/src/app/reconciliation/[invoiceId]/page.tsx`; `features/reconciliation/comparison-workspace.tsx`, `approval-dialog.tsx`, `comparison-workspace.test.tsx`, `messages.ts`.
- **Deliverable:** Structured invoice versus selected payment, explainable reference/date evidence, explicit candidate choice, confirmation, review/history state, link to journal. Missing/different reference is visible but not blocking. Refresh after stale conflict; narrow screens stack panels; preserve keyboard focus.
- **Verification:** `pnpm --filter @project/web exec vitest run src/features/reconciliation/comparison-workspace.test.tsx` — zero/multiple candidates, no auto-approval, reference mismatch permitted, reversed/stale candidate conflict and responsive accessibility states.

## 11. M5 — E2E evidence and local portfolio package

### E2E-01.1 — Prove signed ingestion and duplicate identity end to end
- [ ] **Goal / dependency:** M1–M4 complete; disposable environment authorized.
- **Files:** `tools/simulator/sign-event.ts`, `tests/e2e/ingestion.spec.ts`; root Playwright fixture/config updates.
- **Deliverable:** Signed synthetic sender, 50 parallel same-ID requests, different IDs/same settlement, changed-content conflict, byte mutation and expired signature. Verify committed records through a test-only trusted fixture boundary, not a public database-inspection endpoint.
- **Verification:** `pnpm exec playwright test tests/e2e/ingestion.spec.ts` — one accepted identity for the identical flood and one financial entry; invalid signatures have no persistence effects. Do not require a fragile 10ms arrival window or invent uniform completion timing.

### E2E-01.2 — Prove acceptance and worker recovery boundaries
- [ ] **Goal / dependency:** E2E-01.1.
- **Files:** `tests/e2e/recovery.spec.ts`, `tests/e2e/fixtures/owned-services.ts`; test-only controlled failure hooks.
- **Deliverable:** Interrupt before acceptance commit, after acceptance/before enqueue, before financial commit, and after commit/before queue acknowledgement; isolate Redis outage/restart; stale failure/new completion and manual retry races. Hooks unavailable in non-test mode; never delete shared data.
- **Verification:** `pnpm exec playwright test tests/e2e/recovery.spec.ts` — recoverable accepted outcomes, exact one financial result, due-time/backoff respected, no terminal-state regression.

### E2E-01.3 — Prove import, human approval, and reversal history
- [ ] **Goal / dependency:** E2E-01.1, M3/M4 complete.
- **Files:** `tests/e2e/reconciliation.spec.ts`.
- **Deliverable:** Reference-less mixed import, explicit multiple-candidate selection, approval conflict, competing invoices, reversal racing approval, preserved link history, NEEDS_REVIEW, and later manual rematch. Include keyboard-only confirmation and focus recovery.
- **Verification:** `pnpm exec playwright test tests/e2e/reconciliation.spec.ts` — correct cross-module outcomes, no automatic match or revenue entry, no allocation to reversed payment.

### E2E-02.1 — Package API, worker, and web locally
- [ ] **Goal / dependency:** E2E-01.1–01.3; authorization for local packaging only.
- **Files:** `apps/api/Dockerfile`, `apps/web/Dockerfile`, `.dockerignore`, `docker-compose.yml`; `tools/verification/package.test.mjs`.
- **Deliverable:** API and worker share one versioned backend artifact but separate commands; web production artifact; health/startup order; graceful shutdown; private service networking and server-only secrets. PostgreSQL/Redis remain the only infrastructure services; no Python container.
- **Verification:** `docker compose config --quiet` and `node --test tools/verification/package.test.mjs`; when build execution is authorized, `docker compose build api worker web` — images build without embedding secrets.

### E2E-02.2 — Add safe fixtures and local operator provisioning
- [ ] **Goal / dependency:** E2E-02.1, SETUP-06.1.
- **Files:** `tools/fixtures/seed.ts`, `tools/fixtures/seed.test.ts`, `tools/demo/provision-operator.ts`; root `seed`/`demo:provision` scripts and declared local TS runner.
- **Deliverable:** Synthetic fixed accounts/invoices/payments with stable identities; seed via trusted initializer/signed event or application use cases, never by bypassing production invariants. Require explicit demo/test target and refuse other targets. Local JWT provisioning does not print signing secrets or add login/refresh endpoints. Never reset data automatically.
- **Verification:** `pnpm exec tsx --test tools/fixtures/seed.test.ts` — rerun is idempotent, unsafe targets refused, fixture amounts/associations remain correct. `pnpm run seed` is an explicit future demo operation, not a planning-time command.

### E2E-02.3 — Final documentation, checks, and review evidence
- [ ] **Goal / dependency:** E2E-02.2 and all module gates.
- **Files:** `README.md`, `docs/demo.md`, `docs/verification.md`, `docs/execution.md`, `tools/verification/docs.test.mjs`; synthetic demo screenshots captured during authorized local run.
- **Deliverable:** Setup/prerequisites, approval and migration boundaries, ordered demo instructions, seven operator routes, architecture diagram, sample outcomes, limitations, troubleshooting, credential handling and local-only access warning. Capture exact revision/environment/commands/results; independent security/contract/database review at this final gate. Remove stale “production-ready” or unexecuted guarantee claims.
- **Verification:** `node --test tools/verification/docs.test.mjs`; `npm --prefix apps/api run build`; `npm --prefix apps/api run lint`; `npm --prefix apps/api run test -- --runInBand`; `pnpm --filter @project/web run typecheck`; `pnpm --filter @project/web run lint`; `pnpm --filter @project/web run build`; `pnpm --filter @project/web exec vitest run`; `pnpm --filter @project/contracts exec vitest run`; `pnpm exec playwright test` — each must finish successfully with real non-skipped evidence or be reported as incomplete. No public deployment follows automatically.

## 12. API-to-task coverage

| Endpoint | Backend task | UI/client task | Final evidence |
| --- | --- | --- | --- |
| GET `/v1/health` | SETUP-06.2 | Readiness fixtures | E2E-02.1 |
| POST `/v1/webhooks/simulator` | INGESTION-04.2 | Simulator only; not BFF | E2E-01.1/01.2 |
| GET `/v1/ingestion/events` | INGESTION-04.2 | INGESTION-05.1/05.2 | E2E-01.1 |
| GET `/v1/ingestion/events/:id` | INGESTION-04.2 | INGESTION-05.1/05.3 | E2E-01.2 |
| POST `/v1/ingestion/events/:id/retry` | INGESTION-04.2 | INGESTION-05.1/05.3 | E2E-01.2 |
| GET `/v1/ledger/accounts` | LEDGER-04.2 | LEDGER-05.1/05.2 | E2E-01.1 |
| GET `/v1/ledger/journals` | LEDGER-04.2 | LEDGER-05.1/05.2 | E2E-01.1 |
| GET `/v1/ledger/journals/:id` | LEDGER-04.2 | LEDGER-05.1/05.3 | E2E-01.3 |
| POST `/v1/ledger/journals/:id/reversal` | LEDGER-04.2 | LEDGER-05.1/05.3 | E2E-01.3 |
| POST `/v1/invoices/import` | RECONCILIATION-04.2 | RECONCILIATION-05.1/05.2 | E2E-01.3 |
| GET `/v1/invoices` | RECONCILIATION-04.2 | RECONCILIATION-05.1/05.2 | E2E-01.3 |
| GET `/v1/invoices/:id` | RECONCILIATION-04.2 | RECONCILIATION-05.1/05.3 | E2E-01.3 |
| GET `/v1/invoices/:id/candidates` | RECONCILIATION-04.2 | RECONCILIATION-05.1/05.3 | E2E-01.3 |
| POST `/v1/invoices/:id/approval` | RECONCILIATION-04.2 | RECONCILIATION-05.1/05.3 | E2E-01.3 |
| GET `/v1/invoices/:id/history` | RECONCILIATION-04.2 | RECONCILIATION-05.1/05.3 | E2E-01.3 |

## 13. Product-to-task coverage

| Product IDs | Primary implementation | Evidence |
| --- | --- | --- |
| FR-01 | E2E-02.1–02.3 | Fresh local demo and E2E suite |
| FR-02 | SETUP-05.1, INGESTION-03.1/04.2 | HMAC specs, E2E-01.1 |
| FR-03 | LEDGER-03.1, INGESTION-03.3 | Event processing and E2E-01.1 |
| FR-04 | INGESTION-02.1/03.4 | Identity/concurrency specs, E2E-01.1 |
| FR-05 | INGESTION-02.2/03.2/03.3/03.5 | E2E-01.2 |
| FR-06 | SETUP-03.1, LEDGER-01.1/03.1, RECONCILIATION-01.1/03.1 | Contract/unit/direct-engine precision evidence |
| FR-07 | LEDGER-01.2/01.3 | Actual DB rollback tests |
| FR-08 | LEDGER-01.2/01.3, LEDGER-02.1 | Runtime privileges, immutability and append tests |
| FR-09 | LEDGER-03.2, RECONCILIATION-03.4 | Concurrent reversal and E2E-01.3 |
| FR-10 | RECONCILIATION-03.1/04.1/05.2 | Mixed import and E2E-01.3 |
| FR-11 | RECONCILIATION-02.2/03.2/05.3 | Candidate projection/workspace tests |
| FR-12 | RECONCILIATION-03.3/05.3 | Approval concurrency and E2E-01.3 |
| FR-13 | M4 feature -05 tasks | Component states and complete browser journeys |
| FR-14 | RECONCILIATION-01.2/03.4 | Invariant/race tests and E2E-01.3 |

## 14. Tracking, handoff, and next authorized action

Completing a task requires naming the actual files/revision, command, observed exit/result, relevant limitations, and next task. A documentation review is not a database-verification pass. A skipped service-dependent suite is not a successful module gate.

**Current state:** SETUP-01.1 through SETUP-03.2 are implemented and verified. The API is a module harness, the frontend is a static foundation, Compose defines two local test services, and the shared package exports common/domain transport schemas consumed by real build fixtures. No financial application behavior, database schemas, migrations or running containers have been created by this setup work.

**Next action:** Stop after SETUP-03.2 integration into development. SETUP-04 is next in order and remains unauthorized. Do not start infrastructure, execute migrations, or deploy. Task branch and development merge history record integration revisions.
