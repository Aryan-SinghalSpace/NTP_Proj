import { z } from 'zod';
import { FIELD_DATA_TYPES, type FieldDataType } from './field-types';
import { isValidGtin } from './gs1';

/**
 * Tenant-authored validation rules attached to a field definition.
 * Drives a compiled Zod schema used to validate attribute values.
 */
export const validationRuleSchema = z.object({
  required: z.boolean().optional(),
  min: z.number().optional(),
  max: z.number().optional(),
  minLength: z.number().int().nonnegative().optional(),
  maxLength: z.number().int().nonnegative().optional(),
  regex: z.string().optional(),
  /** key of another field that, when set, makes this field required */
  requiredIf: z.string().optional(),
});
export type ValidationRule = z.infer<typeof validationRuleSchema>;

export interface ValueSchemaSpec {
  dataType: FieldDataType;
  rules?: ValidationRule;
  options?: string[];
}

/**
 * Build a Zod schema for a single field's *value* from its data type and
 * rules. This is the runtime half of "strict typing" — the same function
 * runs on the client (block bad input early) and the server (authoritative).
 */
export function buildValueSchema(spec: ValueSchemaSpec): z.ZodTypeAny {
  const { dataType, rules = {}, options = [] } = spec;
  let schema: z.ZodTypeAny;

  switch (dataType) {
    case 'text':
    case 'rich_text':
    case 'file':
    case 'signature':
    case 'batch_ref':
    case 'unit_ref': {
      let s = z.string();
      if (rules.minLength !== undefined) s = s.min(rules.minLength);
      if (rules.maxLength !== undefined) s = s.max(rules.maxLength);
      if (rules.regex) s = s.regex(new RegExp(rules.regex));
      schema = s;
      break;
    }
    case 'gtin': {
      schema = z.string().refine(isValidGtin, { message: 'Invalid GTIN (check digit failed)' });
      break;
    }
    case 'number': {
      let s = z.number().int();
      if (rules.min !== undefined) s = s.min(rules.min);
      if (rules.max !== undefined) s = s.max(rules.max);
      schema = s;
      break;
    }
    case 'decimal': {
      let s = z.number();
      if (rules.min !== undefined) s = s.min(rules.min);
      if (rules.max !== undefined) s = s.max(rules.max);
      schema = s;
      break;
    }
    case 'boolean':
      schema = z.boolean();
      break;
    case 'date':
      schema = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Expected YYYY-MM-DD');
      break;
    case 'datetime':
      schema = z.string().datetime({ offset: true });
      break;
    case 'single_select':
      schema = options.length ? z.enum(options as [string, ...string[]]) : z.string();
      break;
    case 'multi_select':
      schema = z.array(options.length ? z.enum(options as [string, ...string[]]) : z.string());
      break;
    case 'geo':
      schema = z.object({ lat: z.number().min(-90).max(90), lng: z.number().min(-180).max(180) });
      break;
    default: {
      // exhaustiveness guard
      const _never: never = dataType;
      throw new Error(`Unhandled data type: ${String(_never)}`);
    }
  }

  return rules.required ? schema : schema.optional().nullable();
}

/** Sanity export so callers can confirm the data-type list matches. */
export const SUPPORTED_DATA_TYPES = FIELD_DATA_TYPES;
