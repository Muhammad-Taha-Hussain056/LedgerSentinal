---
name: observer-pattern
description: Rules for domain events, EventEmitter2 setup, typed event classes, publisher/subscriber wiring, and the transactional outbox decision. Load when adding any side effect that should be decoupled from the main operation (email, audit log, cache invalidation, analytics).
---

# Observer pattern

`EventEmitter2` + `@OnEvent` is the standard in-process observer. The publisher emits after successful persistence; observers react asynchronously without affecting the publisher's return value.

## Setup

```ts
// app.module.ts
EventEmitterModule.forRoot({ wildcard: true, delimiter: '.', maxListeners: 20, ignoreErrors: false })
```

`ignoreErrors: false` — listener exceptions propagate; you must catch inside each listener.

## Typed event classes and name constants

```ts
// events/user.events.ts  — one file per aggregate
export const USER_EVENTS = {
  CREATED:           'user.created',
  PASSWORD_CHANGED:  'user.password_changed',
  DEACTIVATED:       'user.deactivated',
} as const;

export class UserCreatedEvent {
  constructor(
    public readonly userId:   string,
    public readonly email:    string,
    public readonly tenantId: string | null,
    public readonly occurredAt = new Date(),
  ) {}
}
```

## Publisher — emit AFTER persistence succeeds

```ts
// users.service.ts
async createUser(dto: CreateUserDto): Promise<User> {
  const user = await this.userRepo.create(dto);          // ← persist first
  this.eventEmitter.emit(                                // ← then emit
    USER_EVENTS.CREATED,
    new UserCreatedEvent(user.id, user.email, user.tenantId),
  );
  return user;                                           // return value unaffected by listeners
}
```

## Subscribers — always catch inside listeners

```ts
// handlers/welcome-email.handler.ts
@Injectable()
export class WelcomeEmailHandler {
  constructor(private readonly mail: MailService) {}

  @OnEvent(USER_EVENTS.CREATED)
  async handle(event: UserCreatedEvent): Promise<void> {
    try {
      await this.mail.sendWelcome(event.email, event.userId);
    } catch (err) {
      // log + swallow — never let a listener crash the publisher
      Logger.error(`WelcomeEmail failed: ${err.message}`, err.stack, WelcomeEmailHandler.name);
    }
  }
}
```

**Register every handler in its module's `providers[]`** — `@OnEvent` is silent if the class is not instantiated.

## Wildcard subscriptions

```ts
@OnEvent('user.*')          // user.created, user.updated, user.deactivated
@OnEvent('*.created')       // user.created, order.created, payment.created
```

## Async vs sync emit

```ts
// Sync (default): emitter waits for all listener promises
this.eventEmitter.emit(USER_EVENTS.CREATED, event);

// Async fire-and-forget: emitter does not wait
this.eventEmitter.emitAsync(USER_EVENTS.CREATED, event);   // returns Promise<any[]>

// Per-listener async flag
@OnEvent(USER_EVENTS.CREATED, { async: true })   // this handler runs async; others are unaffected
```

## When to use the Transactional Outbox instead

`EventEmitter2` is in-process and ephemeral. If the process crashes between `repo.create()` and the emit, the event is lost.

| Use `EventEmitter2` | Use Transactional Outbox |
|---|---|
| Non-critical: analytics, cache warm-up | Critical: billing, inventory, compliance |
| Event loss on crash is acceptable | Exactly-once delivery required |
| Monolith only | Cross-service or external system receiver |

## Anti-patterns

| Anti-pattern | Fix |
|---|---|
| `emit()` before `await repo.create()` | Always emit after successful persistence |
| Listener throws without catch | Wrap every listener body in `try/catch` |
| Returning a value from a listener | Listeners return `void`; publisher ignores returns |
| Circular event (listener emits an event that re-triggers itself) | Guard: check if state already matches target |
| String event names scattered inline | Central `*_EVENTS` constant object, one per aggregate |
| Handler not in `providers[]` | Register every `@OnEvent` class in its module |
| EventEmitter for cross-service communication | Use RabbitMQ/Redis for cross-process events |
