import { describe, it, expect } from 'vitest';
import { buildValueSchema } from './validation';

describe('buildValueSchema', () => {
  it('enforces required text with length + regex', () => {
    const schema = buildValueSchema({
      dataType: 'text',
      rules: { required: true, maxLength: 20, regex: '^D-[0-9]{4}$' },
    });
    expect(schema.safeParse('D-1234').success).toBe(true);
    expect(schema.safeParse('nope').success).toBe(false);
    expect(schema.safeParse(undefined).success).toBe(false); // required
  });

  it('allows null/undefined when not required', () => {
    const schema = buildValueSchema({ dataType: 'decimal', rules: { min: 0 } });
    expect(schema.safeParse(undefined).success).toBe(true);
    expect(schema.safeParse(-5).success).toBe(false);
    expect(schema.safeParse(12.5).success).toBe(true);
  });

  it('validates a GTIN value', () => {
    const schema = buildValueSchema({ dataType: 'gtin', rules: { required: true } });
    expect(schema.safeParse('4006381333931').success).toBe(true);
    expect(schema.safeParse('4006381333930').success).toBe(false);
  });

  it('restricts single_select to options', () => {
    const schema = buildValueSchema({
      dataType: 'single_select',
      rules: { required: true },
      options: ['A', 'B'],
    });
    expect(schema.safeParse('A').success).toBe(true);
    expect(schema.safeParse('C').success).toBe(false);
  });
});
