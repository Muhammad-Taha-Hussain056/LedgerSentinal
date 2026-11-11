---
name: nestjs-error-handling
description: Rules for typed domain exceptions, the global exception filter, standard API error envelope, and RFC 9457 Problem Details format. Load for any new error type, any exception filter, or when changing how errors are returned.
---

# Error handling

All errors extend a typed base exception. A single global exception filter converts them to a standard HTTP response. Services throw typed exceptions; they never return error codes or booleans to signal failure.

## Base exception class

```ts
// common/exceptions/app.exception.ts
export class AppException extends Error {
  constructor(
    public readonly code:       string,      // machine-readable: 'USER_NOT_FOUND'
    public readonly message:    string,      // human-readable
    public readonly statusCode: number,
    public readonly details?:   unknown,
  ) {
    super(message);
    this.name = this.constructor.name;
  }
}
```

## Typed domain exceptions — one per error case

```ts
// common/exceptions/http.exceptions.ts
export class NotFoundException extends AppException {
  constructor(resource: string, id?: string) {
    super('NOT_FOUND', id ? `${resource} '${id}' not found` : `${resource} not found`, 404);
  }
}

export class ConflictException extends AppException {
  constructor(message: string, details?: unknown) {
    super('CONFLICT', message, 409, details);
  }
}

export class ValidationException extends AppException {
  constructor(errors: { field: string; message: string }[]) {
    super('VALIDATION_ERROR', 'Validation failed', 422, { errors });
  }
}

export class ForbiddenException extends AppException {
  constructor(message = 'Insufficient permissions') {
    super('FORBIDDEN', message, 403);
  }
}

export class UnprocessableException extends AppException {
  constructor(message: string, details?: unknown) {
    super('UNPROCESSABLE', message, 422, details);
  }
}

export class ExternalServiceException extends AppException {
  constructor(service: string, message: string) {
    super('EXTERNAL_ERROR', `${service}: ${message}`, 502);
  }
}
```

## Service throws typed exceptions

```ts
// users.service.ts
async findOne(id: string, actor: ActorContext): Promise<User> {
  const user = await this.repo.findById(id);
  if (!user) throw new NotFoundException('User', id);                    // 404
  if (user.tenantId !== actor.tenantId) throw new ForbiddenException(); // 403
  return user;
}

async create(dto: CreateUserDto): Promise<User> {
  const existing = await this.repo.findOne({ where: { email: dto.email } });
  if (existing) throw new ConflictException(`User with email '${dto.email}' already exists`);
  return this.repo.create(dto);
}
```

## API response envelope

```ts
// Standard success
{ "success": true, "data": { ... }, "timestamp": "2026-10-01T12:00:00Z" }

// Standard error
{
  "success":   false,
  "error": {
    "code":    "USER_NOT_FOUND",
    "message": "User 'abc-123' not found",
    "details": null,
    "traceId": "req-abc-123"
  },
  "timestamp": "2026-10-01T12:00:00Z"
}
```

## Global exception filter

```ts
// common/filters/http-exception.filter.ts
@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  private readonly logger = new Logger(AllExceptionsFilter.name);

  catch(exception: unknown, host: ArgumentsHost): void {
    const ctx     = host.switchToHttp();
    const res     = ctx.getResponse<Response>();
    const req     = ctx.getRequest<Request>();
    const traceId = req.headers['x-correlation-id'] as string ?? randomUUID();

    let status  = 500;
    let code    = 'INTERNAL_ERROR';
    let message = 'An unexpected error occurred';
    let details: unknown = null;

    if (exception instanceof AppException) {
      status  = exception.statusCode;
      code    = exception.code;
      message = exception.message;
      details = exception.details ?? null;
    } else if (exception instanceof HttpException) {
      status  = exception.getStatus();
      code    = 'HTTP_ERROR';
      message = exception.message;
    } else {
      // Unhandled exception — log the full error
      this.logger.error('Unhandled exception', exception instanceof Error ? exception.stack : String(exception));
    }

    if (status >= 500) this.logger.error(`[${traceId}] ${code}: ${message}`);

    res.status(status).json({
      success: false,
      error:   { code, message, details, traceId },
      timestamp: new Date().toISOString(),
    });
  }
}

// AppModule providers:
{ provide: APP_FILTER, useClass: AllExceptionsFilter }
```

## Transform interceptor — success envelope

```ts
// common/interceptors/transform.interceptor.ts
@Injectable()
export class TransformInterceptor<T> implements NestInterceptor<T, ApiResponse<T>> {
  intercept(ctx: ExecutionContext, next: CallHandler): Observable<ApiResponse<T>> {
    return next.handle().pipe(
      map((data) => ({ success: true, data, timestamp: new Date().toISOString() })),
    );
  }
}
// AppModule providers:
{ provide: APP_INTERCEPTOR, useClass: TransformInterceptor }
```

## HTTP status code guide

| Situation | Status | Exception class |
|---|---|---|
| Resource not found | 404 | `NotFoundException` |
| Not authenticated | 401 | (AuthN guard handles it) |
| Not authorized | 403 | `ForbiddenException` |
| Duplicate / already exists | 409 | `ConflictException` |
| Invalid business rules | 422 | `UnprocessableException` |
| DTO validation failure | 400 | `ValidationPipe` (automatic) |
| External service failure | 502 | `ExternalServiceException` |
| Anything else | 500 | (unhandled — filter logs it) |

## Anti-patterns

| Anti-pattern | Fix |
|---|---|
| `throw new Error('user not found')` from service | `throw new NotFoundException('User', id)` |
| Returning `null` to signal not-found | Throw `NotFoundException` — never return `null` from service |
| Multiple exception filters (one per module) | One global `AllExceptionsFilter` for everything |
| Catching exceptions in the controller | Controller never catches — filter handles everything |
| Logging inside the service on every error | Log in the filter only; services throw, filter logs |
| `try/catch` around the entire service method | Catch specific external calls only; let domain exceptions propagate |
| Status code hardcoded in the service (`throw { status: 404 }`) | Throw typed domain exception; filter resolves the status |
