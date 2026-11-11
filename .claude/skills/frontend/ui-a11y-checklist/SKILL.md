---
name: ui-a11y-checklist
description: Manual WCAG 2.2 AA checklist for reviewing components and pages. Used by a11y-reviewer agent. Load when reviewing any interactive UI, form, dialog, menu, table, or navigation.
---

# Accessibility checklist (WCAG 2.2 AA)

Walk each changed component through every applicable item. Report findings as: `Severity | WCAG criterion | file:line | Problem | Fix`.

## Semantics and landmarks

- [ ] Page has exactly one `<main>`, correct `<nav>`, `<header>`, `<footer>`, `<aside>` landmarks
- [ ] Headings follow a logical hierarchy (`h1` → `h2` → `h3`) with no skipped levels
- [ ] Lists use `<ul>`/`<ol>`/`<li>`, not `<div>` with bullets
- [ ] Tables use `<table>`, `<thead>`, `<th scope="col/row">` for data, never for layout
- [ ] Interactive elements use `<button>`, `<a>`, `<input>`, `<select>` — never clickable `<div>`/`<span>`

## Accessible names and labels

- [ ] Every `<input>`, `<select>`, `<textarea>` has a visible `<label>` linked by `htmlFor`/`id` (never placeholder-only)
- [ ] Every `<button>` has visible text or `aria-label`
- [ ] Icon-only buttons have `aria-label` describing the action
- [ ] Images have informative `alt` (decorative: `alt=""` or `aria-hidden="true"`)
- [ ] SVG icons used decoratively have `aria-hidden="true"` and `focusable="false"`

## Keyboard operation and focus

- [ ] All interactive elements reachable with Tab
- [ ] Tab order follows visual layout (no positive `tabIndex` except `-1` for programmatic focus)
- [ ] `Escape` closes dialogs, menus, popovers
- [ ] `Enter`/`Space` activates buttons; `Enter` submits forms
- [ ] Arrow keys navigate within composite widgets (tabs, menus, listbox, tree)
- [ ] No keyboard traps — focus can always leave the component

## Visible focus

- [ ] Focus ring visible on every interactive element (never `outline: none` without replacement)
- [ ] Focus ring has minimum 2px width and meets 3:1 contrast against adjacent colors
- [ ] Custom focus styles use `focus-visible` (not `focus`) to avoid showing on mouse click

## Focus management

- [ ] Opening a dialog moves focus to the first interactive element or the dialog itself
- [ ] Closing a dialog returns focus to the trigger element
- [ ] Deleting an item moves focus to a logical neighbor (next item, empty state)
- [ ] Page navigation via `router.push` moves focus to the new content (or `<h1>`)

## Form errors

- [ ] Invalid fields have `aria-invalid="true"`
- [ ] Error messages linked via `aria-describedby` on the field
- [ ] Root/summary errors have `role="alert"` for live announcement
- [ ] After failed submit, focus moves to the first invalid field
- [ ] Required fields marked visually AND with `aria-required="true"` or `required`

## Color and contrast

- [ ] Text meets 4.5:1 contrast (large text 18px+ bold or 24px+: 3:1)
- [ ] Non-text UI components (borders, icons, focus rings): 3:1
- [ ] Information not conveyed by color alone (error = red + icon + text)
- [ ] Works in forced-colors/high-contrast mode (test with Windows High Contrast)

## Target size

- [ ] Interactive targets at least 24×24px (WCAG 2.2 Level AA)
- [ ] Inline text links exempt, but adjacent targets have sufficient spacing

## Motion and animation

- [ ] Animations respect `prefers-reduced-motion: reduce`
- [ ] No auto-playing video/audio
- [ ] Parallax, carousel auto-advance, and decorative motion disabled when reduced motion preferred
- [ ] Toast/notification display duration: minimum 5 seconds or user-dismissable

## Dynamic content

- [ ] Status messages (toasts, alerts) use `role="status"` or `role="alert"` for screen reader announcement
- [ ] Loading states announced (`aria-busy="true"` on the container, or `aria-live="polite"` status)
- [ ] Added/removed list items announced appropriately
- [ ] Infinite scroll: items are in a labeled `<ul>`, count is announced

## Verdict

- **PASS** — all applicable items checked, no issues found
- **PASS WITH ISSUES** — minor items noted, no blockers
- **FAIL** — one or more blockers that prevent users from completing tasks
