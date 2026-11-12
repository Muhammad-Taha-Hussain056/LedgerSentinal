import { z } from 'zod';

import {
  actorIdSchema, businessTextSchema, currencySchema, idSchema, invoiceStatusSchema,
  nullableReferenceSchema, positiveMoneyOutputSchema, postingMoneySchema, utcInstantSchema,
} from './domain-primitives';
import { canonicalMoneySchema } from './money';
import { paginationQuerySchema } from './pagination';
import { listEnvelopeSchema, successEnvelopeSchema } from './problem';

export const accountCodeSchema = z.enum(['BANK_USD', 'UNAPPLIED_RECEIPTS_USD']);
export const accountTypeSchema = z.enum(['ASSET', 'LIABILITY']);
export const journalKindSchema = z.enum(['PAYMENT', 'REVERSAL']);
export const accountQuerySchema = paginationQuerySchema;
export const journalQuerySchema = paginationQuerySchema.safeExtend({ kind: journalKindSchema.optional() });
export const journalParamsSchema = z.strictObject({ id: idSchema });
export const accountViewSchema = z.strictObject({
  id: idSchema, code: accountCodeSchema, name: businessTextSchema, type: accountTypeSchema,
  currency: currencySchema, netDebitBalance: canonicalMoneySchema,
});
export const journalSummarySchema = z.strictObject({
  id: idSchema, kind: journalKindSchema, amount: positiveMoneyOutputSchema, currency: currencySchema,
  paymentReference: nullableReferenceSchema, payerName: nullableReferenceSchema,
  settledAt: utcInstantSchema, createdAt: utcInstantSchema,
  reversalOfId: idSchema.nullable(), reversedById: idSchema.nullable(),
});
export const postingViewSchema = z.strictObject({
  id: idSchema, accountId: idSchema, accountCode: accountCodeSchema, amount: postingMoneySchema,
});
export const reversalInputSchema = z.strictObject({ reason: z.string().trim().min(1).max(1000) });
export const journalDetailSchema = journalSummarySchema.safeExtend({
  postings: z.array(postingViewSchema).length(2),
  reversalReason: reversalInputSchema.shape.reason.nullable(), actorId: actorIdSchema,
});
export const reversalResultSchema = z.strictObject({
  originalJournalEntryId: idSchema, reversalJournalEntryId: idSchema,
  affectedInvoiceId: idSchema.nullable(), invoiceStatus: invoiceStatusSchema.nullable(),
});
export const accountListResponseSchema = listEnvelopeSchema(accountViewSchema);
export const journalListResponseSchema = listEnvelopeSchema(journalSummarySchema);
export const journalDetailResponseSchema = successEnvelopeSchema(journalDetailSchema);
export const reversalResponseSchema = successEnvelopeSchema(reversalResultSchema);

export type AccountView = z.output<typeof accountViewSchema>;
export type JournalSummary = z.output<typeof journalSummarySchema>;
export type JournalDetail = z.output<typeof journalDetailSchema>;
export type PostingView = z.output<typeof postingViewSchema>;
export type ReversalInput = z.output<typeof reversalInputSchema>;
export type ReversalResult = z.output<typeof reversalResultSchema>;
export type JournalQuery = z.output<typeof journalQuerySchema>;
