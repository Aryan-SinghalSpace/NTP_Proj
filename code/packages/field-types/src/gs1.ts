/**
 * GS1 identity mechanics — opt-in conformance mode (PRD §16).
 * GTIN/GLN/SSCC stay validated attributes on top of the UUID identity;
 * these helpers validate/compute, they never mint storage keys.
 */

/** GS1 Modulo-10 check digit over the data portion (no check digit). */
export function gs1Mod10CheckDigit(dataDigits: string): number {
  if (!/^\d+$/.test(dataDigits)) {
    throw new Error('gs1Mod10CheckDigit: input must be digits only');
  }
  let sum = 0;
  const reversed = dataDigits.split('').reverse();
  for (let i = 0; i < reversed.length; i++) {
    // rightmost data digit (i = 0) is weighted x3, then alternate x1/x3
    const weight = i % 2 === 0 ? 3 : 1;
    sum += Number(reversed[i]) * weight;
  }
  return (10 - (sum % 10)) % 10;
}

function hasValidCheckDigit(full: string): boolean {
  const body = full.slice(0, -1);
  const check = Number(full.slice(-1));
  return gs1Mod10CheckDigit(body) === check;
}

/** GTIN-8 / GTIN-12 / GTIN-13 / GTIN-14. */
export function isValidGtin(gtin: string): boolean {
  if (!/^\d+$/.test(gtin)) return false;
  if (![8, 12, 13, 14].includes(gtin.length)) return false;
  return hasValidCheckDigit(gtin);
}

/** GLN — 13 digits. */
export function isValidGln(gln: string): boolean {
  return /^\d{13}$/.test(gln) && hasValidCheckDigit(gln);
}

/** SSCC — 18 digits. */
export function isValidSscc(sscc: string): boolean {
  return /^\d{18}$/.test(sscc) && hasValidCheckDigit(sscc);
}

/** Append the correct check digit to a body of data digits. */
export function withCheckDigit(dataDigits: string): string {
  return dataDigits + String(gs1Mod10CheckDigit(dataDigits));
}
