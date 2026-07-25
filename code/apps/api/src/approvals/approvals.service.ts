import { Injectable } from '@nestjs/common';
import { desc, eq } from 'drizzle-orm';
import { TenantDbService } from '../db/tenant-db.service';
import { approvalRequest } from '../db/schema';
import { AppException } from '../common/errors/app-exception';
import { AuditService } from '../audit/audit.service';

@Injectable()
export class ApprovalsService {
  constructor(
    private readonly db: TenantDbService,
    private readonly audit: AuditService,
  ) {}

  /** The tenant's approval queue (newest first). */
  list() {
    return this.db.run((tx) =>
      tx.select().from(approvalRequest).orderBy(desc(approvalRequest.createdAt)),
    );
  }

  /** Approve or reject a request (records an audit entry). */
  async decide(id: string, decision: 'approved' | 'rejected') {
    const rows = await this.db.run((tx) =>
      tx
        .update(approvalRequest)
        .set({ status: decision, decidedAt: new Date() })
        .where(eq(approvalRequest.id, id))
        .returning(),
    );
    const req = rows[0];
    if (!req) throw new AppException('TW-GEN-404', { detail: `approval ${id}` });
    await this.audit.record({
      action: decision === 'approved' ? 'Published' : 'Updated',
      entity: 'approval_request',
      entityId: req.title,
      diff: `${req.kind} ${decision}`,
    });
    return req;
  }
}
