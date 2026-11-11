---
name: builder-pattern
description: Rules for fluent query builders, filter assemblers, DTO/response builders, and HTTP client request builders. Load when constructing complex objects step-by-step from optional parts — dynamic WHERE clauses, report responses, multi-field email messages.
---

# Builder pattern

A builder accumulates state via fluent methods; `build()` produces the target object. Always call `reset()` at the start of a chain if the builder is injectable (singleton-scoped) — state from a previous request bleeds into the next otherwise.

## Query filter builder (most common NestJS use)

```ts
// users/query/user-query.builder.ts
@Injectable()
export class UserQueryBuilder {
  private conditions: SQL[] = [];
  private orderClause: SQL | null = null;
  private limitVal = 20;
  private offsetVal = 0;

  reset(): this { this.conditions = []; this.orderClause = null; this.limitVal = 20; this.offsetVal = 0; return this; }

  withTenant(id: string): this  { this.conditions.push(eq(users.tenantId, id));      return this; }
  withEmail(e: string): this    { this.conditions.push(ilike(users.email, `%${e}%`)); return this; }
  withStatus(s: UserStatus): this { this.conditions.push(eq(users.status, s));       return this; }
  withCreatedAfter(d: Date): this { this.conditions.push(gte(users.createdAt, d));   return this; }
  withRole(id: string): this    { this.conditions.push(eq(users.roleId, id));         return this; }
  orderByCreatedAt(dir: 'asc'|'desc' = 'desc'): this {
    this.orderClause = sql`${users.createdAt} ${raw(dir.toUpperCase())}`;
    return this;
  }
  withPagination(page: number, size: number): this {
    this.limitVal = size; this.offsetVal = (page - 1) * size; return this;
  }

  build() { return { where: and(...this.conditions), orderBy: this.orderClause, limit: this.limitVal, offset: this.offsetVal }; }
}

// usage in repository — always call reset() first
const q = this.qb.reset().withTenant(tenantId).withPagination(page, size);
if (filters.email)  q.withEmail(filters.email);
if (filters.status) q.withStatus(filters.status);
q.orderByCreatedAt('desc');
const { where, orderBy, limit, offset } = q.build();
```

## Response/DTO builder (instantiate with `new` per operation)

```ts
// Not @Injectable — new instance per use, no reset() needed
export class ReportResponseBuilder {
  private data: Partial<ReportResponse> = {};

  withId(id: string): this           { this.data.id = id;              return this; }
  withTitle(t: string): this         { this.data.title = t;            return this; }
  withSection(s: ReportSection): this { (this.data.sections ??= []).push(s); return this; }
  withMeta(by: string, tenant: string): this {
    this.data.metadata = { requestedBy: by, tenantId: tenant, version: '1' }; return this;
  }

  build(): ReportResponse {
    if (!this.data.id)    throw new Error('Report id required');
    if (!this.data.title) throw new Error('Report title required');
    return { ...this.data, generatedAt: new Date().toISOString() } as ReportResponse;
  }
}

// Usage in service
const report = new ReportResponseBuilder()
  .withId(id).withTitle('October Report').withSection(revenueSection).withMeta(actor.userId, actor.tenantId).build();
```

## Injectable builder scoping rule

| Builder type | Scope | Must call reset()? |
|---|---|---|
| Query/filter builder | `@Injectable()` singleton | **Yes** — always at start of chain |
| Response/DTO builder | `new` per operation | No — fresh state every time |
| HTTP request builder | `@Injectable()` singleton | **Yes** |

## Anti-patterns

| Anti-pattern | Fix |
|---|---|
| Injectable builder without `reset()` | Shared state bleeds between concurrent requests |
| `build()` with no validation | Throw on missing required fields |
| 50-method builder for everything | Split into focused builders per concern |
| Builder method that does NOT return `this` | Break the fluent chain — always `return this` |
| Skipping `reset()` on a reused instance | Old conditions from the previous call persist |
