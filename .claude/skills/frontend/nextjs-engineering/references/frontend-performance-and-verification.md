# Frontend performance and verification

Use for changed frontend behavior, critical/heavy routes, shared-package effects and performance claims. Inspect accepted [settings](frontend-presets-and-settings.md), selected architecture and relevant original standards. This reference owns frontend-specific execution/evidence; broader testing-strategy, performance-engineering, CI and observability skills remain separately planned. No test harness or performance tool is installed here.

Sections: [acceptance](#1-scope-acceptance-and-budget), [measurement](#2-reproducible-measurement), [diagnosis](#3-diagnosis-and-smallest-change), [test layers](#4-choose-the-evidence-layer), [matrix](#5-frontend-scenario-and-profile-matrix), [commands](#6-pnpm-execution-and-tool-boundaries), [report](#7-findings-evidence-and-completion).

## 1. Scope, acceptance and budget

Define what changed, approved base/candidate revisions, affected routes/components/packages and consumers, critical journeys, data volumes, device/browser/network/input targets and expected concurrency. Include content/application surfaces and selected F1/F2/F3 overlays. A single warm empty homepage does not represent a large authenticated dashboard or independently loaded remotes.

Agree observable acceptance and numerical budgets where useful: initial usable content, interaction feedback/completion, JavaScript/media/font cost, request count/critical waterfalls, rendering/long tasks, memory/page retention, layout stability and freshness. Identify baseline, measurement method, limits, owner and revisit trigger. Numbers without observations are targets, not achieved results. Do not invent a universal bundle size, timing SLA or “industry pass” for every client.

Current Core Web Vitals guidance supplies useful reference thresholds, not a complete product-performance specification:

| Metric | Reference good threshold | Additional product evidence |
| --- | --- | --- |
| [LCP](https://web.dev/articles/lcp) | At most 2.5 seconds | Meaningful critical content on the actual route, redirects/server/media path and cold/warm loading. |
| [INP](https://web.dev/articles/inp) | At most 200 milliseconds | Representative interactions throughout the page lifetime, plus operation/network completion where it matters. |
| [CLS](https://web.dev/articles/cls) | At most 0.1 | Images/fonts/async/validation/third-party behavior over real use, not one stable screenshot. |

These field recommendations assess the 75th percentile with mobile/desktop segmentation; lab measurements and field populations are different evidence. See [Web Vitals](https://web.dev/articles/vitals). A Lighthouse score, smaller bundle or one fast trace cannot establish every metric, accessibility, reliability or scalability.

Keep trusted validation, authorization, isolation, accessible interaction and truthful error/pending states while optimizing. Never cache personalized content globally, skip checks or hide failures to meet a score. Explicit reviewed protected caching follows the actual [cache contract](server-client-and-rendering.md#5-cache-ownership-and-identity); public caching cannot silently change privacy semantics.

## 2. Reproducible measurement

Record actual framework/runtime/tool versions, build mode/configuration, fixture/data revision, API/provider behavior, device/viewport/CPU/network settings, cache state and steps. Prefer the actual production build/target for production claims; development timing and a different bundler/runtime may mislead. Keep baseline and candidate conditions comparable and report unavoidable differences.

Measure representative cold and warm navigation, initial load, relevant client transitions, critical interactions and long-lived usage. Use bounded repeat runs appropriate to variability; report the method and distribution/variation rather than cherry-picking the fastest sample. Field monitoring, if approved, needs consent/privacy, sampling and safe labels; do not capture private query strings, tokens, raw errors or client content to collect metrics.

Separate browser network/parse/execute/render from server/API/database/provider latency using available safe traces. A browser fixture with an instant mock response proves only that fixture. Missing production/field access is a limitation, not permission to access credentials or deploy instrumentation. Use disposable/authorized environments and sanitized data.

## 3. Diagnosis and smallest change

| Observed issue | Investigate before changing architecture |
| --- | --- |
| Slow critical content | Redirects, server/data latency, sequential independent reads, cache correctness, image discovery/size and blocked rendering. |
| Slow interaction | Long main-thread tasks, oversized client graph, expensive handlers/rendering/layout and subscriptions; distinguish feedback from backend completion. |
| Layout movement | Intrinsic media space, font metrics, late embeds/data/errors and viewport/keyboard behavior. |
| Large bundle | Actual client entry/transitive imports, unused dependency variants, duplicate runtime/locales, boundary placement and lazy-loading effectiveness. |
| Large list/form | Pagination/bounds, subscriptions, rendering/focus and measured virtualization needs; do not replace backend limits with a giant browser dataset. |
| Repeated requests | Query keys/scope, hydration freshness, mount/refetch settings, duplicate data ownership and lifecycle cleanup. |
| Growing memory | Retained pages/queries, unresolved listeners/timers/streams, store lifetime and detached views. |

Choose the smallest hypothesis-driven change, then measure again under comparable conditions and verify behavior. No blanket memoization, global cache, lazy-load-everything or rewrite to microfrontends. Deferred widgets need useful loading/accessibility and failure behavior. Removing a validation path or rendering fewer required records is not a compatible performance improvement.

For F2 shared packages, inspect all affected app consumers and shipped duplicate code, not only package source size. For F3, measure route/remote discovery chains, duplicate runtime/fonts/CSS, composition/hydration/fallback and whole-journey cost as well as each unit. A local component benchmark cannot prove independent release compatibility or distributed scalability.

## 4. Choose the evidence layer

| Layer | Proves, within its actual scope |
| --- | --- |
| Types/static/dependency checks | Supported contract/import shape, public exports and configured boundary rules; not runtime authorization or accessibility. |
| Unit/pure mapping | Schema/URL/formatting/key/mapping behavior under representative boundary cases; avoid tests that merely mirror the implementation. |
| Component with controlled network | UI states, keyboard/labels/errors, drafts and cache interaction under declared fixtures. MSW/selected tools require actual project adoption. |
| Browser journey | Real navigation/rendering/focus, API/session integration, refresh/identity transitions and production-target behavior in tested environments. |
| Visual review/regression | Intentional component/screen states, responsive/content/theme consistency; stabilize fixtures/fonts without masking real defects. |
| Accessibility review | Automated checks plus actual manual/assistive evaluation as specified in the [accessibility guide](accessibility-and-interactions.md). |
| API/database/provider integration | Actual trusted policy, constraints, transactions, concurrency and external effects under selected disposable/sandbox infrastructure. Frontend mocks do not replace it. |
| Performance traces/field evidence | Measured behavior for recorded conditions/population; not a universal all-category or capacity certificate. |

Select meaningful checks by impact. A label/style correction need not run every project journey, while a shared session/cache component needs affected consumer and identity-transition evidence. Reuse existing tests before adding new ones. A real defect gets an appropriate failing regression before the fix where feasible, then executed evidence; do not add low-value assertions that only restate code.

## 5. Frontend scenario and profile matrix

Choose representative valuable journeys and record exclusions; do not demand an unexplained Cartesian suite or advertise untested combinations.

| Concern | Required applicable scenarios |
| --- | --- |
| Public content | Rendered body/metadata, canonical/redirect/not-found, preview/publish/unpublish, image/font failure, narrow/long content and accessible navigation. |
| Authenticated resource | Read/list/create/edit/cancel/back/delete as selected, safe fields, permissions, errors, stale edits, duplicate/unknown outcomes and cache freshness. |
| Identity/cache | Anonymous/denied/revoked, two actors/tenants, logout/account/tenant switch with delayed read/hydration/mutation, private persistence and no cross-scope placeholder. |
| Forms/state | Dirty refresh, coercion/omitted/null, array reordering errors, wizard retention/final validation, URL/IME/debounce/history and all-matching selection. |
| UI/accessibility | Empty/loading/refresh/partial/forbidden/conflict/queued/unknown states, keyboard/focus, nested overlays, zoom/reflow, touch/drag alternatives and representative assistive technology. |
| F1 | Actual single-app production target and browser journeys; no invented remote/services tests when absent. |
| F2 | Shared package/export/peer compatibility across affected apps, origin/session/navigation and supported mixed frontend/API releases. |
| F3 | Accepted exact composition mechanism/version matrix, deep links/reload, SSR/hydration where selected, missing/incompatible unit/assets, style/focus boundaries, session transitions and recovery. |

Add real category invariants: stock/order/payment for selected commerce, competing timezones/reservations for booking, roles/tenant workflows for SaaS, authorized streaming/tools/cost/cancellation for AI, or equivalent discovered needs. One Customer fixture cannot certify them. Backend/database and provider owners supply actual-engine/sandbox evidence; do not mark their guarantees passed from a mocked browser test.

## 6. pnpm execution and tool boundaries

Inspect actual package names/scripts, task dependencies and environment requirements before execution. Use the selected pnpm/Node versions, explicit workspace dependencies and approved installed tools. Quote selectors in PowerShell and work from the actual project root. Example shapes below require those scripts/packages to exist and are not executed by this documentation batch:

```powershell
pnpm --filter "@project/web" run typecheck
pnpm --filter "@project/web" run build
pnpm --filter "@project/web" run test
pnpm --filter "...@project/ui" run test
```

Use actual configured browser/analyzer/a11y scripts when present; do not invent a passing command, run untrusted instructions or install dependencies as a side effect of verification. Optional Turbo follows the accepted graph and actual base revision. Check approved base-to-candidate changes including working-tree edits; a HEAD-only filter can miss committed branch work. Empty matches, skipped tasks and successful wrappers are not executed-test evidence.

A read-only reviewer inspects findings/evidence. Only an authorized verifier/implementer with actual tools runs builds/browsers/tests; prose does not grant capabilities. Preserve failures and diagnose their cause; do not skip assertions or loosen thresholds just to get green. Stop repeated identical attempts when nothing has changed. Required unavailable checks remain outstanding; no automatic merge, production deployment or credential access.

## 7. Findings, evidence and completion

Return changed scope, applicable standards, base/candidate revisions, settings/contract/tool versions, environment/fixtures, commands and observed outcomes. Distinguish passed/failed/not-run/unavailable/inapplicable, confirmed defects versus hypotheses, before/after measurements and practical limits. Screenshots/traces need route/state/viewport and sanitized content; store them only in an approved project artifact location.

For each defect include severity/confidence, file/line or route/evidence location, reproducible user impact, minimal correction and regression needed. For performance claims include comparable measurements and regressions checked. A smaller bundle without improved measured behavior is a bundle result only. Report supported scope honestly rather than “production-ready/all categories” from a build or simulated case.

Seven frontend role definitions are authored; see the current [handoff inventory](frontend-handoffs.md#1-runtime-and-authority). Broader test strategy, performance engineering, observability, CI/release gates, cross-domain specialist agents and executable toolkit harnesses remain separately planned. Primary references were consulted on 2026-10-21, including the [Next production guide](https://nextjs.org/docs/app/guides/production-checklist); version-specific actions need actual project verification. This preserves FE-STD-12 and relevant frontend checks in the [original standards](../../../../../docs/specifications/standards/01-frontend-backend.md) and [delivery standards](../../../../../docs/specifications/standards/03-delivery-operations-improvement.md). No application build, browser scan, benchmark or field monitoring was executed by writing this guide.
