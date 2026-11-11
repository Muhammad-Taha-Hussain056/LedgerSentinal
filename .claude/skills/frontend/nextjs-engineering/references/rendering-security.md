# Rendering and security checkpoint

Use before consequential rendering/cache/security changes and before reporting relevant frontend acceptance. This preserves the original named `nextjs-engineering/references/rendering-security.md` contract from the [source audit](../../../../../docs/specifications/source-audits/02-phase2-3.md). It is a checkpoint and routing reference; detailed methods stay with their authoritative owners rather than being copied into another competing rule set.

## Required checkpoints

| Concern | Required decision/evidence and method owner |
| --- | --- |
| Version and rendering | Inspect actual Next/React/runtime/router and cache flags. Select supported server/client/streaming behavior deliberately; do not infer security from build symbols. [Rendering gate](server-client-and-rendering.md#1-version-and-execution-model-gate). |
| Client boundary | Keep privileged imports/secrets on trusted servers; pass minimal approved DTOs and inspect transitive client dependencies. Interactive boundaries do not justify shipping whole server records. [Component boundary](server-client-and-rendering.md#2-component-and-import-boundaries). |
| Entry-point authority | Each Route Handler/Server Action/trusted operation validates input and current actor/tenant/resource authority. Layout redirects and hidden controls are insufficient. [Server entries](server-client-and-rendering.md#7-server-entry-points-and-effects), [operation record](api-transport-and-errors.md#1-operation-record-before-code). |
| Cache privacy/freshness | Declare each layer's scope/key/lifetime/invalidation/revocation. Keep protected results out of insufficiently partitioned public/shared caches and serialized payloads; account for late hydration/switch/logout. [Cache ownership](server-client-and-rendering.md#5-cache-ownership-and-identity), [query transitions](query-cache-and-hydration.md#7-invalidation-cancellation-and-identity-transitions). |
| Data movement/recovery | Use the approved transport, runtime-validated public contracts, safe errors, captured scope and actual concurrency/idempotency semantics. Queued, unknown and committed states differ. [Transport](api-transport-and-errors.md), [mutations](mutations-and-recovery.md). |
| Request/render cost | Avoid unnecessary sequential independent reads, duplicate ownership and oversized client imports. Define meaningful loading/error boundaries and measure actual effects. [Rendering methods](server-client-and-rendering.md#4-route-rendering-and-content-lifecycle), [performance evidence](frontend-performance-and-verification.md). |
| Interaction/media | Verify keyboard/focus/form error behavior, stable image/font geometry and selected bundle/loading budgets. No automated accessibility score or build alone proves the journey. [Accessibility](accessibility-and-interactions.md), [forms](forms-validation-and-errors.md), [assets](assets-metadata-and-localization.md). |

## Evidence and disposition

Select checks according to actual risk and scope: direct unauthorized entry, wrong-resource/tenant and revoked authority against the real API; two-actor server/cache/hydration isolation; old-scope responses after transitions; validation/concurrency/unknown-outcome UI; keyboard/focus/errors and measured critical media/bundle behavior. Public content without accounts need not invent tenant fixtures, while protected metadata/media still need their own trust policy.

Record settings/contract/revision, exact versions/configuration, commands/tools, observed result and limitations using the [handoff record](frontend-handoffs.md#6-common-completion-record). Plans, mocks, source review and native runtime execution are different evidence. Missing browser/API/database/provider/native checks remain outstanding; authorization/concurrency claims need the actual trusted backend/engine evidence, not a browser fixture alone.

Map FE-STD-06, FE-STD-07, FE-STD-12 and IAM-STD-07 through the [frontend/backend](../../../../../docs/specifications/standards/01-frontend-backend.md) and [security/data](../../../../../docs/specifications/standards/02-security-data-saas.md) standards. This file closes the original filename's authoring gap only. It does not certify skill triggering, permission enforcement, production behavior or the complete 39-skill kit. Use the exact installed-version documentation when methods are applied; no application or security test was executed by writing this checkpoint.
