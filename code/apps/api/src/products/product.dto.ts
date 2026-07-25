import { z } from 'zod';

/**
 * Payload to create a draft product. GTIN is intentionally absent — a product is
 * born as a draft and its GTIN/identity is assigned at commit (invariant #7).
 * tenant_id is never accepted from the client; it comes from the request context.
 */
export const createProductSchema = z.object({
  brand: z.string().min(1),
  name: z.string().min(1),
  netContent: z.string().min(1),
  packType: z.string().min(1),
  country: z.string().min(1).optional(),
  brandOwner: z.string().min(1),
  category: z.string().min(1),
  attributes: z.record(z.string()).optional(),
});

export type CreateProductInput = z.infer<typeof createProductSchema>;
