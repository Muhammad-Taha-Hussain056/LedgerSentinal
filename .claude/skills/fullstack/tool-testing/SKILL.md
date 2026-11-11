---
name: tool-testing
description: Standards for Vitest, React Testing Library, MSW, and Playwright tests in Next.js projects. Load when writing any test, fixing a failing test, or adding coverage. Used by test-writer agent.
---

# Frontend testing standards

Three test types. Choose the lowest level that proves the behavior. Every test uses the same patterns — no ad-hoc fetch mocking, no test IDs when labels exist.

## Test taxonomy

| Type | Tool | Use for | File pattern |
|---|---|---|---|
| Unit | Vitest | Pure functions, hooks, utilities, Zustand stores | `*.test.ts` colocated |
| Component | Vitest + React Testing Library + MSW | Interactive components, forms, query hooks | `*.test.tsx` colocated |
| E2E | Playwright | Critical user journeys only | `e2e/*.spec.ts` at app root |

## Unit tests (Vitest)

```ts
// features/orders/utils/format-price.test.ts
import { formatPrice } from './format-price';

describe('formatPrice', () => {
  it('formats cents to dollars with 2 decimals', () => {
    expect(formatPrice(1999, 'USD')).toBe('$19.99');
  });
  it('returns $0.00 for zero', () => {
    expect(formatPrice(0, 'USD')).toBe('$0.00');
  });
});
```

## Component tests (React Testing Library + MSW)

```tsx
// features/orders/components/create-order-form.test.tsx
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { server } from '@/test/msw/server';
import { http, HttpResponse } from 'msw';

describe('CreateOrderForm', () => {
  it('submits valid form and navigates', async () => {
    const user = userEvent.setup();
    server.use(
      http.post('/api/orders', () => HttpResponse.json({ id: 'ord-1', status: 'created' })),
    );
    render(<CreateOrderForm />, { wrapper: TestProviders });

    await user.type(screen.getByLabelText(/customer/i), 'Acme Corp');
    await user.type(screen.getByLabelText(/quantity/i), '5');
    await user.click(screen.getByRole('button', { name: /create/i }));

    expect(await screen.findByText(/order created/i)).toBeInTheDocument();
  });

  it('shows field errors from server', async () => {
    server.use(
      http.post('/api/orders', () => HttpResponse.json(
        { type: 'about:blank', title: 'Validation', status: 422, errors: { quantity: ['Must be positive'] } },
        { status: 422 },
      )),
    );
    render(<CreateOrderForm />, { wrapper: TestProviders });
    // fill + submit
    expect(await screen.findByText(/must be positive/i)).toBeInTheDocument();
  });
});
```

## MSW setup

```ts
// test/msw/handlers.ts — default happy-path handlers for all features
export const handlers = [
  http.get('/api/orders', () => HttpResponse.json({ data: [], total: 0, page: 1, pageSize: 20, totalPages: 0 })),
  http.get('/api/auth/me', () => HttpResponse.json({ userId: 'usr-1', email: 'test@test.com', role: 'admin', permissions: ['*'] })),
];

// test/msw/server.ts
import { setupServer } from 'msw/node';
import { handlers } from './handlers';
export const server = setupServer(...handlers);
```

```ts
// vitest.setup.ts
import { server } from './test/msw/server';
beforeAll(() => server.listen({ onUnhandledRequest: 'error' }));
afterEach(() => server.resetHandlers());
afterAll(() => server.close());
```

## TestProviders wrapper

```tsx
// test/test-providers.tsx
'use client';
export function TestProviders({ children }: { children: React.ReactNode }) {
  const [qc] = useState(() => new QueryClient({ defaultOptions: { queries: { retry: false }, mutations: { retry: false } } }));
  return <QueryClientProvider client={qc}>{children}</QueryClientProvider>;
}
```

## E2E tests (Playwright — critical journeys only)

```ts
// e2e/orders.spec.ts
test('create order flow', async ({ page }) => {
  await page.goto('/orders/new');
  await page.getByLabel(/customer/i).fill('Acme Corp');
  await page.getByLabel(/quantity/i).fill('5');
  await page.getByRole('button', { name: /create/i }).click();
  await expect(page.getByText(/order created/i)).toBeVisible();
});
```

## Query rules

| Rule | Standard |
|---|---|
| Query by | `getByRole`, `getByLabelText`, `getByPlaceholderText` — in that order |
| Test IDs | Only when no accessible query exists; `data-testid` with a descriptive name |
| Async | `findBy*` for elements that appear after async operations |
| Events | `userEvent` (not `fireEvent`) — it simulates real user behavior |
| Assertions | Assert on **visible output** first; mock call counts are secondary |
| MSW over fetch stubs | Always mock at the network level with MSW, never `jest.fn()` on `fetch` |

## What each test level proves

| Level | Proves | Does NOT prove |
|---|---|---|
| Unit | Logic correctness of isolated functions | Component rendering, user interaction |
| Component | UI behavior, form validation, query/mutation flow | Backend authorization, DB constraints |
| E2E | Full user journey across pages | Performance, accessibility (separate check) |

## Anti-patterns

| Anti-pattern | Fix |
|---|---|
| `jest.mock('../../lib/api/client')` | Use MSW |
| `screen.getByTestId('submit-btn')` | `screen.getByRole('button', { name: /submit/i })` |
| Testing implementation (`expect(setState).toHaveBeenCalledTimes(3)`) | Test observable output |
| Snapshot tests for components | Assert specific content; snapshots break on every change |
| `describe.skip` or `it.skip` committed | Fix or remove |
| E2E for every form | Component test with MSW; E2E for critical journeys only |
| Testing the framework (`useEffect` fires) | Test user-visible behavior |
