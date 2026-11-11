---
name: nestjs-naming-conventions
description: Canonical rules for file names, class names, folder structure, barrel exports, and token naming across all NestJS projects. Load any time you create a file, name a class, or ask "where does this go?" This is the style enforcer — follow it exactly, never invent names.
---

# NestJS naming conventions

These rules are absolute. AI must follow them on every file created. No creative naming, no "similar but slightly different" names, no abbreviations unless listed here.

## File naming — always `kebab-case`

| What | Pattern | Example |
|---|---|---|
| Module | `<name>.module.ts` | `users.module.ts` |
| Controller | `<name>.controller.ts` | `users.controller.ts` |
| Service | `<name>.service.ts` | `users.service.ts` |
| Repository interface | `<name>.repository.ts` | `user.repository.ts` |
| Concrete repository | `<name>.<orm>.repository.ts` | `user.drizzle.repository.ts` |
| Token file | `<name>.tokens.ts` | `users.tokens.ts` |
| Domain entity | `<name>.entity.ts` | `user.entity.ts` |
| Create DTO | `create-<name>.dto.ts` | `create-user.dto.ts` |
| Update DTO | `update-<name>.dto.ts` | `update-user.dto.ts` |
| Filter/query DTO | `<name>-filter.dto.ts` | `user-filter.dto.ts` |
| Response DTO | `<name>.response.dto.ts` | `user.response.dto.ts` |
| Paginated response | `paginated-<name>.dto.ts` | `paginated-user.dto.ts` |
| Command | `<verb>-<name>.command.ts` | `create-user.command.ts` |
| Query | `get-<name>.query.ts` or `list-<name>.query.ts` | `get-user.query.ts` |
| Event | `<name>-<past-tense>.event.ts` | `user-created.event.ts` |
| Command handler | `<verb>-<name>.handler.ts` | `create-user.handler.ts` |
| Query handler | `get-<name>.handler.ts` | `get-user.handler.ts` |
| Event handler | `<name>-<event>.handler.ts` | `user-created.handler.ts` |
| Guard | `<name>.guard.ts` | `auth.guard.ts`, `permissions.guard.ts` |
| Interceptor | `<name>.interceptor.ts` | `logging.interceptor.ts` |
| Filter | `<name>.filter.ts` | `http-exception.filter.ts` |
| Decorator | `<name>.decorator.ts` | `current-user.decorator.ts` |
| Middleware | `<name>.middleware.ts` | `correlation-id.middleware.ts` |
| Strategy | `<name>.strategy.ts` | `jwt.strategy.ts`, `email-notification.strategy.ts` |
| Adapter | `<name>.adapter.ts` | `stripe-payment.adapter.ts` |
| Builder | `<name>.builder.ts` | `user-query.builder.ts` |
| Saga | `<name>.saga.ts` | `order.saga.ts` |
| Port interface | `<name>.port.ts` | `payment-gateway.port.ts` |
| Schema (Drizzle) | `<name>.schema.ts` | `users.schema.ts` |
| Test | `<name>.spec.ts` | `users.service.spec.ts` |
| E2E test | `<name>.e2e-spec.ts` | `users.e2e-spec.ts` |

## Class naming — always `PascalCase`

| Type | Pattern | Example |
|---|---|---|
| Module | `<Name>Module` | `UsersModule` |
| Controller | `<Name>Controller` | `UsersController` |
| Service | `<Name>Service` | `UsersService` |
| Repository interface | `I<Name>Repository` | `IUserRepository` |
| Concrete repository | `<Name><Orm>Repository` | `UserDrizzleRepository`, `UserTypeOrmRepository` |
| Domain entity | `<Name>` (plain class) | `User`, `Order`, `Payment` |
| Create DTO | `Create<Name>Dto` | `CreateUserDto` |
| Update DTO | `Update<Name>Dto` | `UpdateUserDto` |
| Filter DTO | `<Name>FilterDto` | `UserFilterDto` |
| Response DTO | `<Name>ResponseDto` | `UserResponseDto` |
| Paginated DTO | `Paginated<Name>Dto` | `PaginatedUserDto` |
| Command | `<Verb><Name>Command` | `CreateUserCommand`, `DeleteOrderCommand` |
| Query | `Get<Name>Query` / `List<Name>Query` | `GetUserQuery`, `ListOrdersQuery` |
| Event | `<Name><PastTense>Event` | `UserCreatedEvent`, `OrderShippedEvent` |
| Command handler | `<Verb><Name>Handler` | `CreateUserHandler` |
| Query handler | `Get<Name>Handler` / `List<Name>Handler` | `GetUserHandler` |
| Event handler | `<Name><Event>Handler` | `UserCreatedEmailHandler` |
| Guard | `<Name>Guard` | `AuthNGuard`, `PermissionsGuard` |
| Interceptor | `<Name>Interceptor` | `LoggingInterceptor`, `TransformInterceptor` |
| Filter | `<Name>Filter` | `HttpExceptionFilter`, `AllExceptionsFilter` |
| Decorator factory | `<Name>` (camelCase function) | `CurrentUser`, `Permissions`, `ApiRoute` |
| Strategy (Passport) | `<Name>Strategy` | `JwtStrategy`, `LocalStrategy` |
| Strategy (custom) | `<Name><Type>Strategy` | `EmailNotificationStrategy` |
| Adapter | `<Name>Adapter` | `StripePaymentAdapter`, `S3StorageAdapter` |
| Builder | `<Name>Builder` | `UserQueryBuilder`, `ReportResponseBuilder` |
| Base exception | `<Name>Exception` / `<Name>Error` | `AppException`, `NotFoundException` |
| Saga | `<Name>Saga` | `OrderSaga` |

