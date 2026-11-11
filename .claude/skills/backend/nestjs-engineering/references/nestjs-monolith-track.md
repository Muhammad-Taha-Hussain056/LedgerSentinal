---
name: nestjs-monolith-track
description: Architecture rules for a single-app modular NestJS monolith. Feature modules, shared modules, database-per-monolith, and how to keep modules loosely coupled so extraction is possible later.
---

# Monolith track

A modular monolith: one deployed process, one database, many feature modules. Each module is bounded and could be extracted into a microservice without rewriting — because it already follows the same interface/DI rules.

## Application layers

```
apps/api/src/
├── main.ts                  ← bootstrap, global middleware, global pipes/filters/interceptors
├── app.module.ts            ← root: imports all features + global infra, no providers
├── common/                  ← guards, filters, interceptors, decorators, base exceptions
│   ├── decorators/
│   ├── exceptions/
│   ├── filters/
│   ├── guards/
│   └── interceptors/
├── database/                ← Drizzle schemas, migrations, seeds
│   ├── schema/              ← one file per domain: users.schema.ts, orders.schema.ts
│   └── drizzle.config.ts
├── config/                  ← env validation (Zod or class-validator)
│   └── env.validation.ts
├── shared/                  ← domain-agnostic utilities: LoggerService, PaginationHelper
│   └── shared.module.ts     ← @Global()
├── auth/                    ← AuthModule: JWT strategy, AuthNGuard, AuthZGuard, tokens
│   └── auth.module.ts
└── <feature>/               ← one folder per domain, see nestjs-module-architecture.md
```

## Bootstrap — `main.ts`

```ts
async function bootstrap() {
  const app = await NestFactory.create(AppModule, { bufferLogs: true });

  // Global middleware
  app.use(correlationIdMiddleware);
  app.enableCors({ origin: config.get('ALLOWED_ORIGINS')?.split(',') ?? [], credentials: true });

  // Global pipes
  app.useGlobalPipes(new ValidationPipe({
    whitelist: true, forbidNonWhitelisted: true, transform: true,
    transformOptions: { enableImplicitConversion: true },
  }));

  // Global filters + interceptors (registered via APP_FILTER / APP_INTERCEPTOR in AppModule)

  // Swagger
  if (config.get('NODE_ENV') !== 'production') {
    const spec = new DocumentBuilder()
      .setTitle('API').setVersion('1.0')
      .addBearerAuth().build();
    SwaggerModule.setup('docs', app, SwaggerModule.createDocument(app, spec));
  }

  await app.listen(config.getOrThrow('PORT'));
}
bootstrap();
```

## AppModule — root only, no providers

```ts
@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true, validate: validateEnv }),
    DatabaseModule,           // @Global: DRIZZLE_TOKEN
    EventEmitterModule.forRoot({ wildcard: true }),
    ThrottlerModule.forRoot([{ ttl: 60_000, limit: 100 }]),
    SharedModule,             // @Global: LoggerService, PaginationHelper
    AuthModule,
    UsersModule,
    OrdersModule,
    PaymentsModule,
  ],
  providers: [
    { provide: APP_GUARD,       useClass: AuthNGuard },
    { provide: APP_GUARD,       useClass: PermissionsGuard },
    { provide: APP_FILTER,      useClass: AllExceptionsFilter },
    { provide: APP_INTERCEPTOR, useClass: TransformInterceptor },
    { provide: APP_INTERCEPTOR, useClass: LoggingInterceptor },
  ],
})
export class AppModule {}
```

## Database schema — one file per domain

```ts
// database/schema/users.schema.ts
import { pgTable, uuid, text, timestamp, pgEnum } from 'drizzle-orm/pg-core';

export const userRoleEnum = pgEnum('user_role', ['admin', 'member', 'viewer']);

export const users = pgTable('users', {
  id:        uuid('id').primaryKey().defaultRandom(),
  email:     text('email').notNull().unique(),
  name:      text('name').notNull(),
  role:      userRoleEnum('role').notNull().default('member'),
  tenantId:  uuid('tenant_id'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
});

// database/schema/index.ts — barrel exports all tables
export * from './users.schema';
export * from './orders.schema';
```

## Module coupling rules

| Rule | Why |
|---|---|
| Module A never imports Module B's internal files | Use NestJS exports + imports |
| Shared entities promoted to `SharedModule` only when 3+ modules use them | Otherwise keep in owning module |
| Foreign keys in DB schemas are allowed | Modules may share DB tables; DI boundary is the enforcement layer |
| No circular module imports | Extract shared dep to `SharedModule` |
| `AuthModule` exports `AuthNGuard`, `PermissionsGuard` | Every other module gets them via global APP_GUARD registration |

## When to consider extraction to microservice

| Signal | Action |
|---|---|
| Module's DB table grows faster than others (100M+ rows) | Candidate for separate DB + service |
| Module scales independently (background jobs, heavy compute) | Extract with message queue |
| Team boundary matches module boundary | Organizational case for microservice |
| Module is already fully decoupled (no shared tables) | Low-risk extraction |

Do NOT extract preemptively. A modular monolith with proper DI boundaries is extraction-ready when needed.

## Anti-patterns

| Anti-pattern | Fix |
|---|---|
| Cross-module relative imports | NestJS DI via module exports/imports |
| Business logic in `AppModule` | Move to feature module |
| All schemas in one file | One schema file per domain |
| Feature logic in `SharedModule` | Shared = domain-agnostic utilities only |
| Skipping `DatabaseModule` | Every concrete repository needs `DRIZZLE_TOKEN` — provide it globally |
