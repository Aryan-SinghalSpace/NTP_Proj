import { z } from 'zod';

export const createDealerSchema = z.object({
  name: z.string().trim().min(1),
  city: z.string().trim().optional(),
  identifier: z.string().trim().optional(),
});
export type CreateDealerInput = z.infer<typeof createDealerSchema>;

export const createShipmentSchema = z.object({
  batchId: z.string().uuid(),
  legs: z
    .array(z.object({ dealerId: z.string().uuid(), units: z.number().int().min(1) }))
    .min(1),
});
export type CreateShipmentInput = z.infer<typeof createShipmentSchema>;

export const updateLegSchema = z.object({
  status: z.enum(['loading', 'in_transit', 'delivered']).optional(),
  receivedUnits: z.number().int().min(0).optional(),
});
export type UpdateLegInput = z.infer<typeof updateLegSchema>;
