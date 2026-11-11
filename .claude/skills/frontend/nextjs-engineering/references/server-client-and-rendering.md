# Server/client boundaries and rendering

Use for routes, component boundaries, providers, rendering, hydration and frontend/server caches. Read the accepted settings and [placement guide](code-placement-and-imports.md); architecture ownership remains in the selected [F1/F2/F3 profile](../../../fullstack/system-architecture/references/frontend-foundation.md). This is a decision and implementation contract, not a version-tested starter.

Sections: [version gate](#1-version-and-execution-model-gate), [boundaries](#2-component-and-import-boundaries), [data crossing](#3-data-crossing-and-providers), [route rendering](#4-route-rendering-and-content-lifecycle), [cache contract](#5-cache-ownership-and-identity), [hydration/transitions](#6-hydration-and-identity-transitions), [entry points](#7-server-entry-points-and-effects), [verification](#8-verification-and-source-coverage).

## 1. Version and execution model gate

Inspect exact Next/React versions, router, runtime/hosting target, configuration flags, lockfile and relevant build evidence. Record whether the project uses the previous caching model, Cache Components or another supported configuration. Do not combine APIs/examples from different models or infer semantics from a manifest range. Verify async request APIs, revalidation signatures and runtime restrictions against the selected documentation.

Current [Next.js caching documentation](https://nextjs.org/docs/app/getting-started/caching) distinguishes its Cache Components model from previous behavior. A request-time cookie read does not justify an unconditional rule that the whole route must be dynamic under every model. Choose the implementation after inspecting the real configuration. Missing versions block version-dependent code, not independent requirements analysis.

For each important route record audience, content/data source, identity/tenant scope, rendering/freshness, browser interaction, loading/error boundary, public metadata, deployment target and expected evidence. Build symbols are clues about output, not proof of authorization, isolation, freshness or a rendering defect. A public route can legitimately be request-rendered; a protected product can contain a safe public/static shell.

## 2. Component and import boundaries

In App Router, keep server rendering for suitable composition and trusted reads; introduce a client boundary where interaction/hooks/browser capabilities require it. Minimize the transitive client graph, rather than mechanically forcing every client module to be a leaf. Existing client-heavy tools may have a justified island with deliberate size/lifecycle budgets.

| Need | Placement and required behavior |
| --- | --- |
| Trusted API credentials, secret config, privileged server read | Guarded server module; return minimal safe DTOs. A file called `server.ts` alone is not enforcement. |
| Static/server-rendered content and heavy display transformation | Server-owned where suitable for target and freshness; avoid shipping unused transformation libraries to the browser. |
| Handlers, interactive state, effects, browser hooks | Explicit client module and safe transitive dependencies; no privileged package imports. |
| DOM/window/storage-only library | Client boundary with supported lazy/client-only loading when needed. A Client Component may still prerender on the server, so module/render-time browser access needs care. |
| Framework error boundary | Follow that entry's actual convention; do not apply a blanket prohibition on client directives in every framework file. |
| Interactive wrapper around server content | Server composition passes approved children/slots; the wrapper does not import a guarded server module to execute it in the browser. |

`'use client'` establishes a module boundary; imported dependencies join its client graph unless handled through a supported framework boundary. A type declaration or re-export does not make privileged values safe. Keep public client and guarded server entry points separate. See [React boundary semantics](https://react.dev/reference/rsc/use-client) and [Next.js component guidance](https://nextjs.org/docs/app/getting-started/server-and-client-components).

Do not add a client directive to an entire layout just for a theme toggle. Equally, do not claim a client page is universally forbidden: the accepted route/use case may require one. Record the reason and check bundle, SSR/hydration and trust consequences. Browser support and accessibility still apply to server-rendered content.

## 3. Data crossing and providers

Project transport contracts and React serialization are different. React's documented serializable values include Date, Map and Set; an HTTP JSON DTO convention can deliberately use ISO dates and plain structures. Do not describe a chosen JSON-only convention as a React limitation. Arbitrary functions/class instances and privileged objects are not safe boundary payloads; use supported React/framework constructs only under their actual contract.

Return explicit minimal view DTOs. Never pass a whole user/session/ORM record because TypeScript accepts it. Define decimal/bigint/date-only/instant/omitted/null transformations and locale/timezone formatting; avoid server/browser initial-output mismatch. Rendered HTML and serialized/hydration payloads can disclose data even if a component later hides it.

Client providers wrap approved children/slots and live at the smallest useful scope. Separate public theme concerns from protected query/session lifecycles when appropriate. Avoid creating a global browser query/store just because every route imports a root layout. Server request state is request-isolated; browser state has a declared app/session/tenant lifecycle. An RSC does not read/write a global client store to transport request authority.

Server prefetch plus client hydration is optional for a route that actually needs subsequent client-query behavior. A server-only view can render a safe DTO without a query provider. Hydration requires the same scoped keys, DTO semantics and selected library version on both sides; do not prefetch unnecessarily or duplicate the same read with an unrelated client cache.

## 4. Route rendering and content lifecycle

| Route characteristic | Design requirement |
| --- | --- |
| Public content fixed at build | Static generation/export if all selected features and hosting support it; define rebuild and missing-path behavior. |
| Public content requiring updates | Explicit freshness/revalidation or request-rendering strategy; account for publish/unpublish, stale pages and invalidation failure. |
| Personalized/protected view | Trusted current authority, private/scoped data and caches; choose supported request-time boundaries without exposing private content through a public shell. |
| Slow independent sections | Supported streaming/Suspense boundaries, bounded useful fallbacks, partial error behavior and accessible status. Parallelize independent reads; do not duplicate calls accidentally. |
| Rich editor/board/map | Deliberate browser island, initialization/cleanup, lazy assets, meaningful non-ready state and performance budgets. |
| Mixed shell and request-time content | Supported composition/cache model with inspected flags/version and boundary evidence; no assumed universal PPR configuration. |

Specify loading behavior that fits the operation: stable skeleton, textual progress, retained content during refresh or another accessible state. No universal spinner ban or requirement to add a loading/error/not-found file to every segment. Boundaries should isolate real failure/loading responsibilities. A retry control cannot repeat consequential work blindly.

Public pages define canonical URLs, metadata, crawlable links, sitemap policy, redirects and meaningful not-found behavior. Draft/preview/private content has explicit access and cache/index exclusions. `noindex` is not authorization. Choose freshness and cache headers so unpublishing or permission changes have the required effect; do not assume metadata and body share identical data policy.

Unexpected errors use safe boundary feedback and a correlation identifier where available; expected validation/denial/conflict outcomes use the operation contract. Framework redirect/not-found control flow must not be swallowed by a blanket catch. Global errors, root layouts and provider failures need their own actual framework behavior considered. See [Next.js error handling](https://nextjs.org/docs/app/getting-started/error-handling).

## 5. Cache ownership and identity

For each cache layer, record data class, owner, key/partition, lifetime, freshness, mutation invalidation, permission-revocation policy, persistence and evidence. Distinguish request memoization, server data/output caches, CDN/proxy caches, browser/router caches, query clients and persisted stores. One layer's safe setting does not prove the others safe.

Public caches contain deliberately public projections. Protected results require sufficient identity/tenant/authorization partition and current access enforcement; the default is to avoid shared protected caching unless an explicit reviewed design satisfies those guarantees. Reading cookies, setting one `no-store`, a Vary header or hashing a key is not a complete proof. Never use bearer tokens as visible/cache-log identifiers or dehydrate credentials.

Server personalized query clients and ambient actor state must not be module-global. The selected cache configuration must not capture one request's actor/tenant in a reusable closure. Include result-changing tenant, actor/permission context, locale and query parameters in keys where relevant. Decide how stale grants and sensitive cached data are removed; key separation alone does not implement revocation.

For each mutation, map affected data/detail/list/count/aggregate caches and ownership across browser/server/CDN layers. Invalidate only after the authoritative outcome permits it. Server invalidation and browser query invalidation are separate operations, and asynchronous work may complete later. Use the installed version's actual revalidation API and semantics; no copied universal signature or arbitrary freshness number.

## 6. Hydration and identity transitions

For a protected interactive route:

1. Resolve request identity and verified scope at the trusted owner. Parse safe navigation input; fetch through the approved server adapter.
2. Use request-isolated query state if prefetching. Key it with captured result-changing scope and validated parameters. Return only approved data and a compatible scoped hydration payload.
3. Browser initialization consumes that scope/revision; it does not infer authority from hydration. Configure stale/refetch/retry behavior from freshness and operation semantics.
4. Before applying delayed hydration, read results or mutation callbacks, verify they still belong to the active generation or intentionally retained captured scope. Never show old protected results as new-tenant placeholder content.
5. On logout/account/tenant/impersonation change, follow the foundation's [transition contract](../../../fullstack/system-architecture/references/frontend-foundation.md#6-state-cache-and-identity-transitions): stop protected work, handle dirty drafts, cancel where possible, rotate/clear scoped caches/persistence, re-resolve authority and reject obsolete results.

Every in-flight mutation captures its initiating identity/tenant, resource and operation identity. Its callbacks cannot target the currently selected tenant by reading a mutable global. A failed optimistic mutation removes/reconciles its own contribution; a whole-cache rollback can overwrite later successful work. Cancellation/switching does not undo a committed backend operation. Define how an old-scope outcome remains discoverable without exposing it in the new view. Detailed methods are in [query caches and hydration](query-cache-and-hydration.md) and [mutations and recovery](mutations-and-recovery.md).

## 7. Server entry points and effects

Every selected Route Handler, Server Action and trusted server use case enforces its own validation and authority. Layout redirects, hidden buttons and client role checks do not secure direct requests. Verify actor, requested versus verified tenant, actual resource policy and writable fields at the owning backend boundary. A gateway may protect its own entry but cannot replace backend domain policy. See [Next.js data security](https://nextjs.org/docs/app/guides/data-security).

Choose Server Actions deliberately in project settings rather than globally enabling or banning them. Treat exposed actions as callable endpoints, with their real origin/CSRF/session/deployment behavior. Do not mutate domain state, logout cookies or invalidate caches as a render side effect. Rendering and prefetching may repeat; consequential work belongs to an authorized operation with the correct idempotency/outcome contract.

Frontend server adapters use the [transport/error contract](api-transport-and-errors.md). A selected NestJS backend owns its authoritative use cases and persistence; server components do not grow a second competing business implementation. A project without NestJS still names the trusted domain owner explicitly rather than scattering policy across components.

## 8. Verification and source coverage

Evidence plans include actual production target builds; client graph/secret leak inspection; direct server-entry denial; two-actor/two-tenant cache tests; late hydration/requests and mutation races; accepted rendering/freshness; publish/unpublish and preview; supported SSR/hydration and browser APIs; partial errors/loading/accessibility; and measured relevant bundle/waterfall/interaction budgets. Select applicable cases; a static public site does not need fake tenancy tests.

A build symbol does not prove isolation or performance; a mock backend does not prove current membership or SQL policy. Record versions/configuration, commands, revision, browser observations and missing evidence. No Next.js application was built by authoring this reference.

This reference and the API guide cover FE-STD-06, FE-STD-07, FE-STD-12 and IAM-STD-07 in the [source audit](../../../../../docs/specifications/source-audits/02-phase2-3.md). The original named [rendering-security.md](rendering-security.md) is now authored as a focused checkpoint routing to these methods; that closes its filename gap without certifying the full skill or runtime behavior. The supplied reference kit's blanket serialization, caching and build-symbol rules are superseded here by explicit version/configuration and evidence requirements, not silently copied.
