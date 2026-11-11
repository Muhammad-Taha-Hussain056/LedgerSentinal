# Frontend architecture foundation

Read this for frontend architecture, then only the selected [F1](frontend-f1-single-app.md), [F2](frontend-f2-multiple-apps.md) or [F3](frontend-f3-microfrontends.md) profile. These are prescribed design rules for future projects, not existing application code or automated enforcement. Frontend methods and bounded builder/test/verifier/reviewer handoffs are authored; boundary tooling, cross-domain specialist agents and native/application verification remain outstanding.

For frontend technology selection, use the canonical [presets and settings](../../../frontend/nextjs-engineering/references/frontend-presets-and-settings.md): common engineering rules, selected content/application preset and controlled overrides. Its defaults require project adoption and exact-version verification; they do not select F1/F2/F3, a backend or API transport. The authored [Next.js skill](../../../frontend/nextjs-engineering/SKILL.md) routes to placement, rendering, transport, forms, queries, mutations, URL/UI state, components/layout, accessibility, assets/metadata/localization and frontend performance/verification. Those methods are not runtime-tested implementations. Other sections below remain architecture requirements, not duplicate preset definitions.

For bounded implementation planning, read [frontend assignments/handoffs](../../../frontend/nextjs-engineering/references/frontend-handoffs.md), which separates architect/builders/test writer, execution by frontend-verifier and read-only standards/accessibility review. Definitions are authored; actual native availability and execution remain to be tested. For consequential rendering/cache acceptance, use the original named [security checkpoint](../../../frontend/nextjs-engineering/references/rendering-security.md). Neither reference launches workers or grants new authority.

