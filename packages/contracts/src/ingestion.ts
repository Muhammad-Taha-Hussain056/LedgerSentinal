import { z } from 'zod';

import {
  businessTextSchema, currencySchema, eventTypeSchema, idSchema, machineCodeSchema,
  optionalReferenceSchema, positiveMoneyInputSchema, utcInstantSchema,
} from './domain-primitives';
import { paginationQuerySchema } from './pagination';
import { listEnvelopeSchema, successEnvelopeSchema } from './problem';

export const ingestionStatusSchema = z.enum(['PENDING', 'COMPLETED', 'IGNORED', 'FAILED']);
export const ingestionQuerySchema = paginationQuerySchema.safeExtend({ status: ingestionStatusSchema.optional() });
export const eventParamsSchema = z.strictObject({ id: idSchema });
const eventFields = {
  eventId: businessTextSchema, eventType: eventTypeSchema, paymentId: businessTextSchema,
  amount: positiveMoneyInputSchema.optional(), currency: currencySchema.optional(),
  settledAt: utcInstantSchema.optional(), paymentReference: optionalReferenceSchema,
  payerName: businessTextSchema.optional(),
};
export const simulatorEventSchema = z.strictObject(eventFields).superRefine((event, context) => {
  if (event.eventType !== 'payment.settled') return;
  for (const field of ['amount', 'currency', 'settledAt'] as const) {
    if (event[field] === undefined) {
      context.addIssue({ code: 'custom', path: [field], message: 'Required for a settled payment' });
    }
  }
});
export const settledSimulatorEventSchema = z.strictObject({
  ...eventFields, eventType: z.literal('payment.settled'), amount: positiveMoneyInputSchema,
  currency: currencySchema, settledAt: utcInstantSchema,
});
export const eventOutcomeSchema = z.strictObject({
  id: idSchema, providerEventId: businessTextSchema, eventType: eventTypeSchema,
  status: ingestionStatusSchema, attemptCount: z.number().int().nonnegative(), retryable: z.boolean(),
  journalEntryId: idSchema.nullable(), lastErrorCode: machineCodeSchema.nullable(),
  createdAt: utcInstantSchema, updatedAt: utcInstantSchema,
});
export const retryInputSchema = z.strictObject({});
export const healthDataSchema = z.strictObject({ status: z.literal('ok') });
export const healthResponseSchema = successEnvelopeSchema(healthDataSchema);
export const eventOutcomeResponseSchema = successEnvelopeSchema(eventOutcomeSchema);
export const eventListResponseSchema = listEnvelopeSchema(eventOutcomeSchema);

export type SimulatorEvent = z.output<typeof simulatorEventSchema>;
export type SettledSimulatorEvent = z.output<typeof settledSimulatorEventSchema>;
export type EventOutcome = z.output<typeof eventOutcomeSchema>;
export type IngestionQuery = z.output<typeof ingestionQuerySchema>;
