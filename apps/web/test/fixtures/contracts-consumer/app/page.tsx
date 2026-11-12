import { settledSimulatorEventSchema, type SettledSimulatorEvent } from '@project/contracts';

export default function ContractBuildFixture() {
  const event: SettledSimulatorEvent = settledSimulatorEventSchema.parse({
    eventId: 'web-build-event', eventType: 'payment.settled', paymentId: 'web-build-payment',
    amount: '10.0', currency: 'USD', settledAt: '2026-11-12T10:00:00.000Z',
  });
  return <main><output aria-label="Parsed fixture amount">{event.amount}</output></main>;
}
