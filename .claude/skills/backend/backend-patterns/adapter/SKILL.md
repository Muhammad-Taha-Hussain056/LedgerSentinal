---
name: adapter-pattern
description: Rules for wrapping external APIs, SDKs, and third-party libraries using ports and adapters (hexagonal architecture). Load whenever integrating Stripe, S3, SendGrid, Twilio, or any external service. Hook hard-blocks SDK imports in service files.
---

# Adapter pattern

The **port** (interface) lives in the domain — no SDK imports. The **adapter** (concrete class) wraps the SDK in the infrastructure layer. The domain never imports an SDK directly.

```
Domain Service → @Inject(PORT_TOKEN) → IPort  ←implements← ConcreteAdapter → SDK
```

## Port interface — domain layer, no SDK types

```ts
// domain/ports/payment-gateway.port.ts
export const PAYMENT_GATEWAY = Symbol('PAYMENT_GATEWAY');

export interface IPaymentGateway {
  charge(input: ChargeInput): Promise<ChargeResult>;       // domain types only
  refund(chargeId: string, amount?: number): Promise<RefundResult>;
  retrieve(chargeId: string): Promise<ChargeResult>;
}

// ChargeInput / ChargeResult are plain interfaces — no Stripe, PayPal, etc.
```

## Adapter — infrastructure layer, SDK imports only here

```ts
// infrastructure/adapters/stripe-payment.adapter.ts
import Stripe from 'stripe';   // ← SDK import ONLY in this file

@Injectable()
export class StripePaymentAdapter implements IPaymentGateway {
  private readonly stripe: Stripe;
  constructor(config: ConfigService) {
    this.stripe = new Stripe(config.getOrThrow('STRIPE_SECRET_KEY'), { apiVersion: '2024-04-10' });
  }

  async charge(input: ChargeInput): Promise<ChargeResult> {
    try {
      const c = await this.stripe.charges.create({ amount: input.amount, currency: input.currency, source: input.sourceToken });
      return { chargeId: c.id, status: this.mapStatus(c.status), amount: c.amount, currency: c.currency, createdAt: new Date(c.created * 1000) };
    } catch (err) {
      throw this.mapError(err);   // ← SDK error → domain exception
    }
  }

  private mapStatus(s: string): ChargeResult['status'] {
    return s === 'succeeded' ? 'succeeded' : s === 'pending' ? 'pending' : 'failed';
  }
  private mapError(err: any): Error {
    if (err?.type === 'StripeCardError') return new PaymentDeclinedError(err.message);
    return new PaymentGatewayError(err?.message ?? 'Unknown payment error');
  }
}
```

## Module wiring — swap adapter without touching the service

```ts
// payment.module.ts
{ provide: PAYMENT_GATEWAY, useClass: StripePaymentAdapter }
// → change to PayPalPaymentAdapter without touching PaymentService
```

## Service — depends only on port interface

```ts
constructor(@Inject(PAYMENT_GATEWAY) private readonly gw: IPaymentGateway) {}
// No Stripe import. No PayPal import. Zero SDK knowledge.
```

## Common port interfaces

| External system | Port name | Implementations |
|---|---|---|
| Payment | `IPaymentGateway` | StripeAdapter, PayPalAdapter |
| Storage | `IStoragePort` | S3Adapter, GcsAdapter, LocalAdapter |
| Email | `IMailPort` | SendGridAdapter, SesAdapter, SmtpAdapter, NoOpAdapter |
| SMS | `ISmsPort` | TwilioAdapter, AfricasTalkingAdapter, NoOpAdapter |
| Push | `IPushPort` | FcmAdapter, ApnsAdapter |

Always provide a `NoOp*Adapter` for use in tests and when the feature is disabled.

## Hexagonal folder layout

```
src/
├── domain/
│   └── ports/          ← IPaymentGateway, IStoragePort   (no SDK imports)
├── application/
│   └── services/       ← PaymentService                   (imports port only)
└── infrastructure/
    └── adapters/       ← StripePaymentAdapter, S3StorageAdapter (SDK imports here)
```

## Testing — mock the port

```ts
const mockGateway: IPaymentGateway = {
  charge: jest.fn().mockResolvedValue({ chargeId: 'ch_mock', status: 'succeeded', amount: 1000, currency: 'usd', createdAt: new Date() }),
  refund: jest.fn(),
  retrieve: jest.fn(),
};
{ provide: PAYMENT_GATEWAY, useValue: mockGateway }
// Integration tests: use Stripe test mode against the real StripePaymentAdapter
```

## Anti-patterns

| Anti-pattern | Fix |
|---|---|
| SDK import in a service file | Hook blocks this; move import to adapter |
| SDK type (`Stripe.Charge`) leaking through port | Map all SDK types to domain types inside the adapter |
| Fat adapter with business logic | Adapter translates only — business logic belongs in the service |
| No error mapping | Map every SDK exception to a typed domain exception inside the adapter |
| Missing NoOp adapter | Create one for tests and feature-flag-disabled state |
