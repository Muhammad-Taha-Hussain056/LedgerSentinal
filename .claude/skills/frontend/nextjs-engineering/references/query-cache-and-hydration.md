# Query caches and hydration

Use for selected TanStack Query reads, key factories, SSR prefetch/hydration, pagination, freshness and session transitions. Read accepted [settings](frontend-presets-and-settings.md) and the affected [rendering contract](server-client-and-rendering.md). Server state need not use a browser query library when a suitable server-only read meets the journey. This is not a tested query package or universal version adapter.

Sections: [ownership/version](#1-ownership-and-version-gate), [keys](#2-query-keys-and-captured-context), [lifetimes](#3-server-and-browser-lifetimes), [hydration](#4-prefetch-and-hydration-sequence), [freshness](#5-freshness-retention-and-errors), [collections](#6-lists-pagination-and-live-updates), [transitions](#7-invalidation-cancellation-and-identity-transitions), [evidence](#8-verification-and-sources).

## 1. Ownership and version gate

Inspect actual TanStack/React/Next versions, router/runtime, flags and selected query features. Hook options, callback context, suspense/cancellation, hydration and persistence semantics require matching documentation. Do not silently upgrade to the current major because a source example uses it. A version/configuration gap blocks the affected code, not independent operation discovery.

Queries own fetched canonical data and its cache lifecycle; form drafts, URL navigation and UI state have [different owners](url-and-ui-state.md#1-state-ownership-map). Do not mirror an API collection in a store just for access. Derived view data may use selectors/projections without creating another authoritative copy. Cached data is not proof of current authorization or committed business success.

Each query record identifies contract/revision, actor/tenant/public scope, validated parameters, adapter, key, cache lifetime, freshness/retention, error/retry policy, consumer and invalidation owner. Shared client/server option builders must remain runtime-safe: keep pure keys/schemas separate from guarded server imports and browser-only hooks.

## 2. Query keys and captured context

One feature/application-owned pure key factory describes the accepted cache identity. Include every value affecting results: relevant verified tenant, actor/permission context, locale, resource ID, normalized filters/sort/page/cursor and projection. Public data uses an explicitly public namespace and projection. Never use bearer tokens as keys or assume cache keys are private telemetry.

Illustrative key shape, not an implemented factory or replacement for the original ActorContext:

```text
["contacts", "private", scopeIdentity, "list", normalizedListInput]
["contacts", "private", scopeIdentity, "detail", contactId]
["reference-data", "public", locale, contractRevision]
```

`scopeIdentity` is the agreed non-secret cache scope derived from the session/tenant contract, not client-asserted authority. A local generation can obsolete work but cannot claim a new server permission revision. When no authoritative permission revision exists, define revalidation/revocation and clearing; do not invent one. Include contract revision when it changes result interpretation during the supported client lifecycle.

Use stable JSON-compatible values supported by the selected key implementation. Normalize/default inputs first; avoid non-deterministic functions, mutable class instances or unrelated UI state. Distinguish list/detail/infinite families so incompatible data shapes cannot collide. Client and server use the same key meaning, including all scope dimensions.

Capture scope and parameters at request creation. The query function uses that captured context, not a mutable “current tenant” read after an await. The backend independently validates requested tenant/resource. Disabled or unresolved-scope queries do not fetch; keep hooks structurally valid and use the installed library's supported gating mechanism. `enabled` or a key containing a tenant ID is not authorization. See [official query keys](https://tanstack.com/query/latest/docs/framework/react/guides/query-keys).

## 3. Server and browser lifetimes

Personalized server QueryClients are request-isolated. Never place a mutable authenticated client or actor context at module scope. Where one request needs shared prefetch state, use a supported request-scoped factory/memoization mechanism and verify its actual lifetime. React request memoization, Next persistent caches and browser query caches are different boundaries.

Browser clients remain stable within their intended provider lifecycle so normal renders/suspension do not discard or recreate caches unexpectedly. Choose provider scope and transition handling deliberately; a process/browser-global singleton is not a universal session policy. Multiple apps/remotes do not automatically share a QueryClient. Read only the selected F2/F3 sharing contracts when relevant.

No protected server/client data enters public output, CDN caches, serialized errors, devtools recordings or persisted caches accidentally. Minimize dehydration to selected authorized queries and safe fields. Avoid serializing raw errors/credentials or assuming a successful server query is automatically safe for the browser. Apply [server/client data crossing](server-client-and-rendering.md#3-data-crossing-and-providers).

## 4. Prefetch and hydration sequence

1. Resolve trusted request scope and parse safe route/list input under the accepted contract.
2. Create request-isolated query state and prefetch only useful initial queries through the guarded server adapter. Parallelize independent reads without duplicating them; define what happens when required versus secondary prefetch fails.
3. Dehydrate permitted data with the selected library/version's options. Pending/streamed queries and error handling require explicit supported configuration, not copied flags.
4. Render an appropriately placed hydration boundary/provider. Browser hooks use the same key, schema semantics and captured scope, with an intentional freshness/refetch policy.
5. Check active session/resource generation before applying late hydration or rendering retained data. Tenant A's dehydrated result cannot become tenant B's placeholder.
6. Reconcile later client refresh with other route content. A server-rendered count from one snapshot and a client-refetched list can diverge; assign coherent freshness/invalidation or explain the different snapshots rather than assuming Query updates the RSC automatically.

An above-zero `staleTime` can avoid immediate duplicate hydration fetches; it is **not mandatory for every query**. Zero may be correct for the actual freshness requirement. Do not suppress required fresh data merely to satisfy an example. Set all policy from product needs and verify expected requests. See [advanced SSR](https://tanstack.com/query/latest/docs/framework/react/guides/advanced-ssr).

## 5. Freshness, retention and errors

| Setting/behavior | Required decision |
| --- | --- |
| `staleTime` | How long a result may be considered fresh; value and special modes must match the installed version. Not an authorization/revocation mechanism. |
| Retention/`gcTime` | When inactive query data can be collected; distinct from freshness and privacy cleanup. |
| Focus/reconnect/mount | Per-query refresh behavior from workflow needs; disabling focus refetch alone does not protect dirty forms. |
| Poll/live stream | Bounded interval/subscription, visibility policy, error/backoff, cleanup and gap/reconnect recovery. |
| Retry | Bounded read policy for eligible transient failures; no repeated unauthorized/invalid requests or uncontrolled load. |
| Placeholder/initial data | Distinguish intentionally temporary data from actual accepted cache data; never carry private previous-scope content into a new scope. |

Initial loading, background refreshing, empty, no results, partial failure, denied/expired and unavailable are distinct UI states. Keep safe useful data during refresh when allowed; do not hide a failed refresh behind permanent success or replace a populated view with an unrelated spinner. Domain freshness/revocation can require withholding stale content. Explain the last-update state when it matters.

Use the centralized [transport/error contract](api-transport-and-errors.md), not ad hoc JSON parsing inside components. Query status and network/fetch status may differ; implement disabled/offline/paused states from actual supported APIs. A read error does not imply a write failed. See [important defaults](https://tanstack.com/query/latest/docs/framework/react/guides/important-defaults) and verify configuration instead of assuming documented defaults equal project settings.

## 6. Lists, pagination and live updates

Use validated committed [URL/list input](url-and-ui-state.md#2-url-contract-and-history) and the same normalized object in the key and request. The backend owns bounded page size, authorized sorting/filtering, stable ordering and cursor semantics. Offset/cursor/infinite choice follows the contract; infinite scrolling is not universally cursor-only by frontend decree.

Previous-page placeholders can be appropriate within the same allowed scope/projection. Gate retention by identity and result compatibility; do not blindly apply keepPreviousData to tenant/account/permission transitions. Selection is separate from the visible rows and follows its explicit semantic model.

Infinite lists define initial/next page parameters, end condition, duplicate/order behavior during concurrent changes, memory/page bounds and error retry. A changed filter/sort invalidates the old cursor/page chain. Avoid simultaneous competing page requests and stale page append. Preserve accessible finite/load-more alternatives when required.

Live events update/invalidate only captured authorized scope. Validate event shape/version and handle duplicates/reordering/gaps through the actual backend contract. Reconnect can require a fresh snapshot; an event bus or WebSocket message cannot grant access. Unsubscribe when scope/provider changes. Do not keep a second store copy just to receive events.

## 7. Invalidation, cancellation and identity transitions

Use the narrowest correct key families for mutation effects; detail, lists, counts and aggregate views may all be affected. `setQueryData` is suitable only for a compatible authoritative result and the intended existing/new cache entry. It must not fabricate complete records from partial responses or insert a row into every filtered/paginated list. Invalidating and fetching are different operations; inactive/disabled queries may not refetch immediately. Match the installed APIs and required evidence.

Cancellation is best effort: pass supported AbortSignals through the selected transport and avoid consuming obsolete results elsewhere. Suspense hooks and versions can have documented cancellation limitations; never use cancellation as the sole confidentiality boundary. See [query cancellation](https://tanstack.com/query/latest/docs/framework/react/guides/query-cancellation). Cancelling a query does not roll back a server mutation.

On logout/account/tenant/effective-identity change: stop protected rendering/new old-scope work; resolve dirty drafts; cancel/obsolete old work; remove or partition caches and persisted state under the privacy policy; re-resolve authority; initialize the new scope. A logout usually removes protected browser state; deliberately retaining another tenant's cache requires an explicit current-access/privacy policy. Keys alone do not prevent stale placeholder UI or in-flight callbacks.

Do not indiscriminately clear unrelated public/other app caches to repair a single stale row. Likewise, a narrow invalidation is insufficient when session authority changed. Pending mutation outcomes remain attached to their captured operation/scope and follow [mutation recovery](mutations-and-recovery.md), not the current tenant's global state.

## 8. Verification and sources

Plan actual-version component/browser/SSR checks for simultaneous two-actor requests; stable browser client lifecycle; key/parameter agreement; dehydration privacy; initial and failed prefetch; staleTime zero/positive as selected; disabled/inactive invalidation; scope-safe placeholders; filter/cursor changes; live unsubscribe/reconnect; logout/late hydration/read; query cancellation ignored/unsupported; and mixed RSC/client freshness.

Verify real API policy separately. Mocked network tests prove cache/UI behavior under those fixtures, not current membership, backend pagination correctness or PostgreSQL isolation. Measure actual request counts/freshness/bundle/waterfall before claiming improvement. Use approved pnpm scripts and record revision, versions/config, outcomes and unexecuted checks.

This reference consolidates the supplied `data-tanstack-query` detail while replacing unscoped keys, universal positive freshness and unsafe cross-scope placeholders with explicit contracts. Primary guides were consulted on 2026-10-21. Their changing examples are not an installed compatibility matrix. Map FE-STD-05 through FE-STD-08,12 and applicable tenant rules from the [original standards](../../../../../docs/specifications/standards/01-frontend-backend.md).
