/**
 * The canonical field-type system. Shared by the API (validation, workflow
 * Validate node) and the web app (builder / label designer / forms) so that
 * "strict typing" (invariant #3) is enforced identically on both sides.
 */

export const FIELD_DATA_TYPES = [
  'text',
  'number',
  'decimal',
  'boolean',
  'date',
  'datetime',
  'single_select',
  'multi_select',
  'file',
  'gtin',
  'batch_ref',
  'unit_ref',
  'geo',
  'signature',
  'rich_text',
] as const;

export type FieldDataType = (typeof FIELD_DATA_TYPES)[number];

export const FIELD_TIERS = ['core', 'super', 'tenant_custom'] as const;
export type FieldTier = (typeof FIELD_TIERS)[number];

export const FIELD_STATUSES = ['active', 'deactivated'] as const;
export type FieldStatus = (typeof FIELD_STATUSES)[number];

/**
 * Entities that can carry Field Library attributes.
 */
export const FIELD_ENTITIES = [
  'product',
  'batch',
  'unit',
  'event',
  'label',
  'location',
] as const;
export type FieldEntity = (typeof FIELD_ENTITIES)[number];

/**
 * Which data types may be bound where the workflow/label expects a given
 * input type. Used by the builder to block mismatched bindings.
 */
export function isAssignable(source: FieldDataType, target: FieldDataType): boolean {
  if (source === target) return true;
  // a GTIN/batch/unit ref is a specialised text identifier
  if (target === 'text' && (source === 'gtin' || source === 'batch_ref' || source === 'unit_ref')) {
    return true;
  }
  // an integer number satisfies a decimal slot
  if (target === 'decimal' && source === 'number') return true;
  return false;
}
