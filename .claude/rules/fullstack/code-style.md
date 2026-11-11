---
paths:
  - "**/*.{ts,tsx}"
---

# Code Style & Quality Standards

Applies to all TypeScript/JavaScript code across the repository.

## 1. Strict TypeScript Standards
- **No `any`:** Use `unknown` and narrow with type guards, or define a precise TypeScript type/interface.
- **Type-only imports:** Always use `import type { Foo } from '...'` for type-only imports to allow efficient bundler tree-shaking and avoid circular runtime dependencies.
- **Interfaces vs Types:** Use `interface` for object shapes, public API contracts, and domain entities. Use `type` for unions, intersections, mapped types, and utility types.
- **No unvalidated non-null assertions (`!`):** Never use `!` unless a guaranteed runtime invariant or assertion precedes it.
- **Immutability:** Prefer `const` over `let`. Never use `var`. Use `readonly` arrays/properties for state objects.

## 2. Naming Conventions
- **Files & Folders:** Strictly `kebab-case` (`auth-guard.ts`, `user-profile.tsx`, `create-user.dto.ts`).
- **Components & Classes:** `PascalCase` (`UserProfile`, `UsersService`, `CreateUserDto`).
- **Functions & Methods:** `camelCase` (`findUserById`, `calculateDiscount`).
- **React Hooks:** `camelCase` with mandatory `use` prefix (`useUserSession`, `useDebounce`).
- **Constants & Enums:** `UPPER_SNAKE_CASE` (`MAX_RETRY_COUNT`, `DEFAULT_PAGE_SIZE`).
- **DI Injection Tokens:** `UPPER_SNAKE_CASE` Symbol or string (`USER_REPOSITORY`, `PAYMENT_GATEWAY`).

## 3. Import Organization
Organize imports in 4 distinct blocks separated by a single newline:
1. Node.js built-ins (`node:fs`, `node:path`, `node:crypto`).
2. External packages (`@nestjs/common`, `next`, `react`, `zod`, `drizzle-orm`).
3. Path-aliased workspace packages (`@scope/ui`, `@scope/contracts`, `@features/...`).
4. Relative imports (`./types`, `./constants`) and `import type` declarations.

## 4. Code Complexity & Cleanliness
- **File length:** Maximum 250-300 lines per file. If a component or service exceeds this, decompose into sub-components, utility functions, or dedicated strategy handlers.
- **Nesting:** Maximum 3 levels of indentation. Use early returns (`guard clauses`) to flatten control flow.
- **Function parameters:** Functions with more than 3 parameters should accept a single typed options object.
- **Dead code & logging:** No `console.log` or commented-out code in committed pull requests. Use NestJS `Logger` on backend and structured logging on frontend.
- **Error handling:** Never write empty `catch (e) {}` blocks. Every caught error must be handled, logged, or transformed into a typed domain exception.
