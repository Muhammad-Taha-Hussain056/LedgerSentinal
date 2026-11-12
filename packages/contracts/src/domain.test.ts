import { describe, expect, it } from 'vitest';
import type { ZodType } from 'zod';

import { ACCOUNT, APPROVAL, CANDIDATE, EVENT, IDS, IMPORT_RESULT, INSTANT, INVOICE, INVOICE_VIEW, JOURNAL, JOURNAL_DETAIL, REVERSAL_RESULT, SETTLED } from '../test/domain-fixtures';
import {
  simulatorEventSchema, settledSimulatorEventSchema, eventOutcomeSchema, ingestionQuerySchema,
  retryInputSchema, healthResponseSchema, invoiceInputSchema, invoiceImportSchema,
  importResultSchema, invoiceViewSchema, invoiceQuerySchema, candidateViewSchema,
  approvalInputSchema, approvalViewSchema, accountViewSchema, journalSummarySchema,
  journalDetailSchema, journalQuerySchema, reversalInputSchema, reversalResultSchema,
  invoiceListResponseSchema, journalDetailResponseSchema, approvalResponseSchema,
  accountListResponseSchema, journalListResponseSchema, reversalResponseSchema,
  eventListResponseSchema, eventOutcomeResponseSchema, importResponseSchema,
  invoiceResponseSchema, candidateListResponseSchema, matchHistoryResponseSchema,
} from './index';

describe('simulator and processing transport', () => {
  it('normalizes a settled event and requires only settled financial fields', () => {
    expect(settledSimulatorEventSchema.parse({ ...SETTLED, amount: '00010.0' }).amount).toBe('10.00');
    for (const field of ['amount', 'currency', 'settledAt']) {
      const incomplete: Record<string, unknown> = { ...SETTLED };
      delete incomplete[field];
      expect(simulatorEventSchema.safeParse(incomplete).success).toBe(false);
    }
  });
  it.each(['payment.pending', 'payment.failed', 'provider.future-event'])('permits %s without a fake settlement timestamp', (eventType) => {
    expect(simulatorEventSchema.parse({ eventId: 'e', eventType, paymentId: 'p' }).eventType).toBe(eventType);
    expect(simulatorEventSchema.safeParse({ eventId: 'e', eventType, paymentId: 'p', amount: '1.005' }).success).toBe(false);
  });
  it.each([0, '0', '-1', '1.005', '1e2', '10000000000000000'])('rejects nonpositive/inexact settled amount %s', (amount) => {
    expect(simulatorEventSchema.safeParse({ ...SETTLED, amount }).success).toBe(false);
  });
  it.each(['PKR', 'usd', '', null])('rejects non-USD currency %s', (currency) => {
    expect(simulatorEventSchema.safeParse({ ...SETTLED, currency }).success).toBe(false);
  });
  it.each(['2026-02-30T10:00:00Z', '2026-11-12', '2026-11-12T10:00:00+01:00'])('rejects invalid/non-UTC instant %s', (settledAt) => {
    expect(simulatorEventSchema.safeParse({ ...SETTLED, settledAt }).success).toBe(false);
  });
  it.each(['actorId', 'provider', 'status', 'journalEntryId', 'workspaceId', 'organizationId'])('rejects caller-owned authority field %s', (field) => {
    expect(simulatorEventSchema.safeParse({ ...SETTLED, [field]: 'untrusted' }).success).toBe(false);
  });
  it('validates projections, bounded queries, strict empty retry and health envelope', () => {
    expect(eventOutcomeSchema.parse(EVENT)).toEqual(EVENT);
    expect(eventOutcomeSchema.safeParse({ ...EVENT, payload: SETTLED }).success).toBe(false);
    expect(eventOutcomeSchema.safeParse({ ...EVENT, status: 'SUCCESS' }).success).toBe(false);
    expect(ingestionQuerySchema.parse({ status: 'FAILED' })).toEqual({ page: 1, limit: 20, status: 'FAILED' });
    expect(ingestionQuerySchema.safeParse({ status: 'UNKNOWN' }).success).toBe(false);
    expect(retryInputSchema.parse({})).toEqual({});
    expect(retryInputSchema.safeParse({ processingVersion: 1 }).success).toBe(false);
    expect(healthResponseSchema.parse({ data: { status: 'ok' }, meta: { correlationId: 'req-1' } }).data.status).toBe('ok');
  });
});

