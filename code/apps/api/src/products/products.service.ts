import { Injectable, NotFoundException } from '@nestjs/common';
import { desc, eq } from 'drizzle-orm';
import { TenantDbService } from '../db/tenant-db.service';
import { currentTenant } from '../db/tenant-context';
import { product } from '../db/schema';
import type { CreateProductInput } from './product.dto';

@Injectable()
export class ProductsService {
  constructor(private readonly db: TenantDbService) {}

  /** All products for the current tenant. RLS scopes the rows to the tenant. */
  list() {
    return this.db.run((tx) =>
      tx.select().from(product).orderBy(desc(product.createdAt)),
    );
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
}
