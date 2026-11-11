---
name: singleton-pattern
description: Rules for provider scope, global modules, connection pools, and config services. Load when deciding provider lifetime or registering a shared infrastructure service. All NestJS providers are singletons by default — this skill covers when to deviate and when NOT to.
---

# Singleton pattern

Every NestJS provider is singleton-scoped by default within its module. When a module is imported by multiple modules, the same instance is shared. This is the correct default for stateless services, repositories, connection pools, and config.

## Scope decision guide

```
Is the service stateless (no mutable per-request instance vars)?
  YES → Singleton (default) ✓
  NO  → Does the state need isolation per HTTP request?
          YES → Scope.REQUEST  ⚠ audit scope bubble
          NO  → Does each injection point need a fresh instance?
                  YES → Scope.TRANSIENT
                  NO  → Singleton ✓
```

## `@Global()` — use only for infrastructure

```ts
@Global()   // ← only for: Config, DB connection, Logger, EventEmitter, CacheManager
@Module({
  providers: [{ provide: DRIZZLE_TOKEN, useFactory: ..., inject: [ConfigService] }],
  exports:   [DRIZZLE_TOKEN],
})
export class DatabaseModule {}
```

Do **not** use `@Global()` for feature-specific services — they pollute the global namespace and hide module dependencies.

## Singleton services with shared state (correct use)

```ts
// In-process cache — intentionally shared across all requests
@Injectable()
export class AppCacheService implements OnModuleInit, OnModuleDestroy {
  private readonly store = new Map<string, { v: any; exp: number }>();
  private interval: NodeJS.Timer;

  onModuleInit()    { this.interval = setInterval(() => this.evict(), 5 * 60_000); }
  onModuleDestroy() { clearInterval(this.interval); this.store.clear(); }

  set(k: string, v: any, ttlMs: number) { this.store.set(k, { v, exp: Date.now() + ttlMs }); }
  get<T>(k: string): T | null {
    const e = this.store.get(k);
    if (!e || Date.now() > e.exp) { this.store.delete(k); return null; }
    return e.v as T;
  }
}
```

## Config service — validate at startup

```ts
@Injectable()
export class AppConfigService {
  readonly databaseUrl: string;
  readonly jwtSecret:   string;
  readonly isProduction: boolean;

  constructor(private readonly config: ConfigService) {
    this.databaseUrl  = config.getOrThrow('DATABASE_URL');   // fail fast
    this.jwtSecret    = config.getOrThrow('JWT_SECRET');
    this.isProduction = config.get('NODE_ENV') === 'production';
  }
}
// Benefit: getOrThrow at construction time = crash at startup, not at runtime
```

## Lifecycle hooks — init/destroy run once per singleton

```ts
@Injectable()
export class QueueConnectionService implements OnModuleInit, OnModuleDestroy {
  private connection: QueueConnection;
  async onModuleInit()    { this.connection = await connectQueue(); }
  async onModuleDestroy() { await this.connection.close(); }
}
```

## When NOT to use singleton scope

| Situation | Use instead |
|---|---|
| Storing the current user/tenant/request trace | `Scope.REQUEST` — but audit the scope bubble |
| Logger with per-operation context string | `Scope.TRANSIENT` |
| Stateful wizard or multi-step process state | Session or database, not a singleton service |
| Mutable instance variable that differs per request | Refactor to pass context as method parameters |

## Testing singletons — reset between tests

```ts
beforeEach(async () => {
  // Re-creates the singleton — each test gets a fresh instance
  const mod = await Test.createTestingModule({ providers: [AppCacheService] }).compile();
  service = mod.get(AppCacheService);
});
afterEach(async () => { await mod.close(); }); // triggers OnModuleDestroy
```

## Anti-patterns

| Anti-pattern | Fix |
|---|---|
| Per-request mutable state in a singleton | `Scope.REQUEST` or pass context as method param |
| `@Global()` for a feature service | Global only for infrastructure |
| Heavy async init in constructor | Use `onModuleInit()` |
| Assuming clean singleton state between tests | Reset module in `beforeEach` |
| Connection pool created per request | Create once in singleton factory; share the pool |
