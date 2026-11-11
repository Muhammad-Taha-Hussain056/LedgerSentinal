# Pragmatic Schema Design & Anti-Over-Normalization Standards

This standard establishes the engineering rules for designing production-grade, right-sized relational database schemas in PostgreSQL with Drizzle ORM. It prevents AI over-normalization, eliminates unnecessary micro-tables, leverages modern PostgreSQL rich types (arrays, JSONB, native enums), enforces clean storage tiering (Postgres vs. Redis), and enables fast, resilient schema evolution under Agile methodology.

---

## 1. The Anti-Over-Normalization Manifesto

### The Problem: Academic Purity vs. Production Reality
Standard AI models suffer from an extreme bias toward textbook 5NF (Fifth Normal Form) academic normalization:
- Breaking a single user entity into 20+ micro-tables (`users`, `user_emails`, `user_passwords`, `user_phones`, `user_roles`, `user_profiles`, `user_settings`, `user_preferences`, `user_statuses`, `invite_tokens`, `refresh_tokens`, `totp_secrets`, `email_events`, `rate_limit_buckets`, etc.).
- **The cost of this over-normalization in production is catastrophic:**
  1. **Query & Join Overhead:** A simple "fetch current user" query requires 8 to 12 joins, inflating latency and database CPU usage.
  2. **Transaction & Lock Contention:** Creating or updating a user requires multi-table locks and complex two-phase transactions.
  3. **Cognitive & Code Bloat:** Every table requires a Drizzle schema, repository class, domain entity, create/update DTOs, mappers, and unit test mocks.
  4. **Agile Fragility:** When requirements pivot (as they always do in Agile sprints), migrating 20 rigid interconnected tables requires dozens of delicate, risky migrations.

### The Production Philosophy: Pragmatic Normalization
Modern PostgreSQL is NOT an archaic 1980s flat-file engine. PostgreSQL is an advanced object-relational database with first-class arrays, binary JSON (`jsonb`), native enums, and GIN indexing.
- **Normalize across independent aggregate roots** (users, organizations, orders, products, invoices).
- **Pragmatically embed attributes within the aggregate root** when they are tightly coupled, bounded, or read/written together.
- **Offload ephemeral, high-throughput, TTL-based data to Redis/Key-Value stores.**

---

## 2. The Table Justification Test (Strict Gate)

Before creating ANY new database table, it **MUST satisfy at least ONE** of the following four criteria. If it satisfies none, it **MUST NOT be a separate table**:

| # | Justification Criterion | Rule & Meaning | Example of Valid Table | What to use instead if FAILED |
|---|---|---|---|---|
| **1** | **Independent Aggregate Root** | The entity has an independent business lifecycle, can exist without any parent, and is queried independently across multiple system contexts. | `users`, `organizations`, `products`, `invoices` | Embed as columns or JSONB inside the owning entity. |
| **2** | **Unbounded 1-to-Many Growth** | The child relationship grows unbounded (hundreds to millions of rows per parent) and requires independent pagination, sorting, or aggregation. | `order_items`, `audit_logs`, `messages`, `transactions` | If bounded (< 50 items), use a PostgreSQL array (`text[]`, `uuid[]`) or a JSONB array. |
| **3** | **True Many-to-Many with Metadata** | An associative join entity connecting two independent aggregate roots that carries distinct relationship attributes. | `organization_members` (`user_id`, `org_id`, `role`, `joined_at`) | If primitive linking (e.g. user roles or tags), use an array (`roles: text[]`). |
| **4** | **Independent Concurrent Mutation** | Concurrent background processes or third-party webhooks mutate this specific record at high frequency without locking the main entity. | `webhook_events`, `async_job_runs` | If low frequency or synchronous, update the parent record directly. |

---

## 3. PostgreSQL Rich Types: Arrays, JSONB & Enums

### 3.1 When to Use Native Arrays (`text[]`, `uuid[]`, `varchar[]`)
Use native arrays when you have a **bounded list of primitive values** associated with an entity.

- **Use Arrays For:**
  - User roles: `roles: text('roles').array().notNull().default(sql`'{"member"}'::text[]`)`
  - Tags and labels: `tags: text('tags').array().default(sql`'{}'::text[]`)`
  - Permission scopes: `scopes: text('scopes').array().default(sql`'{}'::text[]`)`
  - Category IDs or simple references: `category_ids: uuid('category_ids').array()`
- **Anti-Pattern to Avoid:** Creating a join table (`user_roles`, `user_has_roles`, `role_assignments`) just to assign string roles like `'admin'`, `'member'`, `'billing_admin'`.
- **Querying Arrays:**
  - Contains any: `WHERE 'admin' = ANY(roles)`
  - Overlap: `WHERE roles && ARRAY['admin', 'editor']::text[]`
  - GIN indexing: `CREATE INDEX idx_users_roles ON users USING GIN (roles);`

