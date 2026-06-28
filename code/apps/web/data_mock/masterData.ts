/**
 * Mock data for the Master Data page (/master-data). Shaped to resemble what the
 * Identity & Master Data backend will serve: products keyed by an internal UUID
 * with GTIN/identity as validated attributes on top, plus manufacturers, brand
 * owners and pack hierarchy.
 *
 * NOTE: everything under `data_mock/` is temporary demo data. Delete this whole
 * folder once each page is wired to the live API.
 */

export type Tone = 'primary' | 'teal' | 'amber' | 'rose' | 'sky' | 'violet';

export interface MdKpi {
  label: string;
  value: string;
  foot: string;
  tone: Tone;
}

export const kpis: MdKpi[] = [
  { label: 'Active GTINs', value: '12,480', foot: '3,210 products', tone: 'primary' },
  { label: 'Products', value: '3,210', foot: '18 draft · 3,192 committed', tone: 'teal' },
  { label: 'Manufacturing units', value: '14', foot: 'across 6 plants', tone: 'violet' },
  { label: 'Brand owners', value: '6', foot: '11 brands linked', tone: 'amber' },
];

/** A locked identity attribute — frozen once the GTIN is committed (invariant 7). */
export interface IdentityField {
  label: string;
  value: string;
}

/** A pack-hierarchy level (Each → Case → Pallet). */
export interface PackLevel {
  level: string;
  scheme: string; // GTIN / SSCC
  code: string;
  qty: string;
}

export type ProductStatus = 'committed' | 'draft';

export interface Product {
  id: string; // internal UUID (truncated for display)
  gtin: string;
  name: string;
  brand: string;
  brandOwner: string;
  category: string;
  netContent: string;
  packType: string;
  country: string;
  status: ProductStatus;
  batches: number;
  swatch: Tone;
  // detail-drawer extras
  mrp: string;
  hsn: string;
  mfgUnit: string;
  shelfLife: string;
  recentBatches: { code: string; mfg: string; exp: string }[];
  hierarchy: PackLevel[];
}

const each = (gtin: string): PackLevel => ({ level: 'Each', scheme: 'GTIN', code: gtin, qty: '1 unit' });

export const products: Product[] = [
  {
    id: 'a1f2…9c0',
    gtin: '8901234 56789 0',
    name: 'Choco Bar 50g',
    brand: 'Velvet',
    brandOwner: 'Acme Foods Pvt Ltd',
    category: 'Confectionery',
    netContent: '50 g',
    packType: 'Flow wrap',
    country: 'India',
    status: 'committed',
    batches: 42,
    swatch: 'amber',
    mrp: '₹20.00',
    hsn: '1806',
    mfgUnit: 'Plant MUM-1',
    shelfLife: '9 months',
    recentBatches: [
      { code: 'B-240931', mfg: '02 Jun', exp: '02 Mar 27' },
      { code: 'B-240517', mfg: '17 May', exp: '17 Feb 27' },
    ],
    hierarchy: [
      each('8901234 56789 0'),
      { level: 'Case', scheme: 'GTIN', code: '1 8901234 56789 7', qty: '24 eaches' },
      { level: 'Pallet', scheme: 'SSCC', code: '0 0894321 000034921 8', qty: '48 cases' },
    ],
  },
  {
    id: 'b3c4…2a1',
    gtin: '8901234 56790 6',
    name: 'Oat Drink 1L',
    brand: 'Harvest',
    brandOwner: 'Acme Foods Pvt Ltd',
    category: 'Beverages',
    netContent: '1 L',
    packType: 'Tetra Pak',
    country: 'India',
    status: 'committed',
    batches: 28,
    swatch: 'teal',
    mrp: '₹110.00',
    hsn: '2202',
    mfgUnit: 'Plant PUN-2',
    shelfLife: '6 months',
    recentBatches: [
      { code: 'B-240488', mfg: '12 May', exp: '12 Nov 26' },
      { code: 'B-240402', mfg: '28 Apr', exp: '28 Oct 26' },
    ],
    hierarchy: [
      each('8901234 56790 6'),
      { level: 'Case', scheme: 'GTIN', code: '1 8901234 56790 3', qty: '12 eaches' },
      { level: 'Pallet', scheme: 'SSCC', code: '0 0894321 000034977 1', qty: '60 cases' },
    ],
  },
  {
    id: 'c5d6…7b3',
    gtin: '8901234 56791 3',
    name: 'Masala Namkeen 200g',
    brand: 'Velvet',
    brandOwner: 'Acme Foods Pvt Ltd',
    category: 'Snacks',
    netContent: '200 g',
    packType: 'Pillow pouch',
    country: 'India',
    status: 'committed',
    batches: 35,
    swatch: 'rose',
    mrp: '₹50.00',
    hsn: '2106',
    mfgUnit: 'Plant MUM-1',
    shelfLife: '4 months',
    recentBatches: [
      { code: 'B-240777', mfg: '20 May', exp: '20 Sep 26' },
      { code: 'B-240701', mfg: '06 May', exp: '06 Sep 26' },
    ],
    hierarchy: [
      each('8901234 56791 3'),
      { level: 'Case', scheme: 'GTIN', code: '1 8901234 56791 0', qty: '30 eaches' },
      { level: 'Pallet', scheme: 'SSCC', code: '0 0894321 000035012 4', qty: '40 cases' },
    ],
  },
  {
    id: 'd7e8…4c5',
    gtin: '8901234 56792 0',
    name: 'Cold Brew Coffee 250ml',
    brand: 'Harvest',
    brandOwner: 'Northstar Beverages',
    category: 'Beverages',
    netContent: '250 ml',
    packType: 'Glass bottle',
    country: 'India',
    status: 'committed',
    batches: 19,
    swatch: 'violet',
    mrp: '₹95.00',
    hsn: '2101',
    mfgUnit: 'Plant BLR-3',
    shelfLife: '3 months',
    recentBatches: [{ code: 'B-240655', mfg: '11 May', exp: '11 Aug 26' }],
    hierarchy: [
      each('8901234 56792 0'),
      { level: 'Case', scheme: 'GTIN', code: '1 8901234 56792 7', qty: '24 eaches' },
      { level: 'Pallet', scheme: 'SSCC', code: '0 0894321 000035098 6', qty: '50 cases' },
    ],
  },
  {
    id: 'e9f0…6d7',
    gtin: '— pending —',
    name: 'Protein Bar 40g',
    brand: 'Velvet',
    brandOwner: 'Acme Foods Pvt Ltd',
    category: 'Confectionery',
    netContent: '40 g',
    packType: 'Flow wrap',
    country: 'India',
    status: 'draft',
    batches: 0,
    swatch: 'sky',
    mrp: '₹60.00',
    hsn: '1806',
    mfgUnit: 'Plant MUM-1',
    shelfLife: '12 months',
    recentBatches: [],
    hierarchy: [each('— assigned at commit —')],
  },
  {
    id: 'f1a2…8e9',
    gtin: '— pending —',
    name: 'Sparkling Lime 330ml',
    brand: 'Harvest',
    brandOwner: 'Northstar Beverages',
    category: 'Beverages',
    netContent: '330 ml',
    packType: 'Aluminium can',
    country: 'India',
    status: 'draft',
    batches: 0,
    swatch: 'primary',
    mrp: '₹40.00',
    hsn: '2202',
    mfgUnit: 'Plant BLR-3',
    shelfLife: '8 months',
    recentBatches: [],
    hierarchy: [each('— assigned at commit —')],
  },
];

