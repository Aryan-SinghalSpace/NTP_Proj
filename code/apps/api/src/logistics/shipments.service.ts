import { Injectable } from '@nestjs/common';
import { desc, eq, sql } from 'drizzle-orm';
import { TenantDbService } from '../db/tenant-db.service';
import { currentTenant } from '../db/tenant-context';
import { shipment, shipmentLeg, dealer, batch, product } from '../db/schema';
import { AppException } from '../common/errors/app-exception';
import { AuditService } from '../audit/audit.service';
import { EventsService } from '../events/events.service';
import type { CreateShipmentInput, UpdateLegInput } from './logistics.dto';

@Injectable()
export class ShipmentsService {
  constructor(
    private readonly db: TenantDbService,
    private readonly audit: AuditService,
    private readonly events: EventsService,
  ) {}

  /** Shipments, each with its per-dealer legs (dealer name/city joined). */
  async list() {
    return this.db.run(async (tx) => {
      const ships = await tx.select().from(shipment).orderBy(desc(shipment.createdAt));
      const legs = await tx
        .select({
          id: shipmentLeg.id,
          shipmentId: shipmentLeg.shipmentId,
          dealerId: shipmentLeg.dealerId,
          dealerName: dealer.name,
          city: dealer.city,
          units: shipmentLeg.units,
          receivedUnits: shipmentLeg.receivedUnits,
          status: shipmentLeg.status,
        })
        .from(shipmentLeg)
        .leftJoin(dealer, eq(shipmentLeg.dealerId, dealer.id));
      const byShip = new Map<string, typeof legs>();
      for (const l of legs) {
        const arr = byShip.get(l.shipmentId) ?? [];
        arr.push(l);
        byShip.set(l.shipmentId, arr);
      }
      return ships.map((s) => ({ ...s, legs: byShip.get(s.id) ?? [] }));
    });
  }

  /** Create a multi-dealer dispatch and append a Dispatch event. */
  async create(input: CreateShipmentInput) {
    const { tenantId } = currentTenant();
    const total = input.legs.reduce((n, l) => n + l.units, 0);
    const code = `DSP-${1000 + Math.floor(Math.random() * 9000)}`;

    const created = await this.db.run(async (tx) => {
      const b = (await tx.select().from(batch).where(eq(batch.id, input.batchId)).limit(1))[0];
      if (!b) throw new AppException('TW-BATCH-400-PRODUCT', { detail: `batch ${input.batchId}` });
      const p = (await tx.select().from(product).where(eq(product.id, b.productId)).limit(1))[0];

      const ship = (
        await tx
          .insert(shipment)
          .values({
            tenantId: tenantId!,
            code,
            batchId: input.batchId,
            batchLabel: b.batchNumber,
            productLabel: p?.name ?? '',
            totalUnits: total,
          })
          .returning()
      )[0]!;

      await tx.insert(shipmentLeg).values(
        input.legs.map((l) => ({
          tenantId: tenantId!,
          shipmentId: ship.id,
          dealerId: l.dealerId,
          units: l.units,
          status: 'loading' as const,
        })),
      );
      return { ship, batchNumber: b.batchNumber };
    });

    await this.events.create({
      eventType: 'Dispatch',
      subjectKind: 'batch',
      subjectId: input.batchId,
      subjectLabel: created.batchNumber,
      location: 'Dispatch',
      quantity: total,
      detail: `${input.legs.length} legs · ${total} units (${code})`,
    });
    await this.audit.record({ action: 'Created', entity: 'shipment', entityId: code, diff: `Dispatch of ${created.batchNumber} · ${total} units to ${input.legs.length} dealers.` });
    return created.ship;
  }

  /** Update a leg (dealer receive). Marking it delivered appends a Receive event. */
  async updateLeg(id: string, patch: UpdateLegInput) {
    const result = await this.db.run(async (tx) => {
      const leg = (await tx.select().from(shipmentLeg).where(eq(shipmentLeg.id, id)).limit(1))[0];
      if (!leg) throw new AppException('TW-GEN-404', { detail: `leg ${id}` });
      const updated = (
        await tx
          .update(shipmentLeg)
          .set({
            ...(patch.status !== undefined ? { status: patch.status } : {}),
            ...(patch.receivedUnits !== undefined ? { receivedUnits: patch.receivedUnits } : {}),
            updatedAt: new Date(),
          })
          .where(eq(shipmentLeg.id, id))
          .returning()
      )[0]!;
      const ship = (await tx.select().from(shipment).where(eq(shipment.id, leg.shipmentId)).limit(1))[0];
      const dlr = (await tx.select().from(dealer).where(eq(dealer.id, leg.dealerId)).limit(1))[0];
      return { updated, ship, dlr, wasDelivered: leg.status !== 'delivered' && patch.status === 'delivered' };
    });

    if (result.wasDelivered && result.ship) {
      await this.events.create({
        eventType: 'Receive',
        subjectKind: 'batch',
        subjectId: result.ship.batchId ?? undefined,
        subjectLabel: result.ship.batchLabel,
        actor: result.dlr?.name,
        location: result.dlr ? `Dealer · ${result.dlr.city}` : 'Dealer',
        quantity: result.updated.receivedUnits || result.updated.units,
        detail: `${result.updated.receivedUnits || result.updated.units} units received by ${result.dlr?.name ?? 'dealer'}`,
      });
    }
    return result.updated;
  }

  /** Real recall fan-out: dealers that received a given batch, with unit totals. */
  async recallFanout(batchId: string) {
    const rows = await this.db.run((tx) =>
      tx.execute(sql`
        select d.name as dealer, d.city as city,
               sum(sl.units)::int as units,
               bool_and(sl.status = 'delivered') as delivered
        from shipment_leg sl
        join shipment s on sl.shipment_id = s.id
        join dealer d on sl.dealer_id = d.id
        where s.batch_id = ${batchId}
        group by d.id, d.name, d.city
        order by units desc
      `),
    );
    return (rows.rows as { dealer: string; city: string; units: number; delivered: boolean }[]).map((r) => ({
      dealer: r.dealer,
      city: r.city,
      units: r.units,
      status: r.delivered ? 'Delivered' : 'In transit',
    }));
  }
}
