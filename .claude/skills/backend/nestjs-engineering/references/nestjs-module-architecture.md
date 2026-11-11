---
name: nestjs-module-architecture
description: Rules for module anatomy, feature module boundaries, shared/core modules, and how modules communicate via DI exports. Load for any "where does this code go?" question, any new module, or any cross-module dependency.
---

# NestJS module architecture

Every feature is a self-contained module. Modules communicate through exported providers only — never through direct file imports.

## Module anatomy

```ts
// users/users.module.ts
@Module({
  imports: [
    DatabaseModule,           // provides DRIZZLE_TOKEN globally
    CqrsModule,               // required when handlers exist
    ConfigModule,             // required if module reads its own config
  ],
  controllers: [UsersController],
  providers: [
    UsersService,
    { provide: USER_REPOSITORY, useClass: UserDrizzleRepository },
    // CQRS handlers
    CreateUserHandler, GetUserHandler, ListUsersHandler,
    UserCreatedEmailHandler,
    // Builders
    UserQueryBuilder,
  ],
  exports: [
    UsersService,             // other modules inject UsersService
    USER_REPOSITORY,          // only if another module needs the repo directly (rare)
  ],
})
export class UsersModule {}
```

## Gateway & App Security Architecture (CosmonyX Pragmatic Standard)

In the monorepo API (`apps/api/src/`) or API Gateway (`apps/gateway/src/app/`), all cross-cutting security, guards, and HTTP lifecycle artifacts live in dedicated root folders:

```
apps/api/src/ (or apps/gateway/src/app/)
├── decorators/          ← Custom decorators: @AuthN, @AuthZ, @CurrentUser, @ApiRoute, @ApiPagination
│   ├── authn.decorator.ts
│   ├── authz.decorator.ts
│   ├── current-user.decorator.ts
│   ├── api-route.decorator.ts
│   └── index.ts
├── filters/             ← Global exception filters: RFC-9457 error envelope
│   ├── exceptions.filter.ts
│   └── index.ts
├── guards/              ← Security guards: authentication & authorization
│   ├── authN.guard.ts   ← Verifies JWT, populates req.user (ActorContext)
│   ├── authZ.guard.ts   ← Evaluates roles/permissions against route metadata
│   └── index.ts
├── interceptors/        ← Transform & telemetry
│   ├── response.interceptor.ts      ← Envelopes response: { success, data, timestamp }
│   ├── logging.interceptor.ts       ← Duration & correlation logging
│   ├── activity-logs.interceptor.ts ← User audit trail
│   └── index.ts
├── interfaces/          ← Global security contracts
│   ├── actor-context.interface.ts   ← ActorContext (userId, tenantId, email, roles, permissions)
│   ├── request-context.interface.ts ← RequestWithActor
│   └── index.ts
├── middleware/          ← Transport middleware
│   ├── correlation-id.middleware.ts ← Injects X-Correlation-Id
│   ├── raw-body.middleware.ts       ← Webhook signature preservation
│   └── index.ts
├── pipes/               ← Input validation
│   ├── validation.pipe.ts           ← Configured class-validator ValidationPipe
│   ├── required.pipe.ts
│   └── index.ts
└── modules/             ← Flat domain feature modules
```

## Feature module folder structure (CosmonyX Pragmatic Standard)

```
apps/api/src/modules/users/  (or apps/user-account/src/app/ in microservices)
├── controllers/
│   └── users.controller.ts       ← HTTP transport / RMQ message handlers
├── services/
│   └── users.service.ts          ← Business logic, calls repository
├── dto/
│   ├── create-user.dto.ts        ← Request validation (class-validator)
│   ├── update-user.dto.ts
│   └── user-response.dto.ts      ← Response serialization
├── constants/
│   └── users.constants.ts        ← Symbol tokens, error codes, local enums
├── users.module.ts               ← NestJS module definition & DI wiring
└── *.spec.ts                     ← Unit tests alongside services/controllers
```

> **The CosmonyX Golden Law:** Never create academic Hexagonal/DDD sub-folders (`/presentation`, `/application`, `/domain/ports`, `/infrastructure/persistence`). Keep modules flat: `controllers/`, `services/`, `dto/`, `constants/`.
> Database schemas and repositories live centrally in `database/` (monolith) or `libs/shared/` (microservices).

## Module types

| Type | Name | Use for |
|---|---|---|
| Feature module | `UsersModule`, `OrdersModule` | One domain area |
| Global infrastructure | `DatabaseModule`, `ConfigModule` | Shared once, `@Global()` |
| Shared utilities | `SharedModule` | Cross-feature helpers: `LoggerService`, `PaginationHelper` |
| Core / bootstrap | `AppModule` / `GatewayModule` | Root: imports features + registers global security providers |

## `AppModule` / `GatewayModule` — root composition & global security

```ts
// app.module.ts (or gateway.module.ts)
@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true, validate: validateEnv }),
    DatabaseModule,           // @Global — provides DRIZZLE_TOKEN everywhere
    EventEmitterModule.forRoot({ wildcard: true }),
    SharedModule,             // @Global — LoggerService, PaginationHelper
    // Features
    UsersModule,
    OrdersModule,
    AuthModule,
    PaymentsModule,
  ],
  providers: [
    // CosmonyX Global Security & Pipeline Wiring:
    { provide: APP_GUARD, useClass: AuthNGuard },
    { provide: APP_GUARD, useClass: AuthZGuard },
    { provide: APP_FILTER, useClass: ExceptionsFilter },
    { provide: APP_INTERCEPTOR, useClass: ResponseInterceptor },
    { provide: APP_INTERCEPTOR, useClass: LoggingInterceptor },
    { provide: APP_INTERCEPTOR, useClass: ActivityLogsInterceptor },
  ],
})
export class AppModule {}
```

## `DatabaseModule` — global infrastructure

```ts
@Global()
@Module({
  providers: [{
    provide: DRIZZLE_TOKEN,
    useFactory: async (config: ConfigService) => { /* pool + drizzle init */ },
    inject: [ConfigService],
  }],
  exports: [DRIZZLE_TOKEN],
})
export class DatabaseModule {}
```

## `SharedModule` — cross-feature utilities

```ts
@Global()
@Module({
  providers: [LoggerService, PaginationHelper, AppCacheService],
  exports:   [LoggerService, PaginationHelper, AppCacheService],
})
export class SharedModule {}
```

**Rule:** only put in `SharedModule` what is used by 2+ feature modules and has no domain knowledge.

## Cross-module communication — only via exports + imports

```
UsersModule exports UsersService
OrdersModule imports UsersModule → injects UsersService in OrdersService

NEVER:
OrdersService imports '../../users/users.service'  ← blocked by guard-write.mjs
```

## Dynamic module pattern — library reuse

```ts
// Configurable libraries (mail, notifications, storage)
// Register with forRootAsync in AppModule; feature modules import the module, not the service directly
MailModule.forRootAsync({ useFactory: (c) => ({ from: c.getOrThrow('MAIL_FROM') }), inject: [ConfigService] })
```

## Anti-patterns

| Anti-pattern | Fix |
|---|---|
| Cross-module relative file imports | Import through NestJS module exports + DI |
| Business logic in `AppModule` | Move to the relevant feature module |
| `@Global()` on a feature service | Global only for infra: DB, Config, Logger, Events |
| Circular module import | Extract shared dep to `SharedModule` |
| Giant `SharedModule` with domain services | Shared = domain-agnostic utilities only |
| One mega-module with all features | Split by domain boundary |
| Missing `CqrsModule` import | Every feature using CQRS must import it |
