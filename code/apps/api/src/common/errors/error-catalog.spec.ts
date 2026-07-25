import { describe, it, expect } from 'vitest';
import { ERROR_CATALOG } from './error-catalog';
import { AppException } from './app-exception';

describe('error catalog', () => {
  const entries = Object.entries(ERROR_CATALOG);

  it('every entry is internally consistent (code key === code field)', () => {
    for (const [key, def] of entries) {
      expect(def.code).toBe(key);
      expect(def.httpStatus).toBeGreaterThanOrEqual(400);
      expect(def.message.length).toBeGreaterThan(0);
      expect(def.internal.length).toBeGreaterThan(0);
    }
  });

  it('friendly messages never leak internal wording (no "RLS"/stack/SQL codes)', () => {
    for (const [, def] of entries) {
      expect(def.message).not.toMatch(/RLS|unique_violation|23505|stack|null|undefined/i);
    }
  });

  it('AppException carries the catalog status + code + friendly message', () => {
    const ex = new AppException('TW-PROD-400-GTIN', { detail: 'gtin 123' });
    expect(ex.code).toBe('TW-PROD-400-GTIN');
    expect(ex.getStatus()).toBe(ERROR_CATALOG['TW-PROD-400-GTIN'].httpStatus);
    expect((ex.getResponse() as { message: string }).message).toBe(ERROR_CATALOG['TW-PROD-400-GTIN'].message);
    // internal detail is appended, never sent to the client body
    expect(ex.internal).toContain('gtin 123');
    expect(ex.internal).toContain(ERROR_CATALOG['TW-PROD-400-GTIN'].internal);
  });

  it('has the invariant-critical product/batch/event codes', () => {
    for (const code of ['TW-PROD-409-COMMITTED', 'TW-PROD-409-GTIN-TAKEN', 'TW-BATCH-409-DUP', 'TW-EVENT-409-IDEMPOTENT']) {
      expect(ERROR_CATALOG).toHaveProperty(code);
      expect(ERROR_CATALOG[code as keyof typeof ERROR_CATALOG].httpStatus).toBe(409);
    }
  });
});
