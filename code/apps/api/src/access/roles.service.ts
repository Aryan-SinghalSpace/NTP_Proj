import { Injectable } from '@nestjs/common';
import { asc, eq, sql } from 'drizzle-orm';
import { TenantDbService } from '../db/tenant-db.service';
import { currentTenant } from '../db/tenant-context';
import { role } from '../db/schema';
import { AppException } from '../common/errors/app-exception';
import { AuditService } from '../audit/audit.service';
import type { CreateRoleInput, UpdateRoleInput } from './access.dto';

@Injectable()
export class RolesService {
  constructor(
    private readonly db: TenantDbService,
    private readonly audit: AuditService,
  ) {}

  /** Roles for the tenant, each with a live member count (from tenant_user). */
  async list() {
    return this.db.run(async (tx) => {
      const roles = await tx.select().from(role).orderBy(asc(role.createdAt));
      const counts = await tx.execute(
        sql`select role_id, count(*)::int as n from tenant_user where role_id is not null group by role_id`,
      );
      const byRole = new Map<string, number>();
      for (const row of counts.rows as { role_id: string; n: number }[]) byRole.set(row.role_id, row.n);
      return roles.map((r) => ({ ...r, members: byRole.get(r.id) ?? 0 }));
    });
  }

  async create(input: CreateRoleInput) {
    const { tenantId } = currentTenant();
    return this.db.run(async (tx) => {
      try {
        const rows = await tx
          .insert(role)
          .values({
            tenantId: tenantId!,
            name: input.name,
            description: input.description ?? '',
            permissions: input.permissions ?? {},
            isSystem: false,
          })
          .returning();
        await this.audit.record({ action: 'Created', entity: 'role', entityId: input.name, diff: 'New role created.' });
        return { ...rows[0]!, members: 0 };
      } catch (err) {
        if ((err as { code?: string }).code === '23505') {
          throw new AppException('TW-ROLE-409-DUP', { detail: input.name, cause: err });
        }
        throw err;
      }
    });
  }

  async update(id: string, patch: UpdateRoleInput) {
    return this.db.run(async (tx) => {
      const found = await tx.select().from(role).where(eq(role.id, id)).limit(1);
      if (!found[0]) throw new AppException('TW-ROLE-404', { detail: `id ${id}` });
      try {
        const rows = await tx
          .update(role)
          .set({
            ...(patch.name !== undefined ? { name: patch.name } : {}),
            ...(patch.description !== undefined ? { description: patch.description } : {}),
            ...(patch.permissions !== undefined ? { permissions: patch.permissions } : {}),
            updatedAt: new Date(),
          })
          .where(eq(role.id, id))
          .returning();
        await this.audit.record({
          action: 'Updated',
          entity: 'role',
          entityId: rows[0]!.name,
          diff: patch.permissions ? 'Permission matrix updated.' : 'Role details updated.',
        });
        return rows[0];
      } catch (err) {
        if ((err as { code?: string }).code === '23505') {
          throw new AppException('TW-ROLE-409-DUP', { detail: patch.name, cause: err });
        }
        throw err;
      }
    });
  }
}
