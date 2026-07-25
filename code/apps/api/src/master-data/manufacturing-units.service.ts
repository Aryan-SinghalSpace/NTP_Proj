import { Injectable } from '@nestjs/common';
import { asc, sql } from 'drizzle-orm';
import { TenantDbService } from '../db/tenant-db.service';
import { manufacturingUnit } from '../db/schema';

@Injectable()
export class ManufacturingUnitsService {
  constructor(private readonly db: TenantDbService) {}

  /**
   * Manufacturing units for the tenant, each with a live product count derived
   * by matching product.attributes->>'mfgUnit' to the unit name — never stored,
   * so it can't drift. Both queries run in the same RLS-scoped transaction.
   */
  async list() {
    return this.db.run(async (tx) => {
      const units = await tx.select().from(manufacturingUnit).orderBy(asc(manufacturingUnit.code));
      const counts = await tx.execute(
        sql`select attributes->>'mfgUnit' as unit, count(*)::int as n from product group by 1`,
      );
      const byUnit = new Map<string, number>();
      for (const row of counts.rows as { unit: string | null; n: number }[]) {
        if (row.unit) byUnit.set(row.unit, row.n);
      }
      return units.map((u) => ({ ...u, products: byUnit.get(u.name) ?? 0 }));
    });
  }
}
