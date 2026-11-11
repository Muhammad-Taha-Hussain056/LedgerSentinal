# URL and UI state

Use for navigation/search/list state, local/shared UI state, wizard ownership, persistence and cross-tab coordination. Follow accepted [settings](frontend-presets-and-settings.md); [queries](query-cache-and-hydration.md), [forms](forms-validation-and-errors.md) and [mutations](mutations-and-recovery.md) own their respective lifecycles. A state library is an implementation choice, not a security boundary or mandatory enterprise dependency.

Sections: [ownership](#1-state-ownership-map), [URL/history](#2-url-contract-and-history), [search](#3-search-composition-and-response-order), [collections](#4-pagination-selection-and-bulk-intent), [stores](#5-shared-ui-stores-and-ssr), [persistence/events](#6-persistence-and-cross-tab-events), [transitions](#7-navigation-and-identity-transitions), [evidence](#8-verification-and-sources).

## 1. State ownership map

| State | Authoritative owner and boundary |
| --- | --- |
| Server records, counts, permissions and operation outcomes | Trusted backend; selected query/server-read layer caches permitted projections. Cached permissions are advisory for presentation, never authority. |
| Shareable committed filters/sort/page/cursor/tab | Validated URL contract when safe and meaningful; secrets/sensitive search can require an explicit private-state alternative. |
| Immediate input/open/focus/hover/expanded state | Local component/reducer or nearest suitable subtree. No global store for a one-control interaction. |
| Form baseline/draft/errors | Selected form mechanism with deliberate lifecycle; not mirrored into query and store copies. |
| Shared transient UI/preferences | Context/reducer or selected Zustand store when a concrete cross-component need warrants it; scoped lifetime and reset. |
| Wizard draft spanning unmounted steps | One explicit retained form/reducer/store owner; persistence separately selected. |
| Large client-owned editor/offline/undo graph | Explicit capability/override with runtime, history, persistence and recovery design; do not assume every application needs it. |

Do not copy Query data, URL parameters or RHF fields into Zustand just for convenience. Derived values use projections/selectors. A temporary editable draft or optimistic layer is legitimate when its owner and reconciliation are explicit; it does not become a second authoritative server cache.

The kit prefers local state first and justified Zustand for shared UI. Existing accepted state systems remain until an approved change. Context with a reducer is valid for suitable small scopes; there is no universal “Context is not a state manager” ban. A new alternative needs its replacement methods/verification, not an arbitrary checklist count. Keep server-state ownership coherent rather than silently adding a competing query engine.

## 2. URL contract and history

Treat URL/path/search input as untrusted data on both server and browser. Define shared parse/default/serialize logic with the operation owner; TypeScript assertions do not validate raw strings. The actual backend still allowlists its own filtering/sorting and limits.

| Concern | Required rule |
| --- | --- |
| Fields | Supported names, types, bounds, allowed enum/sort values and maximum lengths/counts; no raw database column expressions. |
| Missing/empty | Missing versus empty string, defaults, optional/null behavior and consistent server/client interpretation. |
| Repeated/array parameters | Explicit accepted multi-value syntax and duplicate handling. Do not silently read only the first value when duplicates have meaning or create ambiguity. |
| Invalid values | Defined rejection, safe fallback or canonical replacement; no crash or silent unsafe coercion. |
| Canonical form | Stable normalized filters, sorting of order-insensitive values, default omission and encoding; avoid endless replace/render loops. |
| Privacy | No credentials, private drafts or sensitive identifiers/search terms without a deliberate classification and safe alternative. URLs can enter history/logs/referrers. |
| Ownership | Update only owned parameters and preserve permitted unrelated parameters deliberately; do not clobber sibling route state. |

Use actual Next version/router conventions: server page search parameters, browser read-only search views and navigation adapters have different APIs and rendering/Suspense effects. Do not mutate a read-only view or assume a static route behaves identically in dev and production. See [Next.js useSearchParams](https://nextjs.org/docs/app/api-reference/functions/use-search-params).

Choose history behavior per interaction: push for meaningful navigable transitions; replace for canonicalization or selected transient refinements when appropriate. Define scroll/focus behavior. Back/Forward restores committed state, not whatever a stale local timer last held. URL synchronization has one owner; do not let several effects fight over the same keys. A selected URL-state library such as nuqs requires adoption/version guidance, not an incidental installation.

## 3. Search composition and response order

Separate immediate text from committed normalized search. Respect IME composition: preserve the composing value, suppress premature commits/requests and commit according to the selected interaction after composition ends. Clear submits an immediate empty committed search and cancels pending timers/work. Provide an explicit submit path where the product needs it; debounce duration is a measured usability setting, not an invented universal constant.

Each pending debounce captures input/navigation/scope generation. Cancel or obsolete it on new input, navigation/Back, unmount, clear and identity transition. Before committing, ensure the captured generation is still current. A timer created before Back must not replace the restored URL afterward. Handle typing while a navigation is pending using the accepted ownership rule, rather than overwriting newer input from an old URL render.

Read results belong to their captured normalized parameters and identity. Cancel superseded requests where supported; also prevent stale responses from rendering as current when cancellation races/does not work. Query keys separate result families, while the UI selects the active key/generation. Never copy every resolved result into one unscoped global array.

Distinguish no data, no matches, loading and refreshing/error. Preserve safe useful results during same-scope refresh when allowed, with truthful feedback. Do not reuse another tenant's results as a placeholder. Sensitive search may use private state with an explicit Back/refresh contract instead of URL sharing.

## 4. Pagination, selection and bulk intent

The API owns bounded page size, deterministic ordering/tie-breakers, authorized counts/facets and cursor validity. The UI validates navigation input and preserves those semantics. Reset/recompute cursor/page when result-defining filters/search/sort changes. After deletion/filtering, clamp or navigate out of an invalid page using the agreed response contract; do not leave a misleading empty terminal view.

| Selection model | Required representation |
| --- | --- |
| Visible page | Explicit visible eligible IDs with scope and page/filter context. Label the extent honestly. |
| Explicit across pages | Bounded set of authorized-intent IDs, ownership/scope, exclusions and behavior when data changes. Backend rechecks every record. |
| All matching | Accepted scoped predicate or server selection/snapshot token plus exclusions, expiry and membership semantics; not merely IDs from the current page. |

Define whether selection means the matching set at execution or a stable snapshot. Changing the predicate, tenant or permission state clears/rebases selection explicitly. Do not let a stale count or hidden checkbox imply a broader operation than the user intended. UI selection is a request of intent, not authority; the server enforces limits/policy/atomic or per-item outcomes.

Infinite/load-more state needs bounded page retention, next/end/error semantics and accessible navigation alternatives. Detailed presentation methods are in [tables/lists](ui-components-and-layout.md#6-tables-lists-and-selection); this contract defines data/selection ownership. See [query collections](query-cache-and-hydration.md#6-lists-pagination-and-live-updates) and [bulk mutation outcomes](mutations-and-recovery.md#6-bulk-files-and-asynchronous-work).

## 5. Shared UI stores and SSR

Justify a store with concrete consumers and a coherent purpose. Feature-local state stays in the feature; app-shared capabilities use deliberate owners, and packages never import applications. Keep explicit state/actions, selectors and derived values. Avoid an unbounded mega-store, raw server responses, whole-form subscriptions or hidden import-time side effects.

With SSR, create request/provider-scoped state; do not share one mutable server-wide Zustand store across users. A `'use client'` directive does not prevent server prerendering or make module globals safe. Hydrate consistent initial public/permitted state and avoid reading browser storage/window during server render. RSCs do not read/write the client store as ambient request context. See [Zustand Next.js](https://zustand.docs.pmnd.rs/learn/guides/nextjs).

Maintain a stable instance within the intended provider lifecycle and deliberately reset/remount it for resource/session changes. Select only needed state; equality/shallow helpers must match the selected version and value shape. Measure rerenders before changing architecture. Context can inject the store instance without becoming a second source of truth.

Explicit typed actions and immutable updates keep behavior inspectable; dependencies such as timers/listeners/storage have owners and cleanup. Keep devtools/logging free of credentials and private payloads in development too, not just production. A browser store's “canEdit” flag affects presentation only; trusted endpoints enforce actual grants.

## 6. Persistence and cross-tab events

Default to no sensitive draft/query/mutation persistence. Approved preference or draft persistence records:

- Minimal classified allowlist and purpose; owner, identity/tenant scope, storage location, retention/expiry and size limits.
- Schema/version and validated rehydration/migration, unknown/corrupt-version behavior, cleanup and explicit reset/discard paths.
- SSR initial-state strategy and visible rehydration timing; no flash of another identity's saved content.
- Logout/revocation/account/tenant behavior and whether resumption requires server checks before display or submission.

Do not dump an entire store/query cache into localStorage or persist credentials/bearer tokens. `partialize`/migration middleware is only an implementation mechanism; validate persisted values as untrusted and verify the selected version. Persisted data cannot grant authority. Browser encryption with a same-origin accessible key does not remove script access. Offline write queues need the separate [mutation policy](mutations-and-recovery.md#7-offline-and-identity-changes).

Cross-tab/session events are narrow notifications with allowed type/version, bounded non-secret payload and documented origin/channel/source checks where applicable. No bearer tokens, raw drafts or privileged actions. A forged “tenant switched/admin granted” message must not grant access or cause a trusted operation; re-resolve authority through the accepted session owner and reconcile safely. Avoid recursive broadcast storms, stale generations and duplicate subscriptions.

Specify cross-app/remote coordination only for selected F2/F3 topology. Same repository, origin or shared source package does not imply a shared memory lifetime. Keep transition/event contracts minimal and compatible across supported releases.

## 7. Navigation and identity transitions

Before a consequential navigation/scope switch, apply the [form dirty-work policy](forms-validation-and-errors.md#5-submit-and-navigation-contract). Pending writes remain attached to their initiating scope even if the view changes. Discarding a draft or closing a tab does not cancel a committed operation.

Stop old protected rendering/work, obsolete debounce/search/hydration/subscription callbacks, cancel where supported, clear/partition private caches/stores/persistence, re-resolve current authority and initialize the new scope. A reset registry must cover actual stores/queues/subscriptions and unregister correctly; naming a helper does not mean it exists. Do not clear unrelated public preferences without reason or retain sensitive state by accident.

Permission revocation while the page stays open needs its actual server/session enforcement and cache response; waiting for a route change is insufficient when the product requires current denial. Handle browser history returning to a protected route with the same authority checks, not an old client store snapshot. Return URLs and cross-app destinations are validated safe destinations, never arbitrary open redirects.

## 8. Verification and sources

Plan malformed/duplicate/empty/bounded URL parameters; server/browser parser agreement; Back/Forward with pending debounce; IME/clear/slow responses; simultaneous navigation/input; page reset/clamping; explicit versus all-matching selection; changed predicates/permissions; two-request SSR store isolation; provider hydration/reset; selective rerender behavior where relevant; corrupt/expired/migrated persistence; forged/cross-tab events; logout/late callbacks; dirty work and pending operation recovery.

Run applicable actual pnpm scripts/component/browser cases and record revision, exact versions/settings, outcomes and limitations. Mocked event/store tests do not prove backend authorization. Measure before claiming performance gains; a library choice alone establishes none. No URL adapter, store or persistence runtime was executed by writing this guide.

The supplied `data-client-state` methods are consolidated without a compulsory store, blanket Context ban or fixed Redux checklist. Primary Next/Zustand documentation was consulted on 2026-10-21; actual project compatibility still needs evidence. Apply FE-STD-01,05,07,08,09,10 and relevant tenant/privacy requirements from the [original standards](../../../../../docs/specifications/standards/01-frontend-backend.md).
