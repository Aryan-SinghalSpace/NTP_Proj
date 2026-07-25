import { Client } from 'pg';
import { randomUUID } from 'node:crypto';
import { env } from '../src/config/env';
import { tenantStorage, type AppRole } from '../src/db/tenant-context';

/** Run `fn` inside a tenant context (what the middleware does per request). */
export function asTenant<T>(tenantId: string | null, fn: () => Promise<T>, role: AppRole = 'tenant'): Promise<T> {
  return tenantStorage.run({ tenantId, role, requestId: 'test' }, fn);
}

/** A privileged (owner) client — used ONLY for fixture setup/teardown; bypasses RLS. */
export async function ownerClient(): Promise<Client> {
  const c = new Client({ connectionString: env.MIGRATION_DATABASE_URL });
  await c.connect();
  return c;
}

// Child tables to purge (FK-safe order) when tearing a test tenant down.
const CHILD_TABLES = [
  'audit_entry',
  'event',
  'shipment_leg',
  'shipment',
  'batch',
  'product',
  'tenant_user',
  'role',
  'field_definition',
  'manufacturing_unit',
  'brand_owner',
  'identity_scheme',
  'approval_request',
  'notification_rule',
  'notification_delivery',
  'dealer',
  'label_template',
  'workflow_version',
  'workflow_definition',
];

/**
 * Create an isolated test tenant (as owner, so setup itself isn't RLS-bound) and
 * return a cleanup that removes it and everything scoped to it. The code under
 * test still runs as the RLS-enforced app role.
 */
export async function makeTestTenant(owner: Client): Promise<{ id: string }> {
  const id = randomUUID();
  await owner.query('INSERT INTO tenant (id, name, slug) VALUES ($1, $2, $3)', [id, 'Test Tenant', `test-${id.slice(0, 8)}`]);
  return { id };
}

export async function dropTestTenant(owner: Client, id: string): Promise<void> {
  for (const table of CHILD_TABLES) {
    await owner.query(`DELETE FROM ${table} WHERE tenant_id = $1`, [id]);
  }
  await owner.query('DELETE FROM tenant WHERE id = $1', [id]);
}