## Injection tokens — always `SCREAMING_SNAKE_CASE Symbol`

```ts
// tokens.ts — one file per module, all tokens together
export const USER_REPOSITORY     = Symbol('USER_REPOSITORY');
export const PAYMENT_GATEWAY     = Symbol('PAYMENT_GATEWAY');
export const MAIL_PORT           = Symbol('MAIL_PORT');
export const STORAGE_PORT        = Symbol('STORAGE_PORT');
export const NOTIFICATION_MAP    = Symbol('NOTIFICATION_MAP');
export const DRIZZLE_TOKEN       = Symbol('DRIZZLE_TOKEN');
export const APP_CONFIG          = Symbol('APP_CONFIG');
```

Pattern: `<DOMAIN>_<TYPE>` — always a `Symbol`, never a string.

## Event name constants — always `SCREAMING_SNAKE_CASE` in an object

```ts
// events/<name>.events.ts
export const USER_EVENTS = {
  CREATED:          'user.created',
  UPDATED:          'user.updated',
  DEACTIVATED:      'user.deactivated',
  PASSWORD_CHANGED: 'user.password_changed',
} as const;
```

Pattern: `<DOMAIN>_EVENTS.<ACTION>` — dot-delimited, all lowercase.

## Folder structure — feature-first

```
src/ (or apps/gateway/src/app/ in microservices)
├── decorators/                    ← Custom compound & metadata decorators
│   ├── authn.decorator.ts
│   ├── authz.decorator.ts
│   ├── current-user.decorator.ts
│   ├── api-route.decorator.ts
│   └── index.ts
├── filters/                       ← Global exception filters (RFC-9457)
│   ├── exceptions.filter.ts
│   └── index.ts
├── guards/                        ← Authentication & Authorization
│   ├── authN.guard.ts
│   ├── authZ.guard.ts
│   └── index.ts
├── interceptors/                  ← Response transformation & telemetry
│   ├── response.interceptor.ts
│   ├── logging.interceptor.ts
│   ├── activity-logs.interceptor.ts
│   └── index.ts
├── interfaces/                    ← Security & context contracts
│   ├── actor-context.interface.ts
│   ├── request-context.interface.ts
│   └── index.ts
├── middleware/                    ← Express middleware (raw-body, correlation-id)
│   ├── correlation-id.middleware.ts
│   ├── raw-body.middleware.ts
│   └── index.ts
├── pipes/                         ← Input validation & sanitization
│   ├── validation.pipe.ts
│   ├── required.pipe.ts
│   └── index.ts
├── modules/                       ← Flat feature modules (CosmonyX Pragmatic Standard)
│   └── <feature>/
│       ├── controllers/
│       │   └── <feature>.controller.ts
│       ├── services/
│       │   └── <feature>.service.ts
│       ├── dto/
│       │   ├── create-<item>.dto.ts
│       │   ├── update-<item>.dto.ts
│       │   ├── <item>-filter.dto.ts
│       │   └── <item>.response.dto.ts
│       ├── constants/
│       │   └── <feature>.constants.ts  ← Symbol tokens, error codes, local enums
│       ├── <feature>.module.ts
│       └── *.spec.ts                  ← Colocated unit tests
├── database/                      ← Centralized data layer
│   ├── schema/                    ← Drizzle table schemas
│   ├── repositories/              ← Repositories implementing injected tokens
│   ├── migrations/
│   └── seeds/
├── app.module.ts (or gateway.module.ts)
└── main.ts
```

## Variable and method naming

| Type | Style | Example |
|---|---|---|
| Variables, params | `camelCase` | `userId`, `tenantId`, `pageSize` |
| Private class fields | `camelCase` (no underscore prefix) | `this.userRepo`, `this.config` |
| Boolean variables | Question form | `isActive`, `hasPermission`, `canDelete` |
| Async functions | Always return typed Promise | `async getUser(id: string): Promise<User>` |
| Event handlers | `on<EventName>` or `handle` | `onUserCreated`, `handle` |
| Repository methods | `findBy<Field>`, `findAllBy<Field>` | `findByEmail`, `findAllByTenant` |
| Factory methods | `create<Type>` | `createGateway`, `createVerifier` |

## Import order (enforced by ESLint)

```ts
// 1. Node built-ins
import { randomUUID } from 'node:crypto';
// 2. NestJS
import { Injectable, Inject } from '@nestjs/common';
// 3. Third-party
import { eq } from 'drizzle-orm';
// 4. Internal absolute (@scope)
import { ActorContext } from '@scope/contracts';
import { USER_REPOSITORY } from './constants/users.constants';
import { IUserRepository } from '../../database/repositories/user.repository.interface';
```

## What AI must NEVER do

| Forbidden | Reason |
|---|---|
| `userService` as a class name | Must be `UsersService` (plural) |
| `user-repo.ts` as a file name | Must be `user.repository.ts` |
| `const USER_REPO = 'user-repo'` | Token must be a `Symbol`, never a string |
| `IUserRepo` as interface name | Must be `IUserRepository` |
| `UserDto` for a response | Must be `UserResponseDto` |
| `user_created` event name | Must be `user.created` (dot-delimited) |
| `HandleUserCreated` class name | Must be `UserCreatedEmailHandler` or `UserCreatedAuditHandler` |
| Mixed naming in the same project | Pick one convention and stay consistent |
