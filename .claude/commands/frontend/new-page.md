---
description: Scaffold a new Next.js App Router page with route, section/feature component, layout, metadata, loading state, and auth guards
argument-hint: "<route-path> <page-description, e.g. '/dashboard/analytics analytics overview'>"
---

Scaffold page: $ARGUMENTS

## Step 1: Route & Protection Analysis
- Determine the route path: e.g., `app/(dashboard)/analytics/page.tsx` or `app/(auth)/login/page.tsx`.
- Identify route group:
  - `(app)` or `(dashboard)`: Protected route (requires auth guard / session check).
  - `(auth)`: Guest-only route (redirects authenticated users).
  - `(marketing)`: Public route (SEO metadata, static or ISR rendering).
- Identify layout integration and navigation menu entry (sidebar / topbar).

## Step 2: Discover Placement & Contracts
- Follow `arch-code-placement`:
  - `apps/web/src/app/.../page.tsx`: Thin wrapper only.
  - Page logic, state, and complex UI live in `apps/web/src/features/<feature>/components/<FeaturePage>.tsx`.
  - Feature-specific types in `features/<feature>/types/`.
  - Feature-specific queries/mutations in `features/<feature>/api/`.
- Check `@scope/contracts` for existing backend DTOs / contracts.

## Step 3: Implement Page & Components
1. **Thin Route Wrapper (`app/.../page.tsx`):**
   - Server Component by default.
   - Generates SEO metadata using `export async function generateMetadata()`.
   - Performs server prefetch into `HydrationBoundary` if initial data is needed.
   - Imports and renders the feature section component.
2. **Loading State (`app/.../loading.tsx`):**
   - Renders a skeleton UI matching the page layout (no generic spinners).
3. **Error State (`app/.../error.tsx`):**
   - Client Component with `reset` handler and friendly fallback.
4. **Feature Section (`features/<feature>/components/...`):**
   - Structured layout with semantic HTML.
   - Uses `@scope/ui` design system primitives (shadcn/Radix + Tailwind).
   - TanStack Query for data fetching with typed keys and staleTime.
   - Accessible heading hierarchy (single `<h1>`, logical `<h2>`).

## Step 4: Verification
1. Run type-check and linter:
   - `pnpm turbo run typecheck lint --filter=web`
2. Run tests:
   - `pnpm turbo run test --filter=web`
3. Delegate to `a11y-reviewer` for accessibility check.
4. Delegate to `standards-reviewer` for standards compliance.