describe('ledger transport', () => {
  const detail = JOURNAL_DETAIL;
  const postings = detail.postings;
  it('accepts signed balances, positive journal magnitude and two signed postings', () => {
    const account = ACCOUNT;
    expect(accountViewSchema.parse(account).netDebitBalance).toBe('-10.00');
    expect(journalSummarySchema.parse(JOURNAL).amount).toBe('10.00');
    expect(journalDetailSchema.parse(detail).postings).toHaveLength(2);
    expect(journalDetailResponseSchema.parse({ data: detail, meta: { correlationId: 'req-1' } }).data.actorId).toBe('simulator');
  });
  it('rejects invalid enum, UUID, noncanonical/zero magnitude and posting cardinality', () => {
    for (const change of [{ kind: 'CREDIT' }, { id: 'not-uuid' }, { amount: '10.0' }, { amount: '0.00' }]) {
      expect(journalSummarySchema.safeParse({ ...JOURNAL, ...change }).success).toBe(false);
    }
    expect(journalDetailSchema.safeParse({ ...detail, postings: postings.slice(0, 1) }).success).toBe(false);
    expect(journalDetailSchema.safeParse({ ...detail, postings: [...postings, postings[0]] }).success).toBe(false);
    expect(journalDetailSchema.safeParse({ ...detail, postings: postings.map((p) => ({ ...p, amount: '0.00' })) }).success).toBe(false);
    expect(journalQuerySchema.parse({ kind: 'PAYMENT' })).toEqual({ page: 1, limit: 20, kind: 'PAYMENT' });
    expect(journalQuerySchema.safeParse({ kind: 'UNKNOWN' }).success).toBe(false);
  });
  it('accepts only a bounded reason for reversal input and named result identifiers', () => {
    expect(reversalInputSchema.parse({ reason: '  Duplicate entry  ' })).toEqual({ reason: 'Duplicate entry' });
    for (const input of [{ reason: '' }, { reason: ' ' }, { reason: 'a'.repeat(1001) }, { reason: 'fix', actorId: 'caller' }, { reason: 'fix', postings }]) {
      expect(reversalInputSchema.safeParse(input).success).toBe(false);
    }
    expect(reversalResultSchema.parse({ originalJournalEntryId: IDS.journal, reversalJournalEntryId: IDS.other, affectedInvoiceId: null, invoiceStatus: null }).affectedInvoiceId).toBeNull();
  });
});

interface ResponseFixture { readonly name: string; readonly schema: ZodType; readonly value: unknown }
const success = (data: unknown) => ({ data, meta: { correlationId: 'response-example' } });
const list = (data: unknown[]) => ({ data, meta: { correlationId: 'response-example', page: 1, limit: 20, total: data.length, pages: data.length ? 1 : 0 } });
const responses: ResponseFixture[] = [
  { name: 'accounts', schema: accountListResponseSchema, value: list([ACCOUNT]) },
  { name: 'journals', schema: journalListResponseSchema, value: list([JOURNAL]) },
  { name: 'journal detail', schema: journalDetailResponseSchema, value: success(JOURNAL_DETAIL) },
  { name: 'reversal', schema: reversalResponseSchema, value: success(REVERSAL_RESULT) },
  { name: 'processing list', schema: eventListResponseSchema, value: list([EVENT]) },
  { name: 'processing detail/accept/retry', schema: eventOutcomeResponseSchema, value: success(EVENT) },
  { name: 'mixed import', schema: importResponseSchema, value: success(IMPORT_RESULT) },
  { name: 'invoices', schema: invoiceListResponseSchema, value: list([INVOICE_VIEW]) },
  { name: 'invoice detail', schema: invoiceResponseSchema, value: success(INVOICE_VIEW) },
  { name: 'candidates', schema: candidateListResponseSchema, value: list([CANDIDATE]) },
  { name: 'approval', schema: approvalResponseSchema, value: success(APPROVAL) },
  { name: 'historical approval', schema: matchHistoryResponseSchema, value: list([{ ...APPROVAL, current: false, invalidatedByReversalId: IDS.other }]) },
];
it.each(responses)('validates the named $name response envelope', ({ schema, value }) => {
  expect(schema.safeParse(value).success).toBe(true);
});

