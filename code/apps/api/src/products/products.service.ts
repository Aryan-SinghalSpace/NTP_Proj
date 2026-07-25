import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { desc, eq, sql } from 'drizzle-orm';
import { isValidGtin } from '@tracewell/field-types';
import { TenantDbService } from '../db/tenant-db.service';
import { currentTenant } from '../db/tenant-context';
import { product } from '../db/schema';
import type { CreateProductInput } from './product.dto';

@Injectable()
export class ProductsService {
  constructor(private readonly db: TenantDbService) {}

  /**
   * All products for the current tenant, each with a live batch count derived
   * from the batch table (never stored). RLS scopes both queries to the tenant.
   */
  list() {
    return this.db.run(async (tx) => {
      const rows = await tx.select().from(product).orderBy(desc(product.createdAt));
      const counts = await tx.execute(
        sql`select product_id, count(*)::int as n from batch group by product_id`,
      );
      const byProduct = new Map<string, number>();
      for (const row of counts.rows as { product_id: string; n: number }[]) {
        byProduct.set(row.product_id, row.n);
      }
      return rows.map((p) => ({ ...p, batchCount: byProduct.get(p.id) ?? 0 }));
    });
  }

  /** One product by internal UUID. RLS still applies, so cross-tenant ids 404. */
  async getById(id: string) {
    const rows = await this.db.run((tx) =>
      tx.select().from(product).where(eq(product.id, id)).limit(1),
    );
    const row = rows[0];
    if (!row) throw new NotFoundException(`product ${id} not found`);
    return row;
  }

  /**
   * Create a product as a draft. The GTIN and the other identity attributes are
   * not locked yet — they freeze when the product is committed (invariant #7).
   * tenant_id comes from the request context, never from the client body, so a
   * caller cannot write into another tenant (RLS WITH CHECK also enforces this).
   */
  async create(input: CreateProductInput) {
    const { tenantId } = currentTenant();
    const rows = await this.db.run((tx) =>
      tx
        .insert(product)
        .values({
          tenantId: tenantId!,
          brand: input.brand,
          name: input.name,
          netContent: input.netContent,
          packType: input.packType,
          country: input.country ?? 'India',
          brandOwner: input.brandOwner,
          category: input.category,
          attributes: input.attributes ?? {},
          status: 'draft',
        })
        .returning(),
    );
    return rows[0];
  }

  /**
   * Commit a draft product: assign a GTIN and freeze it. Enforces invariant #7 —
   * once committed, the GTIN + the five other identity attributes are locked.
   * Validates the GTIN with the GS1 mod-10 check (opt-in conformance mechanics)
   * and rejects re-committing an already-committed product. The partial unique
   * index (tenant_id, gtin) guarantees a GTIN is used once per tenant.
   */
  async commit(id: string, gtin: string) {
    if (!isValidGtin(gtin)) {
      throw new BadRequestException('Invalid GTIN — GS1 check digit failed (expects 8/12/13/14 digits).');
    }
    return this.db.run(async (tx) => {
      const existing = await tx.select().from(product).where(eq(product.id, id)).limit(1);
      const p = existing[0];
      if (!p) throw new NotFoundException(`product ${id} not found`);
      if (p.status === 'committed') {
        throw new ConflictException('Product is already committed — its identity is locked (invariant #7).');
      }
      try {
        const rows = await tx
          .update(product)
          .set({ gtin, status: 'committed', committedAt: new Date(), updatedAt: new Date() })
          .where(eq(product.id, id))
          .returning();
        return rows[0];
      } catch (err) {
        // 23505 = unique_violation on the (tenant_id, gtin) partial index.
        if ((err as { code?: string }).code === '23505') {
          throw new ConflictException('That GTIN is already committed to another product in this tenant.');
        }
        throw err;
      }
    });
  }
}
