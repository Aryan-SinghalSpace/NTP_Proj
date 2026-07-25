import { Injectable } from '@nestjs/common';
import { asc, eq } from 'drizzle-orm';
import { TenantDbService } from '../db/tenant-db.service';
import { currentTenant } from '../db/tenant-context';
import { batch } from '../db/schema';
import { AppException } from '../common/errors/app-exception';
import type { CreateBatchInput } from './batch.dto';

@Injectable()
export class BatchesService {
  constructor(private readonly db: TenantDbService) {}

  /**
   * Batches for the tenant, optionally scoped to one product. Ordered by expiry
   * ascending so the result is FEFO-friendly (first-expiry-first-out). RLS scopes
   * the rows to the tenant regardless of the productId filter.
   */
  list(productId?: string) {
    return this.db.run((tx) => {
      const q = tx.select().from(batch);
      const scoped = productId ? q.where(eq(batch.productId, productId)) : q;
      return scoped.orderBy(asc(batch.expiryDate));
    });
  }

  /** Create a batch for one of the tenant's products. */
  async create(input: CreateBatchInput) {
    const { tenantId } = currentTenant();
    return this.db.run(async (tx) => {
      try {
        const rows = await tx
          .insert(batch)
          .values({
            tenantId: tenantId!,
            productId: input.productId,
            batchNumber: input.batchNumber,
            mfgDate: input.mfgDate ?? null,
            expiryDate: input.expiryDate ?? null,
            quantity: input.quantity ?? 0,
            manufacturingUnitId: input.manufacturingUnitId ?? null,
            attributes: input.attributes ?? {},
          })
          .returning();
        return rows[0];
      } catch (err) {
        const code = (err as { code?: string }).code;
        if (code === '23505') {
          throw new AppException('TW-BATCH-409-DUP', { detail: `batch ${input.batchNumber}`, cause: err });
        }
        if (code === '23503') {
          throw new AppException('TW-BATCH-400-PRODUCT', { detail: `productId ${input.productId}`, cause: err });
        }
        throw err;
      }
    });
  }
}
