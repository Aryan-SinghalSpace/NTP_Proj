import { Injectable } from '@nestjs/common';
import { and, desc, eq } from 'drizzle-orm';
import { TenantDbService } from '../db/tenant-db.service';
import { currentTenant } from '../db/tenant-context';
import { event } from '../db/schema';
import { AppException } from '../common/errors/app-exception';
import type { CreateEventInput } from './event.dto';

interface ListOpts {
  type?: string;
  subjectId?: string;
  limit?: number;
}

@Injectable()
export class EventsService {
  constructor(private readonly db: TenantDbService) {}

  /**
   * The event stream for the tenant, newest first, optionally filtered by type
   * or subject (the latter powers the trace timeline). RLS scopes the rows.
   */
  list(opts: ListOpts = {}) {
    const conds = [];
    if (opts.type) conds.push(eq(event.eventType, opts.type));
    if (opts.subjectId) conds.push(eq(event.subjectId, opts.subjectId));
    const where = conds.length ? and(...conds) : undefined;
    const limit = Math.min(Math.max(opts.limit ?? 200, 1), 1000);
    return this.db.run((tx) =>
      tx.select().from(event).where(where).orderBy(desc(event.occurredAt)).limit(limit),
    );
  }

  /**
   * Append an event (append-only — events are never updated). The idempotency
   * key dedupes double-scan / retry / offline-sync replay via the partial unique
   * index (tenant_id, idempotency_key).
   */
  async create(input: CreateEventInput) {
    const { tenantId } = currentTenant();
    return this.db.run(async (tx) => {
      try {
        const rows = await tx
          .insert(event)
          .values({
            tenantId: tenantId!,
            eventType: input.eventType,
            subjectKind: input.subjectKind ?? 'batch',
            subjectId: input.subjectId ?? null,
            subjectLabel: input.subjectLabel ?? null,
            actor: input.actor ?? null,
            location: input.location ?? null,
            quantity: input.quantity ?? null,
            detail: input.detail ?? null,
            occurredAt: input.occurredAt ? new Date(input.occurredAt) : undefined,
            idempotencyKey: input.idempotencyKey ?? null,
            payload: input.payload ?? {},
          })
          .returning();
        return rows[0];
      } catch (err) {
        if ((err as { code?: string }).code === '23505') {
          throw new AppException('TW-EVENT-409-IDEMPOTENT', { detail: input.idempotencyKey, cause: err });
        }
        throw err;
      }
    });
  }
}
