import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import type { Client } from 'pg';
import { withCheckDigit } from '@tracewell/field-types';
import { TenantDbService } from '../src/db/tenant-db.service';
import { AuditService } from '../src/audit/audit.service';
import { EventsService } from '../src/events/events.service';
import { ProductsService } from '../src/products/products.service';
import { BatchesService } from '../src/batches/batches.service';
import { DealersService } from '../src/logistics/dealers.service';
import { ShipmentsService } from '../src/logistics/shipments.service';
import { asTenant, ownerClient, makeTestTenant, dropTestTenant } from './helpers';

describe('logistics: dispatch/receive append events; recall fan-out derives dealers', () => {
  let owner: Client;
  let db: TenantDbService;
  let events: EventsService;
  let products: ProductsService;
  let batches: BatchesService;
  let dealers: DealersService;
  let shipments: ShipmentsService;
  let T: string;

  beforeAll(async () => {
    owner = await ownerClient();
    db = new TenantDbService();
    const audit = new AuditService(db);
    events = new EventsService(db);
    products = new ProductsService(db, audit);
    batches = new BatchesService(db);
    dealers = new DealersService(db, audit);
    shipments = new ShipmentsService(db, audit, events);
    T = (await makeTestTenant(owner)).id;
  });

  afterAll(async () => {
    await dropTestTenant(owner, T);
    await db.onModuleDestroy();
    await owner.end();
  });

  it('creating a dispatch appends a Dispatch event; receiving a leg appends a Receive event', async () => {
    const p = await asTenant(T, () => products.create({ brand: 'V', name: 'Log Bar', netContent: '50 g', packType: 'FW', brandOwner: 'Co', category: 'C' }));
    await asTenant(T, () => products.commit(p!.id, withCheckDigit('890222000019')));
    const b = await asTenant(T, () => batches.create({ productId: p!.id, batchNumber: 'B-LOG' }));
    const d = await asTenant(T, () => dealers.create({ name: 'Test Dealer', city: 'Pune' }));

    const ship = await asTenant(T, () => shipments.create({ batchId: b!.id, legs: [{ dealerId: d!.id, units: 100 }] }));
    expect(ship!.totalUnits).toBe(100);

    const afterDispatch = await asTenant(T, () => events.list({ subjectId: b!.id }));
    expect(afterDispatch.some((e) => e.eventType === 'Dispatch')).toBe(true);

    const list = await asTenant(T, () => shipments.list());
    const leg = list.find((s) => s.id === ship!.id)!.legs[0]!;
    await asTenant(T, () => shipments.updateLeg(leg.id, { status: 'delivered', receivedUnits: 100 }));

    const afterReceive = await asTenant(T, () => events.list({ subjectId: b!.id }));
    expect(afterReceive.some((e) => e.eventType === 'Receive')).toBe(true);

    const fanout = await asTenant(T, () => shipments.recallFanout(b!.id));
    expect(fanout).toHaveLength(1);
    expect(fanout[0]!.dealer).toBe('Test Dealer');
    expect(fanout[0]!.units).toBe(100);
    expect(fanout[0]!.status).toBe('Delivered');
  });
});
