import { z } from 'zod';
import { FIELD_ENTITIES, FIELD_DATA_TYPES } from '@tracewell/field-types';

/**
 * Create a Tenant Custom field. Tenant admins can only add tenant_custom fields
 * (tier is forced server-side); Core/Super are managed by the platform. Keys are
 * snake_case identifiers so they bind cleanly in the workflow/label builders.
 */
export const createFieldSchema = z.object({
  entity: z.enum(FIELD_ENTITIES),
  key: z.string().trim().regex(/^[a-z][a-z0-9_]*$/, 'must be snake_case (a-z, 0-9, _)'),
  displayName: z.string().trim().min(1),
  dataType: z.enum(FIELD_DATA_TYPES),
  required: z.boolean().optional(),
});

export type CreateFieldInput = z.infer<typeof createFieldSchema>;