/** Returns the 6 GTIN-immutable identity attributes for a product. */
export function identityFields(p: Product): IdentityField[] {
  return [
    { label: 'GTIN', value: p.gtin },
    { label: 'Brand', value: p.brand },
    { label: 'Product Name', value: p.name },
    { label: 'Net Content', value: p.netContent },
    { label: 'Pack Type', value: p.packType },
    { label: 'Country of Origin', value: p.country },
  ];
}

export interface Manufacturer {
  id: string;
  name: string;
  code: string;
  location: string;
  identifier: string; // GLN or custom id
  products: number;
  status: 'active' | 'inactive';
}

export const manufacturers: Manufacturer[] = [
  { id: 'mu-1', name: 'Acme Plant — Mumbai 1', code: 'MUM-1', location: 'Bhiwandi, MH', identifier: 'GLN 8901234000017', products: 412, status: 'active' },
  { id: 'mu-2', name: 'Acme Plant — Pune 2', code: 'PUN-2', location: 'Chakan, MH', identifier: 'GLN 8901234000024', products: 286, status: 'active' },
  { id: 'mu-3', name: 'Northstar Plant — Bengaluru 3', code: 'BLR-3', location: 'Bommasandra, KA', identifier: 'GLN 8908765000031', products: 173, status: 'active' },
  { id: 'mu-4', name: 'Acme Co-pack — Surat', code: 'SUR-7', location: 'Sachin GIDC, GJ', identifier: 'CUST-COPACK-007', products: 64, status: 'inactive' },
];

export interface BrandOwner {
  id: string;
  name: string;
  gln: string;
  country: string;
  brands: number;
  products: number;
  status: 'active' | 'inactive';
}

export const brandOwners: BrandOwner[] = [
  { id: 'bo-1', name: 'Acme Foods Pvt Ltd', gln: '8901234000000', country: 'India', brands: 4, products: 2480, status: 'active' },
  { id: 'bo-2', name: 'Northstar Beverages', gln: '8908765000000', country: 'India', brands: 2, products: 540, status: 'active' },
  { id: 'bo-3', name: 'Sunrise Naturals', gln: '8907654000000', country: 'India', brands: 1, products: 190, status: 'active' },
];
