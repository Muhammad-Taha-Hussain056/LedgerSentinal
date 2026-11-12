import assert from 'node:assert/strict';

import { settledSimulatorEventSchema, invoiceImportSchema, invoiceInputSchema, type SettledSimulatorEvent } from '@project/contracts';

const event: SettledSimulatorEvent = settledSimulatorEventSchema.parse({
  eventId: 'api-build-event', eventType: 'payment.settled', paymentId: 'api-build-payment',
  amount: '10.0', currency: 'USD', settledAt: '2026-11-12T10:00:00.000Z',
});
assert.equal(event.amount, '10.00');
assert.equal(invoiceImportSchema.parse({ records: [null] }).records.length, 1);
assert.equal(invoiceInputSchema.safeParse(null).success, false);
assert.equal(settledSimulatorEventSchema.safeParse({ ...event, actorId: 'untrusted' }).success, false);
