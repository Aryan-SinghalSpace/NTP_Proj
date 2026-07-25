import { Injectable } from '@nestjs/common';
import { asc, desc, eq } from 'drizzle-orm';
import { z } from 'zod';
import { TenantDbService } from '../db/tenant-db.service';
import { currentTenant } from '../db/tenant-context';
import { notificationRule, notificationDelivery } from '../db/schema';
import { AppException } from '../common/errors/app-exception';
import { AuditService } from '../audit/audit.service';

export const createRuleSchema = z.object({
  name: z.string().trim().min(1),
  trigger: z.string().trim().min(1),
  channels: z.array(z.enum(['in-app', 'email', 'webhook'])).min(1),
  recipients: z.string().trim().optional(),
});
export type CreateRuleInput = z.infer<typeof createRuleSchema>;

@Injectable()
export class NotificationsService {
  constructor(
    private readonly db: TenantDbService,
    private readonly audit: AuditService,
  ) {}

  listRules() {
    return this.db.run((tx) =>
      tx.select().from(notificationRule).orderBy(asc(notificationRule.createdAt)),
    );
  }

  async createRule(input: CreateRuleInput) {
    const { tenantId } = currentTenant();
    const rows = await this.db.run((tx) =>
      tx
        .insert(notificationRule)
        .values({
          tenantId: tenantId!,
          name: input.name,
          trigger: input.trigger,
          channels: input.channels,
          recipients: input.recipients ?? '',
          enabled: true,
        })
        .returning(),
    );
    await this.audit.record({ action: 'Created', entity: 'notification_rule', entityId: input.name, diff: `trigger=${input.trigger}` });
    return rows[0];
  }

  async setEnabled(id: string, enabled: boolean) {
    const rows = await this.db.run((tx) =>
      tx.update(notificationRule).set({ enabled, updatedAt: new Date() }).where(eq(notificationRule.id, id)).returning(),
    );
    if (!rows[0]) throw new AppException('TW-GEN-404', { detail: `rule ${id}` });
    await this.audit.record({
      action: enabled ? 'Reactivated' : 'Deactivated',
      entity: 'notification_rule',
      entityId: rows[0].name,
      diff: `enabled → ${enabled}`,
    });
    return rows[0];
  }

  listDeliveries() {
    return this.db.run((tx) =>
      tx.select().from(notificationDelivery).orderBy(desc(notificationDelivery.occurredAt)).limit(100),
    );
  }
}
