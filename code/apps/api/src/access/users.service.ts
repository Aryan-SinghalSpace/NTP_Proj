import { Injectable } from '@nestjs/common';
import { desc, eq } from 'drizzle-orm';
import { TenantDbService } from '../db/tenant-db.service';
import { currentTenant } from '../db/tenant-context';
import { tenantUser, role } from '../db/schema';
import { AppException } from '../common/errors/app-exception';
import { AuditService } from '../audit/audit.service';
import type { CreateUserInput } from './access.dto';

@Injectable()
export class UsersService {
  constructor(
    private readonly db: TenantDbService,
    private readonly audit: AuditService,
  ) {}

  /** Tenant users with their role name (left-joined). RLS-scoped. */
  list() {
    return this.db.run((tx) =>
      tx
        .select({
          id: tenantUser.id,
          name: tenantUser.name,
          email: tenantUser.email,
          roleId: tenantUser.roleId,
          roleName: role.name,
          status: tenantUser.status,
          lastActiveAt: tenantUser.lastActiveAt,
          createdAt: tenantUser.createdAt,
        })
        .from(tenantUser)
        .leftJoin(role, eq(tenantUser.roleId, role.id))
        .orderBy(desc(tenantUser.createdAt)),
    );
  }

  /** Invite a user (starts as 'invited'). */
  async create(input: CreateUserInput) {
    const { tenantId } = currentTenant();
    return this.db.run(async (tx) => {
      try {
        const rows = await tx
          .insert(tenantUser)
          .values({
            tenantId: tenantId!,
            name: input.name,
            email: input.email,
            roleId: input.roleId ?? null,
            status: 'invited',
          })
          .returning();
        await this.audit.record({
          action: 'Created',
          entity: 'tenant_user',
          entityId: input.email,
          diff: `Invited ${input.name}.`,
        });
        return rows[0];
      } catch (err) {
        if ((err as { code?: string }).code === '23505') {
          throw new AppException('TW-USER-409-DUP', { detail: input.email, cause: err });
        }
        throw err;
      }
    });
  }
}
