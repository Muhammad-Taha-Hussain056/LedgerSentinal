---
name: factory-pattern
description: Rules for useFactory providers, dynamic modules (forRoot/forRootAsync), and abstract factories that create families of related services. Load when a service must be constructed conditionally, asynchronously, or from runtime configuration.
---

# Factory pattern

Three vehicles in NestJS: `useFactory` provider (most common), `DynamicModule` (for reusable libraries), and Abstract Factory (for related service families like payment processor + webhook verifier).

## `useFactory` — conditional and async construction

```ts
// Async init — database connection
{
  provide: DRIZZLE_TOKEN,
  useFactory: async (config: ConfigService) => {
    const pool = new Pool({ connectionString: config.getOrThrow('DATABASE_URL'), max: 20 });
    const client = await pool.connect();
    await client.query('SELECT 1');        // fail fast at startup
    client.release();
    return drizzle(pool);
  },
  inject: [ConfigService],
}

// Conditional selection — pick implementation at startup
{
  provide: STORAGE_SERVICE,
  useFactory: (config: ConfigService): IStorageService => {
    switch (config.get('STORAGE_DRIVER', 'local')) {
      case 's3':    return new S3StorageAdapter(config);
      case 'gcs':   return new GcsStorageAdapter(config);
      default:      return new LocalStorageAdapter(config);
    }
  },
  inject: [ConfigService],
}

// Feature-flagged — return no-op when disabled
{
  provide: ANALYTICS_SERVICE,
  useFactory: (config: ConfigService): IAnalyticsService =>
    config.get('ANALYTICS_ENABLED') === 'true'
      ? new MixpanelService(config.getOrThrow('MIXPANEL_TOKEN'))
      : new NoOpAnalyticsService(),      // never throw at startup for optional services
  inject: [ConfigService],
}
```

## Dynamic module — `forRoot` / `forRootAsync`

```ts
// Reusable library module pattern
@Module({})
export class NotificationsModule {
  static forRoot(opts: NotificationOptions): DynamicModule {
    return {
      module: NotificationsModule, global: true,
      providers: [{ provide: NOTIFICATION_OPTIONS, useValue: opts }, NotificationService],
      exports: [NotificationService],
    };
  }
  static forRootAsync(opts: { useFactory: (...a: any[]) => NotificationOptions; inject?: any[]; imports?: any[] }): DynamicModule {
    return {
      module: NotificationsModule, global: true,
      imports: opts.imports ?? [],
      providers: [{ provide: NOTIFICATION_OPTIONS, useFactory: opts.useFactory, inject: opts.inject ?? [] }, NotificationService],
      exports: [NotificationService],
    };
  }
}
```

## Abstract factory — matched service families

```ts
// Port: factory creates a consistent family — gateway + webhook verifier always match
export interface IPaymentFactory {
  createGateway(): IPaymentGateway;
  createWebhookVerifier(): IWebhookVerifier;
}

export const PAYMENT_FACTORY = Symbol('PAYMENT_FACTORY');

// Module wiring — swap the factory without touching PaymentService
{
  provide: PAYMENT_FACTORY,
  useFactory: (config: ConfigService): IPaymentFactory => {
    switch (config.getOrThrow('PAYMENT_PROVIDER')) {
      case 'stripe': return new StripePaymentFactory(config);
      case 'paypal': return new PayPalPaymentFactory(config);
      default: throw new Error(`Unknown payment provider`);
    }
  },
  inject: [ConfigService],
}

// Consumer
constructor(@Inject(PAYMENT_FACTORY) factory: IPaymentFactory) {
  this.gateway  = factory.createGateway();
  this.verifier = factory.createWebhookVerifier();
}
```

## Testing — replace factory with mock value

```ts
{ provide: PAYMENT_FACTORY, useValue: {
    createGateway:        () => ({ charge: jest.fn(), refund: jest.fn() }),
    createWebhookVerifier: () => ({ verify: jest.fn().mockReturnValue(true) }),
  } as IPaymentFactory,
}
```

## Anti-patterns

| Anti-pattern | Fix |
|---|---|
| Sync factory for async initialization | Use `async useFactory` for any I/O at construction |
| Missing `inject` array | All factory function parameters must be listed in `inject` |
| Factory throwing for optional/disabled service | Return a no-op implementation instead |
| Abstract factory creating unrelated objects | Each factory creates one cohesive family |
| `new ConcreteService()` inside another service | Use factory via DI container instead |
