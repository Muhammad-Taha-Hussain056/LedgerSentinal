# Mutations and recovery

Use for create/update/delete, toggles, reorder, bulk actions, upload completion and other frontend-triggered writes. Follow accepted [transport/error contracts](api-transport-and-errors.md), [query ownership](query-cache-and-hydration.md) and [forms](forms-validation-and-errors.md) as applicable. A mutation library reports client work; the backend owns actual authorization, transactions, durable idempotency and business outcome.

Sections: [operation design](#1-write-contract-and-ownership), [execution](#2-submission-and-outcome-sequence), [cache/feedback](#3-cache-feedback-and-navigation), [concurrency](#4-optimistic-changes-and-concurrent-writes), [retry](#5-retry-idempotency-and-unknown-outcomes), [bulk/jobs](#6-bulk-files-and-asynchronous-work), [offline](#7-offline-and-identity-changes), [evidence](#8-verification-and-sources).

## 1. Write contract and ownership

For each write identify actor/action, editable fields, resource/verified tenant, method/route, input/output/error revision, optimistic suitability, expected revision/precondition, operation identity, limits, atomicity/effects, recovery and destination. Use the [full operation record](api-transport-and-errors.md#1-operation-record-before-code); do not invent financial rules, concurrency guarantees or missing backend schemas from a button label.

Use a feature-owned operation/hook and app transport adapter. Direct API, gateway and Server Action are accepted project choices, not a universal forced BFF pipeline. Substantial UI orchestration lives outside route/component markup. Tiny native/server operations need not acquire TanStack Query merely to satisfy a template, but still meet authority and outcome rules.

Read actual TanStack/React versions for selected hooks, callback signatures, pending state, retry and mutation persistence behavior. Name the operation owner and scope before parallel work. High-risk permissions, tenancy, money or destructive/historical changes need the established review/approval gates; a frontend optimistic flag cannot waive them. Missing reviewer definitions are a handoff gap, not permission to invoke a nonexistent agent.

## 2. Submission and outcome sequence

1. Capture an immutable request snapshot: identity/tenant/resource, contract and expected revision, writable payload, initiating view generation and logical operation ID where required. Normalize/map once from the validated form; do not forward UI-only fields or mutable global scope.
2. Give the user clear pending state and prevent accidental duplicate triggers. The backend must still handle duplicates/concurrency across tabs/devices. Do not perform writes in render or an effect that can repeat merely because it mounted.
3. Execute through the approved adapter. If later work depends on the result, use the selected promise/await contract (such as supported `mutateAsync`); do not assume fire-and-forget `mutate` is an awaited promise.
4. Validate/classify the response and retain its operation context. Distinguish committed success, accepted/pending, rejected/denied/conflict, and unknown after transport/protocol failure. A generic library success flag is not the domain state machine.
5. Apply the appropriate cache/draft/feedback/navigation transition. Business outcome survives component unmount; essential reconciliation cannot depend solely on a per-call UI callback whose lifecycle may end.

Choose one owner for global versus feature errors/success messages. Component unmount, scope changes and consecutive mutations can change callback delivery/order; inspect the installed API and keep essential operation evidence/recovery with the operation owner. Catching an error must preserve failure semantics rather than produce a false success return. See [TanStack mutation lifecycle](https://tanstack.com/query/latest/docs/framework/react/guides/mutations).

## 3. Cache, feedback and navigation

Define affected detail/list/count/aggregate families under the captured scope. Update cached canonical detail only when the response is complete/compatible or the contract provides a valid merge. Do not replace a full entity with a partial PATCH response, insert into every filter/page or invalidate unrelated tenants to force a refresh.

| Operation | Cache/presentation decision |
| --- | --- |
| Create | Use canonical returned identity/DTO if available; invalidate relevant lists/aggregates and follow accepted list/detail/create-another flow. No invented server identity. |
| Update | Apply authoritative revision/data where safe; reconcile affected lists/derived views and edit baseline; avoid overwriting newer accepted state. |
| Delete | Remove/mark appropriate detail, reconcile lists/paging/selection, preserve required history and follow the agreed destination. Authorization and actual deletion semantics stay server-owned. |
| Toggle/reorder | Send the accepted command/precondition and reconcile authoritative order/state. A toggle is not automatically idempotent or low risk. |
| Accepted async work | Track authorized operation status and eventual result; do not mark the resource completed or repeat the initiating command while pending. |

Browser invalidation, Next/server invalidation and other apps' freshness are separate owners. `router.refresh` does not replace query invalidation, and query invalidation does not necessarily refresh server-rendered projections. Use accepted adapters and actual Next version APIs, not a blanket requirement that all invalidation live in a catch-all proxy.

Await relevant invalidation/refetch when the next view requires it, with explicit loading/error policy. Do not keep a save pending indefinitely waiting for inactive/disabled/unavailable queries. **A committed write followed by failed refetch or navigation is a committed write with a presentation/freshness problem.** Show “saved, refresh unavailable” or equivalent, retain the committed operation identity and retry the read/navigation; do not resubmit the write or show an unqualified save failure.

Success announcements and destinations follow the accepted journey. Preserve safe return filters. Error feedback remains inline where consequential, with one accessible summary and optional nonduplicated notification. A 403 changes allowed interaction and protected cache handling; hiding a control alone does not repair authorization.

## 4. Optimistic changes and concurrent writes

Use optimistic behavior only after assessing actual reversibility, authority, cost and failure probability. Do not label archive/reorder/toggle safe categorically; domain effects may make them consequential. Payments, grants, stock/reservations and destructive transitions usually require authoritative confirmation unless an explicit design proves a safe provisional display. Provisional UI never grants real authority.

Choose and document a concurrency strategy per resource:

- Serialize conflicting edits where that meets product needs; account for other tabs/devices through server preconditions, not just a disabled button.
- Maintain identified optimistic layers/patches over confirmed state and reconcile only the completed operation; define noncommuting edits and authoritative version rules.
- Skip optimism and show pending/confirmed results when rollback/rebase would be unreliable.

The common snapshot pattern is safe only under its actual no-overlap/ordering assumptions. If M1 snapshots v1, M2 succeeds with v3, and M1 later fails, restoring M1's entire snapshot erases M2. Remove M1's own provisional contribution or refetch/reconcile canonical state under the chosen strategy. A client sequence counter cannot substitute for a missing server concurrency contract across devices.

Before optimistic writes, obsolete relevant reads where supported; keep initiating scope and request generation. `cancelQueries` may affect client query state but does not undo backend commits or guarantee every request aborts. A late old query/response must not overwrite a newer canonical revision. Never let an error callback read the mutable current tenant and roll back that tenant's cache.

Track temporary UI identities separately from server IDs and business operation identity. Reconciliation removes/replaces only the correct provisional row. An optimistic “delete” cannot lose the information needed for failure recovery; do not restore unauthorized/private data after revocation. Use [official optimistic-update guidance](https://tanstack.com/query/latest/docs/framework/react/guides/optimistic-updates) within these explicit concurrency constraints.

## 5. Retry, idempotency and unknown outcomes

Default consequential writes to no automatic retry until their actual recovery contract is established. A client-generated header by itself does not prevent duplicates. Record durable backend identity scope, payload fingerprint/mismatch behavior, concurrent duplicate ownership, result/status lookup, retention and current-authorization checks.

Reuse the same identity and payload for retrying the same logical operation; a fresh key creates a new operation. If the user changes the payload after an unknown result, resolve or explicitly separate the previous operation before sending another. Do not silently reuse one key for different values or generate it on every render/click. Naturally idempotent operations still need their declared error/concurrency semantics.

After timeout, abort, response loss or malformed success data, the write may have committed. Show an honest outcome-unknown state, preserve safe request/operation context and reconcile through the authorized status/idempotent replay/resource lookup contract. A failed read after commit is distinguished as described above. Do not infer rollback from a closed tab, cancelled promise or stopped spinner.

Refresh/replay rules remain in the [API guide](api-transport-and-errors.md#6-refresh-retry-and-unknown-outcomes). A replay requires eligible authority plus a replayable body and safe backend semantics, not merely a 401 handler. Bound backoff/attempts and honor agreed throttling; reconnect must not automatically repeat a payment/booking/create.

## 6. Bulk, files and asynchronous work

Bulk operations declare explicit IDs versus all-matching selection, scope, maximum size, atomic versus per-item result and duplicate behavior. Prefer the approved bounded bulk endpoint; when unavailable, do not spawn unbounded N requests. Any client orchestration alternative needs deliberate concurrency, partial-failure, cancellation and server authorization contracts. See [selection semantics](url-and-ui-state.md#4-pagination-selection-and-bulk-intent).

Display authorized per-item outcomes and allow retry of only eligible failed/unknown operations without repeating completed effects. Removing visible selection does not cancel server work. Background exports/imports require status, artifact retrieval authorization, expiry and revocation behavior; accepted email/export/job is not delivered/completed work.

Uploads define intent, transfer, completion and attachment as distinct stages with their actual storage/API ownership. Size/type validation, expiring signed capabilities, cancellation, orphan cleanup and duplicate completion need real contracts. Do not force every upload through JSON or declare a copied presigned example implemented. Backend/audit/outbox/provider recovery belongs to its trusted owner.

## 7. Offline and identity changes

Offline write persistence is opt-in, independently scoped and versioned; do not enable it as a library default. Define allowed operations, sensitivity, bounded queue/expiry, durability, payload/contract migration, conflicts, idempotency, explicit user expectations and recovery. Do not store credentials or full protected cache/draft dumps in a mutation persister.

Before resuming, re-resolve current identity/tenant/grants and validate the queued operation's original scope, schema, precondition and expiry. Quarantine/review/discard incompatible work according to the accepted policy. A logout/new login must not replay one person's queued work under another person's authority. Current permission loss may prohibit continuation even for a formerly valid request; backend/system-authorized continuation needs its own explicit contract.

Use the foundation's transition sequence and [UI-state persistence policy](url-and-ui-state.md#6-persistence-and-cross-tab-events). Cancelling the client's wait does not cancel committed business effects. Keep an appropriate authorized recovery path for old-scope pending work without rendering its private payload in the new view.

## 8. Verification and sources

Plan actual-version component/browser/contract cases for double submit; explicit mapped payload; authoritative response validation; commit versus queued/unknown/rejected; M1/M2 completion and failure permutations; ignored cancellation; stale reads; expected-revision conflicts; temporary ID reconciliation; commit followed by refetch/navigation failure; expired/reused/mismatched operation identities; partial bulk outcomes; upload stage failures; offline replay after identity/schema change; and direct backend denial.

Mocks verify client behavior under their fixtures; they do not prove durable idempotency, PostgreSQL concurrency, payment/provider effects or audit/outbox integrity. Run those separately on real disposable engines/sandboxes when authorized. Record pnpm commands/tools, revision, versions, contract/settings, outcomes and missing evidence. No mutation hook, backend or offline queue was executed by writing this file.

The supplied `data-mutations` patterns are consolidated without universal BFF/Server-Action bans, snapshot rollback or automatic per-attempt identity assumptions. Primary lifecycle/optimistic documentation was consulted on 2026-10-21; inspect the project's installed versions before use. Apply FE-STD-01,05,07,09 and BE-STD-02,04,06,07,09,12 from the [original standards](../../../../../docs/specifications/standards/01-frontend-backend.md), plus selected security/tenant/billing requirements.
