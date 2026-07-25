import { Injectable } from '@nestjs/common';
import { asc } from 'drizzle-orm';
import { TenantDbService } from '../db/tenant-db.service';
import { currentTenant } from '../db/tenant-context';
import { dealer } from '../db/schema';
import { AuditService } from '../audit/audit.service';
import type { CreateDealerInput } from './logistics.dto';

@Injectable()
export class DealersService {
  constructor(
    private readonly db: TenantDbService,
    private readonly audit: AuditService,
  ) {}

  list() {
    return this.db.run((tx) => tx.select().from(dealer).orderBy(asc(dealer.name)));
  }

  async create(input: CreateDealerInput) {
    const { tenantId } = currentTenant();
    const rows = await this.db.run((tx) =>
      tx
        .insert(dealer)
        .values({ tenantId: tenantId!, name: input.name, city: input.city ?? '', identifier: input.identifier ?? '' })
        .returning(),
    );
    await this.audit.record({ action: 'Created', entity: 'dealer', entityId: input.name, diff: `New dealer · ${input.city ?? ''}` });
    return rows[0];
  }
}
