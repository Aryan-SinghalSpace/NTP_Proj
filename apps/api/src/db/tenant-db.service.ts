import { Injectable, OnModuleDestroy } from '@nestjs/common';
import { sql } from 'drizzle-orm';
import { drizzle, type NodePgDatabase } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import { env } from '../config/env';
import { currentTenant } from './tenant-context';
import * as schema from './schema';

export type Db = NodePgDatabase<typeof schema>;

/**
 * The only way the app touches the database. Every call runs inside a
 * transaction that first sets `app.role` / `app.tenant_id` as LOCAL settings
 * (via set_config(..., is_local => true)) so Postgres RLS scopes the query to
 * the current tenant. Transaction-scoped settings are pooling-safe.
 */
@Injectable()
export class TenantDbService implements OnModuleDestroy {
  private readonly pool = new Pool({ connectionString: env.DATABASE_URL });
  private readonly db: Db = drizzle(this.pool, { schema });

  async run<T>(fn: (tx: Db) => Promise<T>): Promise<T> {
    const { tenantId, role } = currentTenant();
    return this.db.transaction(async (tx) => {
      await tx.execute(sql`select set_config('app.role', ${role}, true)`);
      await tx.execute(sql`select set_config('app.tenant_id', ${tenantId ?? ''}, true)`);
      return fn(tx as unknown as Db);
    });
  }

  async onModuleDestroy(): Promise<void> {
    await this.pool.end();
  }
}
