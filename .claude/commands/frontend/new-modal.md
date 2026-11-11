---
description: Build an accessible modal, dialog, or drawer with open state, confirmation or form, and focus trap
argument-hint: "<feature> <modal-name> <dialog | sheet | alert-dialog> [purpose]"
---

Build modal: $ARGUMENTS

## Step 1: Modal Type & State Management
- Identify dialog type:
  - `dialog`: Standard content modal / form modal.
  - `alert-dialog`: Destructive confirmation (delete, discard changes) requiring explicit user confirmation.
  - `sheet`: Side drawer for complex details, filters, or mobile navigation.
- Identify open state pattern:
  - Controlled via props: `open: boolean`, `onOpenChange: (open: boolean) => void`.
  - Or URL-driven state: `?modal=<name>&id=<id>` for shareable / history-friendly dialogs.

## Step 2: Component Structure
Create inside the feature directory: `features/<feature>/components/<name>-dialog.tsx`:
- Render using `@scope/ui/dialog` (Radix Dialog / shadcn):
  - `DialogTrigger` (if self-contained) or controlled `open={isOpen}`.
  - `DialogContent` with proper sizing (`max-w-lg`, `sm:max-w-md`).
  - `DialogHeader`, `DialogTitle` (accessible heading, mandatory), `DialogDescription` (accessible description).
  - Modal body: form or confirmation message.
  - `DialogFooter`: Cancel button (variant `outline`) + Action / Submit button (variant `default` or `destructive`).

## Step 3: Interaction & Accessibility Requirements
- **Keyboard navigation:** Escape closes the modal, Tab is trapped inside dialog.
- **Focus management:** Focus moves to first interactive element upon open, returns to trigger upon close.
- **Close on submit:** Close dialog only upon successful mutation response (`onSuccess`), not on submission start.
- **Unsaved changes warning:** If a form is dirty and user tries to close, show confirmation or prevent accidental dismiss.
- **Loading state:** Disable buttons and show loading spinner during async mutation.

## Step 4: Verification
1. Run `pnpm turbo run typecheck lint --filter=web`.
2. Verify test covers: open, close, submit action, cancel action, keyboard escape.
3. Delegate to `a11y-reviewer` for WCAG 2.2 focus trap and ARIA compliance.
