# API transport, errors and operation outcomes

Use when implementing browser/server API clients, selected frontend gateways, credential forwarding, request/response validation or mutation recovery. Read the accepted settings/contract revision and affected [rendering boundary](server-client-and-rendering.md). Full domain/persistence fields remain in the preserved [API/data-flow contract](../../../../../docs/specifications/addenda/2026-10-20-api-data-flow-contract.md). This reference implements no client, gateway or backend module.

Sections: [operation record](#1-operation-record-before-code), [transport selection](#2-transport-selection), [request lifecycle](#3-request-and-response-lifecycle), [errors/UI](#4-safe-errors-and-ui-mapping), [gateway](#5-gateway-and-credential-boundaries), [refresh/replay](#6-refresh-retry-and-unknown-outcomes), [worked flow](#7-worked-create-and-update-flow), [checks](#8-verification-handoff).

## 1. Operation record before code

For every consequential read/write, capture these fields in the accepted operation handoff. Name actual files/functions when present; mark proposed paths and missing contracts honestly.

| Area | Required fields |
| --- | --- |
| Intent | Actor, action, resource, ownership, prerequisites, category invariant and success meaning. |
| Request | Method/route, consumers, contract revision, path/query/body schemas, limits, field sources, writable allowlist, defaults/coercion and omitted/null semantics. |
| Authority | Identity/session owner, requested versus verified tenant, resource policy, origin/CSRF, public/system exceptions and impersonation attribution if selected. |
| Execution | Frontend event/route, feature adapter, selected transport/gateway, real backend guard/validator/resource-policy/use-case ordering and persistence/effect owner. |
| Response | Success/accepted/empty variants, DTO schema and projection, pagination, stable error codes/field paths, safe messages, correlation and concurrency/version fields. |
| Recovery | Deadline/caller cancellation, replayability, business idempotency/outcome lookup, refresh contract, ambiguous response and conflict behavior. |
| Presentation | Pending/empty/refresh/denied/expired/invalid/conflict/unavailable/unknown/success, draft preservation, focus/announcements, cache changes and navigation. |

Contract ownership is singular: accepted schemas or a backend API specification generates clients in one direction. Do not hand-maintain competing frontend/backend DTOs or expose ORM entities. Browser/API/provider input is untrusted; TypeScript generics do not validate it. A missing schema revision, field-error contract, authorization model or replay guarantee blocks dependent behavior rather than permitting invented business semantics.

## 2. Transport selection

| Path | When selected | Required implementation boundary |
| --- | --- | --- |
| Browser -> API | Approved direct browser API | Explicit base origin, CORS/credentials/CSRF, public configuration classification, typed request/response mapping and server enforcement. A direct API is not prohibited merely because NestJS is used. |
| Browser -> frontend gateway -> API | Approved gateway/BFF | Fixed permitted destinations/operations, narrow credential/header mapping, limits/errors/cancellation and independent backend domain authority. |
| Frontend server -> API | Server rendering/read or selected server operation | Guarded server adapter, request-scoped verified context, approved credential mapping and cache/privacy policy. Avoid an unnecessary HTTP call through the app's own gateway. |
| Browser -> selected Server Action | Accepted framework action contract | Reachable server endpoint with explicit validation/authorization/origin/session/error/outcome rules; no duplicated backend domain authority. |

Public content may use no remote API at all. SSE/WebSocket/uploads/downloads have explicit transport/lifecycle contracts; do not force them through a JSON wrapper or call them automatic exceptions to security rules. Project-specific session and deployment topology determines credentials; do not assume cookie tokens, one origin or a separate backend repository.

## 3. Request and response lifecycle

Implement the following contract in the selected adapter, rather than copying an untested generic wrapper:

1. **Capture context:** operation/contract revision, resource/verified scope reference, request generation and deadline/caller signal. Credentials are resolved by the approved owner, never logged or used as visible cache keys.
2. **Validate/map input:** path and query encoding, limits, editable allowlist and actual schema input/output. Preserve omitted versus explicit null. A supplied JSON `false`, `0`, empty string or null is not an absent body; test presence rather than truthiness.
3. **Encode deliberately:** distinguish JSON, FormData, text, binary and stream bodies. Do not force JSON content headers onto multipart bodies or stringify FormData. Set only allowed headers; respect cache/precondition/idempotency semantics from the endpoint contract.
4. **Send with bounds:** approved destination, timeout and cancellation policy. Keep timeout distinct from caller cancellation where observable, clean up timers/listeners and preserve the initiating operation identity. Request bodies/streams may not be replayable.
5. **Classify transport/HTTP:** network failure, caller cancellation and timeout differ from an HTTP response. Fetch can resolve for HTTP error status; inspect status and the endpoint contract. Do not treat every resolved promise as success. See [Fetch usage](https://developer.mozilla.org/en-US/docs/Web/API/Fetch_API/Using_Fetch).
6. **Decode once:** inspect expected media type, size and body rules; consume the body once. Handle `application/json` and accepted `+json` types under the contract. Invalid JSON, unexpected media and schema mismatch are distinct protocol failures, not empty data.
7. **Validate output:** accepted success DTO variants and error payloads require runtime validation. Project trust boundaries decide the exact validation placement, with browser-visible data always constrained by the public contract. A generic `as T` is not validation.
8. **Apply outcome:** update only the captured/current permitted scope, preserve safe metadata and map into an explicit presentation outcome. A failed decode after a mutation does not prove the mutation failed to commit.

| Response condition | Required behavior |
| --- | --- |
| Expected JSON success | Validate DTO; expose only permitted data/metadata to the consumer. |
| `204` or `HEAD` | Bodyless handling according to the operation contract; no mandatory JSON parse or cast pretending a DTO exists. |
| Other empty success | Accept only if defined; otherwise protocol failure with potentially unknown mutation outcome. |
| `202` | Accepted/pending operation, with the agreed identifier/status channel and authorized retrieval; do not announce completion. |
| `304` or another special status | Handle only through an explicit caching/conditional-request contract; not a universal JSON success or arbitrary error. |
| Expected structured failure | Validate safe code/message/field metadata and preserve actual HTTP context; treat unexpected disagreement as a protocol issue. |
| HTML/malformed/oversized/unexpected response | Safe bounded fallback and correlation where usable; never render upstream HTML or leak raw internal bodies. |
| Network/cancel/timeout | Preserve distinct observable outcome; a write may be committed or pending. Offer recovery based on actual server guarantees. |

Do not catch framework redirect/not-found signals as generic transport errors. Programmatic APIs should have an agreed expired-session response; a successful login HTML page after an implicit redirect is not valid domain JSON.

## 4. Safe errors and UI mapping

The project chooses a stable error contract. RFC 9457 Problem Details is the preferred interoperable shape when adopted; domain codes, field errors and correlation are explicitly documented extensions, not automatically standardized fields. See [RFC 9457](https://www.rfc-editor.org/rfc/rfc9457.html). Preserve a compatible existing format until an approved migration.

Error records distinguish kind, HTTP status where present, stable domain code, safe user message, allowlisted field errors, correlation/operation reference and whether recovery is known safe. Keep confidential diagnostics on trusted systems under redaction policy. Request IDs supplied by clients are untrusted input; validate/bound or replace them and do not treat them as authority.

| Outcome | UI contract |
| --- | --- |
| Invalid input | Preserve values; map only known permitted paths to real controls and focus/announce corrections. Unknown paths become an accessible root error. |
| Unauthenticated/expired | Stop protected operations, follow bounded session recovery, preserve permitted return context without putting secrets/drafts in URLs. |
| Forbidden/revoked | Stop privileged interaction and reconcile protected state. Do not keep retrying or imply the UI can grant access. |
| Absent/concealed | Follow the approved not-found/concealment policy; do not disclose another tenant's record existence. |
| Conflict/stale revision | Distinguish duplicate business identity from lost-update conflict; preserve edits and offer approved reconcile/reload, not silent overwrite. |
| Throttled/unavailable | Explain the safe retry path and wait policy; bounded reads may retry, writes require actual replay guarantees. |
| Protocol/unexpected | Safe fallback, retain draft, correlate for diagnosis and classify possible unknown write outcome. |
| Accepted/unknown write | Show queued/in-progress or outcome-unknown truthfully, provide authorized status/reconciliation and prevent an uncontrolled duplicate submission. |

Keep critical errors inline and accessible; a transient toast cannot be their only record. Do not present cancellations as backend rollback or report success merely because the form library resolved a caught request. Detailed RHF/field-array/wizard methods are in [forms, validation and errors](forms-validation-and-errors.md); the adapter's safe field/root error contract remains authoritative for transport mapping.

## 5. Gateway and credential boundaries

When a gateway is selected, choose explicit operations or a deliberately restricted route registry/catch-all. It is never a general authenticated URL proxy. Resolve destinations from trusted configuration and an allowlisted method/path mapping. Validate canonicalized/decoded path segments, permitted query parameters and body limits; reject arbitrary target URLs, traversal and unexpected operations. Fixed origins still require a deliberate redirect policy: disable redirects or validate every permitted destination/hop so credentials cannot cross into an unapproved origin/private destination.

Map credentials deliberately, for example the specific session cookie or backend token required by the selected design. Do not forward the entire browser Cookie/Authorization/header set. Ignore/rebuild client-supplied tenant/role/actor and forwarding headers; only the trusted backend/session contract can establish authority. Request correlation, locale, idempotency and conditional headers have allowlisted formats/lengths. Strip hop-by-hop headers and account for actual runtime streaming/decompression behavior; copying a header list from another proxy is not proof of correctness.

For browser cookie-authenticated writes, define CSRF/origin protections for the actual reverse-proxy topology and deployment. SameSite, CORS, framework defaults or a single Fetch Metadata header are not interchangeable complete policies. Never reflect arbitrary Origin values. Safe read routes must not mutate state as a convenience. For direct browser APIs, document their actual CORS/credential policy rather than claiming all API CORS must be closed.

Handle each selected Set-Cookie according to the trusted session owner and gateway origin/path/security semantics; do not comma-split cookies or forward unrelated upstream cookies. Browser code cannot read HttpOnly credentials. Do not rewrite cookie domains/attributes silently to make a copied example work. Keep secrets out of browser env, URLs, error payloads, hydration and logs.

Gateway timeouts/cancellation propagate where safe; account for body limits, uploads/downloads/streams and client disconnect. A cancelled upstream request may already have committed. Preserve safe response status/headers and DTO/error semantics. Any adaptation or caching has explicit owners/tests. Generic path matching is not automatically sufficient cache invalidation or authorization.

## 6. Refresh, retry and unknown outcomes

Do not build refresh by guessing. The backend/session contract specifies eligible expiry responses, actual refresh authority, rotation/reuse policy, concurrent ownership across instances/tabs, cookie propagation, logout/revocation and failure. Never add a refresh-token grace window just to make a local deduplication example work. An in-memory promise map only coordinates that process; it does not prove distributed correctness or authorize holding raw tokens indefinitely.

Bound eligible recovery to the agreed number of attempts. Do not refresh for every 401 or loop on forbidden/invalid credentials. A replayed write needs both a replayable body and a backend-supported idempotency/outcome guarantee; an idempotency header without durable server behavior proves nothing. A safe read may have a separate bounded policy. Delay/backoff and Retry-After handling follow the operation/provider contract, not blanket retries on reconnect.

For a consequential write, record business operation identity, scope, payload mismatch behavior, durable outcome/status lookup, retention and concurrent duplicate semantics. A retry uses the same approved identity for the same operation; minting a fresh key creates a new operation. Rechecking current authorization still applies to replays and status retrieval.

After timeout, abort, response loss or a malformed success body, mark outcome unknown where appropriate. Reconcile through the agreed operation lookup/idempotent replay/resource status. Do not automatically resubmit a payment, booking or create because the browser stopped waiting. Keep old-scope work attached to its initiating context; its callbacks cannot mutate a newly selected tenant's view or roll back unrelated later successes.

## 7. Worked create and update flow

Illustrative tenant Customer journey, not implemented application code or universal business policy:

```text
form draft + UI schema
 -> allowlisted create/update DTO and captured tenant/operation identity
 -> feature client -> selected direct API / restricted gateway / server entry
 -> backend session verification + validation + membership/resource policy
 -> owning use case -> scoped query/transaction + required audit/effects
 -> approved response/error DTO
 -> feature outcome -> scoped caches -> feedback/focus/navigation
```

For create, the original example permits code/name/optional email and gives ownership/IDs/timestamps to the server. The backend owns uniqueness and any required durable idempotency; the frontend does not infer success from optimistic insertion. Commit can precede a lost response. Recovery must return the authorized recorded outcome or a safe unresolved status, not blindly insert again.

For edit, load the scoped detail/revision, preserve a draft, send only editable fields and expected concurrency version, then let the backend atomically enforce its precondition. Conflict preserves edits and offers reconcile/refresh. Clearing an optional field and omitting it have defined different meanings where required. Transport schema errors do not replace database constraint evidence.

On committed success, update/invalidate the actual detail/list/count/aggregate owners under the captured scope and follow the accepted destination with success announced. On `202`, show pending and track authorized progress. On failure/unknown, preserve input and safe operation context. During tenant switching, old responses/hydration/optimistic callbacks cannot populate the new scope. Server-side effects remain owned by the backend/outbox/reconciliation design; frontend invalidation is not a distributed transaction.

## 8. Verification handoff

Use existing approved tools and disposable test infrastructure under task authority. Record command/tool, revision, exact settings/contract versions, environment, observed result and gaps. The read-only architect/reviewer supplies a plan/findings; a separately authorized verifier executes. This documentation batch does not run an API, refresh provider, frontend build or PostgreSQL test.

Required applicable cases:

- Valid DTOs, malformed/nested/unknown input, omitted/null/false/zero bodies, JSON media types, multipart/stream handling, 204/HEAD/202/empty variants and body-once decoding.
- Error HTML, invalid JSON, schema mismatch, inconsistent safe error metadata, unknown field paths, bounded response handling and no raw payload/secret disclosure.
- Anonymous, revoked, forged role/tenant, wrong-resource and direct-entry denial against the actual API; mock responses alone cannot prove these boundaries.
- Gateway operation/origin/path/header/credential/redirect restrictions, CSRF policy, cookie handling and no arbitrary target proxy. Inspect the actual deployment path, not only a mocked handler.
- Eligible/ineligible refresh, bounded repeated expiry, concurrent sessions/instances, replayable/non-replayable bodies and durable duplicate behavior where selected.
- Network timeout/caller cancel before/after commit, response loss or malformed success, operation lookup/replay and no duplicate effects. Backend engine/provider evidence remains separate.
- Delayed read/hydration and overlapping optimistic mutations during logout/tenant switching; scoped callbacks, dirty input, conflict/error focus and honest queued/unknown presentation.
- Supported old/new contract consumers and affected workspace production builds. Real browser/session evidence is distinct from mocked transport cases.

Map these to FE-STD-05 through FE-STD-09, BE-STD-03 through BE-STD-07 and BE-STD-12, plus applicable identity/tenant standards. [Original requirements](../../../../../docs/specifications/standards/01-frontend-backend.md) and the [source audit](../../../../../docs/specifications/source-audits/02-phase2-3.md) remain preserved. Report not-run/unavailable/inapplicable explicitly; this reference is not evidence that any reusable module exists.
