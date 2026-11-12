import { z } from 'zod';

import { canonicalMoneySchema, moneySchema } from './money';

export const idSchema = z.uuid();
export const utcInstantSchema = z.iso.datetime();
export const invoiceDateSchema = z.iso.date();
export const currencySchema = z.literal('USD');
export const businessTextSchema = z.string().trim().min(1).max(255);
export const actorIdSchema = z.string().trim().min(1).max(64);
export const eventTypeSchema = z.string().trim().min(1).max(64);
export const machineCodeSchema = z.string().trim().min(1).max(64);
export const invoiceStatusSchema = z.enum(['UNMATCHED', 'MATCHED', 'NEEDS_REVIEW']);
export const optionalReferenceSchema = z.string().trim().max(255)
  .transform((value) => value || undefined).optional();
export const nullableReferenceSchema = businessTextSchema.nullable();
export const positiveMoneyInputSchema = moneySchema.refine((value) => !value.startsWith('-') && value !== '0.00');
export const positiveMoneyOutputSchema = canonicalMoneySchema.refine((value) => !value.startsWith('-') && value !== '0.00');
export const postingMoneySchema = canonicalMoneySchema.refine((value) => value !== '0.00');
