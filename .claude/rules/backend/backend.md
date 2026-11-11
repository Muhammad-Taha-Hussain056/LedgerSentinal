---
paths:
  - "**/src/**/*.module.ts"
  - "**/src/**/*.controller.ts"
  - "**/src/**/*.service.ts"
  - "**/src/**/*.repository.ts"
  - "**/src/**/*.guard.ts"
  - "**/src/**/*.interceptor.ts"
  - "**/src/**/*.filter.ts"
  - "**/src/**/*.decorator.ts"
  - "**/src/**/*.dto.ts"
  - "**/src/**/*.handler.ts"
  - "**/src/**/*.command.ts"
  - "**/src/**/*.query.ts"
  - "**/src/**/*.event.ts"
  - "**/src/**/*.saga.ts"
  - "**/src/**/*.strategy.ts"
  - "**/src/**/*.factory.ts"
  - "**/src/**/*.adapter.ts"
  - "**/src/**/*.builder.ts"
  - "**/nest-cli.json"
  - "**/tsconfig*.json"
---

# Backend change rules

Apply to all NestJS backend work. These path hints activate when touching any backend source file.

## Before changing code

Load [nestjs-engineering](../../skills/backend/nestjs-engineering/SKILL.md) first — it routes to the correct reference and pattern skill. Never skip the routing table. For architecture-level changes use [system-architecture](../../skills/fullstack/system-architecture/SKILL.md).

## Required checkpoints

- **Module structure:** each feature module owns its domain — controller, service, repository, DTOs, entities. Never import a sibling module's internal files. Use NestJS exports + imports for cross-module communication. See [nestjs-module-architecture](../../skills/backend/nestjs-engineering/references/nestjs-module-architecture.md).

- **Gateway & security layout (CosmonyX standard):** all cross-cutting security infrastructure resides strictly in dedicated folders: `src/decorators/`, `src/filters/`, `src/guards/`, `src/interceptors/`, `src/interfaces/`, `src/middleware/`, `src/pipes/`. Wire globally via `APP_GUARD` (`AuthNGuard`, `AuthZGuard`), `APP_FILTER` (`ExceptionsFilter`), and `APP_INTERCEPTOR` (`ResponseInterceptor`, `LoggingInterceptor`). Never scatter guards inside feature modules or arbitrary `/presentation` subfolders.

- **Provider design:** constructor injection with typed Symbol tokens. Singleton scope by default. `REQUEST` scope only for per-request isolation. See [dependency-injection](../../skills/backend/backend-patterns/dependency-injection/SKILL.md).

- **Data access:** all database access through repositories. Service never calls ORM directly. Interface in domain, concrete in infrastructure. See [repository-pattern](../../skills/database/repository-pattern/SKILL.md).

- **Request lifecycle:** middleware → guard (AuthN) → guard (AuthZ) → interceptor → pipe (validation) → controller → service → repository. See [nestjs-request-lifecycle](../../skills/backend/nestjs-engineering/references/nestjs-request-lifecycle.md).

- **DTO validation:** every endpoint accepts/returns typed DTOs. `ValidationPipe` globally with `whitelist: true, forbidNonWhitelisted: true`. Never return ORM entities. See [nestjs-dto-validation](../../skills/backend/nestjs-engineering/references/nestjs-dto-validation.md).

- **Auth:** AuthN guard verifies JWT, attaches `ActorContext`. AuthZ guard checks permissions. Services receive verified actor — never re-derive identity. See [nestjs-auth-guards](../../skills/backend/nestjs-engineering/references/nestjs-auth-guards.md).

- **Error handling:** typed domain exceptions extending `AppException`. One global `AllExceptionsFilter`. Standard error envelope. See [nestjs-error-handling](../../skills/backend/nestjs-engineering/references/nestjs-error-handling.md).

- **Naming:** follow all conventions in [nestjs-naming-conventions](../../skills/backend/nestjs-engineering/references/nestjs-naming-conventions.md) — file names, class names, token names, event names, folder structure.

- **Testing:** unit tests for services, integration tests for modules, E2E for HTTP stack. Use `@nestjs/testing` and `buildXxx()` factories. See [nestjs-testing-patterns](../../skills/backend/nestjs-engineering/references/nestjs-testing-patterns.md).

- **Evidence:** run `npm run build && npm run lint && npm run test` before reporting done. Report actual pass/fail counts.
