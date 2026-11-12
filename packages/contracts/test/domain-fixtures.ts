export const IDS = {
  journal: '11111111-1111-4111-8111-111111111111',
  invoice: '22222222-2222-4222-8222-222222222222',
  account: '33333333-3333-4333-8333-333333333333',
  other: '44444444-4444-4444-8444-444444444444',
};
export const INSTANT = '2026-11-12T10:00:00.000Z';
export const SETTLED = {
  eventId: 'evt-1', eventType: 'payment.settled', paymentId: 'payment-1',
  amount: '10.00', currency: 'USD', settledAt: INSTANT,
};
export const INVOICE = {
  invoiceNumber: 'INV-1', vendorName: 'Synthetic vendor', invoiceDate: '2026-11-12',
  currency: 'USD', totalAmount: '10.00',
};
export const JOURNAL = {
  id: IDS.journal, kind: 'PAYMENT', amount: '10.00', currency: 'USD',
  paymentReference: null, payerName: null, settledAt: INSTANT, createdAt: INSTANT,
  reversalOfId: null, reversedById: null,
};
export const EVENT = {
  id: IDS.other, providerEventId: 'evt-1', eventType: 'payment.settled',
  status: 'COMPLETED', attemptCount: 1, retryable: false,
  journalEntryId: IDS.journal, lastErrorCode: null, createdAt: INSTANT, updatedAt: INSTANT,
};
export const INVOICE_VIEW = {
  ...INVOICE, id: IDS.invoice, paymentReference: null, status: 'UNMATCHED',
  currentJournalEntryId: null, createdAt: INSTANT, updatedAt: INSTANT,
};
export const APPROVAL = {
  id: IDS.other, invoiceId: IDS.invoice, journalEntryId: IDS.journal,
  approvedBy: 'demo-operator', approvedAt: INSTANT, current: true, invalidatedByReversalId: null,
};
export const ACCOUNT = {
  id: IDS.account, code: 'UNAPPLIED_RECEIPTS_USD', name: 'Clearing', type: 'LIABILITY',
  currency: 'USD', netDebitBalance: '-10.00',
};
export const JOURNAL_DETAIL = {
  ...JOURNAL,
  postings: [
    { id: IDS.account, accountId: IDS.account, accountCode: 'BANK_USD', amount: '10.00' },
    { id: IDS.other, accountId: IDS.other, accountCode: 'UNAPPLIED_RECEIPTS_USD', amount: '-10.00' },
  ], reversalReason: null, actorId: 'simulator',
};
export const CANDIDATE = {
  ...JOURNAL, evidence: {
    amountEqual: true, currencyEqual: true, referenceComparison: 'MISSING',
    payerName: null, dateDifferenceDays: -3,
  },
};
export const REVERSAL_RESULT = {
  originalJournalEntryId: IDS.journal, reversalJournalEntryId: IDS.other,
  affectedInvoiceId: IDS.invoice, invoiceStatus: 'NEEDS_REVIEW',
};
export const IMPORT_RESULT = {
  results: [
    { row: 1, outcome: 'CREATED', invoiceId: IDS.invoice, code: null, errors: [] },
    { row: 2, outcome: 'DUPLICATE', invoiceId: IDS.invoice, code: null, errors: [] },
    { row: 3, outcome: 'CONFLICT', invoiceId: IDS.invoice, code: 'INVOICE_CONTENT_CONFLICT', errors: [] },
    { row: 4, outcome: 'INVALID', invoiceId: null, code: 'INVALID_INPUT', errors: [{ path: '', code: 'invalid_type', message: 'Use an invoice object' }] },
  ], counts: { created: 1, duplicate: 1, conflict: 1, invalid: 1 },
};
