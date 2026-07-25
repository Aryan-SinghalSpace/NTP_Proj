import { z } from 'zod';

/** Create a batch. tenant_id comes from request context, never the client body. */
export const createBatchSchema = z.object({
  productId: z.string().uuid(),
  batchNumber: z.string().trim().min(1),
  mfgDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(), // ISO date
  expiryDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  quantity: z.number().int().min(0).optional(),
  manufacturingUnitId: z.string().uuid().optional(),
  attributes: z.record(z.string()).optional(),
});

export type CreateBatchInput = z.infer<typeof createBatchSchema>;
