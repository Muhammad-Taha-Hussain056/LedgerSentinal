---
paths:
  - "**/src/**/*.{ts,tsx}"
  - "**/app/**/*.{ts,tsx}"
  - "**/packages/**/*.{ts,tsx}"
---

# Full-Stack Security Rules

Applies to all code across backend (NestJS) and frontend (Next.js). Never bypass these requirements.

## 1. Authentication & Token Handling
- **Backend:**
  - Dedicated Gateway security structure: guards live in `src/guards/` (`authN.guard.ts`, `authZ.guard.ts`), decorators in `src/decorators/` (`@AuthN()`, `@AuthZ()`, `@CurrentUser()`, `@Public()`), interfaces in `src/interfaces/` (`actor-context.interface.ts`).
  - All protected endpoints must have `@AuthN()` (or `@UseGuards(AuthNGuard, AuthZGuard)`). Public endpoints must explicitly declare `@Public()`.
  - JWT tokens must be signed with secure asymmetric keys or strong random secrets via `ConfigService`.
  - Never store plain text passwords; always hash using Argon2id or bcrypt (cost factor >= 12).
  - Extract user identity strictly from `ActorContext` via `@CurrentUser()` custom decorator; never trust client-supplied user IDs in request bodies or query params.
- **Frontend:**
  - Access and refresh tokens must be stored in `httpOnly`, `Secure`, `SameSite=Lax` cookies; never store sensitive auth tokens in `localStorage` or `sessionStorage`.
  - Auth middleware is optimistic redirect only; real authorization must occur in the server data layer (`requireUser()`).
  - The logout flow must invalidate backend tokens and clear all auth cookies.
  - Never log tokens, passwords, or PII in `console.log`, analytics, or error tracking.

## 2. Injection Prevention
- **Backend:**
  - SQL Injection: All database queries must use parameterized queries through the repository pattern and ORM (Drizzle/TypeORM). Never concatenate raw strings into SQL queries.
  - Input Sanitization: Global `ValidationPipe` with `{ whitelist: true, forbidNonWhitelisted: true }` must be active to reject unexpected payload properties.
- **Frontend:**
  - XSS Prevention: Never use `dangerouslySetInnerHTML` with user-supplied content. If HTML rendering is required, sanitize with DOMPurify.
  - Never use `eval()`, `Function()`, or `setTimeout(string)` with dynamic content.
  - Validate and sanitize any user input used in `href`, `src`, or event handler attributes.

## 3. Open Redirect Prevention
- `returnTo` or `next` URL query parameters used in login or auth flows must only accept relative internal paths (starting with `/` and not `//`).
- Never pass user-controlled values directly to `router.push()` or `window.location` without verifying against an allowed path pattern.

## 4. Data Exposure & Secrets
- Never commit `.env` files with real credentials.
- `NEXT_PUBLIC_*` environment variables in Next.js are visible in client bundles; never prefix secrets or private keys with `NEXT_PUBLIC_`.
- Backend error responses must never expose stack traces, internal file paths, or raw database errors in production (standard RFC 9457 envelope only).
- Never cache per-user or personalized data in shared HTTP or CDN caches.
