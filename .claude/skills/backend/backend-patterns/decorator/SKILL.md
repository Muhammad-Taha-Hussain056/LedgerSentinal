---
name: decorator-pattern
description: Rules for custom NestJS metadata decorators, method/class decorators, and cross-cutting concerns. Load when creating custom @decorators for route metadata, current user extraction, permissions, caching, or Swagger enrichment.
---

# Decorator pattern

NestJS decorators attach metadata to classes and methods via `@SetMetadata` + `Reflector`. Guards, interceptors, and pipes read this metadata to apply cross-cutting behavior without modifying the decorated class.

## Metadata decorator + guard pair (most common pattern)

```ts
// 1. Define the metadata key and decorator
export const PERMISSIONS_KEY = 'permissions';
export const Permissions = (...permissions: string[]) => SetMetadata(PERMISSIONS_KEY, permissions);

// 2. Guard reads the metadata
@Injectable()
export class PermissionsGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(ctx: ExecutionContext): boolean {
    const required = this.reflector.getAllAndOverride<string[]>(PERMISSIONS_KEY, [
      ctx.getHandler(),   // method-level metadata takes priority
      ctx.getClass(),     // then class-level
    ]);
    if (!required?.length) return true;   // no permissions required — public route
    const { user } = ctx.switchToHttp().getRequest<{ user: ActorContext }>();
    return required.every((p) => user.permissions.includes(p));
  }
}

// 3. Usage on controller
@Get(':id')
@Permissions('orders:read')           // ← declarative, no if/else in the controller
async getOrder(@Param('id') id: string) { ... }
```

## Current user decorator (parameter decorator)

```ts
// @CurrentUser() extracts the validated actor context injected by AuthN guard
export const CurrentUser = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): ActorContext =>
    ctx.switchToHttp().getRequest<{ user: ActorContext }>().user,
);

// Usage
@Get('me')
getMe(@CurrentUser() actor: ActorContext) { return this.usersService.getProfile(actor.userId); }
```

## Composite route decorator — single decorator for Swagger + Auth + Permissions

```ts
// Reduce boilerplate: @ApiRoute(options) replaces 4 decorators per endpoint
export const ApiRoute = (opts: { summary: string; permissions?: string[]; public?: boolean }) =>
  applyDecorators(
    ApiOperation({ summary: opts.summary }),
    opts.public ? SetMetadata(IS_PUBLIC_KEY, true) : UseGuards(AuthNGuard, PermissionsGuard),
    ...(opts.permissions ? [Permissions(...opts.permissions)] : []),
    ApiUnauthorizedResponse({ description: 'Unauthenticated' }),
    ApiForbiddenResponse({ description: 'Insufficient permissions' }),
  );

// Usage
@Post()
@ApiRoute({ summary: 'Create order', permissions: ['orders:write'] })
async create(@Body() dto: CreateOrderDto) { ... }
```

## Caching decorator (method decorator)

```ts
export const Cacheable = (ttlMs: number): MethodDecorator =>
  (target, propertyKey, descriptor: PropertyDescriptor) => {
    const original = descriptor.value;
    descriptor.value = async function (...args: any[]) {
      const key = `${String(propertyKey)}:${JSON.stringify(args)}`;
      const cached = this.cacheService?.get(key);
      if (cached !== null && cached !== undefined) return cached;
      const result = await original.apply(this, args);
      this.cacheService?.set(key, result, ttlMs);
      return result;
    };
    return descriptor;
  };
```

> Note: method decorator approach requires `this.cacheService` to be available. Prefer interceptor-based caching (`CacheInterceptor`) for most cases — it composes cleanly with NestJS's DI.

## Custom Swagger decorators

```ts
// DRY: group multiple @ApiResponse decorators for a standard CRUD endpoint
export const ApiCrudResponses = () =>
  applyDecorators(
    ApiOkResponse({ description: 'Success' }),
    ApiBadRequestResponse({ description: 'Validation error' }),
    ApiUnauthorizedResponse({ description: 'Not authenticated' }),
    ApiForbiddenResponse({ description: 'Not authorized' }),
    ApiNotFoundResponse({ description: 'Resource not found' }),
  );
```

## Decorator taxonomy

| Type | NestJS vehicle | Common uses |
|---|---|---|
| Class decorator | `@Injectable`, `@Controller`, custom via `ClassDecorator` | Tagging classes for DI or metadata |
| Method decorator | `@Get`, `@Post`, custom `MethodDecorator` | Route definition, caching, logging |
| Parameter decorator | `createParamDecorator` | `@CurrentUser`, `@TenantId`, `@Body` |
| Composite decorator | `applyDecorators(...)` | `@ApiRoute`, `@PublicRoute`, `@AdminOnly` |
| Metadata decorator | `@SetMetadata(KEY, value)` | Permissions, public flag, rate-limit tier |

## Anti-patterns

| Anti-pattern | Fix |
|---|---|
| Business logic inside a decorator | Decorators attach metadata only; guards/interceptors act on it |
| String metadata keys scattered across files | Central constants: `export const PERMISSIONS_KEY = 'permissions'` |
| Reading metadata with `ctx.getHandler()` only | Use `reflector.getAllAndOverride` to respect class + method hierarchy |
| Fat `@ApiRoute` with 20 options | Keep composite decorators focused on one cross-cutting concern |
| Decorator that calls a service directly | Inject the service into the guard or interceptor that reads the metadata |
