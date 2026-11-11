# Requirements quality

Use this reference for substantial discovery, cross-layer changes, unfamiliar business domains or high-risk requirements. It specifies what must be decided and handed off; it does not implement the application or authorize extra files.

## Contents

- Requirement record and clarification gates
- Architecture passport and ownership
- Frontend, backend and database discovery
- Operation and data-flow handoff
- Category-specific invariants
- Quality targets and evidence
- Reuse, MVP and specialist handoff

## Requirement record and clarification gates

For each material requirement, record:

| Field | Required meaning |
| --- | --- |
| Identity and source | Stable requirement label and the client statement, existing contract or approved decision it comes from. |
| Actor and ownership | Who acts, on whose resource, with which role/tenant/system authority. “Admin” needs a defined scope. |
| Trigger and preconditions | Entry point, prior state and required permissions or dependencies. |
| Expected behavior | Observable state transition and successful destination, including cancel/back behavior for a user flow. |
| Data and rules | Readable/writable fields, source of truth, validation, lifecycle and business invariants. |
| Error and recovery | Invalid/forbidden/stale/unavailable outcomes; retry, partial completion and recovery policy where relevant. |
| Authorization boundary | Where the server/data owner verifies identity, membership and actual resource permission. |
| Acceptance | Given/When/Then positive, denial/failure and boundary cases; expected observable evidence. |
| Status and decisions | Confirmed versus proposed/assumed/unknown; open question, owner and work it blocks. |

An inference from a vague prompt remains a proposal. “Use your judgment” permits routine engineering decisions within scope; it does not define refund rules, data ownership or privileged AI actions. Ask the few questions that change the solution, not an exhaustive questionnaire.

Before asking, inspect available code/briefs for the answer. Recommend a reasonable option with its trade-off. When a blocker is unresolved, identify independent work that can continue. When a significant existing contract already answers the question, reference it instead of reopening the entire architecture.

For a new system, show the objective, actors, included/excluded scope, important architecture proposals and acceptance gates for review before dependent implementation. Preserve the original `feature-spec` deliverable fields from the [workflow source audit](../../../../../docs/specifications/source-audits/01-phase1-catalog.md). Write a project-specific specification only to an authorized location; never overwrite a shared template or create one merely to fill the tree.

## Architecture passport and ownership

For a new architecture record product purpose/category, audiences, environments, existing decisions, repository/versions/lockfiles, deployment target, ownership/trust boundaries, expected volume, integrations, constraints, quality targets and verification approach. Mark unconfirmed choices pending.

Treat these as separate decisions that can coexist:

| Axis | Decisions to resolve |
| --- | --- |
| Repository/workspace | Single project or workspace; Turborepo only if appropriate; package ownership, dependency direction and build/test boundaries. |
| Frontend applications | One app or several; routing, design-system ownership, server/client boundaries and deployable units. |
| Microfrontend composition, if selected | Shell/route/remote composition, independent releases, navigation, asset/version compatibility, CSS/runtime isolation, failure fallback and rollback. Define session renewal, origins/CSRF and scoped cache clearing. |
| Backend deployment | Modular monolith or services; domain ownership, public interfaces, authenticated communication, failure budgets and compatibility. Recommend the simplest suitable profile and confirm consequential alternatives. |
| Persistence | Which module/service owns each dataset and invariant; legitimate shared/global records, transaction boundaries, retention and historical compatibility. |

Turborepo does not imply runtime microfrontends. A monorepo does not imply microservices. Several services do not gain a shared atomic transaction from sharing a repository. Shared public DTOs/UI contracts must not expose privileged repositories, secrets or server-only dependencies to the browser.

For services, prohibit casual writes into another owner's tables; define authenticated synchronous contracts and versioned events. Specify outbox/inbox, compensation and reconciliation only where the chosen consistency model needs them. Independent deployments require mixed-version cases and an explicit migration window.

The detailed [architecture/API contract](../../../../../docs/specifications/addenda/2026-10-20-api-data-flow-contract.md) owns these flow patterns. Preserve the original actor/policy/tenant/repository signatures in the [foundation source audit](../../../../../docs/specifications/source-audits/02-phase2-3.md); they are starting contracts, not a mandate to wrap every table in a generic repository.

## Frontend, backend and database discovery

Use the relevant parts of [frontend/backend standards](../../../../../docs/specifications/standards/01-frontend-backend.md), including FE-STD-01–12 and BE-STD-01–13. Record actual affected routes/modules; do not load unrelated concerns by default.

