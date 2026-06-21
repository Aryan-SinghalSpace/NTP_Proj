import { describe, it, expect } from 'vitest';
import { gs1Mod10CheckDigit, isValidGtin, isValidGln, isValidSscc, withCheckDigit } from './gs1';

describe('GS1 mod-10', () => {
  it('computes a known EAN-13 check digit', () => {
    // 4006381333931 is a canonical valid GTIN-13
    expect(gs1Mod10CheckDigit('400638133393')).toBe(1);
    expect(withCheckDigit('400638133393')).toBe('4006381333931');
  });

  it('validates GTIN lengths and check digit', () => {
    expect(isValidGtin('4006381333931')).toBe(true);
    expect(isValidGtin('4006381333930')).toBe(false); // wrong check digit
    expect(isValidGtin('40063813339311')).toBe(false); // wrong length (14 but invalid)
    expect(isValidGtin('abc')).toBe(false);
  });

  it('validates GLN (13) and SSCC (18) shapes', () => {
    const gln = withCheckDigit('890123456789'); // 12 body + check = 13
    expect(isValidGln(gln)).toBe(true);
    expect(isValidGln('123')).toBe(false);

    const sscc = withCheckDigit('00890123456789012'); // 17 body + check = 18
    expect(isValidSscc(sscc)).toBe(true);
    expect(isValidSscc('123')).toBe(false);
  });
});
