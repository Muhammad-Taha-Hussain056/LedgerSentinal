# F1: single modular frontend

Use only after the user selects F1. Read [frontend-foundation](frontend-foundation.md) for the common rules; do not load F2/F3 for ordinary F1 work. This profile specifies one frontend application and one route/composition owner. It does not choose the backend or require a monorepo.

## Profile contract

Choose F1 when the approved product can have one frontend deployment/release boundary. It can serve multiple roles, areas, tenants or brands without becoming multiple apps. Organize those capabilities as features and route groups rather than treating every dashboard area as an independently deployed remote.

Record application name, owner, route map, origin/base path, public/private areas, runtime/rendering target, supported clients and deployment environments. Record whether a backend exists, where it lives and how it is called separately. Public content and an authenticated area may share one app if their rendering/cache/trust boundaries are deliberate.

| Decision | F1 requirement |
| --- | --- |
| Internal organization | Feature-first with thin route composition, explicit feature public entry points and no sibling feature imports. |
| Package manager | pnpm with approved version and lockfile; a single app does not require workspaces. |
| Shared code | Keep app-local until an actual package boundary is justified; approved foundation exceptions have an owner. |
| Rendering | Per-route static/server/client choice based on audience/freshness/interaction and supported framework version. |
| Data path | Explicit server adapter, direct browser API or frontend gateway per operation; no automatic backend choice. |
| Release | One frontend artifact/release boundary; backend and published package versions may still differ. |

## Blueprint and dependency direction

Illustration, not an implemented starter:

```text
project/
  package.json                 approved pnpm version and real scripts
  pnpm-lock.yaml
  src/
    app/
      (public)/                only when needed
      (workspace)/customers/   routing/layout/composition
    features/
      customers/               index.ts, optional server.ts, UI/api/schema/tests
      reports/                 separate feature, no customers imports
    components/                shared presentation primitives
    lib/                       app-owned adapters and helpers
```

Route groups are optional organizational examples, not security boundaries. An existing client layout should be mapped incrementally rather than renamed wholesale. For a static portfolio, omit workspace/customers/reports/auth/API code; feature folders exist only for actual capabilities. An F1 app may live at `apps/web` in a selected pnpm workspace alongside a backend or approved packages. That remains F1 because there is one frontend app.

Allowed flow is route/composition -> feature public entry -> feature internals -> approved app/platform/public packages. Shared components and utilities do not import features. If a route combines Customers and Reports, inject narrow view data/callbacks or compose independent panels. Do not allow reports to reach into customers internals or import its public barrel as a shortcut.

Keep server-only adapters behind their server entry, with minimal client DTOs. Authenticated server calls use the request's verified session context, never global user state. Database access, when selected inside the application's trusted server architecture, remains behind its explicit server domain boundary; importing a server file into a client feature is prohibited. A selected NestJS API continues to own its business authorization and persistence.

## Route and journey design

For each important route identify actor, prerequisites, layout, feature entry, rendering/freshness, URL state, API contracts, error boundary, navigation and acceptance. Public routes define metadata/canonical/indexing/content freshness; private routes define session recovery, forbidden behavior and sensitive-cache policy. Prevent private metadata, drafts or records entering public caches.

An illustrative tenant Customer journey, only if the product selects it:

1. Route composes the Customer list; validated URL parameters become bounded query input. Its approved server or browser adapter sends the request under the selected session/origin policy.
2. The backend verifies identity, requested tenant membership and read policy; scopes rows/counts; returns minimal DTOs and pagination. The frontend query/cache key reflects all result-changing scope and parameters.
3. Create/edit opens the owning feature form, preserving list return state. UI input maps into allowlisted transport fields; tenant, actor, permissions and server timestamps are not writable business fields.
4. Backend validation, actual resource policy, uniqueness/concurrency and transaction/effects are defined by the named owner. Return a committed response or distinguish invalid, denied, duplicate, stale and unavailable outcomes.
5. Success updates/invalidates detail/list/aggregate views, announces the outcome and follows the agreed destination. Failure preserves edits with field/root feedback and focus. A stale edit offers reconciliation without discarding the draft.
6. A lost create response triggers the agreed outcome/idempotency recovery, not an uncontrolled second create. Logout/tenant switch prevents old pending requests from repopulating the new view.

Use the [operation handoff](architecture-decisions.md#operation-handoff) and original addendum for actual field/transaction contracts. A static contact flow instead needs its real delivery/abuse/failure contract; do not graft Customers into every application.

## Sharing and release

Prefer one owner per capability and avoid app-internal service layers that only rename a function. Separate view-specific input from transport DTOs and persistence models. Extract packages only for actual consumers or a deliberately approved foundation. If another frontend later becomes necessary, propose F2/F3 migration independently; do not change the profile by adding a second app quietly.

Record frontend/backend contract compatibility, feature flags if selected and recovery. A single frontend release can still encounter old browser assets, a newer API, a failed deployment or cached public content. Plan compatible API windows and asset/cache behavior. No automatic publication or deployment is authorized by F1.

## Required evidence plan

Scale checks to actual scope, naming the project commands and expected observations:

- Feature/import boundaries, public exports, server-only dependency isolation, typecheck and production build for the selected target; static export only when all selected features support it.
- Important route journeys, responsive/long-content states, keyboard/focus and applicable accessibility checks; public rendered HTML/metadata and publish/freshness where selected.
- For authenticated products: anonymous/forbidden/expired states, wrong-tenant API denial, identity switch with an old request resolving late, no private shared-cache leakage and revocation recovery.
- For writes: malformed fields, field/root error mapping, dirty input during refresh, duplicate submit, ambiguous result, concurrency conflict and correct post-save/back/cancel navigation.
- Representative performance baseline/budget and measured request/bundle/render results where relevant. No fabricated gain from merely selecting server components.

Backend/database guarantees require their separate execution evidence. No backend checks are required when no backend exists. Return incomplete readiness if a required target or version is unresolved; a proposed command is not a pass.

## Architect handoff checklist

Deliver the accepted F1 decision, repository/backend axes, route-to-feature map, settings, allowed imports, actual reuse inventory, operation contracts, package/contract owners, release compatibility, small implementation slices and planned evidence. List unresolved decisions and excluded capabilities. Do not create a workspace, Turbo configuration, API, authentication or database simply because those are available in the agency catalog.
