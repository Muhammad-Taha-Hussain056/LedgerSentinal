import { z } from 'zod';

import { paginationMetaSchema } from './pagination';

export const correlationIdSchema = z.string().regex(/^[A-Za-z0-9][A-Za-z0-9._-]{0,127}$/)
  .refine((value) => value === value.trim());

const nonblank = z.string().trim().min(1);

export const fieldErrorSchema = z.strictObject({
  path: z.string(),
  code: nonblank,
  message: nonblank,
});

export const problemSchema = z.strictObject({
  type: z.url().default('about:blank'),
  title: nonblank,
  status: z.number().int().min(400).max(599),
  detail: nonblank.optional(),
  instance: z.string().regex(/^\/(?!\/)[^?#\r\n]*$/).optional(),
  code: nonblank,
  correlationId: correlationIdSchema,
  errors: z.array(fieldErrorSchema).optional(),
});

export const successMetaSchema = z.strictObject({ correlationId: correlationIdSchema });
export const listMetaSchema = paginationMetaSchema.safeExtend({ correlationId: correlationIdSchema });

export function successEnvelopeSchema<TSchema extends z.ZodType>(data: TSchema) {
  return z.strictObject({ data, meta: successMetaSchema });
}

export function listEnvelopeSchema<TSchema extends z.ZodType>(item: TSchema) {
  return z.strictObject({ data: z.array(item).max(100), meta: listMetaSchema })
    .refine((list) => list.data.length <= list.meta.limit && list.data.length <= list.meta.total, {
      message: 'List data must fit the declared limit and total',
      path: ['data'],
    });
}

export type FieldError = z.output<typeof fieldErrorSchema>;
export type Problem = z.output<typeof problemSchema>;
export type SuccessMeta = z.output<typeof successMetaSchema>;
export type ListMeta = z.output<typeof listMetaSchema>;
export type SuccessEnvelope<T> = z.output<ReturnType<typeof successEnvelopeSchema<z.ZodType<T>>>>;
export type ListEnvelope<T> = z.output<ReturnType<typeof listEnvelopeSchema<z.ZodType<T>>>>;
