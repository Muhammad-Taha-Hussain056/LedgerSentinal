import { z } from 'zod';

import {
  actorIdSchema, businessTextSchema, currencySchema, idSchema, invoiceDateSchema,
  invoiceStatusSchema, machineCodeSchema, nullableReferenceSchema, optionalReferenceSchema,
  positiveMoneyInputSchema, positiveMoneyOutputSchema, utcInstantSchema,
} from './domain-primitives';
import { journalSummarySchema } from './ledger';
import { paginationQuerySchema } from './pagination';
import { fieldErrorSchema, listEnvelopeSchema, successEnvelopeSchema } from './problem';

export const invoiceInputSchema = z.strictObject({
  invoiceNumber: businessTextSchema, vendorName: businessTextSchema, invoiceDate: invoiceDateSchema,
  currency: currencySchema, totalAmount: positiveMoneyInputSchema, paymentReference: optionalReferenceSchema,
});
// Preserve each raw row for independent validation and partial-success reporting.
export const invoiceImportSchema = z.strictObject({ records: z.array(z.unknown()).min(1).max(100) });
export const importOutcomeSchema = z.enum(['CREATED', 'DUPLICATE', 'CONFLICT', 'INVALID']);
export const importRowResultSchema = z.strictObject({
  row: z.number().int().min(1).max(100), outcome: importOutcomeSchema,
  invoiceId: idSchema.nullable(), code: machineCodeSchema.nullable(), errors: z.array(fieldErrorSchema),
});
const countSchema = z.number().int().min(0).max(100);
export const importCountsSchema = z.strictObject({
  created: countSchema, duplicate: countSchema, conflict: countSchema, invalid: countSchema,
});
export const importResultSchema = z.strictObject({
  results: z.array(importRowResultSchema).min(1).max(100), counts: importCountsSchema,
}).superRefine((result, context) => {
  const counts = { CREATED: 0, DUPLICATE: 0, CONFLICT: 0, INVALID: 0 };
  result.results.forEach((row, index) => {
    counts[row.outcome] += 1;
    if (row.row !== index + 1) context.addIssue({ code: 'custom', path: ['results', index, 'row'], message: 'Rows must retain input order' });
  });
  for (const [outcome, field] of [['CREATED', 'created'], ['DUPLICATE', 'duplicate'], ['CONFLICT', 'conflict'], ['INVALID', 'invalid']] as const) {
    if (result.counts[field] !== counts[outcome]) context.addIssue({ code: 'custom', path: ['counts', field], message: 'Count must match row outcomes' });
  }
});
// Response absence is explicit null, intentionally different from optional input.
export const invoiceViewSchema = invoiceInputSchema.extend({
  id: idSchema, totalAmount: positiveMoneyOutputSchema, paymentReference: nullableReferenceSchema,
  status: invoiceStatusSchema, currentJournalEntryId: idSchema.nullable(),
  createdAt: utcInstantSchema, updatedAt: utcInstantSchema,
});
export const invoiceQuerySchema = paginationQuerySchema.safeExtend({ status: invoiceStatusSchema.optional() });
export const invoiceParamsSchema = z.strictObject({ id: idSchema });
export const candidateParamsSchema = z.strictObject({ invoiceId: idSchema });
export const candidateEvidenceSchema = z.strictObject({
  amountEqual: z.boolean(), currencyEqual: z.boolean(),
  referenceComparison: z.enum(['EXACT', 'DIFFERENT', 'MISSING']),
  payerName: nullableReferenceSchema, dateDifferenceDays: z.number().int(),
});
export const candidateViewSchema = journalSummarySchema.safeExtend({ evidence: candidateEvidenceSchema });
export const approvalInputSchema = z.strictObject({ journalEntryId: idSchema });
export const approvalViewSchema = z.strictObject({
  id: idSchema, invoiceId: idSchema, journalEntryId: idSchema, approvedBy: actorIdSchema,
  approvedAt: utcInstantSchema, current: z.boolean(), invalidatedByReversalId: idSchema.nullable(),
});
export const importResponseSchema = successEnvelopeSchema(importResultSchema);
export const invoiceListResponseSchema = listEnvelopeSchema(invoiceViewSchema);
export const invoiceResponseSchema = successEnvelopeSchema(invoiceViewSchema);
export const candidateListResponseSchema = listEnvelopeSchema(candidateViewSchema);
export const approvalResponseSchema = successEnvelopeSchema(approvalViewSchema);
export const matchHistoryResponseSchema = listEnvelopeSchema(approvalViewSchema);

export type InvoiceInput = z.output<typeof invoiceInputSchema>;
export type InvoiceImport = z.output<typeof invoiceImportSchema>;
export type ImportResult = z.output<typeof importResultSchema>;
export type InvoiceView = z.output<typeof invoiceViewSchema>;
export type InvoiceQuery = z.output<typeof invoiceQuerySchema>;
export type CandidateView = z.output<typeof candidateViewSchema>;
export type ApprovalInput = z.output<typeof approvalInputSchema>;
export type ApprovalView = z.output<typeof approvalViewSchema>;
