import { Injectable } from '@nestjs/common';
import { desc } from 'drizzle-orm';
import { TenantDbService } from '../db/tenant-db.service';
import { currentTenant } from '../db/tenant-context';
import { auditEntry } from '../db/schema';
import { logEvent } from '../common/logger';

export interface AuditInput {
  action: string; // Created / Updated / Deactivated / Reactivated / Published …
  entity: string;
  entityId?: string;
  version?: string;
  diff?: string;
  actor?: string;
  actorRole?: string;
}

/**
 * Append-only audit log (invariant #2 — every change auditable). Other services
 * call `record()` after a successful mutation. Recording must NEVER break the
 * primary operation, so failures are logged and swallowed. Actor defaults to the
 * tenant-admin stand-in until real auth attributes the actor from the token.
 */
@Injectable()
export class AuditService {
  constructor(private readonly db: TenantDbService) {}

  list(limit = 200) {
    const capped = Math.min(Math.max(limit, 1), 1000);
    return this.db.run((tx) =>
      tx.select().from(auditEntry).orderBy(desc(auditEntry.occurredAt)).limit(capped),
    );
  }

  async record(e: AuditInput): Promise<void> {
    const { tenantId } = currentTenant();
    if (!tenantId) return; // no tenant context → nothing to attribute
    try {
      await this.db.run((tx) =>
        tx.insert(auditEntry).values({
          tenantId,
          actor: e.actor ?? 'Tenant Admin',
          actorRole: e.actorRole ?? 'Tenant Admin',
          action: e.action,
          entity: e.entity,
          entityId: e.entityId ?? '',
          version: e.version ?? '',
          diff: e.diff ?? '',
        }),
      );
    } catch (err) {
      logEvent('warn', { event: 'audit.failed', detail: err instanceof Error ? err.message : String(err) });
    }
  }
}
