---
name: dependency-injection-pattern
description: Rules for every provider, injection token, scope decision, async provider, and dynamic module. Load for any new @Injectable class, custom token, or useFactory provider. Every other pattern depends on this one.
---

# Dependency Injection pattern

NestJS's IoC container resolves and injects dependencies automatically. `@Injectable()` marks a class as a provider; constructor parameters are the injection tokens. Never use `new SomeService()` or property injection in application code.

## The four provider types

```ts
// 1. useClass — most common
{ provide: USER_REPOSITORY, useClass: UserDrizzleRepository }

// 2. useValue — constants, config objects, test mocks
{ provide: APP_CONFIG, useValue: { timeout: 3000, retries: 3 } }

// 3. useFactory — async init, conditional selection, dependencies needed
{
  provide: DRIZZLE_TOKEN,
  useFactory: async (config: ConfigService) => {
    const pool = new Pool({ connectionString: config.getOrThrow('DATABASE_URL') });
    return drizzle(pool);
  },
  inject: [ConfigService],         // ← always list every dependency
}

// 4. useExisting — alias
{ provide: ILogger, useExisting: WinstonLogger }
```

## Provider scopes

| Scope | Constant | Lifetime | When to use |
|---|---|---|---|
| **Singleton** | `Scope.DEFAULT` | App lifetime | Everything — the default |
| **Request** | `Scope.REQUEST` | Per HTTP request | Per-request context (trace ID, current tenant). Causes scope bubble up the tree. |
| **Transient** | `Scope.TRANSIENT` | Per injection point | Stateful helper that must not share state |

> **Scope bubble:** a singleton that injects a REQUEST-scoped provider becomes request-scoped too. Audit the full chain before applying REQUEST scope.

## Custom tokens (use for all interface-based injection)

```ts
// tokens.ts
export const PAYMENT_GATEWAY = Symbol('PAYMENT_GATEWAY');
export const MAIL_PORT       = Symbol('MAIL_PORT');

// service
constructor(@Inject(PAYMENT_GATEWAY) private readonly gw: IPaymentGateway) {}
```

## Dynamic modules — `forRoot` / `forRootAsync`

```ts
@Module({})
export class MailModule {
  static forRootAsync(opts: { useFactory: (...a: any[]) => MailOptions; inject?: any[] }): DynamicModule {
    return {
      module: MailModule,
      global: true,
      providers: [{ provide: MAIL_OPTIONS, useFactory: opts.useFactory, inject: opts.inject ?? [] }, MailService],
      exports: [MailService],
    };
  }
}
// AppModule:
MailModule.forRootAsync({ useFactory: (c: ConfigService) => ({ from: c.getOrThrow('MAIL_FROM') }), inject: [ConfigService] })
```

## Testing — swap providers with mocks

```ts
const module = await Test.createTestingModule({
  providers: [
    FeatureService,
    { provide: USER_REPOSITORY, useValue: { findById: jest.fn() } },
    { provide: ConfigService,   useValue: { get: jest.fn().mockReturnValue('test') } },
  ],
}).compile();
```

## Anti-patterns

| Anti-pattern | Fix |
|---|---|
| Property injection `@Inject() private svc: Svc` | Constructor injection only |
| `new SomeService()` inside a class | Inject via constructor |
| Missing `inject` array in `useFactory` | List every dependency the factory function uses |
| `@Global()` on feature-specific services | Global only for infrastructure (Config, DB, Logger, Events) |
| `forwardRef()` without documentation | Extract shared dep to a third service to eliminate the cycle |
| `REQUEST` scope on shared services | Use only on leaf providers; document the scope bubble impact |
