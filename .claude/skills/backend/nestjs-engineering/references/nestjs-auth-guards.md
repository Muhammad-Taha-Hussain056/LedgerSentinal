---
name: nestjs-auth-guards
description: Rules for JWT authentication, AuthN guard, AuthZ guard, RBAC, current-user decorator, and public route bypass. Load for any route that requires authentication or permission checks.
---

# Auth guards

AuthN (who are you) → AuthZ (what can you do). These are always two separate guards in the correct order.

## ActorContext — the verified identity on every request

```ts
// src/interfaces/actor-context.interface.ts (or apps/gateway/src/app/interfaces/)
export interface ActorContext {
  userId:      string;
  tenantId:    string | null;
  email:       string;
  role:        UserRole;
  permissions: string[];   // e.g. ['orders:read', 'orders:write', 'users:admin']
}

// Extended Express Request type
// src/interfaces/request-context.interface.ts
export interface RequestWithActor extends Request {
  user: ActorContext;
}
```

## JWT Strategy — validates the token, produces ActorContext

```ts
// src/modules/auth/strategies/jwt.strategy.ts
@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(config: ConfigService) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      secretOrKey:    config.getOrThrow('JWT_SECRET'),
      ignoreExpiration: false,
    });
  }

  async validate(payload: JwtPayload): Promise<ActorContext> {
    // Payload has been verified by passport-jwt — trust it
    return {
      userId:      payload.sub,
      tenantId:    payload.tenantId ?? null,
      email:       payload.email,
      role:        payload.role,
      permissions: payload.permissions ?? [],
    };
  }
}
```

## AuthN Guard — applied globally

```ts
// src/guards/authN.guard.ts (or apps/gateway/src/app/guards/authN.guard.ts)
export const IS_PUBLIC_KEY = 'isPublic';
export const Public = () => SetMetadata(IS_PUBLIC_KEY, true);
export const AUTH_N_KEY = 'authenticatedOnly';
export const AuthN = () => SetMetadata(AUTH_N_KEY, true);

@Injectable()
export class AuthNGuard extends AuthGuard('jwt') {
  constructor(private readonly reflector: Reflector) { super(); }

  canActivate(ctx: ExecutionContext): boolean | Promise<boolean> | Observable<boolean> {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      ctx.getHandler(), ctx.getClass(),
    ]);
    if (isPublic) return true;
    return super.canActivate(ctx);   // passport-jwt validates the token + calls validate()
  }
}

// AppModule / GatewayModule providers — AuthN first in the order
{ provide: APP_GUARD, useClass: AuthNGuard }
```

## AuthZ Guard — permissions check after AuthN

```ts
// src/guards/authZ.guard.ts (or apps/gateway/src/app/guards/authZ.guard.ts)
export const PERMISSIONS_KEY = 'permissions';
export const Permissions = (...perms: string[]) => SetMetadata(PERMISSIONS_KEY, perms);
export const AuthZ = (...perms: string[]) => SetMetadata(PERMISSIONS_KEY, perms);

@Injectable()
export class AuthZGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(ctx: ExecutionContext): boolean {
    const required = this.reflector.getAllAndOverride<string[]>(PERMISSIONS_KEY, [
      ctx.getHandler(), ctx.getClass(),
    ]);
    if (!required?.length) return true;   // no permissions declared — any authenticated user passes
    const actor = ctx.switchToHttp().getRequest<RequestWithActor>().user;
    return required.every((p) => actor.permissions.includes(p));
  }
}

// AppModule / GatewayModule providers — AuthZ after AuthN
{ provide: APP_GUARD, useClass: AuthZGuard }
```

## `@CurrentUser()` parameter decorator

```ts
// src/decorators/current-user.decorator.ts
export const CurrentUser = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): ActorContext =>
    ctx.switchToHttp().getRequest<RequestWithActor>().user,
);
```

## Composite route decorator — reduces boilerplate

```ts
// src/decorators/api-route.decorator.ts
export const ApiRoute = (opts: {
  summary:      string;
  permissions?: string[];
  isPublic?:    boolean;
}): MethodDecorator & ClassDecorator =>
  applyDecorators(
    ApiOperation({ summary: opts.summary }),
    ...(opts.isPublic ? [Public()] : [AuthN()]),
    ...(opts.permissions ? [Permissions(...opts.permissions)] : []),
    ApiBearerAuth(),
    ApiUnauthorizedResponse({ description: 'Token missing or invalid' }),
    ApiForbiddenResponse({ description: 'Insufficient permissions' }),
  );
```

## Controller usage

```ts
@Controller('orders')
@ApiTags('Orders')
export class OrdersController {
  constructor(private readonly svc: OrdersService) {}

  @Post()
  @ApiRoute({ summary: 'Create an order', permissions: ['orders:write'] })
  async create(@Body() dto: CreateOrderDto, @CurrentUser() actor: ActorContext) {
    return OrderResponseDto.from(await this.svc.create(dto, actor));
  }

  @Get(':id')
  @ApiRoute({ summary: 'Get order by ID', permissions: ['orders:read'] })
  async findOne(@Param('id', ParseUuidPipe) id: string, @CurrentUser() actor: ActorContext) {
    return OrderResponseDto.from(await this.svc.findOne(id, actor));
  }

  @Get('health')
  @ApiRoute({ summary: 'Health check', isPublic: true })
  health() { return { status: 'ok' }; }
}
```

## Token refresh flow

```ts
// auth/auth.controller.ts — refresh endpoint is public
@Post('refresh')
@Public()
async refresh(@Body() dto: RefreshTokenDto): Promise<TokenResponseDto> {
  return this.authService.refresh(dto.refreshToken);
}
// AuthService verifies the refresh token from the DB, issues a new access token
// Never trust refresh token from a cookie without verifying it against the DB
```

## Service receives ActorContext — never re-derives identity

```ts
// CORRECT
async getOrder(id: string, actor: ActorContext): Promise<Order> {
  const order = await this.repo.findById(id);
  if (!order) throw new NotFoundException(`Order ${id} not found`);
  if (order.tenantId !== actor.tenantId) throw new ForbiddenException();
  return order;
}

// WRONG — deriving identity inside the service
async getOrder(id: string, req: Request): Promise<Order> { ... } // never inject Request
```

## Anti-patterns

| Anti-pattern | Fix |
|---|---|
| Auth check inside service (`if req.user.role...`) | Guard owns auth; service receives verified ActorContext |
| Tenant check missing on multi-tenant query | Always compare `resource.tenantId === actor.tenantId` |
| `@UseGuards()` on one route but not globally | Apply `AuthNGuard` + `PermissionsGuard` globally; use `@Public()` to opt out |
| Deriving `userId` from request body | `actor.userId` from `@CurrentUser()` only — never trust body |
| Refresh token not verified against DB | Refresh tokens must be validated against a stored hash |
| `JwtStrategy.validate()` making DB calls for every request | Return decoded payload only; guard holds actor context |
