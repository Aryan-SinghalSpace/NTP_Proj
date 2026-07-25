import { Injectable } from '@nestjs/common';
import { asc, sql } from 'drizzle-orm';
import { TenantDbService } from '../db/tenant-db.service';
import { brandOwner } from '../db/schema';

@Injectable()
export class BrandOwnersService {
  constructor(private readonly db: TenantDbService) {}

  /**
   * Brand owners for the tenant, each with live product + distinct-brand counts
   * derived by joining product.brand_owner — never stored. RLS-scoped.
   */
  async list() {
    return this.db.run(async (tx) => {
      const owners = await tx.select().from(brandOwner).orderBy(asc(brandOwner.name));
      const counts = await tx.execute(
        sql`select brand_owner, count(*)::int as products, count(distinct brand)::int as brands
            from product group by brand_owner`,
      );
      const byOwner = new Map<string, { products: number; brands: number }>();
      for (const row of counts.rows as { brand_owner: string; products: number; brands: number }[]) {
        byOwner.set(row.brand_owner, { products: row.products, brands: row.brands });
      }
      return owners.map((o) => ({
        ...o,
        products: byOwner.get(o.name)?.products ?? 0,
        brands: byOwner.get(o.name)?.brands ?? 0,
      }));
    });
  }
}
