# Accessibility and interactions

Use for user-facing components, routes, forms, navigation, tables, overlays and media. The project target is WCAG 2.2 AA where applicable; record exact scope, supported environments and verification. This is an implementation/review guide, not a conformance certificate or exhaustive replacement for the standard.

Sections: [authority](#1-target-scope-and-evidence), [semantics](#2-semantics-names-and-status), [widgets](#3-widget-focus-and-input-contracts), [layout](#4-layout-contrast-and-targets), [forms/auth](#5-forms-errors-and-authentication), [media/motion](#6-media-motion-and-content), [verification](#7-verification-procedure-and-findings).

## 1. Target, scope and evidence

Use the normative [WCAG 2.2](https://www.w3.org/TR/WCAG22/) criteria and their applicable exceptions. WAI Understanding documents and ARIA Authoring Practices explain implementation; they are not additional normative criteria. Distinguish kit product rules, AA requirements and optional stricter goals. Do not label an AAA enhancement as mandatory AA or declare all targets subject to an exception-free size rule.

Record routes/components/journeys and states, supported browsers/assistive technology/input, languages, excluded third-party surfaces and known limitations. An exception needs the original standards' scope/reason/control/owner/review record; it cannot silently authorize an inaccessible critical journey. Include users' real completion paths, not only isolated components.

Automated axe/Lighthouse checks detect some problems; a perfect score cannot establish WCAG conformance. Human keyboard, visual, zoom/reflow and representative assistive-technology evaluation remain necessary. Report not-run/unavailable/inapplicable separately. See [WAI evaluation guidance](https://www.w3.org/WAI/test-evaluate/).

## 2. Semantics, names and status

Use headings/landmarks to express actual structure and provide a useful main-content bypass where relevant. Choose native buttons, links, inputs and tables before adding ARIA; custom roles require their complete behavior. Do not turn all clickable surfaces into buttons or use an application/grid role only for styling. Native semantics can be broken by invalid nesting or careless wrappers.

Every control has an appropriate programmatic name, state and relationships. Visible labels should agree with accessible names; placeholder-only labels and unexplained icon-only actions are insufficient. Decorative icons are hidden from assistive naming; informative graphics have meaningful alternatives. Avoid duplicate IDs, disconnected labels and hidden elements remaining in the tab order.

Announce important asynchronous status without stealing focus unnecessarily. Use live regions/status/error semantics deliberately; multiple assertive announcements can obscure the task. Do not expose private payloads through visually hidden text or accessible names. Loading, queued, failed, unknown and committed outcomes remain truthful; a screen reader cannot recover meaning from color alone.

## 3. Widget focus and input contracts

For every custom interactive component specify entry/exit, keyboard behavior, focus movement/return, activation/dismissal and changed-state announcement. Tab order follows meaningful reading/task order. Avoid positive tabindex patches, invisible focus targets and keyboard traps. Retain visible focus styles in every theme/input mode, including forced-colors settings where supported.

| Interaction | Required behavior |
| --- | --- |
| Modal dialog | Actual modal background/focus behavior, meaningful initial focus, contained tab sequence, appropriate dismissal and logical return destination. |
| Nested popup/dialog | Top eligible layer owns Escape/interaction; no accidental simultaneous ancestor dismissal or focus loss. |
| Nonmodal popover/disclosure | Correct expanded/controlled relationship and exit behavior; no automatic modal focus trap. |
| Menu/combobox/tabs/grid | Adopt the relevant full keyboard/selection model only for the actual widget, with state/name/focus tested together. Ordinary navigation is not automatically a menu widget. |
| Row/action | Real keyboard-operable named link/button; row-click convenience preserves independent controls and native navigation. |
| Drag/reorder | Alternative completion without dragging, including a simple-pointer path and keyboard operation where applicable. |

For modals, match the actual adopted implementation and [WAI dialog pattern](https://www.w3.org/WAI/ARIA/apg/patterns/dialog-modal/). `aria-modal` does not make background content inert. Initial focus can be a meaningful static heading/content element for complex text or an appropriate action; do not always focus the destructive control. If the trigger is deleted, return to a sensible surviving control/heading rather than a nonexistent node.

Dragging alternatives must satisfy the actual scope/exceptions of [SC 2.5.7](https://www.w3.org/WAI/WCAG22/Understanding/dragging-movements.html). Keyboard access alone is not a universal replacement for its single-pointer alternative. Move up/down controls or another accepted path can provide both when implemented correctly. Tooltips/help used on hover/focus need appropriate dismissal/persistence and must not be the sole access to essential instructions.

## 4. Layout, contrast and targets

Test resize, text spacing, zoom/reflow, long content and keyboard focus across real layouts, not just token samples. Ordinary reading/task content should adapt without two-dimensional page scrolling; genuine two-dimensional tables/canvases need the standard's scoped treatment and a usable task path. Local overflow cannot hide sibling controls or focus. Sticky headers/actions must not obscure the control being used.

Check [SC 2.4.11](https://www.w3.org/WAI/WCAG22/Understanding/focus-not-obscured-minimum.html) at AA and preserve the kit's visible/unobscured focus goal. [SC 2.4.13](https://www.w3.org/WAI/WCAG22/Understanding/focus-appearance.html) is AAA; do not claim its detailed appearance requirements are an AA certification rule. A project may deliberately adopt stronger focus design and record that choice.

For [SC 2.5.8](https://www.w3.org/WAI/WCAG22/Understanding/target-size-minimum.html), the baseline is 24 by 24 CSS pixels, with the criterion's spacing, equivalent-control, inline, user-agent and essential exceptions considered accurately. A larger comfortable product target is often useful but is not an exception-free WCAG claim. Review actual hit regions and adjacent controls, not only icon dimensions.

Text contrast under [SC 1.4.3](https://www.w3.org/WAI/WCAG22/Understanding/contrast-minimum.html) normally needs 4.5:1, or 3:1 for qualifying large text, with the defined exceptions. Non-text controls/graphics have separate applicable requirements; do not use large-text rules as a universal UI contrast rule. Measure actual rendered foreground/background states, including focus/error/selected and themes. Disabled styling should remain understandable even where a normative contrast exception applies.

Do not use color/position/shape alone for essential meaning. Preserve readable units, links and validation text; truncation or mobile hiding requires another accessible path. Verify controls with zoom, text enlargement, virtual keyboards and the selected input modes. A passing screenshot at one width proves none of these interactions by itself.

## 5. Forms, errors and authentication

Follow [forms/validation](forms-validation-and-errors.md) for label/description/error associations, field/root summaries, stale server errors, arrays and step navigation. Focus the appropriate invalid location after submit without repeatedly interrupting typing. Preserve allowed data after rejection and announce meaningful state changes. Required and invalid state need semantics and text, not a color-only border.

Support password managers, paste and appropriate autocomplete. Do not force memory/transcription puzzles or block assistance without an equivalent allowed path. Apply the real [SC 3.3.8](https://www.w3.org/WAI/WCAG22/Understanding/accessible-authentication-minimum.html) conditions and exceptions; frontend convenience cannot weaken trusted authentication. Repeated information and multi-step entry need applicable assistance/reuse rather than unnecessary retyping.

Do not replace native Enter/Space/button behavior with global handlers that double-submit, activate the wrong action or break assistive input. Pending/disabled behavior keeps name/focus/outcome clear. Errors should identify correction where safe without leaking another tenant's existence or private diagnostic payloads. Session expiry, permission loss and time limits require a usable recovery path under actual security constraints.

## 6. Media, motion and content

Choose image alternatives by purpose/context; decorative images use empty alternatives, functional images convey the action, and complex charts need an accessible representation of essential information. Do not repeat adjacent captions verbatim without a reason. Charts cannot depend solely on color, tiny hover targets or canvas pixels.

For selected audio/video, define applicable captions, transcripts/audio description, player controls and autoplay/audio behavior. A third-party embed does not remove accessibility responsibility; document what was tested and offer an equivalent supported path where needed. Refer to the actual applicable media criteria rather than marking every media item passed from a component name.

Respect reduced motion and avoid unnecessary flashing/parallax/auto-advancing disruption. Required pause/stop/control behavior follows the content's actual timing and criteria. Removing motion must not remove state information. Localized accessible names, reading direction and meaningful language markup follow [assets/localization](assets-metadata-and-localization.md).

## 7. Verification procedure and findings

Inspect actual components/versions, then evaluate representative rendered states: keyboard-only completion, focus order/visibility/return, nested overlays, zoom/reflow/text changes, touch/drag alternatives, labels/errors/status, contrast/themes, media and supported screen-reader/browser combinations. Include loading, empty, error, denied, conflict and dynamic updates. Inspect hidden/portal/virtualized content and affected sibling screens.

Use approved automated tools and actual project pnpm scripts for configured checks; do not install tools incidentally or claim a scan was run because a command exists. Add meaningful component/browser regression cases for real defects and manually verify behaviors automation cannot establish. The broader testing-strategy skill remains separately planned; this reference owns frontend-specific checks.

For each finding record severity/confidence, route/state and file/line, applicable criterion or kit rule, observed evidence, user impact, minimal correction and regression/manual check. Separate confirmed failures from hypotheses and unavailable runtime observations. Record assessment scope/revision/tool/environment and dispositions; do not issue a global PASS for untested journeys or use a numerical score as certification.

Normative and primary explanatory references were consulted on 2026-10-21. This guide preserves FE-STD-04 plus relevant FE-STD-01 through FE-STD-03,05,09,10,12 from the [original standards](../../../../../docs/specifications/standards/01-frontend-backend.md). No rendered UI, scan or assistive-technology session was executed by writing this file; specialized agents and enforcement remain separate capabilities.
