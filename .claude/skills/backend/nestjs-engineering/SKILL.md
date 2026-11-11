---
name: nestjs-engineering
description: Use when building or changing NestJS modules, controllers, services, repositories, guards, interceptors, pipes, filters, DTOs, CQRS handlers, events, sagas, decorators, or any backend design pattern. Load this skill first; it routes to the correct reference and pattern skill.
---

# NestJS engineering

Version note: read the pinned `@nestjs/core` version from session context. If the API differs from what is shown here, check the official docs for that version — never guess.

Inspect the repo before writing code. Load only the references the task needs. Never scaffold outside approved scope.

## Skill routing (load before acting)

| When the task involves | Load reference |
|---|---|
| Module anatomy, feature boundaries, SharedModule, GlobalModule | `references/nestjs-module-architecture.md` |
| Request pipeline, guards, interceptors, pipes, order of execution | `references/nestjs-request-lifecycle.md` |
| DTOs, class-validator, class-transformer, response shaping | `references/nestjs-dto-validation.md` |
| JWT, AuthN guard, AuthZ guard, RBAC, `@CurrentUser` | `references/nestjs-auth-guards.md` |
| Unit tests, integration tests, `@nestjs/testing` setup | `references/nestjs-testing-patterns.md` |
| Exception filters, typed error classes, response envelope | `references/nestjs-error-handling.md` |
| File naming, class naming, folder structure, barrel exports | `references/nestjs-naming-conventions.md` |
| Single-app modular monolith track | `references/nestjs-monolith-track.md` |
| Multi-service microservices, RabbitMQ, TCP transports | `references/nestjs-microservices-track.md` |

## Pattern routing (load alongside references)

| When the task involves | Load pattern |
|---|---|
| Any data access, new entity, ORM query | `../backend-patterns/repository/SKILL.md` |
| Any new provider, scope, injection token | `../backend-patterns/dependency-injection/SKILL.md` |
| Dynamic module, config-driven service creation | `../backend-patterns/factory/SKILL.md` |
| Shared services, global modules, connection pools | `../backend-patterns/singleton/SKILL.md` |
| Domain events, decoupled side effects | `../backend-patterns/observer/SKILL.md` |
| Complex query assembly, DTO construction | `../backend-patterns/builder/SKILL.md` |
| External API, SDK wrapping, hexagonal port | `../backend-patterns/adapter/SKILL.md` |
| Interchangeable algorithms, runtime selection | `../backend-patterns/strategy/SKILL.md` |
| Custom decorators, metadata, cross-cutting | `../backend-patterns/decorator/SKILL.md` |
| Read/write separation, CQRS handlers, sagas | `../backend-patterns/cqrs/SKILL.md` |
| Which pattern to use for a new problem | `../backend-patterns/PATTERNS.md` |

## Invariants (never break)

- Constructor injection only — no property injection, no `new SomeService()`
- Repository interface in domain, ORM code in infrastructure — never cross
- DTO validation globally: `ValidationPipe` with `whitelist: true, forbidNonWhitelisted: true, transform: true`
- Dedicated Gateway security layout: cross-cutting guards, filters, interceptors, pipes, decorators, and middleware reside strictly in root `src/{decorators,filters,guards,interceptors,interfaces,middleware,pipes}`, wired globally in `AppModule` / `GatewayModule` via `APP_GUARD`, `APP_FILTER`, `APP_INTERCEPTOR`
- Guards run before the controller method — services assume a verified actor
- Typed domain exceptions only — never `throw new Error('string')` from a service
- `@nestjs/testing` for every test — never mock the whole container

## How to work

1. Read `orchestra.config.json` + session version list.
2. Get a plan from `backend-architect` for multi-file tasks — wait for approval.
3. Load this skill's routing table; load only what the task touches.
4. Build: `repository-builder` → `service-builder` → `api-builder` → `cqrs-handler` if CQRS.
5. Verify: `backend-verifier` runs checks, `backend-reviewer` + `contract-reviewer` review.
6. Never claim done before `npm run build && npm run lint && npm run test` all pass.