### 3.2 When to Use JSONB (`jsonb`)
Use `jsonb` for **semi-structured, nested, or evolving domain attributes** that are always loaded and saved with the aggregate root.

- **Use JSONB For:**
  - **User Settings & Preferences:** UI theme, email notification toggles, locale, dashboard preferences.
  - **Third-Party Auth & Identity Metadata:** Raw provider claims from Google/GitHub, avatar URLs, external IDs.
  - **E-Commerce Snapshots:** Snapshot of billing/shipping address at order time, tax breakdowns.
  - **Extensible / Custom Fields:** Dynamic attributes in multi-tenant SaaS that vary per organization or product type.
  - **Audit Diffs:** `before` and `after` state snapshots in audit logs.
- **Anti-Pattern to Avoid:** Creating separate 1-to-1 tables (`user_settings`, `user_preferences`, `user_profiles`, `user_metadata`) that share the exact same lifecycle as `users`.
- **Typing & Validation Invariant:**
  - Always strongly type JSONB columns in Drizzle using `.$type<T>()`.
  - Always validate JSONB inputs at the API boundary using Zod / `class-validator`.
  - If a sub-property in JSONB is queried frequently in `WHERE` clauses, create a GIN index:
    `CREATE INDEX idx_users_settings ON users USING GIN (settings jsonb_path_ops);`

### 3.3 When to Use Native Enums (`pgEnum`)
Use PostgreSQL native enums for discrete, finite state machine states.

- **Use Enums For:**
  - `status`: `pgEnum('order_status', ['draft', 'pending', 'paid', 'fulfilled', 'cancelled'])`
  - `tier`: `pgEnum('subscription_tier', ['free', 'pro', 'enterprise'])`
- **Anti-Pattern to Avoid:** Creating single-column lookup tables (`order_statuses` table containing 4 rows) requiring a foreign key join just to read a string status.

---

## 4. Storage Tiering: PostgreSQL vs. Redis vs. Object Storage

Not everything belongs in a relational database. Putting transient, high-churn, or blob data into PostgreSQL is the primary cause of bloated tables and over-normalization.

| Storage Tier | Technology | Data That Belongs Here | NEVER Put Here |
|---|---|---|---|
| **Relational Tier** | PostgreSQL (Drizzle) | Core business entities, relational invariants, financial balances, orders, users, audit history. | Ephemeral rate limits, temporary OTPs, real-time presence, video files, high-churn counters. |
| **Ephemeral / Cache Tier** | Redis / Key-Value Store | Rate-limit counters, transient OTP verification tokens, login attempt tallies, distributed locks, session blacklist, short-lived cache. | Relational master records, billing invoices, data needing long-term ACID durability. |
| **Object Storage Tier** | S3 / Cloudflare R2 | Avatars, PDFs, image uploads, file attachments, bulk export archives. | Never store raw image bytes or base64 blobs inside Postgres tables. Store only the URL string. |

### The Ephemeral Token & Rate-Limit Rule
- **Rate-limit buckets:** Store in Redis with TTL (`INCR` + `EXPIRE`). Never create a `rate_limit_buckets` table in Postgres!
- **Email Verification & OTP Tokens:**
  - If Redis is available: Store `verify:otp:<user_id>` with 15-minute TTL.
  - If Postgres-only: Store `verification_token_hash` and `verification_token_expires_at` directly as nullable columns on `users`, NOT in a separate `email_verification_tokens` table!

---

## 5. Domain Table Budgets (Hard Limits)

To prevent AI runaway table creation, every domain feature has a **Strict Table Budget**. Proposing more tables than the budget requires an explicit justification audit.

| Domain Module | Maximum Table Budget | Standard Production Schema Structure |
|---|---|---|
| **Authentication & Users** | **2 to 3 tables** | 1. `users` (core identity, credentials, roles[], settings jsonb, status)<br>2. `sessions` or `refresh_tokens` (id, user_id, token_hash, ip, expires_at)<br>3. `oauth_accounts` (optional: federated Google/GitHub logins) |
| **Organization / Multi-Tenancy** | **2 tables** | 1. `organizations` (id, name, slug, settings jsonb)<br>2. `organization_members` (org_id, user_id, role, permissions[]) |
| **Billing & Subscriptions** | **2 to 3 tables** | 1. `subscriptions` (org_id, plan_id, status, current_period_end)<br>2. `invoices` (org_id, amount_cents, status, pdf_url, invoice_items jsonb)<br>3. `payment_methods` (optional: customer_id, stripe_payment_method_id) |
| **E-Commerce & Orders** | **3 to 4 tables** | 1. `products` (id, name, price_cents, attributes jsonb)<br>2. `orders` (id, customer_id, status, total_cents, shipping_address jsonb)<br>3. `order_items` (order_id, product_id, quantity, unit_price_cents)<br>4. `inventory` (optional: product_id, stock_count) |
| **Content / Blog / CMS** | **2 to 3 tables** | 1. `posts` (id, author_id, title, slug, content, tags[], status, published_at)<br>2. `comments` (post_id, author_id, content, status)<br>3. `categories` (optional: id, name, slug) |