| Boundary | Required decisions when affected |
| --- | --- |
| Product/UI | Sitemap, actors and complete journeys; visual direction, content, responsive layouts, localization, accessibility, keyboard/focus behavior, navigation/cancel and unsaved edits. |
| Frontend data | Server/client rendering boundary, runtime input validation, form field mapping, pending/empty/error/forbidden/session-expired/stale-conflict states, retries and feedback. Define URL/list/search state, pagination, bulk-selection meaning and cache scope/invalidation. |
| API/backend | Route/method/version, DTO and writable allowlists, validation/normalization, trusted context, route/resource policies, service/use-case boundaries, error codes, audit attribution and bounded resource use. Include authentication/CSRF, pagination, files/exports or streaming only when relevant. |
| Data model | Entities and relationships, ownership, identifiers, field types/null/default semantics, unique/check/foreign-key constraints, delete/history rules and access-path indexes. Identify expected row counts and query patterns before choosing indexes. |
| Integrity/evolution | Atomic invariants, concurrent writers, transaction/isolation/retry boundaries, existing records, migration order, lock/rewrite risk, backfills, checkpoints, restore/forward recovery and mixed-version compatibility. |

For protected resources, include anonymous, forbidden, wrong-tenant, forged ownership and revoked-member cases. Frontend hiding is not authority. For tenant data, scope reads, writes, joins, aggregates, caches, files, search, exports and jobs, with legitimate public/global exceptions explicit. Apply IAM/TEN/DB sections of [security/data standards](../../../../../docs/specifications/standards/02-security-data-saas.md).

For proposed database changes, require a schema/relationship sketch and the constraints needed to enforce declared invariants. A uniqueness check in application code does not resolve simultaneous inserts. Mocks alone do not verify PostgreSQL constraints, locking or transaction behavior. A migration draft does not authorize execution against live data.

## Operation and data-flow handoff

For each important operation, capture a compact record with the fields below. For a small compatible change, reference the existing contract and specify only the delta. Resolve shared interfaces before parallel work.

| Stage | Handoff fields |
| --- | --- |
| Intent/UI | Actor, action, resource, entry route, prerequisite state, form fields and success/cancel destination. |
| Request | Consumer, endpoint/method, version, headers where relevant, request DTO, validation, normalization, omitted/null semantics and protected fields excluded from writes. |
| Trusted context | Session/provider verification, requested versus verified tenant, membership, permission matrix, impersonation/system-principal exceptions and relevant origin/CSRF protections. |
| Policy/use case | Actual guard/validator ordering, loaded-resource policy, controller-to-service/use-case boundaries and responsible module. |
| Persistence | Query/repository, tenant predicates, selected/updated columns, constraints, expected affected rows, transaction commit/rollback and concurrency/precondition handling. |
| External effects | Audit, provider/queue/outbox/inbox effects where applicable, stable business operation identity, payload mismatch, crash/retry/reconciliation and retention. |
| Response | Approved response DTO and safe error/status mapping, field/conflict errors and correlation. Exclude ORM internals and sensitive fields. |
| Client outcome | Loading/error/denial/conflict/retry states, input preservation, stale-response handling, cache invalidation, navigation and accessible feedback. |
| Owners/evidence | Contract revision and owner, frontend/backend/database write scopes, serialized migration ownership, compatibility cases and executable acceptance plan. |

Example shape: UI action → validated request → trusted actor/tenant → resource policy → use case → scoped transaction/query → approved response/error → client state/cache. Record names and ownership when known; missing endpoint/schema details remain a design handoff, not invented facts.

Choose the affected variants explicitly:

- **Read/list:** filtered scope applies to results/counts; allowlisted sort/filter, deterministic bounded pagination and scoped caches.
- **Create/update/delete:** writable fields, duplicate/stale-write behavior, historical relationships, transaction/effects, response loss and safe retry; an idempotency key must have a defined identity/lifetime where required.
- **Bulk/import:** bound rows/bytes/concurrency; define duplicate identity, dry-run/preview, atomic versus per-item results, overlap behavior and partial retry.
- **Export/files:** authorize creation and retrieval, limit fields/rows, protect/expire artifacts, handle CSV formula injection where applicable, and define authority after revocation or during a long job.
- **Jobs/webhooks:** establish scoped user-delegated or system authority, callback authenticity/account/environment, versioned payloads, durable acceptance, duplicate/order handling and crash recovery. Accepted/queued/submitted is distinct from completed/delivered.

Example acceptance for a protected export: Given an authenticated member of organization A, when that user submits a known organization B record ID, then no B row or downloadable artifact is disclosed. Separately test permitted creation, protected download, sensitive-field exclusion, limits and the agreed revocation policy. These are planned tests until executed.

## Category-specific invariants

Choose categories from actual journeys, not a template label. Combine only selected capabilities; this matrix is a discovery aid, not a claim of implemented support.

