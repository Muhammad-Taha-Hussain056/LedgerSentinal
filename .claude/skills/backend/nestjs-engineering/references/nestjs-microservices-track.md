---
name: nestjs-microservices-track
description: Rules for NestJS microservices using RabbitMQ, TCP, or Redis transports. Load only when toggles.microservices is true. Covers service setup, message patterns, client proxy, and cross-service contract rules.
---

# Microservices track

Only engage this track when `orchestra.config.json` has `toggles.microservices: true`.

Microservices in NestJS use a transport layer (RabbitMQ recommended, TCP for internal, Redis for pub/sub). Each service has its own database — never a shared database across services.

## Service types

| Type | Description |
|---|---|
| **Gateway** (BFF) | HTTP-facing; routes requests to downstream microservices. Holds no domain logic. |
| **Domain service** | Owns one domain (users, orders, payments). Exposes message patterns, not HTTP. |
| **Worker** | Consumes jobs from a queue (email, PDF, image processing). No direct API. |

## RabbitMQ transport setup

```ts
// main.ts — microservice (domain service)
const app = await NestFactory.createMicroservice<MicroserviceOptions>(AppModule, {
  transport: Transport.RMQ,
  options: {
    urls:             [config.getOrThrow('RABBITMQ_URL')],
    queue:            config.getOrThrow('RABBITMQ_QUEUE'),    // e.g. 'users_queue'
    queueOptions:     { durable: true },
    noAck:            false,           // manual ack — never lose a message
    prefetchCount:    10,
  },
});
await app.listen();
```

## Message patterns — request/response

```ts
// Users microservice — handler
@Controller()
export class UsersController {
  constructor(private readonly svc: UsersService) {}

  @MessagePattern(USER_PATTERNS.FIND_BY_ID)
  async findById(@Payload() data: { id: string; tenantId: string }): Promise<UserResponseDto | null> {
    return this.svc.findOne(data.id, buildActorFromMessage(data));
  }

  @MessagePattern(USER_PATTERNS.CREATE)
  async create(@Payload() data: CreateUserMessageDto): Promise<UserResponseDto> {
    return UserResponseDto.from(await this.svc.create(data));
  }
}

// Shared patterns constants — in @scope/contracts package
export const USER_PATTERNS = {
  FIND_BY_ID: { cmd: 'users.find_by_id' },
  CREATE:     { cmd: 'users.create' },
  LIST:       { cmd: 'users.list' },
} as const;
```

## Event patterns — fire and forget

```ts
// Domain service emits event
@EventPattern(ORDER_EVENTS.CREATED)
async handleOrderCreated(@Payload() event: OrderCreatedEvent): Promise<void> {
  try {
    await this.notificationService.sendOrderConfirmation(event.orderId, event.userEmail);
  } catch (err) {
    this.logger.error(`handleOrderCreated failed: ${err.message}`);
    // Do NOT rethrow — the message will be nacked and requeued
  }
}
```

## Gateway — ClientProxy injection

```ts
// Gateway (BFF) — calls Users microservice
@Module({
  imports: [
    ClientsModule.registerAsync([{
      name: USERS_SERVICE,
      useFactory: (config: ConfigService) => ({
        transport: Transport.RMQ,
        options: { urls: [config.getOrThrow('RABBITMQ_URL')], queue: 'users_queue', queueOptions: { durable: true } },
      }),
      inject: [ConfigService],
    }]),
  ],
})
export class GatewayUsersModule {}

// Gateway service
@Injectable()
export class GatewayUsersService {
  constructor(@Inject(USERS_SERVICE) private readonly client: ClientProxy) {}

  async findById(id: string, tenantId: string): Promise<UserResponseDto> {
    return firstValueFrom(
      this.client.send<UserResponseDto>(USER_PATTERNS.FIND_BY_ID, { id, tenantId }).pipe(
        timeout(5000),
        catchError((err) => { throw new ExternalServiceException('UsersService', err.message); }),
      ),
    );
  }
}
```

## Cross-service contract rules

| Rule | Why |
|---|---|
| All message DTOs live in `@scope/contracts` package | Single source of truth across services |
| No shared database between services | Loose coupling — each service owns its data |
| `ClientProxy.send()` wrapped in `firstValueFrom` + `timeout` | Prevents gateway hanging on microservice timeout |
| `noAck: false` on all RMQ consumers | Manual ack prevents message loss on crash |
| Pattern constants centralized in contracts | Prevents typo-driven silent routing failures |
| No business logic in the gateway | Gateway routes and transforms only |

## Service-to-service identity propagation

```ts
// Pass actor context in every message payload — microservice cannot read HTTP headers
{
  id:       'usr-123',
  tenantId: 'tenant-abc',
  actorId:  'usr-admin',        // who initiated the request
  traceId:  'req-xyz',          // correlation ID from the gateway
}
```

## Anti-patterns

| Anti-pattern | Fix |
|---|---|
| Shared database across microservices | Each service owns its tables; use message patterns for cross-service reads |
| `noAck: true` | Messages lost on crash — always `noAck: false` with manual ack |
| Business logic in gateway | Gateway calls microservice, returns result — no domain logic |
| Direct TCP calls between domain services | Domain services communicate via RMQ events/patterns, not TCP |
| Pattern string literals scattered across repos | Centralize in `@scope/contracts` |
| Missing timeout on `ClientProxy.send()` | Gateway hangs forever if the microservice is down |
| Microservice returning HTTP status codes | Return typed message response; gateway maps to HTTP |
