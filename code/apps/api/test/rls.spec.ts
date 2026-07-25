import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import type { Client } from 'pg';
import { TenantDbService } from '../src/db/tenant-db.service';
import { AuditService } from '../src/audit/audit.service';
import { ProductsService } from '../src/products/products.service';
import { FieldsService } from '../src/fields/fields.service';
import { asTenant, ownerClient, makeTestTenant, dropTestTenant } from './helpers';

const PRODUCT = {
  brand: 'Velvet',
  name: 'RLS Test Bar',
  netContent: '50 g',
  packType: 'Flow wrap',
  brandOwner: 'Test Co',
  category: 'Test',
};

describe('Row-Level Security — tenant isolation (invariant #6)', () => {
  let owner: Client;
  let db: TenantDbService;
  let products: ProductsService;
  let fields: FieldsService;
  let A: string;
  let B: string;

  beforeAll(async () => {
    owner = await ownerClient();
    db = new TenantDbService();
    const audit = new AuditService(db);
    products = new ProductsService(db, audit);
    fields = new FieldsService(db, audit);
    A = (await makeTestTenant(owner)).id;
    B = (await makeTestTenant(owner)).id;
  });

  afterAll(async () => {
    await dropTestTenant(owner, A);
    await dropTestTenant(owner, B);
    await db.onModuleDestroy();
    await owner.end();
  });

  it('a product created in tenant A is invisible to tenant B and to no-tenant', async () => {
    const p = await asTenant(A, () => products.create(PRODUCT));
    expect(p!.gtin).toBeNull();
    expect(p!.status).toBe('draft');

    const inA = await asTenant(A, () => products.list());
    const inB = await asTenant(B, () => products.list());
    const inNone = await asTenant(null, () => products.list());

    expect(inA.some((x) => x.id === p!.id)).toBe(true);
    expect(inB.some((x) => x.id === p!.id)).toBe(false);
    expect(inNone.some((x) => x.id === p!.id)).toBe(false);
  });

  it('the platform role can read across tenants (super-admin god-mode)', async () => {
    const p = await asTenant(A, () => products.create({ ...PRODUCT, name: 'RLS Platform Bar' }));
    const asPlatform = await asTenant(B, () => products.list(), 'platform'); // B tenant id, platform role
    expect(asPlatform.some((x) => x.id === p!.id)).toBe(true); // platform sees A's product despite B context
  });

  it('Core/Super fields are shared globally; a tenant-custom field is isolated', async () => {
    const aFields = await asTenant(A, () => fields.listByEntity('batch'));
    const bFields = await asTenant(B, () => fields.listByEntity('batch'));

    const globalKeys = (list: typeof aFields) =>
      list.filter((f) => f.tier !== 'tenant_custom').map((f) => f.key).sort();
    // both tenants see the same Core/Super set (tenant_id IS NULL rows)
    expect(globalKeys(bFields)).toEqual(globalKeys(aFields));
    expect(globalKeys(aFields).length).toBeGreaterThan(0);

    await asTenant(A, () => fields.create({ entity: 'batch', key: 'rls_iso_field', displayName: 'Iso', dataType: 'text' }));
    const aAfter = await asTenant(A, () => fields.listByEntity('batch'));
    const bAfter = await asTenant(B, () => fields.listByEntity('batch'));
    expect(aAfter.some((f) => f.key === 'rls_iso_field')).toBe(true);
    expect(bAfter.some((f) => f.key === 'rls_iso_field')).toBe(false);
  });
});
