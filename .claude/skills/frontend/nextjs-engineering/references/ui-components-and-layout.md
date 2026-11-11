# UI components and layout

Use for product screens, shared components, responsive layouts, tables, dialogs and navigation. Start from accepted [settings](frontend-presets-and-settings.md), actual brand/design context and [placement boundaries](code-placement-and-imports.md). This reference defines frontend implementation methods, not an installed design system or tested component package.

Sections: [design context](#1-design-context-and-scope), [tokens/components](#2-tokens-components-and-public-apis), [layouts](#3-responsive-layout-and-stable-geometry), [navigation](#4-navigation-and-journey-consistency), [states](#5-complete-screen-and-action-states), [tables](#6-tables-lists-and-selection), [overlays](#7-dialogs-menus-and-layering), [handoff](#8-implementation-and-verification-handoff).

## 1. Design context and scope

Inspect existing screens, tokens, components, content, interaction conventions and acceptance criteria before changing UI. Preserve an established brand unless redesign is authorized. A starter supplies consistent behavior and reusable structure; it does not make every client look identical. Do not choose the same dashboard/card treatment for unrelated product needs.

Record audience, primary tasks, information hierarchy, approved visual references, typography, density, colors, spacing, imagery, motion, device/input support, locales and accessibility target in an existing approved project record. A DESIGN.md may be useful when the project adopts it; this reference does not authorize another file automatically. Separate confirmed decisions from proposed directions and ask about consequential ambiguity, while implementing routine choices within accepted settings.

Before a substantial screen, identify actor/prerequisites, main and secondary actions, important data, permissions for presentation, navigation, validation and recovery. Define representative states rather than designing one populated happy-path screenshot. Business category changes the journey; preset and F1/F2/F3 change implementation boundaries independently. A public portfolio need not acquire dashboard primitives, accounts or packages.

## 2. Tokens, components and public APIs

Map the client's design into semantic tokens for text/surfaces/borders/actions/status, typography, spacing, density, radii, elevation and motion. Define relevant light/dark/high-contrast behavior only where selected. Distinguish destructive, primary, secondary and quiet actions consistently. Do not invent per-screen raw colors or variants just to match a screenshot; justified campaign/artwork differences have explicit scope.

| Layer | Implementation responsibility |
| --- | --- |
| Neutral primitive | Button, link treatment, input, badge, dialog/table primitives; semantic props, interaction states, ref/accessibility support. No fetching, contracts, actor storage or domain policy. |
| App-shared presentation | Reusable page frame, navigation and feedback conventions, consuming neutral primitives without importing features. |
| Domain feature | DTO-to-view mapping, domain labels/tones, writable fields, permitted actions for presentation, API/state integration and failure recovery. |
| Route/composition | Combines feature public APIs, layouts, metadata and actual framework boundaries; does not expose sibling feature internals. |

Keep package promotion and explicit exports/dependencies consistent with [pnpm/shared-package rules](../../../fullstack/system-architecture/references/frontend-foundation.md#4-shared-package-contract). A shared Button or Badge cannot depend on the backend/Drizzle or an Orders enum. A cohesive domain presentation package is possible with its own owner and public contract; do not disguise it as neutral UI.

For each component define semantic purpose, typed public API, defaults, variants, size/density, controlled/uncontrolled behavior, event/ref forwarding, keyboard/focus, disabled/busy/error and content limits. Use actual approved primitives and inspect copied/generated source. Names such as `cn`, FormField, a toast provider or a Storybook setup do not prove those assets exist. CVA, icon sets and Storybook require project adoption before installation.

Prefer native link/button/input semantics. Do not nest interactive controls, turn a link into a fake disabled button, or replace native submit behavior with a global key handler. Icon-only controls need a usable accessible name; decorative icons stay out of the accessibility name. Loading preserves useful button width/name and duplicate-submit behavior. A disabled visual style alone cannot stop activation or enforce permissions.

## 3. Responsive layout and stable geometry

Choose breakpoints from content and supported tasks, not device labels alone. Specify narrow/wide navigation, grid collapse, action placement, wrapping, panel/table overflow and virtual-keyboard behavior. Use appropriate flex/grid minimum-size constraints and local scrolling rather than hiding global overflow to suppress a defect. Document scrolling and focus must remain usable.

| Surface | Required behavior |
| --- | --- |
| Page/header | Clear hierarchy and reachable primary action; long headings/breadcrumbs wrap without displacing essential controls off-screen. |
| Cards/panels | Group related content when useful; avoid nested cards/empty wrappers that add visual noise and constrain forms. |
| Forms | Labels/errors/controls remain readable; sticky actions do not cover focused fields, validation or mobile keyboards. |
| Tables | Deliberate local horizontal overflow, priority/disclosure or alternate layout; essential data/actions remain reachable. |
| Dialog/drawer | Fits supported viewport/zoom; content can scroll, controls remain reachable and background locking is restored correctly. |
| Media/loading | Reserved intrinsic dimensions/aspect ratios and stable placeholders; a late image/font/error message should not unexpectedly move the action being used. |

Test long translations, unbroken identifiers, large amounts, missing images, empty values, multiple errors and sibling panels. Truncation needs an accessible way to obtain necessary full content; a hover tooltip alone is insufficient. Do not abbreviate important money/date/status meaning silently. Use writing-direction-safe layout and content-specific wrapping rather than arbitrary forced breaks everywhere.

Avoid fixed heights that clip dynamic errors or a blanket viewport-height rule on mobile. Consider safe areas, browser chrome, zoom, text expansion and keyboard overlap using the selected browser support and CSS implementation. Specialist wide canvases can use a documented scoped strategy with an equivalent supported way to complete the task. See [accessibility/reflow checks](accessibility-and-interactions.md#4-layout-contrast-and-targets).

## 4. Navigation and journey consistency

Use real destinations/links, meaningful current-page state, clear headings and logical landmarks. Navigation lists are not automatically application menus; use each widget's actual semantics. Define mobile navigation open/close/focus and route-change behavior. Breadcrumbs, sidebars, tabs and step navigation have distinct purposes and keyboard contracts.

Equivalent create/edit flows share save/cancel labels, destinations and success feedback unless an accepted journey differs. The original default create destination is the owning list with safe list state preserved; detail/onboarding/create-another alternatives need an explicit product decision. Preserve validated return context through login; never accept arbitrary return URLs. Back/Cancel and dirty draft handling follow [forms](forms-validation-and-errors.md#5-submit-and-navigation-contract).

Destructive confirmation names the object and consequence, including dependent data when material. Do not ask for confirmation on every ordinary reversible save. Undo is offered only when the backend can actually reverse the operation within its policy. A dismissed dialog, removed row or client-side undo animation does not establish cancellation/reversal of committed business effects.

## 5. Complete screen and action states

For every affected screen/action specify available, hover/focus/active, disabled, pending, committed, queued, rejected and recovery behavior where applicable. Distinguish initial loading, refresh, empty dataset, no matches, partial error, forbidden, expired session, conflict, unavailable and unknown write outcome. Preserve permitted useful content and drafts without exposing stale private state across identities.

Loading may use stable skeletons, retained content, progress text or an appropriate bounded indicator; no universal spinner ban. Critical failures stay inline with an accessible summary/action, not only a transient toast. Avoid duplicate feedback from global and feature handlers. Do not announce success from an accepted queue insertion or mark a committed save failed merely because navigation/refetch failed. Follow [mutation outcomes](mutations-and-recovery.md).

Feature gates/roles improve presentation; trusted APIs still enforce actual authority. Do not render unauthorized payloads and merely hide their cells. Account for permission revocation/session change while the screen stays open. Sensitive fallback content and missing microfrontend views remain protected under the selected architecture.

## 6. Tables, lists and selection

Start with semantic HTML tables for tabular data or real lists for list content. Use an application grid only when its editing/navigation requirements justify the complete grid keyboard/focus contract. A styled collection of clickable divs is not automatically an accessible table. Columns have clear headers, units/formatting, missing-value rules and appropriate text alignment; numerical layout must not alter values.

Sorting uses an operable named control, visible state and appropriate header sort semantics. A row-click enhancement does not replace a real named link/button; preserve independent checkboxes/actions and browser link behavior. Stable resource identities key rows; indexes are unsuitable when rows reorder/change identity. Keep focus predictable across pagination, deletion and refreshed data.

Define responsive column priority and equivalent disclosure; hiding a critical column/action without another path is not a mobile strategy. Overflow belongs to the table region without clipping sibling forms or focus. Column resizing, pinning, density and customization are selected capabilities with keyboard/reset/persistence rules, not mandatory new libraries.

Selection labels distinguish this page, explicit cross-page IDs and all matching results. Use the [URL/state selection contract](url-and-ui-state.md#4-pagination-selection-and-bulk-intent), including exclusions, changed predicates and execution/snapshot meaning. Backend policy and limits apply to every affected record. Present partial bulk failure honestly rather than clearing selection and showing generic success.

Pagination/load-more/virtualization follows actual data bounds and measured needs. Virtualization requires semantics, total/position information where appropriate, stable keys, keyboard access, focus retention, loading/error and a usable alternative for unsupported interactions. It is not a substitute for server-side limits or proof that the product scales. Plan [performance and verification](frontend-performance-and-verification.md) before claiming improvement.

## 7. Dialogs, menus and layering

Select the appropriate interaction: modal dialog, nonmodal popover, menu, combobox, disclosure or inline expansion. Do not apply a focus trap to every popup. A modal requires actual focus/background behavior, not merely `aria-modal`. Use tested adopted primitives, while verifying the composed result and nested layers.

Define opening trigger, accessible name, initial focus, allowed dismissal, Escape ownership, scroll locking, portals/z-index and return focus. Escape normally dismisses the active eligible layer rather than all ancestors. Return to the trigger when valid, otherwise a logical surviving destination after deletion/navigation. Long content, errors and mobile keyboards must not strand the close/save actions. Detailed [interaction checks](accessibility-and-interactions.md#3-widget-focus-and-input-contracts) own accessibility behavior.

Transient tooltip content cannot be the only source of essential instructions. Confirmation and error dialogs must not multiply unnecessarily or trap users in retry loops. Preserve pending operation context after closing an overlay, and never imply close equals backend cancellation. A shell/remote overlay integration needs its selected F3 focus/style/runtime contract tested together.

## 8. Implementation and verification handoff

Return the adopted design context, route/component ownership, existing assets versus additions, public APIs/token changes, representative states, responsive/focus rules, operation/error contracts and acceptance evidence. Work in the smallest authorized slice; shared tokens/components have an owner and affected consumers. Follow actual pnpm scripts and inspect dependency/build scope before running tools.

Verify representative screens and siblings in selected browsers/viewports/zoom/input modes; long/missing content; component variants; route/save/cancel/dirty flows; table sort/selection; nested overlays; keyboard/focus; permissions/error/queued/unknown states; production bundles and meaningful component/browser/visual tests. Visual comparisons use controlled fixtures and intentional states, not fragile incidental pixels or real client data.

No UI was rendered, component built or application tested by authoring this reference. Reviewer/implementer/verifier agents remain separately authored capabilities. Apply FE-STD-01 through FE-STD-05,08,09,12 from the [preserved standards](../../../../../docs/specifications/standards/01-frontend-backend.md). The supplied ui-builder/a11y/test roles inform specificity but do not install their missing skills, permissions or tools here.