---

## 6. Agile-Ready Schema Design (Evolving Schemas)

In Agile development, business requirements are incomplete or evolve sprint-by-sprint. An over-normalized schema resists change; a pragmatic schema welcomes change.

### The "Core Skeleton + Extensible Envelope" Pattern
1. **Core Skeleton (Strong Relational Core):**
   - Solid, immutable relational columns: `id` (UUID), foreign keys (`user_id`, `organization_id`), discrete status (`pgEnum`), financial amounts in cents (`bigint`), and timestamps (`created_at`, `updated_at`).
2. **Extensible Envelope (`metadata jsonb default '{}'::jsonb`):**
   - For rough, evolving, or sprint-by-sprint attributes, store them in the `metadata` or `settings` JSONB column.
   - Example: Sprint 1 needs "twitter_handle" and "preferred_language". Do NOT run a migration to add 2 columns immediately if requirements are changing. Put them into `metadata`.
3. **The Column Promotion Rule:**
   - Promote an attribute from `metadata` JSONB to a dedicated SQL column **ONLY WHEN**:
     - It becomes a high-frequency filter in query performance hotspots.
     - It requires a database-level `UNIQUE` constraint or foreign key constraint.
     - Requirements around this attribute have completely solidified across multiple sprints.
   - Promotion is purely additive and backwards-compatible: add the column, backfill via `UPDATE`, switch reads, drop from JSONB.

---

## 7. Document Modeling & Anti-Over-Normalization for MongoDB (Mongoose / CosmonyX Pattern)

When building on MongoDB with Mongoose (as proven in the **CosmonyX** architecture), the principles of anti-over-normalization apply with even greater importance. Standard AI models mistakenly treat MongoDB like a relational database, creating 20+ separate collections and using slow, memory-intensive `$lookup` aggregation joins.

### 7.1 The Document Justification Test (Embedding vs. Referencing)

Before creating a separate MongoDB collection, apply the **Document Justification Test**:

| Pattern | When to Use | CosmonyX Example | Anti-Pattern to AVOID |
|---|---|---|---|
| **Embed Subdocument (`@Schema({ _id: false })`)** | Data is bounded (< 100 items), tightly coupled to the aggregate lifecycle, and always retrieved or updated together with the parent. | User Profile (`firstName`, `lastName`), User Settings (`theme`, `notifications`), Postal Addresses, Order Items snapshot, OAuth account tokens. | Creating a separate `user_profiles` or `user_settings` collection requiring `$lookup`. |
| **Embed Native Array (`@Prop({ type: [String] })`)** | Bounded primitive identifiers or labels. | User roles (`roles: ['member', 'admin']`), content tags, permission flags. | Creating a `roles` collection and an associative `user_roles` collection. |
| **Referenced Collection (`@Prop({ type: SchemaTypes.ObjectId, ref: '...' })`)** | The child relationship grows unbounded (hundreds to millions of documents), has an independent aggregate lifecycle, or is queried independently. | Company $\rightarrow$ Users, Account $\rightarrow$ Transactions, Organization $\rightarrow$ Invoices. | Inlining 10,000 transaction records inside a single account document (exceeding the 16MB document limit). |

### 7.2 MongoDB Domain Collection Budgets
- **Authentication & Users:** **1 to 2 collections max** (`users` with embedded preferences, address, and credentials; `sessions` for active device tokens).
- **Organizations / Multi-Tenancy:** **1 collection** (`companies` with embedded plan settings and contact info).
- **Transactions / Ledger:** **2 collections** (`accounts`, `transactions`).

---

## 8. Golden Rules of Schema Design (Mandatory Checkpoints)

1. **Entity Justification Pass:** Every SQL table or MongoDB collection must pass the respective Justification Test.
2. **No 1-to-1 Splits:** Zero 1-to-1 extension tables or collections (`user_profile`, `user_settings`). Embed as columns/JSONB in SQL, or embedded subdocuments in MongoDB.
3. **Primitive Sets Use Native Arrays:** Use `text[]` in PostgreSQL or `[String]` in Mongoose instead of join tables/collections for small, bounded sets (roles, tags, scopes).
4. **Semi-Structured Data & Agile Envelopes:** Use typed `jsonb` (SQL) or subdocument/mixed schemas (MongoDB) with boundary validation for evolving settings, third-party metadata, and audit diffs.
5. **Redis for Ephemeral State:** Rate limits, transient OTPs, distributed locks, and token blacklists belong in Redis, NEVER in PostgreSQL tables or MongoDB collections.
6. **Pre-Backend Approval Gate:** Schema design must be reviewed and approved by the user BEFORE any repository, service, or controller code is generated.

