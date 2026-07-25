import { Injectable } from '@nestjs/common';
import { asc, desc, eq } from 'drizzle-orm';
import { z } from 'zod';
import { TenantDbService } from '../db/tenant-db.service';
import { currentTenant } from '../db/tenant-context';
import { identityScheme } from '../db/schema';
import { AppException } from '../common/errors/app-exception';
import { AuditService } from '../audit/audit.service';

export const createSchemeSchema = z.object({
  name: z.string().trim().min(1),
  pattern: z.string().trim().min(1),
  example: z.string().trim().optional(),
  scope: z.string().trim().optional(),
});
export type CreateSchemeInput = z.infer<typeof createSchemeSchema>;

@Injectable()
export class IdentitySchemesService {
  constructor(
    private readonly db: TenantDbService,
    private readonly audit: AuditService,
  ) {}

  /** All schemes for the tenant (standard cards first, then custom). */
  list() {
    return this.db.run((tx) =>
      tx.select().from(identityScheme).orderBy(desc(identityScheme.kind), asc(identityScheme.name)),
    );
  }

  async setEnabled(id: string, enabled: boolean) {
    const rows = await this.db.run((tx) =>
      tx.update(identityScheme).set({ enabled, updatedAt: new Date() }).where(eq(identityScheme.id, id)).returning(),
    );
    if (!rows[0]) throw new AppException('TW-GEN-404', { detail: `scheme ${id}` });
    await this.audit.record({
      action: enabled ? 'Reactivated' : 'Deactivated',
      entity: 'identity_scheme',
      entityId: rows[0].name,
      diff: `enabled → ${enabled}`,
    });
    return rows[0];
  }

  async create(input: CreateSchemeInput) {
    const { tenantId } = currentTenant();
    const rows = await this.db.run((tx) =>
      tx
        .insert(identityScheme)
        .values({
          tenantId: tenantId!,
          kind: 'custom',
          name: input.name,
          pattern: input.pattern,
          example: input.example ?? null,
          scope: input.scope ?? 'Product',
          enabled: true,
        })
        .returning(),
    );
    await this.audit.record({
      action: 'Created',
      entity: 'identity_scheme',
      entityId: input.name,
      diff: `custom scheme · pattern ${input.pattern}`,
    });
    return rows[0];
  }
}
