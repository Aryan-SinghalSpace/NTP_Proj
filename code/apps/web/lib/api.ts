const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000';

// Demo tenant seeded by apps/api/drizzle/0001_seed.sql. Real auth replaces this.
const DEMO_TENANT = '00000000-0000-0000-0000-000000000001';

export interface FieldDefinitionRow {
  id: string;
  version: number;
  tier: string;
  entity: string;
  key: string;
  displayName: string;
  dataType: string;
  status: string;
  isLocked: boolean;
}

export async function getFields(entity: string): Promise<FieldDefinitionRow[]> {
  const res = await fetch(`${API_BASE}/api/fields?entity=${encodeURIComponent(entity)}`, {
    headers: { 'x-tenant-id': DEMO_TENANT },
    cache: 'no-store',
  });
  if (!res.ok) {
    throw new Error(`API responded ${res.status}`);
  }
  return (await res.json()) as FieldDefinitionRow[];
}

/* ── Products (Identity & Master Data) ──────────────────────── */

/** A product row exactly as the API returns it (drizzle camelCases the columns). */
export interface ApiProduct {
  id: string;
  tenantId: string;
  gtin: string | null; // null while draft — assigned at commit (invariant 7)
  brand: string;
  name: string;
  netContent: string;
  packType: string;
  country: string;
  brandOwner: string;
  category: string;
  attributes: Record<string, string>; // mrp, hsn, mfgUnit, shelfLife…
  status: 'draft' | 'committed';
  committedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface CreateProductPayload {
  brand: string;
  name: string;
  netContent: string;
  packType: string;
  country?: string;
  brandOwner: string;
  category: string;
  attributes?: Record<string, string>;
}

/** The current tenant's products. RLS on the API scopes them to the tenant. */
export async function getProducts(): Promise<ApiProduct[]> {
  const res = await fetch(`${API_BASE}/api/products`, {
    headers: { 'x-tenant-id': DEMO_TENANT },
    cache: 'no-store',
  });
  if (!res.ok) {
    throw new Error(`API responded ${res.status}`);
  }
  return (await res.json()) as ApiProduct[];
}

/** Create a draft product. Runs the POST /api/products write path through RLS. */
export async function createProduct(payload: CreateProductPayload): Promise<ApiProduct> {
  const res = await fetch(`${API_BASE}/api/products`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'x-tenant-id': DEMO_TENANT },
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    const detail = await res.text().catch(() => '');
    throw new Error(`API responded ${res.status}${detail ? `: ${detail}` : ''}`);
  }
  return (await res.json()) as ApiProduct;
}

/* ── Manufacturing units & brand owners (product counts derived live) ─────── */

export interface ApiManufacturingUnit {
  id: string;
  name: string;
  code: string;
  location: string;
  identifier: string;
  status: 'active' | 'inactive';
  products: number; // derived from the product table
}

export interface ApiBrandOwner {
  id: string;
  name: string;
  gln: string | null;
  country: string;
  status: 'active' | 'inactive';
  products: number; // derived
  brands: number; // derived (distinct brand)
}

async function getJson<T>(path: string): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    headers: { 'x-tenant-id': DEMO_TENANT },
    cache: 'no-store',
  });
  if (!res.ok) throw new Error(`API responded ${res.status}`);
  return (await res.json()) as T;
}

/** Commit a draft product: assign a GTIN and lock its identity (invariant 7). */
export async function commitProduct(id: string, gtin: string): Promise<ApiProduct> {
  const res = await fetch(`${API_BASE}/api/products/${id}/commit`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'x-tenant-id': DEMO_TENANT },
    body: JSON.stringify({ gtin }),
  });
  if (!res.ok) {
    let msg = `API responded ${res.status}`;
    try {
      const j = await res.json();
      if (j?.message) msg = Array.isArray(j.message) ? j.message.join(', ') : String(j.message);
    } catch {
      /* keep default */
    }
    throw new Error(msg);
  }
  return (await res.json()) as ApiProduct;
}

export function getManufacturingUnits(): Promise<ApiManufacturingUnit[]> {
  return getJson<ApiManufacturingUnit[]>('/api/manufacturing-units');
}

export function getBrandOwners(): Promise<ApiBrandOwner[]> {
  return getJson<ApiBrandOwner[]>('/api/brand-owners');
}
