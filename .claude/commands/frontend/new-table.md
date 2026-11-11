---
description: Build a production-grade data table with TanStack Table, server-side pagination, sorting, search/filters, loading skeletons, and empty states
argument-hint: "<feature> <table-name> <data endpoint or contract schema>"
---

Build data table: $ARGUMENTS

## Step 1: Requirements & Data Contract
- Identify the data source: API endpoint from `@scope/contracts` or BFF proxy.
- Determine columns, sortable fields, searchable filters, and row action triggers (edit, view, delete).
- Confirm pagination model: server-side pagination (page/limit or cursor) with query params.

## Step 2: Column Definitions
- Create `features/<feature>/components/<name>-columns.tsx`:
  - Typed column definitions using `ColumnDef<TData, any>[]`.
  - Use `accessorKey` for direct properties, `accessorFn` for computed values.
  - Custom cell renderers for badges, formatted currency, dates (formatted at presentation only).
  - Row action menu with accessible dropdown / buttons.

## Step 3: Table State & API Integration
- URL-driven state for pagination, sorting, and filters (`useSearchParams` or `nuqs`).
- TanStack Query hook with query key including all active query parameters:
  ```typescript
  const queryKey = ['<feature>', 'list', { page, limit, search, sort, filter }];
  ```
- Keep `placeholderData: keepPreviousData` to prevent flickering during page transitions.

## Step 4: Table Component Structure
- Render using `@scope/ui/table` (or project Table primitive):
  - Table header with sort indicators (accessible `aria-sort`).
  - Table body with data rows or skeleton loading rows during fetch.
  - Pagination controls (Page X of Y, Previous / Next buttons, page size selector).
  - Empty state component when `data.items.length === 0`.
  - Error state with retry action if query errors.
  - Horizontal scroll wrapper for mobile / responsive viewports (`overflow-x-auto`).

## Step 5: Verification
1. Run `pnpm turbo run typecheck lint --filter=web`.
2. Add component test covering: column rendering, sort click, pagination click, empty state.
3. Delegate to `standards-reviewer` and `a11y-reviewer`.
