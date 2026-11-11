---
paths:
  - "**/next.config.*"
  - "**/app/**/page.{tsx,jsx}"
  - "**/app/**/layout.{tsx,jsx}"
  - "**/app/**/loading.{tsx,jsx}"
  - "**/app/**/error.{tsx,jsx}"
  - "**/app/**/not-found.{tsx,jsx}"
  - "**/app/**/global-error.{tsx,jsx}"
  - "**/src/features/**"
  - "**/src/lib/**"
  - "**/src/components/**"
  - "**/packages/ui/**"
  - "**/packages/contracts/**"
---

# Frontend change rules

Apply to all Next.js + shadcn/ui frontend work. These path hints activate when touching routes, features, shared UI, packages and config.

## Before changing code

Load [nextjs-engineering](../../skills/frontend/nextjs-engineering/SKILL.md) first — it routes to the correct standalone skill. Never skip the routing table. For architecture-level changes use [system-architecture](../../skills/fullstack/system-architecture/SKILL.md).

## Required checkpoints

- **File placement:** follow `arch-code-placement`. Features own their code. Shared only when 2+ features need it. No sibling-feature imports. No cross-app imports. See [arch-code-placement](../../skills/frontend/arch-code-placement/SKILL.md).

- **Server vs client boundary:** Server Components by default. `'use client'` on the smallest leaf. Props crossing the boundary must be serializable. See [next-server-vs-client](../../skills/frontend/next-server-vs-client/SKILL.md).

- **Data fetching:** server prefetch + `HydrationBoundary` for initial data. TanStack Query for all reads. Browser never calls NestJS directly — always through BFF. See [data-tanstack-query](../../skills/frontend/data-tanstack-query/SKILL.md) and [data-bff-proxy](../../skills/frontend/data-bff-proxy/SKILL.md).

- **Mutations:** `useMutation` → BFF → NestJS → invalidate. Idempotency key for creates. See [data-mutations](../../skills/frontend/data-mutations/SKILL.md).

- **Forms:** React Hook Form + Zod. Schemas derived from `@scope/contracts`. Server errors mapped via `applyProblemToForm`. See [form-rhf-zod](../../skills/frontend/form-rhf-zod/SKILL.md) and [form-error-mapping](../../skills/frontend/form-error-mapping/SKILL.md).

- **Client state:** URL state for shareable/bookmarkable state. Zustand for UI state. Never copy server data into a store. See [data-client-state](../../skills/frontend/data-client-state/SKILL.md).

- **Auth:** middleware is optimistic redirect only. Real auth in server data layer (`requireUser()`). See [next-middleware-auth](../../skills/frontend/next-middleware-auth/SKILL.md).

- **Assets & SEO:** `next/image` for all images. `next/font` for all fonts. `buildMetadata()` for all public pages. See [next-assets](../../skills/frontend/next-assets/SKILL.md) and [next-metadata-seo](../../skills/frontend/next-metadata-seo/SKILL.md).

- **Evidence:** run `pnpm turbo run typecheck lint test --filter=...[HEAD]` before reporting done. Report actual pass/fail counts.
