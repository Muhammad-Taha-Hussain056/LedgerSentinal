---
name: nestjs-dto-validation
description: Rules for every DTO — input (request), output (response), filter/query. class-validator decorators, class-transformer, response shaping, partial/pick types. Load for any new endpoint, any changed request/response shape, any DTO question.
---

# DTO validation

DTOs are the public API boundary. Input DTOs validate everything coming in. Output (response) DTOs shape everything going out. No ORM entity types ever leave the controller.

## Input DTO — request body

```ts
// dto/create-user.dto.ts
import { IsEmail, IsString, MinLength, IsOptional, IsEnum, IsUUID } from 'class-validator';
import { Transform } from 'class-transformer';

export class CreateUserDto {
  @IsEmail()
  @Transform(({ value }) => value?.toLowerCase().trim())
  email: string;

  @IsString()
  @MinLength(2)
  @Transform(({ value }) => value?.trim())
  name: string;

  @IsEnum(UserRole)
  role: UserRole;

  @IsOptional()
  @IsUUID()
  organizationId?: string;
}
```

## Output DTO — response (never expose ORM internals)

```ts
// dto/user.response.dto.ts
export class UserResponseDto {
  id:           string;
  email:        string;
  name:         string;
  role:         UserRole;
  createdAt:    string;   // ISO string — never Date object
  organizationId: string | null;

  // Static factory — maps domain entity to response shape
  static from(user: User): UserResponseDto {
    return {
      id:           user.id,
      email:        user.email,
      name:         user.name,
      role:         user.role,
      createdAt:    user.createdAt.toISOString(),
      organizationId: user.organizationId ?? null,
    };
  }
}

// Controller usage
return UserResponseDto.from(user);
```

## Paginated response

```ts
// dto/paginated-user.dto.ts
export class PaginatedUserDto {
  data:       UserResponseDto[];
  total:      number;
  page:       number;
  pageSize:   number;
  totalPages: number;

  static from(page: Page<User>): PaginatedUserDto {
    return { ...page, data: page.data.map(UserResponseDto.from) };
  }
}
```

## Filter / query params DTO

```ts
// dto/user-filter.dto.ts
export class UserFilterDto {
  @IsOptional() @IsString() @Transform(({ value }) => value?.trim())
  search?: string;

  @IsOptional() @IsEnum(UserRole)
  role?: UserRole;

  @IsOptional() @IsEnum(UserStatus)
  status?: UserStatus;

  @IsOptional() @Type(() => Number) @IsInt() @Min(1) @Transform(({ value }) => Number(value))
  page?: number = 1;

  @IsOptional() @Type(() => Number) @IsInt() @Min(1) @Max(100)
  pageSize?: number = 20;
}
```

## Update DTO — PartialType

```ts
// dto/update-user.dto.ts
import { PartialType, OmitType } from '@nestjs/mapped-types';

export class UpdateUserDto extends PartialType(
  OmitType(CreateUserDto, ['email'] as const)   // email not updatable
) {}
```

## Nested object DTO

```ts
export class AddressDto {
  @IsString() street:  string;
  @IsString() city:    string;
  @IsString() country: string;
  @IsOptional() @IsString() zip?: string;
}

export class CreateOrderDto {
  @ValidateNested()
  @Type(() => AddressDto)   // ← required for nested validation
  shippingAddress: AddressDto;
}
```

## Class-validator cheat sheet

| Decorator | Use for |
|---|---|
| `@IsString()` | Any text field |
| `@IsEmail()` | Email addresses |
| `@IsUUID()` | UUID IDs |
| `@IsEnum(Enum)` | Enum fields |
| `@IsInt()` / `@IsNumber()` | Numbers |
| `@Min(n)` / `@Max(n)` | Numeric range |
| `@MinLength(n)` / `@MaxLength(n)` | String length |
| `@IsUrl()` | URLs |
| `@IsOptional()` | Optional fields — must be first |
| `@IsNotEmpty()` | Rejects empty string (`''`) |
| `@IsArray()` + `@ArrayMinSize(1)` | Arrays |
| `@ValidateNested()` + `@Type(()=>Cls)` | Nested objects |
| `@IsDateString()` | ISO date strings |
| `@IsBoolean()` | Booleans |
| `@Transform(({value})=>...)` | Input normalization |

## GlobalPipe config — set once in `main.ts`

```ts
app.useGlobalPipes(new ValidationPipe({
  whitelist:            true,
  forbidNonWhitelisted: true,
  transform:            true,
  transformOptions:     { enableImplicitConversion: true },
}));
```

**Never** add `ValidationPipe` to individual controllers or methods — the global one handles everything.

## Anti-patterns

| Anti-pattern | Fix |
|---|---|
| Returning ORM entity from controller | Map to `*ResponseDto.from(entity)` before returning |
| `any` type in a DTO field | Use explicit type + validator |
| `@IsOptional()` after other decorators | `@IsOptional()` must be first decorator |
| Missing `@Type(() => Class)` on nested | Nested objects won't be instantiated — validation skipped |
| Validate in service with `if` statements | All validation at DTO boundary via class-validator |
| `UpdateUserDto` with all fields required | Always extend `PartialType(CreateUserDto)` |
| Sending raw `Date` object in response | Always `.toISOString()` before sending |
| Returning password hash or sensitive field | Explicitly exclude in `*ResponseDto.from()` |
