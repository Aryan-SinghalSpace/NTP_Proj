import { z } from 'zod';
import {
  FIELD_DATA_TYPES,
  FIELD_ENTITIES,
  FIELD_STATUSES,
  FIELD_TIERS,
} from './field-types';
import { validationRuleSchema } from './validation';

/**
 * The canonical shape of a Field Library definition, shared client/server.
 * (The DB row carries more bookkeeping columns; this is the domain shape.)
 */
export const fieldDefinitionSchema = z.object({
  id: z.string().uuid(),
  version: z.number().int().positive(),
  tier: z.enum(FIELD_TIERS),
  tenantId: z.string().uuid().nullable(),
  entity: z.enum(FIELD_ENTITIES),
  key: z
    .string()
    .min(1)
    .regex(/^[a-z][a-z0-9_]*$/, 'key must be snake_case'),
  displayName: z.string().min(1),
  dataType: z.enum(FIELD_DATA_TYPES),
  validation: validationRuleSchema.default({}),
  options: z.array(z.string()).default([]),
  derived: z.record(z.unknown()).nullable().default(null),
  status: z.enum(FIELD_STATUSES).default('active'),
  isLocked: z.boolean().default(false),
});

export type FieldDefinition = z.infer<typeof fieldDefinitionSchema>;
