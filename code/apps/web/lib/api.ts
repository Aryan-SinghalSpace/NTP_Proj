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
