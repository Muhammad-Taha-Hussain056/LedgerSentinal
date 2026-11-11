---
name: backend-patterns
description: Master decision guide for all ten NestJS backend design patterns. Load this first to select the correct pattern, then load the specific pattern SKILL.md.
---

# Backend design patterns — master index

Load this file first when a pattern decision is needed. Find the correct pattern below, then load its `SKILL.md` for implementation rules and code.

## Decision table (first match wins)

| The code needs to... | Pattern | Skill |
|---|---|---|
| Access data from a database | **Repository** | `repository/SKILL.md` |
| Wire dependencies between classes (new provider, token, scope) | **Dependency Injection** | `dependency-injection/SKILL.md` |
| Create objects dynamically based on config/runtime input | **Factory** | `factory/SKILL.md` |
| Share one instance app-wide (connection pool, config, cache) | **Singleton** | `singleton/SKILL.md` |
| React to domain events with decoupled side effects | **Observer** | `observer/SKILL.md` |
| Assemble a complex object step by step (queries, reports) | **Builder** | `builder/SKILL.md` |
| Wrap an external API or third-party SDK | **Adapter** | `adapter/SKILL.md` |
| Swap algorithms at runtime (payment providers, notifications) | **Strategy** | `strategy/SKILL.md` |
| Add cross-cutting behavior without modifying the target | **Decorator** | `decorator/SKILL.md` |
| Separate reads from writes in a complex domain | **CQRS** | `cqrs/SKILL.md` |

## Pattern combinations (common)

| Scenario | Patterns used together |
|---|---|
| New feature module with DB access | Repository + DI + DTO validation |
| External payment integration | Adapter + Strategy + Factory |
| Event-driven side effects after a write | Observer + (optional CQRS) |
| Complex query with filters | Builder + Repository |
| Custom route metadata | Decorator + DI (guard reads metadata) |
| Multi-provider config-driven service | Factory + Strategy + Singleton |

## When NOT to use a pattern

| Temptation | Do instead |
|---|---|
| "Repository for a simple key-value lookup" | If there's no domain entity, a direct service method is fine |
| "CQRS for a CRUD with identical read/write shapes" | Skip CQRS — it adds handlers/buses for no benefit |
| "Factory for one provider that never changes" | Direct `useClass` in the module — Factory is for dynamic/config-driven creation |
| "Observer for synchronous validation before a write" | Call the validation service directly — Observer is for post-write side effects |
| "Strategy for two if-branches" | If it's 2 options and won't grow, a simple conditional is clearer |
| "Builder for an object with 3 required fields" | Use the constructor or a factory method |

## Loading rule

1. Read this index first.
2. Load **only** the pattern(s) the task needs — never all 10.
3. If unsure which pattern fits, describe the problem to `backend-architect` and get a recommendation.
