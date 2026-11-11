# Forms, validation and errors

Use for native or RHF/Zod forms, edit drafts, field arrays, wizards and validation recovery. Follow accepted [presets/settings](frontend-presets-and-settings.md) and [placement](code-placement-and-imports.md). The [API guide](api-transport-and-errors.md) owns transport/error shape; [mutations](mutations-and-recovery.md) owns committed/queued/unknown outcomes. This reference authors methods, not a tested form package.

Sections: [selection/ownership](#1-select-the-form-and-its-owner), [schemas](#2-input-validation-and-transport-mapping), [controls](#3-controls-and-validation-timing), [drafts](#4-edit-baselines-and-background-data), [submission](#5-submit-and-navigation-contract), [errors](#6-server-error-mapping), [arrays](#7-field-arrays-and-dependent-values), [wizards](#8-multi-step-flows-and-draft-retention), [accessibility](#9-accessibility-content-and-performance), [verification](#10-verification-and-sources).

## 1. Select the form and its owner

Inspect actual RHF, resolver, Zod, React and component versions before using generics, schema composition or reset options. Native accessible forms suit simple cases; selected RHF/Zod supports substantial client validation/draft needs. A tiny contact form does not require a global store or query cache. An existing accepted form framework needs a scoped migration decision, not an incidental replacement.

Define actor/journey, editable fields, request/response/error contract revision, authority owner, save/cancel destination and failure states. Fields derive from approved writable DTOs, not database columns. IDs, actor/tenant/roles, revisions and server timestamps have explicit origins; showing a field disabled or hidden does not authorize it. The server independently validates input, membership/resource policy and business invariants.

The feature owns input schema, UI mapping, localized copy and form orchestration. Neutral UI owns accessible primitives, not backend schemas, queries or tenant policy. Use existing real components; names such as FormField or unsaved-change guard are not implemented assets merely because another kit mentions them.

## 2. Input, validation and transport mapping

Define three stages: values the controls actually hold; validated/transformed form output; allowlisted transport DTO. Derive authoritative field rules where suitable, with explicit UI additions/mapping. Do not duplicate a backend schema by hand or assume transformed UI values are already the transport shape.

For Zod, distinguish `z.input<typeof schema>` from `z.output<typeof schema>`; `z.infer` describes output. Match RHF input/context/output generics and resolver mode to the installed versions, including whether the resolver returns transformed or raw values. Use a small feature-owned `toCreateInput`/`toUpdateInput` mapping as needed, rather than spreading an entire form into a request. See [resolver typing](https://github.com/react-hook-form/resolvers#typescript).

| Input class | Required semantics before implementation |
| --- | --- |
| Text/optional text | Empty versus omitted versus explicit null, whitespace normalization, length and Unicode rules; do not silently trim meaningful passwords/content. |
| Number/money | Blank, invalid, zero, sign, bounds, locale decimal input and precision. Do not let blank coerce accidentally to zero or use floating-point money without the domain's declared representation. |
| Checkbox/select | Actual boolean/enum mapping, absence versus false, placeholder and disabled semantics. String `"false"` is not a boolean false through generic truthiness. |
| Date/time | Date-only versus instant versus scheduled local time, timezone/DST rules and API representation. Do not convert every calendar date with `toISOString`. |
| File/object reference | Upload lifecycle, allowed type/size, safe object identity, authorization and expiry; a returned URL is not universal proof of access. |

Choose one conversion boundary deliberately: native registration options, a controlled component adapter or schema preprocessing/transformation. Avoid double coercion. Zod coercion is not categorically forbidden; its inferred input, JavaScript conversion behavior and blank/null semantics need explicit tests. Do not narrow an `unknown` input type with a cast to suppress a real mismatch. See [Zod coercion](https://zod.dev/api#coercion).

Cross-field rules target appropriate fields and root errors; shared business constraints remain authoritative on the server. Async availability/uniqueness checks are advisory, bounded and race-aware, not proof a later write will succeed. Cancel/obsolete superseded checks and avoid a network request on every keystroke. Validate the final writable payload on submit regardless of earlier step checks.

## 3. Controls and validation timing

Supply an intentional initial value/baseline for registered fields, especially controlled components. Avoid controlled/uncontrolled flips and unsafe default placeholders. Do not copy a universal empty default into number/date/picker controls that require another representation. Loading an edit record is distinct from rendering a create form with empty defaults.

Use native registration for compatible inputs; use Controller/useController or the selected adapter for controlled custom controls. Forward name/value/change/blur/ref and accessible properties correctly; avoid registering the same input twice. A single mandatory wrapper does not replace understanding its contract.

Default substantial forms to submit-first feedback with deliberate revalidation after correction; scope alternatives to the interaction. Search may validate differently. Do not announce errors during every partial keystroke or suppress native semantics without an equivalent accessible path. Choose browser validation versus `noValidate` intentionally.

Watch only needed fields/subtrees for dependent UI. Reset or preserve dependent values according to the domain, rather than silently submitting hidden stale selections. Hidden/unmounted/disabled controls have deliberate inclusion semantics; disabling a control must not accidentally erase required payload data. Requiredness is semantic, not only a red asterisk.

## 4. Edit baselines and background data

Keep server canonical data, the form's accepted baseline and the user's draft separate. Initialize after the intended record/scope is available. Capture resource identity and revision. Do not feed every query result into reactive values/reset without a draft-reconciliation policy.

| Event | Required behavior |
| --- | --- |
| Initial load | Adopt the matching resource/scope once the accepted initial data arrives; show loading/failure distinctly. |
| Background data, clean draft | Deliberately adopt the new canonical baseline if appropriate; preserve focus and stable controls. |
| Background data, dirty draft | Preserve edits and original concurrency precondition; offer reconcile/reload or a defined non-conflicting merge. Do not silently advance the expected revision while keeping stale edited fields. |
| Record/tenant change | Resolve meaningful unsaved-work policy, stop old responses and reset/remount intentionally for the new identity. |
| Committed save | Adopt canonical returned values/revision as the new baseline, accounting for any edits made after the submitted snapshot. |
| Denied/invalid/conflict/unknown | Preserve permitted input; show the actual outcome and recovery, without clearing the dirty guard as if saved. |

Disabling focus refetch does not prevent manual invalidation, polling, reconnect, cache updates or prop changes. RHF reset options are implementation tools, not a generic merge algorithm. `keepDirtyValues` needs supported subscriptions/options and does not reconcile reordered/deleted rows or competing domain edits by itself. Read [RHF reset documentation source](https://github.com/react-hook-form/documentation/blob/master/src/content/docs/useform/reset.mdx) for the selected version.

## 5. Submit and navigation contract

1. Validate current UI input; focus/announce correctable errors. Build an immutable submitted snapshot with resource/scope, field/row identities, expected revision and business operation identity where required.
2. Prevent accidental concurrent submission in the UI, then invoke the feature-owned mutation/operation. Backend constraints/idempotency still enforce real invariants.
3. Await the relevant operation outcome if the next step depends on it. Distinguish validation failure, denial, conflict, network/protocol unknown, queued acceptance and committed success.
4. On commit, establish the correct baseline and update the scoped data views. If edits continued during submission, do not overwrite newer draft values blindly; reconcile or keep editing explicitly.
5. Follow accepted save/cancel/back/create-another destinations, preserving safe list state and announcing success. A failed cache refresh after a committed write is a refresh problem, not a reason to submit the write again.

Do not use `isSubmitSuccessful` alone as domain commit proof: a submit handler that catches a rejected mutation and returns normally can satisfy library success semantics. Track the explicit operation outcome and the saved draft revision for dirty-navigation guards. Queued/unknown work needs its own resume/status contract. Never infer rollback from abort or lost response.

Guard meaningful dirty work through the actual supported navigation mechanism. In-app links, Cancel/Back, record/tenant switching and hard unload are different paths. `beforeunload` is best effort and is not universal mobile/browser protection; do not depend on undocumented App Router interception. Offer explicit save/discard/stay where applicable without confirming every ordinary reversible save. Do not put private drafts in return URLs.

## 6. Server error mapping

Use validated safe error codes and the [API error contract](api-transport-and-errors.md#4-safe-errors-and-ui-mapping). Map paths only through an explicit allowlist/parser matching actual editable controls. Bound depth/count/length, reject unsafe keys and normalize only documented path syntax. Never accept an arbitrary string as a typed RHF FieldPath through a cast or default an omitted allowlist to “everything is known.”

Use the submitted snapshot to associate errors with the correct field/row/value. If values changed after submit, avoid presenting a stale check as a current error; retain a safe root explanation or revalidate the affected value. Unknown, unmounted or inaccessible fields become an accessible root/summary error with navigation to a valid step when appropriate. Do not silently drop them or overwrite multiple root errors with the last one.

Display only approved localized messages/codes. A server-provided field message still requires a safe contract and text rendering; do not render HTML/SQL/stack text or blindly log private input. Preserve correlation IDs safely. Assign one owner for global/feature feedback to avoid duplicate toasts; critical form errors remain inline. Restore appropriate focus and clear stale server errors deliberately when corrected/retried.

## 7. Field arrays and dependent values

Use the library's stable row key for rendering (RHF `field.id` under its supported contract), not the visible index. Keep that rendering key distinct from backend item ID and any stable client draft ID. Append complete intended row defaults; inspect whether update/replace operations remount controls and affect focus. See [RHF field-array documentation source](https://github.com/react-hook-form/documentation/blob/master/src/content/docs/usefieldarray.mdx).

An index path such as `items.0.sku` refers to the submitted order, not necessarily the current order. Prefer stable item identities in the error contract. Otherwise map submitted index -> captured item identity -> current index, with bounds and freshness checks. If a row was removed or cannot be matched, show a root/summary error. Do not attach the error to whatever now occupies index zero.

Define minimum/maximum rows, uniqueness/cross-row rules, removal of persisted rows, blank row behavior, totals and dependent lookups. Changing a parent selection may invalidate child values; specify confirmation/clearing. Server validation and transaction invariants remain necessary. Watch targeted values for totals rather than duplicating a second authoritative form/store state.

## 8. Multi-step flows and draft retention

Choose one draft owner: a retained parent form/provider, a feature reducer or a justified selected store. Define unmount/unregister behavior explicitly. Avoid copying the same fields into RHF plus Zustand plus query state. Each step validates its needed fields; final submission validates the full current payload, including conditional branches and cross-step rules. Schema composition must preserve actual installed-version refinements/transforms; do not blindly merge incompatible schemas.

Describe next/back, progress, direct step navigation, refresh/resume, permission loss, async checks and final queued/committed outcomes. Prevent implicit Enter from advancing/submitting the wrong action; buttons declare their type. On rejected final submission, surface the summary and focus/navigate to the relevant valid step without losing other values.

Persistence is optional and separate from wizard existence. Default to no browser persistence for sensitive drafts. If explicitly approved, persist a minimal classified subset with owner/scope, version, expiry, migrations, corruption handling and cleanup. No credentials, tokens or protected query-cache dumps in localStorage. Resume rechecks identity/tenant, current authority, schema and server revision. Client encryption does not remove same-origin script access. See [UI-state persistence rules](url-and-ui-state.md#6-persistence-and-cross-tab-events).

## 9. Accessibility, content and performance

Use labels, descriptions, autocomplete, visible/unobscured focus and text errors linked to controls. Support keyboard, paste/password managers, reduced motion, zoom and mobile keyboards. Error summaries link to available controls/steps; pending and success states are announced without moving focus unexpectedly. Dialog/picker primitives need actual focus/dismiss/return behavior. Localize validation, accessible names and date/number controls consistently.

Test long labels/translations, narrow viewports, nested arrays and large forms. Avoid whole-form subscriptions, unnecessary controlled layers or validation storms; measure before adding complex optimization. Virtualized/unmounted controls require deliberate registration, validation and focus behavior. Accessible alternatives and server authority cannot be removed to meet a rendering target.

## 10. Verification and sources

Plan relevant component/browser/contract checks using the project's actual pnpm scripts and installed versions. Cover blank/zero/null/transform types; malformed/extra writable fields; native/custom control behavior; pending and duplicate submit; dirty refresh/record switch; failed caught submission; canonical values versus newer edits; stale revision; unknown field errors; reordered/removed arrays; wizard remount/final validation; persistence expiry/revocation; keyboard/focus/locale and selected upload states.

Mocked errors verify presentation only; actual API denial and database constraints need their own evidence. Record commands, revision, settings/contract versions, results and unavailable checks. No RHF/Zod component or browser journey was executed by authoring this file.

The supplied `form-rhf-zod` and `form-error-mapping` detail is consolidated here without their universal coercion, reset, wrapper or unsafe path assumptions. Official RHF documentation pages returned HTTP 403 during this review, so their maintained documentation repository and resolver source were consulted instead (2026-10-21). This does not establish compatibility with an uninspected project version. Apply FE-STD-01,04,05,09,10 and relevant BE-STD-03/12 from the [original standards](../../../../../docs/specifications/standards/01-frontend-backend.md).