Sections: [settings](#1-settings-before-implementation), [pnpm](#2-pnpm-and-dependency-discipline), [features](#3-feature-first-app-boundaries), [packages](#4-shared-package-contract), [rendering/transport](#5-rendering-serverclient-and-transport), [state/cache](#6-state-cache-and-identity-transitions), [operations/forms](#7-operation-to-ui-contract), [quality/categories](#8-ux-quality-and-category-coverage), [verification/PowerShell](#9-verification-handoff-and-windows-usage). On follow-up work, load affected sections and the existing decision record rather than repeating the entire design.

## 1. Settings before implementation

The user selects the frontend profile before the project starts. The architect explains the options, records the choice and applies it. An existing accepted choice is reused. If the user asks for a migration, return a scoped proposal and await its acceptance before changing architecture.

| Setting | Required record |
| --- | --- |
| Frontend profile | F1 one modular app; F2 multiple apps without a composed product surface; F3 independently deployed units composed into one product surface. F3 additionally selects route-based or runtime composition. |
| Repository | Single project, pnpm workspace or separate repositories; app/package owners; optional Turborepo. Repository layout does not decide composition. |
| Versions | Approved pnpm/Node/framework/React/TypeScript versions, lockfile and observed resolution evidence; exact supported combinations when composition requires them. |
| UI and content | Brand/tokens, styling/component system, locales/timezones, accessibility/device/browser targets, SEO/public-content needs. |
| Data and forms | Server read/rendering strategy, client query library if needed, UI state ownership, form/schema tools, API/client generation strategy and error format. |
| Trust and transport | Public/authenticated/tenant scopes, session owner, origin/cookie/CSRF policy, direct API versus frontend gateway, Server Actions policy and backend authority. |
| Delivery | Deployable units, owners, environment config, compatibility window, performance/recovery targets and evidence gates. |

pnpm and feature-first organization are kit requirements. Next.js/TypeScript are the preferred suitable web stack; an alternative needs an explicit project decision. TanStack Query, RHF/Zod, Zustand, Tailwind/shadcn/Radix, test libraries, BFF and Turborepo are selectable presets, not an automatically approved bundle. Do not interpret F1/F2/F3 as choosing any of them. No universal default of a separate NestJS repository, frontend-owned contracts, cookie bearer tokens, disabled Server Actions or client queries for every server read.

For an existing client with a different package manager, propose an authorized pnpm migration and compatibility plan; do not silently regenerate its lockfile. A static site may need no backend, accounts, tenancy, state library or database. A domain-heavy application adds selected capabilities and their real invariants.

## 2. pnpm and dependency discipline

Use pnpm for installation and project commands. Inspect before running commands; the read-only architect only proposes them. Record an exact approved pnpm version in the future project's `packageManager` field and compatible Node requirements; select its activation method for that environment instead of assuming Corepack is available. Commit the matching `pnpm-lock.yaml`. Do not introduce npm/yarn/bun lockfiles or use `npx` as a hidden installer. No global configuration changes or installation without the task's authority.

A workspace declares members in root `pnpm-workspace.yaml`. Use explicit local `workspace:` dependencies such as `"@project/contracts": "workspace:*"`; this prevents unintended registry fallback for intended local dependencies. Do not assume a package is available merely because it is installed at the root or hoisted. Each consumer declares its own runtime/dev/peer dependencies. These behaviors are documented in [pnpm workspaces](https://pnpm.io/workspaces); verify syntax against the selected version.

Keep runtime dependencies separate from development tools. Shared React libraries normally declare a tested React peer range and suitable development dependency; do not bundle a second React runtime into a consumer accidentally. Record Next/React/type-package compatibility and singleton needs when relevant. Central version/catalog configuration may reduce drift if supported by the selected pnpm version, but `catalog:` and semver ranges are declarations, not observed exact versions.

Root configuration owns workspace/task orchestration, not hidden dependencies for every member. Use explicit `exports` and client/server subpaths; TS aliases are not substitutes for package dependencies or public entry points. Decide whether a package exports built artifacts or source consumed by approved tooling. Test the chosen runtime/module/type resolution, CSS/assets and production consumer build; a dev-only import resolving is insufficient.

Turborepo is optional task/build orchestration layered over workspaces, not a microfrontend engine. Define real scripts, task dependencies, inputs/outputs and environment-sensitive caching only when selected. Do not cache secrets or reuse build artifacts across incompatible environment inputs. See [Turborepo structure](https://turborepo.dev/docs/crafting-your-repository/structuring-a-repository).

## 3. Feature-first app boundaries

Map these illustrative paths to the approved app root; create only needed folders:

```text
src/
  app/                         route/layout composition and entry adapters
  features/<feature>/
    index.ts                   explicit client-safe public exports
    server.ts                  explicit server-only public exports, if needed
    components/                domain UI and containers
    hooks/                     feature interaction hooks
    api/                       client calls, query keys and mutations
    schemas/                   UI input rules and transport mapping
    messages/                  feature copy/localization, if selected
    types/                     feature-local types
    store/                     justified UI state only, if selected
    *.test.ts(x)                colocated relevant tests
  components/                  app-wide domain-neutral UI
  lib/                         app-owned platform adapters and pure helpers
```

Route files compose feature public APIs, loading/error boundaries and metadata. Framework entry adapters remain where the framework requires them; keep substantial domain UI, validation mapping and orchestration in owning features/server modules. Thin routes are a separation rule, not a line-count quota.

Within a feature, local modules may collaborate. Across features, prohibit imports of another feature's internals **and its public entry point**; a public API is for approved route/composition consumers, not a license for feature cycles. Compose sibling features at a route/container using narrow props, slots or owner-defined contracts. If one domain genuinely depends on another, expose a deliberate application/domain service or extract a cohesive shared capability with an owner; record the dependency decision rather than hiding a cross-feature import.

Public `index.ts` exports client-safe items only. Do not barrel-export server code, repositories or secrets. Use a separate server entry and framework-appropriate server-only safeguards. A client-safe entry must have a client-safe transitive graph. Avoid blanket `export *` across runtime boundaries. A public server API is not authorization by itself.

Placement order: feature-local; app-shared when two independent features need the same domain-neutral behavior; workspace package when multiple apps/packages genuinely consume a stable capability. A second consumer is a useful extraction signal, not a hard requirement: a deliberate design-system/config/contract foundation may be shared earlier with an owner and rationale. Do not extract because two snippets merely look similar or create empty packages for hypothetical scale.

## 4. Shared-package contract

Illustrative allowed edges, with actual names agreed per project:

| Consumer | Allowed dependencies and constraints |
| --- | --- |
| Frontend app | Its own features/adapters and exported UI/contracts/utils/config packages. Never another app's `src`. |
| UI package | Domain-neutral tokens/primitives; approved pure utilities and UI peers. No API fetching, tenant/session storage, contracts, backend or database dependencies. App wrappers adapt business DTOs into presentation props. |
| Contracts package | Public DTO/error/event types and selected runtime validation. No React/Next, ORM table definitions, privileged domain services, secret configuration or database clients. |
| Utilities package | Pure platform-independent TypeScript helpers; no React/Next, network, identity or persistence side effects. Split platform adapters separately. |
| Config package | Explicit build/tool configuration consumed as development configuration; no secret values or accidental runtime payloads. |
| Backend/database package | Trusted server consumers only. Never in frontend client dependency graphs. Owning backend implements actual authorization and transactions. |

Packages never depend on applications. Keep the graph acyclic; no relative imports into another workspace, undeclared deep imports or TS path bypasses of `exports`. A domain-specific shared module is distinct from neutral UI/utils and must explicitly name its domain owner, runtime constraints and public contract.

For each shared package record owner, consumers, exported subpaths, runtime/peer dependencies, build strategy, tests, version/compatibility and release authority. Same-workspace changes require all affected consumers checked. Separate repositories use approved versioned publication/consumption, not filesystem links outside the repository or copied DTOs. Publication and registry credentials require separate authority; never access credentials to plan this.

One source owns each API/schema contract and its generation direction: contract-first schemas or backend specification with generated clients, chosen explicitly. Do not maintain hand-edited competing definitions. Shared contracts do not authorize exposing every database field. Account for different client/server releases, deprecated fields and generated artifacts. This kit contains no working shared application packages yet.

## 5. Rendering, server/client and transport

For each route specify audience, static/server/client rendering, freshness, streaming/error boundaries, metadata and cache policy. Inspect the installed router/version; do not copy version-sensitive defaults. Prefer narrow interactive boundaries rather than turning an entire layout into a client module. Secrets and privileged dependencies remain on trusted servers. A client module's transitive imports also enter its client graph; inspect re-exports. See [React client boundaries and supported serialized values](https://react.dev/reference/rsc/use-client).

Pass minimal safe view DTOs across server/browser boundaries. A stricter JSON DTO rule is project policy; do not misstate React's support for Date/Map/Set. Convert dates, decimals, bigint and absent/null fields according to the actual transport contract, not incidental ORM serialization. Avoid server/browser timezone or locale mismatches.

Choose a read path per operation: approved server-side reads and rendering for suitable routes; a client query layer for interactive/refetched server state when needed. Hydration must use identical contract/scope and safe serialized data. A browser data library is not mandatory for static public content.

Choose direct API or frontend gateway explicitly. Direct browser APIs require their real origin/CORS/session/CSRF model. A gateway forwards only allowed headers/cookies and validated method/path/body; it must not become an arbitrary authenticated URL proxy. Preserve safe status/error semantics, timeout/cancellation and request correlation. Server-rendered code should use its approved server API adapter rather than create an unnecessary HTTP round trip through its own gateway.

If NestJS owns a domain, it verifies identity and enforces policy, input, invariants and persistence. Frontend checks improve experience and may protect its own server entry points, but do not replace backend authorization. Every selected Route Handler or Server Action is independently authenticated/authorized and validated; hidden controls or a layout redirect are insufficient. See [Next.js data security](https://nextjs.org/docs/app/guides/data-security).

## 6. State, cache and identity transitions

Assign one owner to each state class: server authority in the API/query layer; committed shareable list/filter/sort/page state in validated URL parameters; transient interaction state local; form drafts in the selected form mechanism; a selected UI store only for justified cross-component UI. Do not mirror query responses into Zustand/Redux merely for convenience. Global state is not a persistence or security boundary.

For every server/CDN/router/query/browser-persisted cache record data class, key/scope, TTL/freshness, invalidation, owner and privacy. Include every changing value that affects results: verified tenant, relevant actor/permission context, locale, filter/sort/page/cursor and resource ID. Do not use token values as keys. Query-key guidance comes from [TanStack Query](https://tanstack.com/query/latest/docs/framework/react/guides/query-keys); the tenancy and revocation obligations are kit policy. No process-global personalized server query client; use request-isolated server state and explicitly scoped browser lifecycle.

On logout, organization/account change or effective impersonation change: stop protected rendering; prevent new old-scope work; cancel in-flight reads/mutations where possible; rotate/clear scoped caches and persisted sensitive state; re-resolve authority; reject late old-generation results; fetch under the new scope. Cancellation is best effort and does not undo committed server work. Old requests must not repopulate the new session's UI. Define dirty-form behavior before switching and revocation while a page remains open. Cross-tab/session signals contain no bearer tokens and do not themselves grant authority.

After mutation, update/invalidate relevant detail/list/aggregate caches for the correct scope. Optimistic behavior requires a conflict/rollback policy; a stale failed request must not roll back a newer success. Avoid blind retries of payments, bookings, exports or creates: use the backend's actual idempotency/outcome contract. An ambiguous network failure is not proof of rollback.

## 7. Operation-to-UI contract

Use the [full operation fields](../../../../../docs/specifications/addenda/2026-10-20-api-data-flow-contract.md). Name real owners/functions when available, proposed paths otherwise. The frontend handoff includes:

1. Actor/action, route/journey, editable field allowlist, UI input-to-transport transformations, validation schema input/output, defaults and omitted/null/date/file semantics.
2. Form or list event -> feature hook/client -> selected direct/gateway/server adapter -> backend route/contract revision. Name credentials/origin/CSRF handling without secret values.
3. Trusted backend identity/tenant/resource-policy owner -> validation/use case -> transaction/query/effect owner -> approved response DTO. Link actual backend design; frontend does not invent its constraints.
4. Stable status/error codes, safe field errors, correlation ID; distinguish invalid, unauthenticated, forbidden, absent/concealed, stale/conflict, throttled, unavailable and accepted-asynchronous outcomes.
5. Pending state/double-submit protection; response ordering; success navigation; affected caches; failure recovery, input preservation, focus and announcements. Record retry/idempotency and authority changes during the request.

Forms initialize deliberately; background refresh must not overwrite dirty edits. Map only allowlisted server field paths to real controls, including supported arrays/nested names; unknown errors become an accessible root error. Preserve data on rejection. Use an explicit committed-success outcome for dirty-navigation guards, not a form library's success flag after a caught failed request. Define cancel/back, create-another, stale revision reconciliation, partial/bulk success and file-upload cancellation when applicable.

For lists define deterministic sorting, bounded pagination, filters/search normalization, IME/debounce/cancel behavior, empty versus no-results, page clamping and selection semantics. Sensitive search terms may require private state instead of a URL. For exports/jobs show queued/running/failed/completed distinctly and authorize artifact retrieval; do not display acceptance as completion.

## 8. UX, quality and category coverage

Apply [FE-STD-01 through FE-STD-12](../../../../../docs/specifications/standards/01-frontend-backend.md#frontend) for applicable routes: consistent journey/save/cancel destinations; project-specific visual direction and tokens; responsive stable geometry; WCAG 2.2 AA target and keyboard/focus; complete asynchronous recovery states; safe server/client boundaries; scoped caching; URL/list state; validated forms/conflicts; locale/time semantics; public metadata/content lifecycle; actual verification/performance evidence. Record exceptions using the original standards' owner/control/review protocol.

Specify interaction states for each affected screen: loading, refreshing, empty, no results, partial failure, denied, expired session, conflict, success and unavailable. Keep critical failures inline. Tables must not break sibling panels; long text, zoom, mobile keyboard and overflow need explicit behavior. Define locale/currency/timezone and date-only versus instant/scheduled-local semantics; do not impose multilingual infrastructure on a single-locale product.

Define numerical budgets with the project owner for representative critical routes: shipped JavaScript, request waterfalls, rendering/interaction latency, image/font behavior and allowed staleness. Record device/network/data conditions and baseline. Budget numbers without measurement are targets. Observe before claiming performance/scalability improvement. Plan component/browser/accessibility and visual evidence proportionate to the change; mocks cannot prove backend authorization or database guarantees.

Category overlays come from the product: public sites/CMS need publish/preview/metadata/freshness; SaaS needs selected roles/tenant/journeys; commerce needs selected cart/stock/price/order/payment states; booking needs timezones and reservation conflicts; AI interfaces need authorized retrieval, streaming cancellation, untrusted content, cost and output validation. Other categories require equivalent discovery and domain evidence. This guide does not certify all categories or prescribe a universal business model.

## 9. Verification handoff and Windows usage

The architect names checks; an authorized verifier executes. Inspect scripts first and use PowerShell from the actual project root. Example command shapes below require the named packages/scripts to exist; they are not commands executed in this documentation batch:

```powershell
pnpm --version
pnpm --filter "@project/web" run typecheck
pnpm --filter "@project/web" run build
pnpm --filter "...@project/ui" run test
pnpm exec <approved-installed-tool>
```

The `...` prefix selects a package and its dependents; suffix selects its dependencies. Quote selectors in PowerShell and use exact scoped names. Verify matched members and actual scripts; an empty selection, missing/skipped task or successful wrapper exit is not test evidence. See [pnpm filtering](https://pnpm.io/filtering). An authorized CI install uses the selected version's frozen-lockfile policy; installation executes dependency scripts under project policy, so planning never implicitly installs dependencies.

Plan checks for allowed import graph/public exports, server-only leak prevention, types, production builds and meaningful affected tests. Compare the approved base revision with the full candidate, including working-tree changes; a HEAD-only selection can miss committed branch work. Shared-package changes cover all affected consumers. F3 adds mixed-release and failure integration evidence. Report commands, revisions, actual versions, outcomes and not-run/unavailable limits; do not say a check passed merely because its command is listed.

Troubleshooting: unresolved workspace import -> check member pattern, exact package name, declared `workspace:` dependency and exported entry before changing hoisting; works in dev only -> inspect package build/module/type conditions and consumer production build; stale tenant UI -> inspect request/cache/persisted-state lifecycle and late responses; F3 hydration failure -> inspect the exact compatibility matrix and duplicated runtime. Do not bypass these failures with undeclared dependencies, secret-bearing client config or unverified version upgrades.
