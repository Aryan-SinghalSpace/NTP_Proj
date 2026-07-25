import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import type { Client } from 'pg';
import { TenantDbService } from '../src/db/tenant-db.service';
import { AuditService } from '../src/audit/audit.service';
import { ProductsService } from '../src/products/products.service';
import { ManufacturingUnitsService } from '../src/master-data/manufacturing-units.service';
import { BrandOwnersService } from '../src/master-data/brand-owners.service';
import { NotificationsService } from '../src/notifications/notifications.service';
import { ApprovalsService } from '../src/approvals/approvals.service';
import { IdentitySchemesService } from '../src/identity-schemes/identity-schemes.service';
import { asTenant, ownerClient, makeTestTenant, dropTestTenant } from './helpers';

const mk = (over: Record<string, unknown>) => ({
  brand: 'V',
  name: 'X',
  netContent: '1',
  packType: 'FW',
  brandOwner: 'Co',
  category: 'C',
  ...over,
});

describe('master-data live counts (derived from products, never stored)', () => {
  let owner: Client;
  let db: TenantDbService;
  let products: ProductsService;
  let units: ManufacturingUnitsService;
  let owners: BrandOwnersService;
  let T: string;

  beforeAll(async () => {
    owner = await ownerClient();
    db = new TenantDbService();
    products = new ProductsService(db, new AuditService(db));
    units = new ManufacturingUnitsService(db);
    owners = new BrandOwnersService(db);
    T = (await makeTestTenant(owner)).id;
  });
  afterAll(async () => {
    await dropTestTenant(owner, T);
    await db.onModuleDestroy();
    await owner.end();
  });

  it('brand owner shows live product + distinct-brand counts', async () => {
    await owner.query('INSERT INTO brand_owner (tenant_id, name) VALUES ($1, $2)', [T, 'TestBO']);
    await asTenant(T, () => products.create(mk({ name: 'p1', brand: 'B1', brandOwner: 'TestBO' })));
    await asTenant(T, () => products.create(mk({ name: 'p2', brand: 'B2', brandOwner: 'TestBO' })));
    await asTenant(T, () => products.create(mk({ name: 'p3', brand: 'B1', brandOwner: 'TestBO' })));

    const list = await asTenant(T, () => owners.list());
    const bo = list.find((o) => o.name === 'TestBO')!;
    expect(bo.products).toBe(3);
    expect(bo.brands).toBe(2); // B1, B2 distinct
  });

  it('manufacturing unit shows a live product count (matched on attributes.mfgUnit)', async () => {
    await owner.query('INSERT INTO manufacturing_unit (tenant_id, name, code, location, identifier) VALUES ($1,$2,$3,$4,$5)', [T, 'Plant TU', 'TU', 'x', 'y']);
    await asTenant(T, () => products.create(mk({ name: 'm1', attributes: { mfgUnit: 'Plant TU' } })));
    await asTenant(T, () => products.create(mk({ name: 'm2', attributes: { mfgUnit: 'Plant TU' } })));

    const list = await asTenant(T, () => units.list());
    const u = list.find((x) => x.name === 'Plant TU')!;
    expect(u.products).toBe(2);
  });
});

describe('notifications / approvals / identity-schemes toggles + writes', () => {
  let owner: Client;
  let db: TenantDbService;
  let notifications: NotificationsService;
  let approvals: ApprovalsService;
  let schemes: IdentitySchemesService;
  let T: string;

  beforeAll(async () => {
    owner = await ownerClient();
    db = new TenantDbService();
    const audit = new AuditService(db);
    notifications = new NotificationsService(db, audit);
    approvals = new ApprovalsService(db, audit);
    schemes = new IdentitySchemesService(db, audit);
    T = (await makeTestTenant(owner)).id;
  });
  afterAll(async () => {
    await dropTestTenant(owner, T);
    await db.onModuleDestroy();
    await owner.end();
  });

  it('a notification rule can be created and toggled', async () => {
    const rule = await asTenant(T, () => notifications.createRule({ name: 'R', trigger: 'X', channels: ['in-app'], recipients: 'y' }));
    expect(rule!.enabled).toBe(true);
    const off = await asTenant(T, () => notifications.setEnabled(rule!.id, false));
    expect(off!.enabled).toBe(false);
    const list = await asTenant(T, () => notifications.listRules());
    expect(list.some((r) => r.id === rule!.id)).toBe(true);
    expect(await asTenant(T, () => notifications.listDeliveries())).toBeInstanceOf(Array);
  });

  it('deciding an approval sets status + decided_at', async () => {
    const { rows } = await owner.query(
      "INSERT INTO approval_request (tenant_id, kind, title) VALUES ($1,'field-promotion','Promote X') RETURNING id",
      [T],
    );
    const id = rows[0].id as string;
    const decided = await asTenant(T, () => approvals.decide(id, 'approved'));
    expect(decided!.status).toBe('approved');
    expect(decided!.decidedAt).not.toBeNull();
  });

  it('a custom identity scheme can be created and disabled', async () => {
    const s = await asTenant(T, () => schemes.create({ name: 'Test SKU', pattern: '^X-\\d+$' }));
    expect(s!.kind).toBe('custom');
    expect(s!.enabled).toBe(true);
    const off = await asTenant(T, () => schemes.setEnabled(s!.id, false));
    expect(off!.enabled).toBe(false);
    const list = await asTenant(T, () => schemes.list());
    expect(list.some((x) => x.id === s!.id)).toBe(true);
  });
});
