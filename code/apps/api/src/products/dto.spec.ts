import { describe, it, expect } from 'vitest';
import { createProductSchema, commitProductSchema } from './product.dto';
import { createBatchSchema } from '../batches/batch.dto';
import { createEventSchema, EVENT_TYPES } from '../events/event.dto';

describe('product DTOs', () => {
  const valid = {
    brand: 'Velvet',
    name: 'Choco Bar 50g',
    netContent: '50 g',
    packType: 'Flow wrap',
    brandOwner: 'Acme Foods Pvt Ltd',
    category: 'Confectionery',
  };

  it('accepts a valid create payload and rejects missing required fields', () => {
    expect(createProductSchema.safeParse(valid).success).toBe(true);
    expect(createProductSchema.safeParse({ ...valid, name: '' }).success).toBe(false);
    expect(createProductSchema.safeParse({ brand: 'x' }).success).toBe(false);
  });

  it('never trusts a tenantId or gtin from the create body (not in schema)', () => {
    const parsed = createProductSchema.parse({ ...valid, tenantId: 'evil', gtin: '123' } as never);
    expect(parsed).not.toHaveProperty('tenantId');
    expect(parsed).not.toHaveProperty('gtin');
  });

  it('commit requires a non-empty gtin string', () => {
    expect(commitProductSchema.safeParse({ gtin: '8901234567890' }).success).toBe(true);
    expect(commitProductSchema.safeParse({ gtin: '' }).success).toBe(false);
    expect(commitProductSchema.safeParse({}).success).toBe(false);
  });
});

describe('batch DTO', () => {
  it('requires a productId (uuid) + batchNumber and validates date format', () => {
    const base = { productId: '00000000-0000-0000-0000-000000000001', batchNumber: 'B-1' };
    expect(createBatchSchema.safeParse(base).success).toBe(true);
    expect(createBatchSchema.safeParse({ ...base, mfgDate: '2026-06-02' }).success).toBe(true);
    expect(createBatchSchema.safeParse({ ...base, mfgDate: '02-06-2026' }).success).toBe(false);
    expect(createBatchSchema.safeParse({ productId: 'not-a-uuid', batchNumber: 'B-1' }).success).toBe(false);
  });
});

describe('event DTO', () => {
  it('only accepts the 14 v1 event types', () => {
    expect(EVENT_TYPES).toHaveLength(14);
    expect(createEventSchema.safeParse({ eventType: 'Commission' }).success).toBe(true);
    expect(createEventSchema.safeParse({ eventType: 'Frobnicate' }).success).toBe(false);
  });
});
