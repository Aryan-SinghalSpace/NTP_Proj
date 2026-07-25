import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import type { Client } from 'pg';
import { sql } from 'drizzle-orm';
import { withCheckDigit } from '@tracewell/field-types';
import { TenantDbService } from '../src/db/tenant-db.service';
import { AuditService } from '../src/audit/audit.service';
import { ProductsService } from '../src/products/products.service';
import { BatchesService } from '../src/batches/batches.service';
import { EventsService } from '../src/events/events.service';
import { AppException } from '../src/common/errors/app-exception';
import { asTenant, ownerClient, makeTestTenant, dropTestTenant } from './helpers';

const PRODUCT = { brand: 'Velvet', name: 'Svc Bar', netContent: '50 g', packType: 'Flow wrap', brandOwner: 'Test Co', category: 'Test' };
const VALID_GTIN = withCheckDigit('890111000012'); // 12 body + check digit = valid GTIN-13

describe('service invariants (against real Postgres + RLS)', () => {
  let owner: Client;
  let db: TenantDbService;
  let audit: AuditService;
  let products: ProductsService;
  let batches: BatchesService;
  let events: EventsService;
  let T: string;

  beforeAll(async () => {
    owner = await ownerClient();
    db = new TenantDbService();
    audit = new AuditService(db);
    products = new ProductsService(db, audit);
    batches = new BatchesService(db);
    events = new EventsService(db);
    T = (await makeTestTenant(owner)).id;
  });

  afterAll(async () => {
    await dropTestTenant(owner, T);
    await db.onModuleDestroy();
    await owner.end();
  });

  async function expectCode(fn: () => Promise<unknown>, code: string) {
    let err: unknown;
    try {
      await fn();
    } catch (e) {
      err = e;
    }
    expect(err).toBeInstanceOf(AppException);
    expect((err as AppException).code).toBe(code);
  }

  it('commit locks a draft: assigns GTIN, flips to committed (invariant #7)', async () => {
    const p = await asTenant(T, () => products.create(PRODUCT));
    const committed = await asTenant(T, () => products.commit(p!.id, VALID_GTIN));
    expect(committed!.status).toBe('committed');
    expect(committed!.gtin).toBe(VALID_GTIN);
    expect(committed!.committedAt).not.toBeNull();
  });

  it('rejects an invalid GTIN (GS1 check digit) → TW-PROD-400-GTIN', async () => {
    const p = await asTenant(T, () => products.create({ ...PRODUCT, name: 'Bad GTIN' }));
    await expectCode(() => asTenant(T, () => products.commit(p!.id, '123')), 'TW-PROD-400-GTIN');
  });

  it('re-committing a committed product → TW-PROD-409-COMMITTED', async () => {
    const p = await asTenant(T, () => products.create({ ...PRODUCT, name: 'Recommit' }));
    const g = withCheckDigit('890111000029');
    await asTenant(T, () => products.commit(p!.id, g));
    await expectCode(() => asTenant(T, () => products.commit(p!.id, withCheckDigit('890111000036'))), 'TW-PROD-409-COMMITTED');
  });

  it('a duplicate GTIN in the same tenant → TW-PROD-409-GTIN-TAKEN', async () => {
    const g = withCheckDigit('890111000043');
    const p1 = await asTenant(T, () => products.create({ ...PRODUCT, name: 'Dup GTIN 1' }));
    const p2 = await asTenant(T, () => products.create({ ...PRODUCT, name: 'Dup GTIN 2' }));
    await asTenant(T, () => products.commit(p1!.id, g));
    await expectCode(() => asTenant(T, () => products.commit(p2!.id, g)), 'TW-PROD-409-GTIN-TAKEN');
  });

  it('a duplicate batch number for a product → TW-BATCH-409-DUP', async () => {
    const p = await asTenant(T, () => products.create({ ...PRODUCT, name: 'Batched' }));
    await asTenant(T, () => batches.create({ productId: p!.id, batchNumber: 'B-DUP' }));
    await expectCode(() => asTenant(T, () => batches.create({ productId: p!.id, batchNumber: 'B-DUP' })), 'TW-BATCH-409-DUP');
  });

  it('an event replayed with the same idempotency key → TW-EVENT-409-IDEMPOTENT', async () => {
    const key = `idem-${T.slice(0, 8)}`;
    await asTenant(T, () => events.create({ eventType: 'Commission', subjectKind: 'batch', idempotencyKey: key }));
    await expectCode(
      () => asTenant(T, () => events.create({ eventType: 'Commission', subjectKind: 'batch', idempotencyKey: key })),
      'TW-EVENT-409-IDEMPOTENT',
    );
  });

  it('mutations write an audit entry (invariant #2 — every change auditable)', async () => {
    await asTenant(T, () => products.create({ ...PRODUCT, name: 'Audited' }));
    const rows = await asTenant(T, () =>
      db.run((tx) => tx.execute(sql`select count(*)::int as n from audit_entry where entity = 'product'`)),
    );
    expect(Number((rows.rows[0] as { n: number }).n)).toBeGreaterThan(0);
  });
});
