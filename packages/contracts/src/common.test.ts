import { describe, expect, it } from 'vitest';
import { z } from 'zod';

import {
  MAX_MONEY_CENTS, canonicalMoneySchema, centsToMoney, moneySchema, moneyToCents,
  paginationQuerySchema, paginationMetaSchema, successEnvelopeSchema, listEnvelopeSchema,
  problemSchema,
} from './index';

describe('exact money transport', () => {
  it.each([
    ['0', '0.00'], ['0.1', '0.10'], ['12', '12.00'], ['00012.3', '12.30'],
    ['-0', '0.00'], ['-0.00', '0.00'], ['-001.20', '-1.20'],
    ['9999999999999999.99', '9999999999999999.99'],
    ['-9999999999999999.99', '-9999999999999999.99'],
  ])('normalizes %s without approximation', (input, canonical) => {
    expect(moneySchema.parse(input)).toBe(canonical);
    expect(centsToMoney(moneyToCents(input))).toBe(canonical);
    expect(canonicalMoneySchema.parse(canonical)).toBe(canonical);
  });

  it.each([
    '', ' ', ' 1', '1 ', '+1', '.10', '1.', '1.005', '-1.005', '1e2', '1E2',
    '1,000.00', 'NaN', 'Infinity', '-Infinity', '0x10', '١.٠٠', '1\n',
    '10000000000000000', '-10000000000000000.00',
    0.1, Number.NaN, Infinity, null, undefined, true, {}, 1n,
  ])('rejects invalid or out-of-range input %s', (input) => {
    expect(moneySchema.safeParse(input).success).toBe(false);
    expect(() => moneyToCents(input)).toThrow();
  });

  it('adds cents exactly and preserves values above Number.MAX_SAFE_INTEGER', () => {
    expect(moneyToCents('0.10') + moneyToCents('0.20')).toBe(30n);
    expect(MAX_MONEY_CENTS).toBe(999999999999999999n);
    expect(moneyToCents('9999999999999999.99')).toBe(MAX_MONEY_CENTS);
    expect(centsToMoney(-MAX_MONEY_CENTS)).toBe('-9999999999999999.99');
    expect(() => centsToMoney(MAX_MONEY_CENTS + 1n)).toThrow();
    expect(() => centsToMoney(-MAX_MONEY_CENTS - 1n)).toThrow();
  });

  it.each(['1', '1.2', '01.20', '-0.00'])('rejects noncanonical output %s', (input) => {
    expect(canonicalMoneySchema.safeParse(input).success).toBe(false);
  });
});

describe('bounded pagination', () => {
  it('defaults to page 1 and limit 20 and accepts integer query strings', () => {
    expect(paginationQuerySchema.parse({})).toEqual({ page: 1, limit: 20 });
    expect(paginationQuerySchema.parse({ page: '2', limit: '100' })).toEqual({ page: 2, limit: 100 });
  });

  it.each([0, -1, 1.5, '', ' ', '1.0', '1e2', '+1', true, null, [], '9007199254740992'])('rejects invalid page %s', (page) => {
    expect(paginationQuerySchema.safeParse({ page }).success).toBe(false);
  });

  it('rejects oversized limits and unknown authority/filter fields', () => {
    expect(paginationQuerySchema.safeParse({ limit: 101 }).success).toBe(false);
    expect(paginationQuerySchema.safeParse({ organizationId: 'caller-supplied' }).success).toBe(false);
  });

  it('keeps empty and populated totals consistent without rejecting an empty later page', () => {
    expect(paginationMetaSchema.parse({ page: 2, limit: 20, total: 0, pages: 0 }).pages).toBe(0);
    expect(paginationMetaSchema.parse({ page: 1, limit: 20, total: 21, pages: 2 }).pages).toBe(2);
    expect(paginationMetaSchema.safeParse({ page: 1, limit: 20, total: 21, pages: 1 }).success).toBe(false);
    expect(paginationMetaSchema.safeParse({ page: 1, limit: 20, total: -1, pages: 0 }).success).toBe(false);
  });
});

describe('success envelopes and safe problems', () => {
  const correlationId = 'req-123';
  const data = z.strictObject({ amount: canonicalMoneySchema });
  const problem = {
    type: 'urn:ledgersentinel:problem:invalid-input', title: 'Invalid input', status: 400,
    detail: 'Correct the amount and try again.', instance: '/v1/invoices/import',
    code: 'INVALID_INPUT', correlationId,
    errors: [{ path: 'records.0.totalAmount', code: 'invalid_format', message: 'Use at most two decimals.' }],
  };

  it('validates the named data and common/list metadata without an extra success wrapper', () => {
    const success = { data: { amount: '0.10' }, meta: { correlationId } };
    expect(successEnvelopeSchema(data).parse(success)).toEqual(success);
    const list = { data: [], meta: { correlationId, page: 1, limit: 20, total: 0, pages: 0 } };
    expect(listEnvelopeSchema(data).parse(list)).toEqual(list);
    expect(listEnvelopeSchema(data).parse({ ...list, meta: { ...list.meta, page: 2 } }).data).toEqual([]);
    expect(successEnvelopeSchema(data).safeParse({ ...success, success: true }).success).toBe(false);
    expect(listEnvelopeSchema(data).safeParse({ ...list, data: [{ amount: '0.1' }] }).success).toBe(false);
  });

  it.each([
    { count: 2, limit: 1, total: 2, pages: 2 },
    { count: 101, limit: 100, total: 101, pages: 2 },
    { count: 1, limit: 20, total: 0, pages: 0 },
  ])('rejects list data inconsistent with its bounds: %j', ({ count, limit, total, pages }) => {
    const list = {
      data: Array.from({ length: count }, () => ({ amount: '0.10' })),
      meta: { correlationId, page: 1, limit, total, pages },
    };
    expect(listEnvelopeSchema(data).safeParse(list).success).toBe(false);
  });

  it('retains RFC members and declared field errors and defaults a standard type', () => {
    expect(problemSchema.parse(problem)).toEqual(problem);
    expect(problemSchema.parse({ title: 'Forbidden', status: 403, code: 'FORBIDDEN', correlationId }).type).toBe('about:blank');
  });

  it.each([199, 200, 399, 600, 400.5])('rejects non-error HTTP status %s', (status) => {
    expect(problemSchema.safeParse({ ...problem, status }).success).toBe(false);
  });

  it.each(['/v1/invoices?token=secret', '/v1/invoices#fragment', '//external.test/path', 'https://external.test', '/v1/invoices\n'])('rejects an unsafe instance %s', (instance) => {
    expect(problemSchema.safeParse({ ...problem, instance }).success).toBe(false);
  });

  it('rejects unknown diagnostic fields, unsafe correlation IDs and success envelopes', () => {
    expect(problemSchema.safeParse({ ...problem, stack: 'internal trace' }).success).toBe(false);
    expect(problemSchema.safeParse({ ...problem, correlationId: 'req\r\ninjected: yes' }).success).toBe(false);
    expect(problemSchema.safeParse({ data: problem, meta: { correlationId } }).success).toBe(false);
    expect(problemSchema.safeParse({ ...problem, errors: [{ ...problem.errors[0], rejectedValue: 'secret' }] }).success).toBe(false);
  });
});
