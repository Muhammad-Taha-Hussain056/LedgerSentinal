# F3: independently deployed composed frontends

Use only after the user selects F3. Read [frontend-foundation](frontend-foundation.md). F3 composes independently deployed frontend units into an agreed product surface. Package sharing alone does not provide composition, independent releases or fault isolation. This profile does not select backend microservices.

Sections: [composition](#1-required-composition-choice), [passport](#2-architecture-passport-extension), [ownership](#3-ownership-and-integration-boundaries), [identity/cache](#4-authentication-tenancy-and-caching), [UI/runtime](#5-uiruntime-integration), [releases/recovery](#6-failure-releases-and-recovery), [evidence](#7-required-proof-and-handoff).

## 1. Required composition choice

F3 selection alone is incomplete. Present the following viable choices and get the composition mechanism accepted before implementation:

| Variant | Shape and required decisions |
| --- | --- |
| Route-based composition | Edge/router maps non-overlapping path ownership to independently deployed apps/zones. Record rewrite/proxy ownership, asset paths, base paths, cross-zone navigation and shared session/visual contracts. |
| Runtime composition | A host/shell loads remote capabilities within a page. Record exact loader/adapter, host/remote contract, rendering support, runtime sharing, mount/unmount and release compatibility. |

[Next.js Multi-Zones](https://nextjs.org/docs/app/guides/multi-zones) is an official route-based approach. It does not establish that an arbitrary runtime federation adapter supports the selected Next.js/React/router/SSR combination. Verify the exact mechanism against primary documentation and a disposable proof with the actual versions. An unsupported combination blocks dependent implementation; propose another compatible mechanism without silently changing the approved profile.

Do not claim seamless SPA navigation or shared component state across route zones. Record full-document versus client navigation behavior and its effect on drafts, focus, analytics, loading and performance. For runtime composition, confirm server rendering/streaming/hydration and development/production behavior, not just a local remote rendering once.

## 2. Architecture passport extension

| Field | Required record |
| --- | --- |
| Composition owner | Router/edge owner for zones or host/shell owner for runtime composition; bootstrap/config and recovery authority. |
| Unit ownership | Each zone/remote name, owner, routes or mount contract, origin, assets, supported version and deployment unit. |
| Routing | Collision-free route ownership, nested/unknown paths, deep links, reload, redirects, navigation/back and not-found boundaries. |
| Integration | Exact loader/rewrite mechanism and documented version compatibility, SSR/client constraints and approved external dependencies. |
| Runtime and styling | React/runtime sharing or isolation, peer versions, CSS/token scope, global styles, portals, overlays, focus and z-index ownership. |
| Trust | Approved origins/asset sources, config integrity policy, authentication/session boundaries, CSP/CORS/CSRF where applicable and remote-content trust. |
| Contracts | Versioned props/events/routes/session view, validation, deprecations, supported producer/consumer combinations and owners. |
| Reliability | Load/health timeout, error containment, unavailable/degraded views, retries, kill switch and rollback authority. |
| Delivery | Artifact/asset compatibility, publication/release ordering, cache policy, observation window, recovery and mixed-version evidence. |

Repository selection remains separate: a pnpm workspace with optional Turborepo or multiple pnpm repositories with approved distribution. Each app/unit uses feature-first internals and explicit package exports. Shared source packages do not grant access to another unit's private feature code.

## 3. Ownership and integration boundaries

Illustrative route-based ownership map:

```text
approved router/edge
  /             -> public zone
  /workspace/*  -> workspace zone
  /support/*    -> support zone
each zone -> own routes/features -> exported packages and authorized APIs
```

Illustrative runtime map:

```text
shell: navigation, composition, session-view contract, global error boundary
  orders remote: exposed mount/component API -> own features
  reports remote: exposed mount/component API -> own features
each unit -> approved UI/contracts/utils and authoritative APIs
```

These are examples, not implemented starters. Record the real owners rather than creating all units. Each route/mount has one owner. Shared shell concerns are narrow: navigation, visual frame, accessible global feedback where chosen, lifecycle integration and session **view**. The shell must not accumulate every domain service or act as the sole authorization gate.

Units cannot import another unit's private app/feature code, database layer or store. Export only deliberate integration points. A runtime event bus, if chosen, has named typed/versioned events, validated payloads, explicit producer/consumer, ordering/deduplication where material, subscription cleanup and failure handling. Avoid a general global mutable store that couples all releases. Events and props carry minimal approved data, no bearer tokens or arbitrary executable callbacks from untrusted configuration.

Remote code executed in the host's origin has substantial shared trust; a component boundary is not a security sandbox. When untrusted third-party UI needs stronger isolation, propose an explicit iframe/origin isolation contract and its accessibility/message/auth implications. Validate message origin/source/schema; never treat a message as server authorization.

## 4. Authentication, tenancy and caching

Choose one documented session integration strategy for the actual origin topology. Same-origin versus cross-origin, cookies versus tokens, direct APIs versus gateways and refresh ownership are separate decisions. Do not hand every remote a localStorage bearer token or place credentials in remote URLs, event payloads, props or logs. Shared UI session state is advisory; every backend entry enforces identity and resource authority.

Define session/bootstrap unavailable, login/logout/expiry, membership revocation, tenant/account switching and impersonation transitions across all units. Protected units stop rendering and requesting old-scope data during transitions. Prevent duplicate refresh storms through the selected authority owner; define denied/expired responses and recovery without infinite redirect loops.

Each zone/remote cache has a declared lifetime and identity partition. Server query clients are request-isolated. Browser caches include relevant tenant/actor/permission/query variables. Cancel/obsolete old-generation work, clear or partition persisted data and ignore late results after switches. Scope propagated invalidation events; a browser event never expands permissions. Test a delayed response from tenant A after tenant B is active, not only clearing the current list.

Route composition must preserve safe cookie/CSRF/origin behavior through actual rewrites/proxies. Runtime remote loading configuration is allowlisted and environment-controlled; query-string-provided remote script URLs are prohibited. Plan artifact integrity/CSP controls appropriate to the mechanism and document what trust they actually provide. Do not certify isolation merely because origins or directories differ.

## 5. UI/runtime integration

Agree shared design tokens, accessibility primitives and versioning, while each unit owns domain UI. Define global CSS/reset ownership, CSS namespace/style encapsulation, fonts, asset prefixes and modal/portal layers. Test sibling units together: a remote stylesheet cannot silently break another unit's layout or focus.

For runtime composition, choose shared runtime singleton constraints or deliberate isolation supported by the actual mechanism. Check React/renderer/peer compatibility and hook behavior in production; a dependency deduplication assumption is not proof. Record host/remote SSR boundary, hydration payload compatibility, loading placeholders and error boundaries. Server-only imports cannot enter browser remote bundles.

For zones, specify asset path uniqueness and cache lifetimes so one release cannot serve another zone's chunks. Test direct deep links, hard refresh, nested/unknown routes, external links and cross-zone navigation. Do not rely on host-only client routing for routes owned by another deployment.

## 6. Failure, releases and recovery

Every zone/remote defines unavailable/slow/incompatible states. Provide bounded loading, accessible fallback and a useful recovery route; partial UI failure cannot show a misleading successful business outcome. Protected fallback content must remain protected. Retrying a remote load must not resubmit an order, payment or other business operation.

Record the supported matrix: current host/router with current and previous supported unit; candidate unit with current host/router; backend/API and shared package versions across the deployment window. Include cached browser sessions, missing/changing assets and in-progress workflows. The exact matrix is project-specific and finite; unsupported combinations must fail safely rather than load blindly.

Plan additive contract evolution, feature capability negotiation where needed, release ordering and deprecation. Name authority for changing routing/remote manifests, disabling a remote and recovering an artifact. Retain compatible assets/config long enough for the documented window. Identify rollback limits for data/contracts and forward recovery. No automatic package publication, merges, deployments or credential access.

Trace frontend errors with app/unit/build/contract and request correlation identifiers, without sensitive data. Separate load/render/auth/API errors. Define health signals and operator actions. Set per-unit and whole-journey performance budgets: duplicate JavaScript, serial discovery/load waterfalls, render/hydration cost, navigation latency and fallback time on representative devices/network. Independent builds alone do not demonstrate faster delivery or runtime performance.

## 7. Required proof and handoff

Before expanding implementation, an authorized verifier must demonstrate the chosen composition on disposable project infrastructure with the approved versions. This toolkit batch provides no such application or integration runtime.

Plan the following evidence:

- Production host/zone/remote builds and public export/import boundaries; exact runtime/peer resolution and client/server leak checks.
- Direct deep links, refresh, back/forward, route collisions, cross-unit navigation, metadata where public and actual supported server rendering/hydration.
- Loading timeout, missing/incompatible unit, malformed integration payload, stale asset/config, recovery/fallback and sibling fault containment.
- Session expiry/logout/revocation/tenant transition across units and tabs; delayed old-scope result; no unauthorized API access or cached data disclosure.
- Supported mixed-release matrix and rollback/disable behavior, including cached browsers and ongoing writes. Separate component event tests from real integration tests.
- Cross-unit keyboard/focus, modal/overlay behavior, responsive/long-content layout, CSS collision and representative assistive-technology checks.
- Measured per-unit and whole-product performance, with conditions/baseline and observed limits. Test selected domain failures as well as the composition mechanism.

Return accepted F3 variant/mechanism, evidence-backed version matrix, unit/route/origin ownership, integration/session/event contracts, package graph, backend/data handoff, failure/recovery plan, small slices and blocked checks. Route-based and runtime variants have different evidence; do not require nonexistent runtime remotes for a zone-only project or claim either variant supports every project category automatically.
