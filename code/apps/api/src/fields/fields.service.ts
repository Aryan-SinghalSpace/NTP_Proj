import { Injectable } from '@nestjs/common';
import { and, asc, eq } from 'drizzle-orm';
import type { FieldEntity } from '@tracewell/field-types';
import { TenantDbService } from '../db/tenant-db.service';
import { currentTenant } from '../db/tenant-context';
import { fieldDefinition } from '../db/schema';
import { AppException } from '../common/errors/app-exception';
import { AuditService } from '../audit/audit.service';
import type { CreateFieldInput } from './field.dto';

@Injectable()
export class FieldsService {
  constructor(
    private readonly db: TenantDbService,
    private readonly audit: AuditService,
  ) {}

  /**
   * Field definitions for an entity. RLS returns Core/Super (tenant_id IS NULL)
   * plus the current tenant's Custom fields. By default only active fields; with
   * includeInactive the deactivated ones are included too (invariant #4 —
   * deactivate-not-delete, "View Historic Records").
   */
  listByEntity(entity: FieldEntity, includeInactive = false) {
    return this.db.run((tx) => {
      const where = includeInactive
        ? eq(fieldDefinition.entity, entity)
        : and(eq(fieldDefinition.entity, entity), eq(fieldDefinition.status, 'active'));
      return tx
        .select()
        .from(fieldDefinition)
        .where(where)
        .orderBy(asc(fieldDefinition.tier), asc(fieldDefinition.key));
    });
  }

  /** Create a Tenant Custom field (tier forced server-side). */
  async create(input: CreateFieldInput) {
    const { tenantId } = currentTenant();
    return this.db.run(async (tx) => {
      const dup = await tx
        .select({ id: fieldDefinition.id })
        .from(fieldDefinition)
        .where(
          and(
            eq(fieldDefinition.entity, input.entity),
            eq(fieldDefinition.key, input.key),
            eq(fieldDefinition.status, 'active'),
          ),
        )
        .limit(1);
      if (dup.length) throw new AppException('TW-FIELD-409-DUP', { detail: `${input.entity}.${input.key}` });

      const rows = await tx
        .insert(fieldDefinition)
        .values({
          tier: 'tenant_custom',
          tenantId: tenantId!,
          entity: input.entity,
          key: input.key,
          displayName: input.displayName,
          dataType: input.dataType,
          validation: input.required ? { required: true } : {},
          status: 'active',
          isLocked: false,
        })
        .returning();
      await this.audit.record({
        action: 'Created',
        entity: 'field_definition',
        entityId: `${input.entity}.${input.key}`,
        diff: `New Tenant Custom field · type=${input.dataType}${input.required ? ' · required' : ''}.`,
      });
      return rows[0];
    });
  }

  /** Deactivate / reactivate a Tenant Custom field (never delete — invariant #4). */
  async setStatus(id: string, status: 'active' | 'deactivated') {
    return this.db.run(async (tx) => {
      const rows = await tx.select().from(fieldDefinition).where(eq(fieldDefinition.id, id)).limit(1);
      const field = rows[0];
      if (!field) throw new AppException('TW-FIELD-404', { detail: `id ${id}` });
      if (field.tier !== 'tenant_custom') {
        throw new AppException('TW-FIELD-403-TIER', { detail: `tier ${field.tier}` });
      }
      const updated = await tx
        .update(fieldDefinition)
        .set({ status, updatedAt: new Date() })
        .where(eq(fieldDefinition.id, id))
        .returning();
      await this.audit.record({
        action: status === 'deactivated' ? 'Deactivated' : 'Reactivated',
        entity: 'field_definition',
        entityId: `${field.entity}.${field.key}`,
        diff: `active ${field.status === 'active'} → ${status === 'active'}; historical values preserved.`,
      });
      return updated[0];
    });
  }
}
