import { z } from 'zod';

const positiveInteger = z.number().int().min(1);
const queryInteger = z.union([
  positiveInteger,
  z.string().regex(/^[0-9]+$/)
    .refine((value) => value === value.trim())
    .transform(Number).pipe(positiveInteger),
]);

export const paginationQuerySchema = z.strictObject({
  page: queryInteger.default(1),
  limit: queryInteger.pipe(positiveInteger.max(100)).default(20),
});

export const paginationMetaSchema = z.strictObject({
  page: positiveInteger,
  limit: positiveInteger.max(100),
  total: z.number().int().nonnegative(),
  pages: z.number().int().nonnegative(),
}).refine((meta) => meta.pages === Math.ceil(meta.total / meta.limit), {
  message: 'Pages must equal the ceiling of total divided by limit',
  path: ['pages'],
});

export type PaginationQuery = z.output<typeof paginationQuerySchema>;
export type PaginationMeta = z.output<typeof paginationMetaSchema>;
