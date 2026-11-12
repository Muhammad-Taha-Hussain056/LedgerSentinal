import { z } from 'zod';

export const MAX_MONEY_CENTS = 999999999999999999n;

function withinMagnitude(value: string): boolean {
  const whole = value.replace(/^-/, '').split('.')[0] ?? '';
  return whole.replace(/^0+/, '').length <= 16;
}

function parseDecimal(value: string): bigint {
  const negative = value.startsWith('-');
  const unsigned = negative ? value.slice(1) : value;
  const [whole = '0', fraction = ''] = unsigned.split('.');
  const cents = BigInt(whole) * 100n + BigInt(fraction.padEnd(2, '0'));
  return negative ? -cents : cents;
}

function formatCents(cents: bigint): string {
  const magnitude = cents < 0n ? -cents : cents;
  return `${cents < 0n ? '-' : ''}${magnitude / 100n}.${(magnitude % 100n).toString().padStart(2, '0')}`;
}

const decimalInputSchema = z.string()
  .regex(/^-?[0-9]+(?:\.[0-9]{1,2})?$/)
  // Reject surrounding whitespace explicitly rather than normalizing monetary input.
  .refine((value) => value === value.trim(), 'Money must not contain surrounding whitespace')
  .refine(withinMagnitude, 'Money exceeds the supported magnitude');

export const moneySchema = decimalInputSchema.transform((value) => formatCents(parseDecimal(value)));

export const canonicalMoneySchema = z.string()
  .regex(/^-?(?:0|[1-9][0-9]{0,15})\.[0-9]{2}$/)
  .refine((value) => value === value.trim() && value !== '-0.00', 'Use canonical exact money');

export type Money = z.output<typeof canonicalMoneySchema>;

export function moneyToCents(value: unknown): bigint {
  return parseDecimal(moneySchema.parse(value));
}

export function centsToMoney(value: bigint): Money {
  const cents = z.bigint().min(-MAX_MONEY_CENTS).max(MAX_MONEY_CENTS).parse(value);
  return formatCents(cents);
}
