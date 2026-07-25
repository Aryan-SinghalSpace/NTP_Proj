import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import type { Client } from 'pg';
import { TenantDbService } from '../src/db/tenant-db.service';
import { AuditService } from '../src/audit/audit.service';
import { FieldsService } from '../src/fields/fields.service';
import { asTenant, ownerClient, makeTestTenant, dropTestTenant, expectAppCode } from './helpers';

describe('field library: deactivate-not-delete (invariant #4) + tier guard', () => {
  let owner: Client;
  let db: TenantDbService;
  let fields: FieldsService;
  let T: string;

  beforeAll(async () => {
    owner = await ownerClient();
    db = new TenantDbService();
    fields = new FieldsService(db, new AuditService(db));
    T = (await makeTestTenant(owner)).id;
  });

  afterAll(async () => {
    await dropTestTenant(owner, T);
    await db.onModuleDestroy();
    await owner.end();
  });

  it('deactivating a tenant field hides it from active but keeps it in the historic view', async () => {
    const f = await asTenant(T, () => fields.create({ entity: 'batch', key: 'test_deact', displayName: 'D', dataType: 'text' }));

    let active = await asTenant(T, () => fields.listByEntity('batch'));
    expect(active.some((x) => x.key === 'test_deact')).toBe(true);

    await asTenant(T, () => fields.setStatus(f!.id, 'deactivated'));
    active = await asTenant(T, () => fields.listByEntity('batch'));
    const historic = await asTenant(T, () => fields.listByEntity('batch', true));
    expect(active.some((x) => x.key === 'test_deact')).toBe(false); // hidden
    expect(historic.some((x) => x.key === 'test_deact')).toBe(true); // preserved

    await asTenant(T, () => fields.setStatus(f!.id, 'active'));
    active = await asTenant(T, () => fields.listByEntity('batch'));
    expect(active.some((x) => x.key === 'test_deact')).toBe(true); // reactivated
  });

  it('a Core/Super field cannot be deactivated via the tenant endpoint → TW-FIELD-403-TIER', async () => {
    const historic = await asTenant(T, () => fields.listByEntity('batch', true));
    const core = historic.find((x) => x.tier !== 'tenant_custom')!;
    await expectAppCode(() => asTenant(T, () => fields.setStatus(core.id, 'deactivated')), 'TW-FIELD-403-TIER');
  });

  it('a duplicate field key for an entity → TW-FIELD-409-DUP', async () => {
    await asTenant(T, () => fields.create({ entity: 'product', key: 'test_dup', displayName: 'A', dataType: 'text' }));
    await expectAppCode(
      () => asTenant(T, () => fields.create({ entity: 'product', key: 'test_dup', displayName: 'B', dataType: 'text' })),
      'TW-FIELD-409-DUP',
    );
  });
});
