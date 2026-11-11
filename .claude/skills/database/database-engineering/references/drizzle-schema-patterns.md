# Drizzle ORM Pragmatic Schema Patterns

This reference provides production-ready, battle-tested Drizzle ORM patterns demonstrating pragmatic normalization, PostgreSQL rich types (arrays, JSONB, native enums), and optimal indexing.

---

## 1. Common Table Base Helper

Standardize `id`, `created_at`, and `updated_at` across all tables:

```typescript
// src/database/schema/common.helper.ts
import { timestamp, uuid } from 'drizzle-orm/pg-core';

export const baseColumns = {
  id: uuid('id').primaryKey().defaultRandom(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
};
```

---

## 2. The Pragmatic Auth Schema (Production Standard: 3 Tables Max)

Instead of the AI hallucination of 26 tables, real-world production authentication is built in **3 clean tables**:
1. `users`: Identity, credentials, roles (array), profile/settings (jsonb), TOTP secret, email verification status.
2. `sessions`: Refresh tokens, device/IP context, expiration.
3. `oauth_accounts`: Federated identities (Google, GitHub, Microsoft).

```typescript
// src/database/schema/auth.schema.ts
import { sql } from 'drizzle-orm';
import {
  pgEnum,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  uuid,
  varchar,
  jsonb,
  index,
} from 'drizzle-orm/pg-core';
import { baseColumns } from './common.helper';

// 1. Discrete state machines as native Postgres Enums
export const userStatusEnum = pgEnum('user_status', [
  'active',
  'pending_verification',
  'suspended',
]);

// Strong typing for embedded JSONB structures
export interface UserPreferences {
  theme?: 'light' | 'dark' | 'system';
  locale?: string;
  notifications?: {
    emailMarketing: boolean;
    securityAlerts: boolean;
  };
}

// 2. Pragmatic Users Table: No unnecessary 1-to-1 table splits
export const usersTable = pgTable(
  'users',
  {
    ...baseColumns,
    email: varchar('email', { length: 255 }).notNull(),
    passwordHash: text('password_hash'), // Nullable for OAuth-only accounts
    fullName: varchar('full_name', { length: 255 }),
    avatarUrl: text('avatar_url'),

    status: userStatusEnum('status').default('pending_verification').notNull(),

    // Primitive bounded collection -> Postgres Array (NO user_roles join table!)
    roles: text('roles')
      .array()
      .notNull()
      .default(sql`'{"member"}'::text[]`),

    // 2FA / TOTP stored directly on user (NO separate totp_tokens table!)
    totpSecret: text('totp_secret'),
    totpEnabled: timestamp('totp_enabled_at', { withTimezone: true }),

    // Email verification state directly on user (NO email_events table!)
    emailVerifiedAt: timestamp('email_verified_at', { withTimezone: true }),
    emailVerificationTokenHash: text('email_verification_token_hash'),
    emailVerificationExpiresAt: timestamp('email_verification_expires_at', { withTimezone: true }),

    // Semi-structured preferences -> Strongly typed JSONB (NO user_settings table!)
    preferences: jsonb('preferences')
      .$type<UserPreferences>()
      .notNull()
      .default(sql`'{}'::jsonb`),

    // Agile Extensible Envelope: Absorb sprint-by-sprint attribute changes safely
    metadata: jsonb('metadata')
      .$type<Record<string, unknown>>()
      .notNull()
      .default(sql`'{}'::jsonb`),
  },
  (table) => [
    uniqueIndex('idx_users_email').on(table.email),
    index('idx_users_status').on(table.status),
    index('idx_users_roles').using('gin', table.roles),
    index('idx_users_metadata').using('gin', sql`${table.metadata} jsonb_path_ops`),
  ]
);

// 3. Sessions & Refresh Tokens: Fast revocation & device tracking
export const sessionsTable = pgTable(
  'sessions',
  {
    ...baseColumns,
    userId: uuid('user_id')
      .notNull()
      .references(() => usersTable.id, { onDelete: 'cascade' }),
    refreshTokenHash: text('refresh_token_hash').notNull(),
    userAgent: text('user_agent'),
    ipAddress: varchar('ip_address', { length: 45 }),
    expiresAt: timestamp('expires_at', { withTimezone: true }).notNull(),
    revokedAt: timestamp('revoked_at', { withTimezone: true }),
  },
  (table) => [
    uniqueIndex('idx_sessions_token_hash').on(table.refreshTokenHash),
    index('idx_sessions_user_id').on(table.userId),
    index('idx_sessions_expires_at').on(table.expiresAt),
  ]
);

// 4. OAuth Federated Accounts (Optional: only if multi-provider auth is required)
export const oauthAccountsTable = pgTable(
  'oauth_accounts',
  {
    ...baseColumns,
    userId: uuid('user_id')
      .notNull()
      .references(() => usersTable.id, { onDelete: 'cascade' }),
    provider: varchar('provider', { length: 50 }).notNull(), // 'google' | 'github'
    providerUserId: varchar('provider_user_id', { length: 255 }).notNull(),
    profileData: jsonb('profile_data')
      .$type<Record<string, unknown>>()
      .notNull()
      .default(sql`'{}'::jsonb`),
  },
  (table) => [
    uniqueIndex('idx_oauth_provider_user').on(table.provider, table.providerUserId),
    index('idx_oauth_user_id').on(table.userId),
  ]
);
```

