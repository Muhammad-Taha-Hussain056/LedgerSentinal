---
name: nextjs-engineering
description: Use when building or changing Next.js routes, components, data fetching, forms, mutations, state, assets, metadata, auth, middleware, or any frontend work. This skill routes to the correct standalone skill — load it first.
---

# Next.js engineering

Load this skill first for any frontend task. It routes you to the correct standalone skill. Never improvise frontend patterns — find the skill below and follow it.

## Skill routing (load before acting)

| When the task involves | Load skill |
|---|---|
| Adding app/package, `turbo.json`, workspace layout | `arch-monorepo-layout` |
| Creating or restructuring a feature, cross-feature deps | `arch-feature-boundaries` |
| "Where does this file go?", naming, imports, barrel exports | `arch-code-placement` |
| `'use client'`, server/client boundary, passing props, providers | `next-server-vs-client` |
| Static/ISR/dynamic/streaming, `loading.tsx`, caching strategy | `next-rendering-modes` |
| Middleware, protected routes, login/logout, 401/refresh | `next-middleware-auth` |
| `next/image`, `next/font`, `next/script`, third-party embeds | `next-assets` |
| Page titles, OG, sitemap, robots, JSON-LD, structured data | `next-metadata-seo` |
| TanStack Query, query keys, staleTime, prefetch, hydration | `data-tanstack-query` |
| Backend calls, BFF proxy, cookies, fetch clients, cache tags | `data-bff-proxy` |
| Any create/update/delete from UI, `useMutation` | `data-mutations` |
| Client state, Zustand, URL state, Redux gate | `data-client-state` |
| Any form, React Hook Form, Zod, wizard, field array | `form-rhf-zod` |
| API errors, RFC 9457, field errors vs toasts, ProblemError | `form-error-mapping` |

## Invariants (never break)

- Server Components by default. `'use client'` on the smallest leaf only.
- Browser never calls NestJS directly. All traffic through the BFF proxy.
- Server data lives in TanStack Query. Never copy into Zustand.
- Forms use React Hook Form + Zod. Schemas derived from `@scope/contracts`.
- UI components from `@scope/ui` only. Semantic tokens. No raw colors.
- User-facing copy in per-feature `messages.ts`. Never inline strings.
- No `any`, no `@ts-ignore`, no unexplained `!`.
- Middleware is optimistic redirect only. Real auth in the server data layer.
- pnpm only. `pnpm --filter <pkg>`, `pnpm turbo run <task>`.

## How to work

1. Read `orchestra.config.json` + session-start version list.
2. For multi-file tasks, get a plan from `frontend-architect` first.
3. Load only the skills from the routing table above.
4. Build: `feature-builder` for features, `ui-builder` for design system components.
5. Test: `test-writer` for unit/component/E2E.
6. Review: `standards-reviewer` + `a11y-reviewer` before reporting done.
7. Verify: `pnpm turbo run typecheck lint test --filter=...[HEAD]`.

## Stack (fixed defaults — override in config)

Next.js App Router · TypeScript strict · pnpm + Turborepo · TanStack Query · Zustand · React Hook Form + Zod · Tailwind + shadcn/ui + Radix · Vitest + React Testing Library + Playwright + MSW.
