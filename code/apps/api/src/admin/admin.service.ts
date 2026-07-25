import { Injectable } from '@nestjs/common';
import { and, asc, eq, sql } from 'drizzle-orm';
import { TenantDbService } from '../db/tenant-db.service';
import { currentTenant } from '../db/tenant-context';
import { tenant, tenantUser, product, event, fieldDefinition, approvalRequest } from '../db/schema';
import { AppException } from '../common/errors/app-exception';

/**
 * Platform Super-Admin queries — cross-tenant. Requires the platform role
 * (x-platform: 1 stand-in until real auth). With that role, RLS returns rows
 * across all tenants; the guard below refuses non-platform callers.
 */
@Injectable()
export class AdminService {
  constructor(private readonly db: TenantDbService) {}

  private assertPlatform() {
    if (currentTenant().role !== 'platform') {
      throw new AppException('TW-TENANT-403', { detail: 'admin endpoint requires platform role' });
    }
  }

  async tenants() {
    this.assertPlatform();
    return this.db.run(async (tx) => {
      const rows = await tx.select().from(tenant).orderBy(asc(tenant.createdAt));
      const users = await tx.execute(sql`select tenant_id, count(*)::int n from tenant_user group by 1`);
      const products = await tx.execute(sql`select tenant_id, count(*)::int n from product group by 1`);
      const events = await tx.execute(sql`select tenant_id, count(*)::int n from event group by 1`);
      const um = new Map((users.rows as { tenant_id: string; n: number }[]).map((r) => [r.tenant_id, r.n]));
      const pm = new Map((products.rows as { tenant_id: string; n: number }[]).map((r) => [r.tenant_id, r.n]));
      const em = new Map((events.rows as { tenant_id: string; n: number }[]).map((r) => [r.tenant_id, r.n]));
      return rows.map((t) => ({
        id: t.id,
        name: t.name,
        slug: t.slug,
        region: t.region,
        tier: t.tier,
        status: t.status,
        users: um.get(t.id) ?? 0,
        products: pm.get(t.id) ?? 0,
        events: em.get(t.id) ?? 0,
        since: t.createdAt,
      }));
    });
  }

  async superFields() {
    this.assertPlatform();
    return this.db.run(async (tx) => {
      const fields = await tx
        .select()
        .from(fieldDefinition)
        .where(eq(fieldDefinition.tier, 'super'))
        .orderBy(asc(fieldDefinition.key));
      const promotions = await tx
        .select()
        .from(approvalRequest)
        .where(and(eq(approvalRequest.kind, 'field-promotion'), eq(approvalRequest.status, 'pending')));
      return { fields, promotions };
    });
  }

  async usage() {
    this.assertPlatform();
    return this.db.run(async (tx) => {
      const tenants = await tx.select().from(tenant);
      const totalEvents = Number(((await tx.execute(sql`select count(*)::int n from event`)).rows[0] as { n: number }).n);
      const totalProducts = Number(((await tx.execute(sql`select count(*)::int n from product`)).rows[0] as { n: number }).n);
      const byTenant = await tx.execute(sql`
        select t.name, count(e.id)::int as events
        from tenant t left join event e on e.tenant_id = t.id
        group by t.id, t.name order by events desc limit 6
      `);
      const rows = byTenant.rows as { name: string; events: number }[];
      const grand = rows.reduce((n, r) => n + r.events, 0) || 1;
      return {
        tenantsActive: tenants.filter((t) => t.status === 'active').length,
        tenantsOnboarding: tenants.filter((t) => t.status === 'onboarding').length,
        tenantsSuspended: tenants.filter((t) => t.status === 'suspended').length,
        totalTenants: tenants.length,
        totalEvents,
        totalProducts,
        topTenants: rows.map((r) => ({ name: r.name, events: r.events, share: Math.round((r.events / grand) * 100) })),
      };
    });
  }
}