| Category | Decisions and representative failure/boundary cases |
| --- | --- |
| Public/marketing/content sites and CMS | Content ownership, sitemap/assets, rendering/SEO, localization/accessibility, form destination/abuse protection and delivery failure; draft/publication permissions and cache freshness only if editing/publishing exists. No automatic account system or database. |
| SaaS, CRM, internal tools and client portals | Resource ownership, roles/membership, lifecycle, imports/search/reports, organization switching and exports. Define metrics/date boundaries, duplicates, revocation and data isolation. Billing and quotas remain conditional. |
| Commerce | Product/order/stock and money states, atomic reservation/oversell rules, fulfillment, payment confirmation, refunds and reconciliation. Confirm currency, rounding, taxes and jurisdictions with appropriate sources; do not invent commercial policy. |
| Marketplaces | Buyer/vendor/platform authority, vendor onboarding, commissions, money collection/payout ownership, disputes/refunds and seller/customer isolation. Confirm who can change financial state. |
| Booking/scheduling | Resource/capacity ownership, competing reservations, holds/expiry, timezones, recurring availability, daylight-saving ambiguity/gaps, cancellation/rescheduling and reminder deduplication. |
| AI-enabled products | Permitted data/retrieval scope, prompt injection/untrusted content, output validation, tool/action authority, human approval boundaries, evaluation examples, cancellation, latency and cost/rate limits. An assistant does not inherit permission to charge/refund or modify records. |
| Integration/automation-heavy products | Provider/connection ownership, scopes, field authority, backfill/deletes, pagination, rate limits, token lifecycle, webhook authenticity, checkpointing and replay/reconciliation. |
| Regulated or unfamiliar domains; other platforms | Establish domain experts, authoritative/current requirements, sensitive-data and operational constraints, additional stack/runtime needs and capability gaps before commitment. Do not declare legal compliance, native/embedded/game support or production readiness from this web-focused kit. |

Microfrontend projects additionally test independent shell/remote versions, navigation/session continuity and missing-remote recovery. Microservice projects additionally test authenticated contracts, duplicates/reordering, unavailable consumers and reconciliation. Single-app/monolith projects need no invented distributed infrastructure.

## Quality targets and evidence

Replace vague adjectives with a target, scope, representative load/environment and measurement method. When a target is unknown, record a provisional proposal or question; do not invent a universal latency/scale/compliance promise.

| Dimension | Discovery evidence contract |
| --- | --- |
| Security/privacy | Protected actions, role/tenant boundaries, sensitive fields, retention/deletion, abuse limits, threat cases and redaction; use sanitized fixtures, never client secrets. |
| Integrity | Constraints, races, stale edits, rollback, duplicates and historical records; require real disposable PostgreSQL concurrency/migration checks where those guarantees depend on PostgreSQL. |
| Performance/scale | Expected users/tenants/records, payload sizes, peak concurrency, latency/load targets, pagination/query plans and representative browser/API measurements. |
| Reliability/operations | Failure/retry/timeouts, idempotency and recovery, backup/restore objectives, observability/correlation, runbooks and support ownership. |
| Usability/accessibility | Responsive and assistive-technology journeys, keyboard/focus, localization, loading/error/conflict states and navigation consistency. |
| Maintainability/cost | Compatible contracts, package/module ownership, actual reuse, dependency/version policy, deployable units, provider/hosting budgets and upgrade/release strategy. |

For each case record precondition, action, expected result, evidence source/environment and current status. Use Given/When/Then; include positive, negative and boundary/concurrency cases proportional to risk. Keep planned, passed, failed, not-run, unavailable and inapplicable distinct. Proposed checks have no execution result. See applicable WF/OPS/EVAL sections in [delivery standards](../../../../../docs/specifications/standards/03-delivery-operations-improvement.md).

For money, tenancy, credentials, historical migrations and concurrency, identify the specialist review and human approval gate before a high-risk merge. Provider sandboxes, browser checks, PostgreSQL tests and model evaluations establish different claims; none substitutes for the others. No automatic merge or production deployment is authorized.

## Reuse, MVP and specialist handoff

Search real modules, packages, contracts, templates and test evidence. Record available asset, path/revision, compatibility, maturity and missing behavior. An example `ActorContext`, empty directory or old test report is not a reusable tested module. Preserve suitable current abstractions and explain any replacement.

Recommend a thin vertical slice with meaningful end-to-end value and clear exclusions. Identify dependencies and the next contract decisions; do not scaffold every catalog capability. A delivery estimate lists assumptions, risks, dependencies and evidence gaps rather than false precision.

The handoff contains the approved brief/revision, applicable standard IDs, selected workflow/domain capabilities, ownership and operation contracts, blocking decisions, writable scope, checks and stop conditions. A frontend worker implements presentation/client behavior, a backend worker owns application/policy boundaries, and a database owner owns persistence/integrity; these are roles, not agent files already installed.

When available and relevant, select existing specialist definitions and skills. Otherwise report the missing capability and propose it for a later approved batch. Keep reviewers independent and read-only; verification execution is separate. Do not spawn one agent per skill or copy the whole transcript into every assignment. One implementer may perform several compatible roles.

Discovery is ready for review when the next slice has observable acceptance, known authority/ownership, explicit architecture proposals and visible blockers. It is ready for dependent implementation only when the blocking decisions and change authority are resolved. This file does not itself create agents, hooks, project records, application modules or runtime support.
