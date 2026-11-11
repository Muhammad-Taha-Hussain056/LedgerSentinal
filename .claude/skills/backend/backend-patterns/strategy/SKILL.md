---
name: strategy-pattern
description: Rules for interchangeable algorithms selected at runtime — payment methods, notification channels, auth strategies, export formats. Load when multiple implementations of the same behavior exist and selection happens based on configuration or user input.
---

# Strategy pattern

Define a family of algorithms behind a common interface; register them in a map; resolve the correct one at runtime without `if/else` chains. Combines with the Factory pattern for multi-provider features.

## Interface + registration map

```ts
// domain/interfaces/notification.strategy.ts
export interface INotificationStrategy {
  send(to: string, message: string, meta?: Record<string, any>): Promise<void>;
  readonly channel: string;   // 'email' | 'sms' | 'push'
}

export const NOTIFICATION_STRATEGY_MAP = Symbol('NOTIFICATION_STRATEGY_MAP');
```

## Concrete strategies

```ts
@Injectable() export class EmailNotificationStrategy implements INotificationStrategy {
  readonly channel = 'email';
  constructor(@Inject(MAIL_PORT) private readonly mail: IMailPort) {}
  async send(to: string, message: string) { await this.mail.send({ to: [to], subject: 'Notification', text: message }); }
}

@Injectable() export class SmsNotificationStrategy implements INotificationStrategy {
  readonly channel = 'sms';
  constructor(@Inject(SMS_PORT) private readonly sms: ISmsPort) {}
  async send(to: string, message: string) { await this.sms.send(to, message); }
}
```

## Module wiring — build the registry map

```ts
// notifications.module.ts
{
  provide: NOTIFICATION_STRATEGY_MAP,
  useFactory: (email: EmailNotificationStrategy, sms: SmsNotificationStrategy): Map<string, INotificationStrategy> =>
    new Map([
      [email.channel, email],
      [sms.channel,   sms],
    ]),
  inject: [EmailNotificationStrategy, SmsNotificationStrategy],
}
```

## Service — resolve at runtime, no if/else

```ts
@Injectable()
export class NotificationService {
  constructor(
    @Inject(NOTIFICATION_STRATEGY_MAP)
    private readonly strategies: Map<string, INotificationStrategy>,
  ) {}

  async notify(channel: string, to: string, message: string): Promise<void> {
    const strategy = this.strategies.get(channel);
    if (!strategy) throw new BadRequestException(`Unknown notification channel: ${channel}`);
    await strategy.send(to, message);
  }
}
```

## Adding a new strategy — Open/Closed principle

1. Create `PushNotificationStrategy implements INotificationStrategy`
2. Add to the `useFactory` map — **zero changes** to `NotificationService`

## Payment strategy example (common pattern)

```ts
export interface IPaymentStrategy {
  readonly provider: string;  // 'stripe' | 'paypal' | 'bank_transfer'
  charge(amount: number, currency: string, source: string): Promise<ChargeResult>;
}

// Registry: Map<string, IPaymentStrategy> — resolved by order.paymentMethod
```

## Testing

```ts
const mockStrategies = new Map<string, INotificationStrategy>([
  ['email', { channel: 'email', send: jest.fn().mockResolvedValue(undefined) }],
]);
{ provide: NOTIFICATION_STRATEGY_MAP, useValue: mockStrategies }
```

## Anti-patterns

| Anti-pattern | Fix |
|---|---|
| `if (channel === 'email') ... else if (channel === 'sms')` in service | Build a registry map; resolve by key |
| Strategy map built with string keys scattered across files | Central `channel` / `provider` property on each strategy |
| Strategy with business logic unrelated to the algorithm | Strategy does one thing; business logic stays in the service |
| New strategy requires modifying the service | Register in module wiring only — service is closed to modification |
| Hardcoded channel in the service | Channel comes from input or config — never hardcoded |