---

## 3. The Pragmatic E-Commerce / Order Schema (3 Tables)

Captures catalog, orders, and line items with immutable snapshots without over-normalization:

```typescript
// src/database/schema/orders.schema.ts
import { sql } from 'drizzle-orm';
import {
  bigint,
  index,
  integer,
  jsonb,
  pgEnum,
  pgTable,
  text,
  uuid,
  varchar,
} from 'drizzle-orm/pg-core';
import { baseColumns } from './common.helper';
import { usersTable } from './auth.schema';

export const orderStatusEnum = pgEnum('order_status', [
  'pending_payment',
  'processing',
  'shipped',
  'delivered',
  'cancelled',
]);

export interface ShippingAddress {
  street: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
  recipientName: string;
  phoneNumber?: string;
}

// 1. Products: Dynamic specifications stored in JSONB
export const productsTable = pgTable(
  'products',
  {
    ...baseColumns,
    name: varchar('name', { length: 255 }).notNull(),
    slug: varchar('slug', { length: 255 }).notNull().unique(),
    priceCents: bigint('price_cents', { mode: 'number' }).notNull(), // Integers for currency!
    stockQuantity: integer('stock_quantity').notNull().default(0),
    tags: text('tags').array().default(sql`'{}'::text[]`),
    specifications: jsonb('specifications')
      .$type<Record<string, string | number>>()
      .default(sql`'{}'::jsonb`),
  },
  (table) => [
    index('idx_products_tags').using('gin', table.tags),
  ]
);

// 2. Orders: Core financial aggregate root
export const ordersTable = pgTable(
  'orders',
  {
    ...baseColumns,
    orderNumber: varchar('order_number', { length: 50 }).notNull().unique(),
    userId: uuid('user_id')
      .notNull()
      .references(() => usersTable.id, { onDelete: 'restrict' }),
    status: orderStatusEnum('status').default('pending_payment').notNull(),
    totalCents: bigint('total_cents', { mode: 'number' }).notNull(),
    taxCents: bigint('tax_cents', { mode: 'number' }).notNull().default(0),

    // Snapshot address at time of checkout in JSONB (Never join against user_addresses!)
    shippingAddress: jsonb('shipping_address')
      .$type<ShippingAddress>()
      .notNull(),

    // Payment processor metadata (Stripe paymentIntentId, chargeId)
    paymentDetails: jsonb('payment_details')
      .$type<{ stripePaymentIntentId?: string; receiptUrl?: string }>()
      .default(sql`'{}'::jsonb`),
  },
  (table) => [
    index('idx_orders_user_id').on(table.userId),
    index('idx_orders_status').on(table.status),
    index('idx_orders_created_at').on(table.createdAt),
  ]
);

// 3. Order Items: Unbounded child line items (Passes Table Justification Test #2)
export const orderItemsTable = pgTable(
  'order_items',
  {
    ...baseColumns,
    orderId: uuid('order_id')
      .notNull()
      .references(() => ordersTable.id, { onDelete: 'cascade' }),
    productId: uuid('product_id')
      .notNull()
      .references(() => productsTable.id, { onDelete: 'restrict' }),
    productNameSnapshot: varchar('product_name_snapshot', { length: 255 }).notNull(),
    unitPriceCents: bigint('unit_price_cents', { mode: 'number' }).notNull(),
    quantity: integer('quantity').notNull(),
    subtotalCents: bigint('subtotal_cents', { mode: 'number' }).notNull(),
  },
  (table) => [
    index('idx_order_items_order_id').on(table.orderId),
    index('idx_order_items_product_id').on(table.productId),
  ]
);
```

---

## 4. Querying Arrays and JSONB in Drizzle

### Array Operations in Repositories
```typescript
import { arrayContains, arrayOverlaps, sql } from 'drizzle-orm';

// Check if user has 'admin' role
const admins = await db.select().from(usersTable)
  .where(arrayContains(usersTable.roles, ['admin']));

// Check if user has any of multiple roles
const privileged = await db.select().from(usersTable)
  .where(arrayOverlaps(usersTable.roles, ['admin', 'manager']));
```

### JSONB Queries in Repositories
```typescript
import { sql } from 'drizzle-orm';

// Filter by a nested JSONB property using GIN-accelerated @>
const darkThemeUsers = await db.select().from(usersTable)
  .where(sql`${usersTable.preferences} @> '{"theme": "dark"}'::jsonb`);

// Extract scalar property from JSONB
const userCity = await db.select({
  city: sql<string>`${ordersTable.shippingAddress}->>'city'`
}).from(ordersTable);
```
