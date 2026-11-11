---
name: cqrs-pattern
description: Full @nestjs/cqrs rules — commands, queries, events, sagas, bus injection, and module wiring. Load when toggles.cqrs is true or the task requires explicit read/write separation, event sourcing, or multi-step saga workflows.
---

# CQRS pattern

`@nestjs/cqrs` provides `CommandBus`, `QueryBus`, `EventBus`, and `@Saga`. Commands mutate state and have no return value (or return the new ID only). Queries return projections and have zero side effects. Events signal that something happened.

## Module setup

```ts
// feature.module.ts — CqrsModule must be imported
import { CqrsModule } from '@nestjs/cqrs';

@Module({
  imports: [CqrsModule],
  providers: [
    FeatureService,
    CreateOrderHandler,    // ICommandHandler
    GetOrderHandler,       // IQueryHandler
    ListOrdersHandler,     // IQueryHandler
    OrderCreatedHandler,   // IEventHandler
    OrderSaga,             // @Saga
    { provide: ORDER_REPOSITORY, useClass: OrderDrizzleRepository },
  ],
})
export class OrdersModule {}
```

## Commands — intent + mutation

```ts
// commands/create-order.command.ts
export class CreateOrderCommand {
  constructor(
    public readonly actorId:  string,
    public readonly tenantId: string,
    public readonly items:    OrderItemInput[],
  ) {}
}

// commands/handlers/create-order.handler.ts
@CommandHandler(CreateOrderCommand)
export class CreateOrderHandler implements ICommandHandler<CreateOrderCommand> {
  constructor(
    @Inject(ORDER_REPOSITORY) private readonly repo: IOrderRepository,
    private readonly eventBus: EventBus,
  ) {}

  async execute(cmd: CreateOrderCommand): Promise<string> {   // returns new ID only
    const order = await this.repo.create({ actorId: cmd.actorId, tenantId: cmd.tenantId, items: cmd.items });
    this.eventBus.publish(new OrderCreatedEvent(order.id, cmd.tenantId, order.total));
    return order.id;
  }
}
```

## Queries — projection, zero side effects

```ts
// queries/get-order.query.ts
export class GetOrderQuery {
  constructor(public readonly orderId: string, public readonly tenantId: string) {}
}

// queries/handlers/get-order.handler.ts
@QueryHandler(GetOrderQuery)
export class GetOrderHandler implements IQueryHandler<GetOrderQuery, OrderDto> {
  constructor(@Inject(ORDER_REPOSITORY) private readonly repo: IOrderRepository) {}

  async execute(q: GetOrderQuery): Promise<OrderDto> {
    const order = await this.repo.findByIdForTenant(q.orderId, q.tenantId);
    if (!order) throw new NotFoundException(`Order ${q.orderId} not found`);
    return mapToOrderDto(order);   // query returns a projection DTO, never an ORM entity
  }
}
```

## Events — domain signals

```ts
export class OrderCreatedEvent {
  constructor(
    public readonly orderId:  string,
    public readonly tenantId: string,
    public readonly total:    number,
    public readonly occurredAt = new Date(),
  ) {}
}

@EventsHandler(OrderCreatedEvent)
export class OrderCreatedHandler implements IEventHandler<OrderCreatedEvent> {
  constructor(private readonly mail: MailService) {}

  async handle(event: OrderCreatedEvent): Promise<void> {
    try {
      await this.mail.sendOrderConfirmation(event.orderId);
    } catch (err) {
      Logger.error(`OrderCreatedHandler failed: ${err.message}`);  // never throw from event handler
    }
  }
}
```

## Sagas — long-running workflows via Observables

```ts
@Injectable()
export class OrderSaga {
  @Saga()
  orderCreated = (events$: Observable<any>): Observable<ICommand> =>
    events$.pipe(
      ofType(OrderCreatedEvent),
      map((e) => new SendOrderConfirmationEmailCommand(e.orderId)),  // dispatch a new command
      // Never call repos directly from a saga — dispatch commands instead
    );
}
```

## Controller → CommandBus / QueryBus

```ts
@Injectable()
export class OrdersController {
  constructor(private readonly cmd: CommandBus, private readonly qry: QueryBus) {}

  @Post()
  async create(@Body() dto: CreateOrderDto, @CurrentUser() actor: ActorContext): Promise<{ id: string }> {
    const id = await this.cmd.execute(new CreateOrderCommand(actor.userId, actor.tenantId, dto.items));
    return { id };
  }

  @Get(':id')
  async get(@Param('id') id: string, @CurrentUser() actor: ActorContext): Promise<OrderDto> {
    return this.qry.execute(new GetOrderQuery(id, actor.tenantId));
  }
}
```

## CQRS decision guide

| Use CQRS | Skip CQRS |
|---|---|
| Complex domain with meaningful read/write differences | Simple CRUD with identical read/write shapes |
| Multiple event handlers per write operation | Single service method is clearer |
| Audit trail or event sourcing requirements | No event replay needed |
| Eventual consistency across modules | Immediate consistency is fine |

## Anti-patterns

| Anti-pattern | Fix |
|---|---|
| Command handler returning a full entity/DTO | Return `void` or the new entity ID only |
| Query handler calling `repo.create/update/delete` | Queries are read-only — zero mutations |
| `CommandBus` injected directly in a service | Services dispatch commands; controllers dispatch commands. Services that orchestrate should use the bus or be replaced by a command |
| Event handler throwing without catch | All event handlers wrap body in `try/catch` |
| Saga calling a repository directly | Sagas dispatch commands; commands have handlers that call repos |
| Handler missing from `providers[]` | Register every `@CommandHandler`, `@QueryHandler`, `@EventsHandler`, `@Injectable() Saga` |
| `CqrsModule` not imported | All handlers are silently unregistered |
