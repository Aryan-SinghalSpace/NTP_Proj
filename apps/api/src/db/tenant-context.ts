import { AsyncLocalStorage } from 'node:async_hooks';

export type AppRole = 'tenant' | 'platform';

export interface TenantStore {
  tenantId: string | null;
  role: AppRole;
}

/**
 * Request-scoped tenant context. The TenantMiddleware populates it; the
 * TenantDbService reads it to set `app.tenant_id` / `app.role` per transaction,
 * which the Postgres RLS policies enforce.
 */
export const tenantStorage = new AsyncLocalStorage<TenantStore>();

export function currentTenant(): TenantStore {
  return tenantStorage.getStore() ?? { tenantId: null, role: 'tenant' };
}
