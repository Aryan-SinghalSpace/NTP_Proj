import { Injectable } from '@nestjs/common';
import { asc, desc, eq } from 'drizzle-orm';
import { TenantDbService } from '../db/tenant-db.service';
import { currentTenant } from '../db/tenant-context';
import { tenant, tenantUser, role } from '../db/schema';
import { AppException } from '../common/errors/app-exception';
import { AuditService } from '../audit/audit.service';

interface TenantPatch {
  name?: string;
  settings?: Record<string, unknown>;
}

@Injectable()
export class TenantService {
  constructor(
    private readonly db: TenantDbService,
    private readonly audit: AuditService,
  ) {}

  /** The current tenant's profile + settings. */
  async get() {
    const { tenantId } = currentTenant();
    const rows = await this.db.run((tx) => tx.select().from(tenant).where(eq(tenant.id, tenantId!)).limit(1));
    if (!rows[0]) throw new AppException('TW-GEN-404', { detail: `tenant ${tenantId}` });
    return rows[0];
  }

  /** Update name + settings only (tier/status/slug stay platform-managed). */
  async update(patch: TenantPatch) {
    const { tenantId } = currentTenant();
    const current = await this.get();
    const mergedSettings = {
      ...((current.settings as Record<string, unknown>) ?? {}),
      ...(patch.settings ?? {}),
    };
    const rows = await this.db.run((tx) =>
      tx
        .update(tenant)
        .set({
          ...(patch.name !== undefined ? { name: patch.name } : {}),
          settings: mergedSettings,
          updatedAt: new Date(),
        })
        .where(eq(tenant.id, tenantId!))
        .returning(),
    );
    await this.audit.record({
      action: 'Updated',
      entity: 'tenant',
      entityId: current.slug,
      diff: 'Tenant settings updated.',
    });
    return rows[0];
  }

  /**
   * The current user (auth stand-in): the active Tenant Admin, else the first
   * user. Real OIDC will resolve this from the verified token.
   */
  async me() {
    const rows = await this.db.run((tx) =>
      tx
        .select({
          id: tenantUser.id,
          name: tenantUser.name,
          email: tenantUser.email,
          roleName: role.name,
          status: tenantUser.status,
        })
        .from(tenantUser)
        .leftJoin(role, eq(tenantUser.roleId, role.id))
        .orderBy(desc(role.isSystem), asc(tenantUser.createdAt)),
    );
    const admin = rows.find((u) => u.roleName === 'Tenant Admin' && u.status === 'active') ?? rows[0];
    return admin ?? null;
  }
}
