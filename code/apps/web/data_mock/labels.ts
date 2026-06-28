/**
 * Mock data for the Label Designer (/labels): WYSIWYG label templates rendered
 * with Zint, scannability validation and multi-format output.
 *
 * NOTE: everything under `data_mock/` is temporary demo data. Delete this whole
 * folder once each page is wired to the live API.
 */

export interface LabelField {
  label: string;
  value: string;
  mono?: boolean;
}

export interface LabelTemplate {
  id: string;
  name: string;
  symbology: string;
  size: string;
  fields: LabelField[];
  /** human-readable barcode payload */
  payload: string;
}

export const templates: LabelTemplate[] = [
  {
    id: 'tpl_unit',
    name: 'Unit · GS1 DataMatrix',
    symbology: 'GS1 DataMatrix',
    size: '25 × 25 mm',
    payload: '(01)08901234567890(10)B-240931(17)270302',
    fields: [
      { label: 'Product', value: 'Choco Bar 50g' },
      { label: 'GTIN', value: '8901234 56789 0', mono: true },
      { label: 'Batch', value: 'B-240931', mono: true },
      { label: 'Expiry', value: '02 Mar 2027' },
    ],
  },
  {
    id: 'tpl_case',
    name: 'Case · GS1-128',
    symbology: 'GS1-128',
    size: '100 × 50 mm',
    payload: '(01)18901234567897(37)24(10)B-240931',
    fields: [
      { label: 'Product', value: 'Choco Bar 50g · Case' },
      { label: 'GTIN', value: '1 8901234 56789 7', mono: true },
      { label: 'Qty', value: '24 eaches' },
      { label: 'Batch', value: 'B-240931', mono: true },
    ],
  },
  {
    id: 'tpl_pallet',
    name: 'Pallet · SSCC',
    symbology: 'GS1-128 (SSCC)',
    size: '150 × 100 mm',
    payload: '(00)008943210000349218',
    fields: [
      { label: 'SSCC', value: '0 0894321 000034921 8', mono: true },
      { label: 'Contains', value: '48 cases' },
      { label: 'Ship to', value: 'Mumbai DC' },
    ],
  },
];

export interface ScanCheck {
  label: string;
  ok: boolean;
  note: string;
}

export const scannability: ScanCheck[] = [
  { label: 'Quiet zone', ok: true, note: '≥ 4× module width' },
  { label: 'Module size', ok: true, note: '0.33 mm (≥ min)' },
  { label: 'Contrast', ok: true, note: '78% (≥ 40%)' },
  { label: 'Check digit', ok: true, note: 'GS1 mod-10 valid' },
  { label: 'Print resolution', ok: false, note: '203 dpi — 300 dpi advised for unit size' },
];

export const outputFormats = ['PDF', 'PNG', 'ZPL', 'Excel'] as const;
