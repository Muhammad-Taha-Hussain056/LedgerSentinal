---
name: nestjs-request-lifecycle
description: The exact order every HTTP request travels through NestJS. Load when adding guards, interceptors, pipes, filters, or middleware, or when debugging why a check runs at the wrong time.
---

# NestJS request lifecycle

```
Incoming request
    │
    ▼
Middleware          ← app.use() — correlation IDs, raw body parsing, rate limiting
    │
    ▼
Guards              ← @UseGuards() — AuthN first, then AuthZ/Permissions
    │  (CanActivate returns false → 403 ForbiddenException, stops here)
    │
    ▼
Interceptors (pre)  ← @UseInterceptors() — logging start, timeout, tracing
    │
    ▼
Pipes               ← @UsePipes() — ValidationPipe, ParseUuidPipe, ParseIntPipe
    │  (validation fails → 400 BadRequestException, stops here)
    │
    ▼
Controller method   ← @Get/@Post/etc. — calls service, returns plain value
    │
    ▼
Interceptors (post) ← response transform (wrap in envelope), logging end
    │
    ▼
Exception filters   ← @Catch() — maps typed exceptions to HTTP responses
    │
    ▼
Response sent
```

## Middleware — `main.ts` or `AppModule.configure()`

```ts
// correlation ID — attach before anything else
app.use((req, res, next) => {
  req.headers['x-correlation-id'] ??= randomUUID();
  res.setHeader('X-Correlation-Id', req.headers['x-correlation-id']);
  next();
});
// Raw body for webhook signature verification
app.use('/webhooks', rawBodyMiddleware);   // must run before json() bodyParser
```

## Guards — always before the controller

```ts
// Apply globally in AppModule providers:
{ provide: APP_GUARD, useClass: AuthNGuard },       // authn first
{ provide: APP_GUARD, useClass: PermissionsGuard }, // authz second

// Public routes bypass AuthN guard:
@Get('health') @SetMetadata(IS_PUBLIC_KEY, true) health() { return 'ok'; }

// AuthN attaches actor to request — AuthZ reads it:
interface RequestWithActor extends Request { user: ActorContext; }
```

Guard order matters: **AuthN must run before AuthZ** — AuthZ reads `request.user` set by AuthN.

## Interceptors — wrap the handler call

```ts
// Global transform interceptor — wraps every response in an envelope
@Injectable()
export class TransformInterceptor<T> implements NestInterceptor<T, ApiResponse<T>> {
  intercept(ctx: ExecutionContext, next: CallHandler): Observable<ApiResponse<T>> {
    return next.handle().pipe(
      map((data) => ({ success: true, data, timestamp: new Date().toISOString() })),
    );
  }
}

// Global timeout
{ provide: APP_INTERCEPTOR, useClass: TimeoutInterceptor }   // default 30s

// Logging interceptor — logs start + end with duration
{ provide: APP_INTERCEPTOR, useClass: LoggingInterceptor }
```

## Pipes — validate and transform input only

```ts
// Global ValidationPipe — ALWAYS configured this way
app.useGlobalPipes(new ValidationPipe({
  whitelist:              true,   // strip unknown properties
  forbidNonWhitelisted:   true,   // reject if unknown props sent
  transform:              true,   // plain objects → DTO class instances
  transformOptions:       { enableImplicitConversion: true },
  exceptionFactory: (errors) => new BadRequestException(
    errors.map((e) => ({ field: e.property, errors: Object.values(e.constraints ?? {}) }))
  ),
}));

// Route-level pipes for params
@Get(':id') getOne(@Param('id', ParseUuidPipe) id: string) { ... }
@Get()      list(@Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number) { ... }
```

**Pipes do NOT execute business logic.** If a pipe hits the database, it's wrong — move that logic to a guard or service.

## What runs where & where it lives (CosmonyX Gateway Standard)

| Concern | Where | Dedicated File Location |
|---|---|---|
| "Is the user authenticated?" | Guard (AuthN) | `src/guards/authN.guard.ts` (APP_GUARD) |
| "Can this user do this action?" | Guard (AuthZ / Permissions) | `src/guards/authZ.guard.ts` (APP_GUARD) |
| "Is this input valid?" | Pipe (ValidationPipe, RequiredPipe) | `src/pipes/validation.pipe.ts`, `required.pipe.ts` |
| "Log latency & correlation" | Interceptor (Logging) | `src/interceptors/logging.interceptor.ts` (APP_INTERCEPTOR) |
| "Audit user mutations" | Interceptor (ActivityLogs) | `src/interceptors/activity-logs.interceptor.ts` (APP_INTERCEPTOR) |
| "Add correlation ID / raw body" | Middleware | `src/middleware/correlation-id.middleware.ts`, `raw-body.middleware.ts` |
| "Format response body envelope" | Interceptor (Response) | `src/interceptors/response.interceptor.ts` (APP_INTERCEPTOR) |
| "Map domain/HTTP exceptions to RFC-9457" | Exception filter | `src/filters/exceptions.filter.ts` (APP_FILTER) |
| "Route metadata, auth flags & Swagger" | Custom Decorators | `src/decorators/api-route.decorator.ts`, `authN.decorator.ts`, `authZ.decorator.ts` |
| "Execute business logic" | Service | `src/modules/<feature>/services/<feature>.service.ts` |

## Exception filter — global handler

```ts
// src/filters/exceptions.filter.ts
// Applied globally via AppModule / GatewayModule providers:
{ provide: APP_FILTER, useClass: ExceptionsFilter }
```

See `nestjs-error-handling.md` for the filter implementation.

## Anti-patterns

| Anti-pattern | Fix |
|---|---|
| Database call in a pipe | Guard or service — pipes transform, they don't query |
| Business logic in a guard | Guard returns `true/false` only; call service if lookup needed |
| Checking auth inside a service | Auth is done before the service executes — guards own it |
| Missing `transform: true` in ValidationPipe | DTOs are plain objects without it — class methods unavailable |
| Interceptor modifying the request before the guard | Guards run before interceptors — interceptors see post-auth request |
| State mutation in middleware | Middleware only adds headers, IDs, raw body — never mutates domain state |
