/**
 * Mock data for the Identity Schemes config page (/identity-schemes). Shaped to
 * resemble tenant identity-scheme configuration: GTIN (primary), UUID and custom
 * schemes, each with a status, a validation-rule summary and allocation info.
 *
 * NOTE: everything under `data_mock/` is temporary demo data. Delete this whole
 * folder once each page is wired to the live API.
 */

export type SchemeTone = 'success' | 'info' | 'violet' | 'teal';

export interface IdentityScheme {
  id: string;
  name: string;
  short: string;
  primary: boolean;
  enabled: boolean;
  tone: SchemeTone;
  summary: string;
  /** validation rule summary lines */
  rules: string[];
  /** allocation / range info lines, label → value */
  allocation: { label: string; value: string; mono?: boolean }[];
}

export const schemes: IdentityScheme[] = [
  {
    id: 'sch_gtin',
    name: 'GTIN',
    short: 'Global Trade Item Number',
    primary: true,
    enabled: true,
    tone: 'success',
    summary: 'GS1 14-digit trade-item identity. Primary scheme — used on labels and as the default product key.',
    rules: [
      'mod-10 check digit (GS1 algorithm)',
      'length ∈ {8, 12, 13, 14}; normalised to GTIN-14',
      'company prefix must match registered licence',
    ],
    allocation: [
      { label: 'Company prefix', value: '890 1234', mono: true },
      { label: 'Allocated', value: '3,210 of 100,000' },
      { label: 'Indicator digits', value: '0–8 (pack levels)' },
      { label: 'Allocation mode', value: 'Manual + bulk import' },
    ],
  },
  {
    id: 'sch_uuid',
    name: 'UUID',
    short: 'Universally Unique Identifier',
    primary: false,
    enabled: true,
    tone: 'info',
    summary: 'Internal v4 UUID — every entity carries one regardless of scheme. First-class fallback identity.',
    rules: [
      'RFC 4122 v4 format check',
      'collision-checked against the tenant namespace',
      'immutable once assigned',
    ],
    allocation: [
      { label: 'Generator', value: 'Server-side v4' },
      { label: 'Assigned', value: '3,214 entities' },
      { label: 'Namespace', value: 'tnt_acme', mono: true },
      { label: 'Allocation mode', value: 'Auto on create' },
    ],
  },
  {
    id: 'sch_custom',
    name: 'Custom',
    short: 'Tenant-defined identifiers',
    primary: false,
    enabled: true,
    tone: 'violet',
    summary: 'Tenant-defined coded identities for internal SKUs, asset tags and legacy codes. Validated by regex.',
    rules: [
      'regex pattern per scheme',
      'optional prefix + sequence allocation',
      'uniqueness scoped to the scheme',
    ],
    allocation: [
      { label: 'Active schemes', value: '3' },
      { label: 'Codes issued', value: '1,940' },
      { label: 'Sequence padding', value: '6 digits' },
      { label: 'Allocation mode', value: 'Sequence / manual' },
    ],
  },
];

export interface CustomScheme {
  id: string;
  name: string;
  pattern: string;
  example: string;
  scope: string;
  issued: number;
  enabled: boolean;
}

export const customSchemes: CustomScheme[] = [
  {
    id: 'cs_sku',
    name: 'Internal SKU',
    pattern: '^SKU-[A-Z]{2}-\\d{6}$',
    example: 'SKU-FD-004821',
    scope: 'Product',
    issued: 1210,
    enabled: true,
  },
  {
    id: 'cs_asset',
    name: 'Asset Tag',
    pattern: '^AT\\d{8}$',
    example: 'AT00194872',
    scope: 'Manufacturing unit',
    issued: 642,
    enabled: true,
  },
  {
    id: 'cs_legacy',
    name: 'Legacy ERP code',
    pattern: '^[0-9]{4}-[0-9]{4}$',
    example: '4821-0093',
    scope: 'Product',
    issued: 88,
    enabled: false,
  },
];