describe('invoice and reconciliation transport', () => {
  it('trims business text, preserves identity case, and permits missing/blank references', () => {
    const parsed = invoiceInputSchema.parse({ ...INVOICE, invoiceNumber: '  inv-1  ', paymentReference: '   ', totalAmount: '10' });
    expect(parsed.invoiceNumber).toBe('inv-1');
    expect(parsed.totalAmount).toBe('10.00');
    expect(parsed.paymentReference).toBeUndefined();
    expect(invoiceInputSchema.parse(INVOICE).paymentReference).toBeUndefined();
    expect(invoiceInputSchema.safeParse({ ...INVOICE, paymentReference: null }).success).toBe(false);
  });
  it.each(['2026-02-30', '2025-02-29', '2026-11-12T00:00:00Z', '12/11/2026'])('rejects invalid invoice date %s', (invoiceDate) => {
    expect(invoiceInputSchema.safeParse({ ...INVOICE, invoiceDate }).success).toBe(false);
  });
  it.each(['id', 'status', 'actorId', 'approvedBy', 'currentJournalEntryId', 'workspaceId'])('rejects imported authority/mutable field %s', (field) => {
    expect(invoiceInputSchema.safeParse({ ...INVOICE, [field]: 'untrusted' }).success).toBe(false);
  });
  it('preserves malformed rows in a valid envelope for independent validation', () => {
    const records = [INVOICE, { ...INVOICE, status: 'MATCHED' }, { ...INVOICE, totalAmount: '1.005' }, null];
    const envelope = invoiceImportSchema.parse({ records });
    expect(envelope.records.map((row) => invoiceInputSchema.safeParse(row).success)).toEqual([true, false, false, false]);
    expect(invoiceImportSchema.safeParse({ records, actorId: 'caller' }).success).toBe(false);
    expect(invoiceImportSchema.safeParse({ records: [] }).success).toBe(false);
    expect(invoiceImportSchema.safeParse({ records: Array.from({ length: 101 }, () => INVOICE) }).success).toBe(false);
  });
  it('validates ordered per-row outcomes and truthful counts', () => {
    const result = {
      results: [
        { row: 1, outcome: 'CREATED', invoiceId: IDS.invoice, code: null, errors: [] },
        { row: 2, outcome: 'INVALID', invoiceId: null, code: 'INVALID_INPUT', errors: [{ path: 'totalAmount', code: 'invalid_format', message: 'Use exact cents' }] },
      ], counts: { created: 1, duplicate: 0, conflict: 0, invalid: 1 },
    };
    expect(importResultSchema.parse(result)).toEqual(result);
    expect(importResultSchema.safeParse({ ...result, counts: { ...result.counts, created: 2 } }).success).toBe(false);
    expect(importResultSchema.safeParse({ ...result, results: [...result.results].reverse() }).success).toBe(false);
  });
  it('validates invoice/approval history and candidate evidence without a score or required reference', () => {
    expect(invoiceViewSchema.parse(INVOICE_VIEW)).toEqual(INVOICE_VIEW);
    expect(invoiceQuerySchema.parse({ status: 'NEEDS_REVIEW' })).toEqual({ page: 1, limit: 20, status: 'NEEDS_REVIEW' });
    const candidate = { ...JOURNAL, evidence: { amountEqual: true, currencyEqual: true, referenceComparison: 'MISSING', payerName: null, dateDifferenceDays: -3 } };
    expect(candidateViewSchema.parse(candidate).evidence.referenceComparison).toBe('MISSING');
    expect(candidateViewSchema.safeParse({ ...candidate, score: 95 }).success).toBe(false);
    expect(candidateViewSchema.safeParse({ ...candidate, evidence: { ...candidate.evidence, referenceComparison: 'SIMILAR' } }).success).toBe(false);
    expect(approvalInputSchema.parse({ journalEntryId: IDS.journal })).toEqual({ journalEntryId: IDS.journal });
    expect(approvalInputSchema.safeParse({ journalEntryId: IDS.journal, approvedBy: 'caller' }).success).toBe(false);
    expect(approvalViewSchema.parse(APPROVAL)).toEqual(APPROVAL);
    expect(approvalResponseSchema.parse({ data: APPROVAL, meta: { correlationId: 'req-1' } }).data.approvedBy).toBe('demo-operator');
    expect(invoiceListResponseSchema.parse({ data: [INVOICE_VIEW], meta: { correlationId: 'req-1', page: 1, limit: 20, total: 1, pages: 1 } }).data).toHaveLength(1);
    expect(invoiceInputSchema.safeParse({ ...INVOICE, vendorName: ' ' }).success).toBe(false);
    expect(invoiceViewSchema.safeParse({ ...INVOICE_VIEW, createdAt: new Date(INSTANT) }).success).toBe(false);
  });
});
