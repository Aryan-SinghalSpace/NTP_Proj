import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import type { Client } from 'pg';
import { TenantDbService } from '../src/db/tenant-db.service';
import { AuditService } from '../src/audit/audit.service';
import { WorkflowsService } from '../src/workflows/workflows.service';
import { asTenant, ownerClient, makeTestTenant, dropTestTenant, expectAppCode } from './helpers';

describe('workflows: versioned draft → publish with 30-day grace (invariant #2)', () => {
  let owner: Client;
  let db: TenantDbService;
  let workflows: WorkflowsService;
  let T: string;

  beforeAll(async () => {
    owner = await ownerClient();
    db = new TenantDbService();
    workflows = new WorkflowsService(db, new AuditService(db));
    T = (await makeTestTenant(owner)).id;
  });

  afterAll(async () => {
    await dropTestTenant(owner, T);
    await db.onModuleDestroy();
    await owner.end();
  });

  const find = async (id: string) => (await asTenant(T, () => workflows.list())).find((w) => w.id === id)!;

  it('create → draft v1; save updates the draft in place; publish sets grace; new save opens v2', async () => {
    const def = await asTenant(T, () => workflows.create('Test WF', { nodes: [], edges: [] }));
    let wf = await find(def!.id);
    expect(wf.latestVersion).toBe(1);
    expect(wf.state).toBe('draft');

    // saving a draft updates it in place — still v1, still draft
    await asTenant(T, () => workflows.saveGraph(def!.id, { nodes: [{ id: 'n1' }], edges: [] }));
    wf = await find(def!.id);
    expect(wf.latestVersion).toBe(1);
    expect(wf.state).toBe('draft');

    // publish v1 → published + grace window set
    const pub = (await asTenant(T, () => workflows.publish(def!.id))) as { state: string; graceUntil: unknown };
    expect(pub.state).toBe('published');
    expect(pub.graceUntil).not.toBeNull();

    // saving after publish opens a NEW draft v2 (published versions are immutable)
    await asTenant(T, () => workflows.saveGraph(def!.id, { nodes: [{ id: 'n2' }], edges: [] }));
    wf = await find(def!.id);
    expect(wf.latestVersion).toBe(2);
    expect(wf.state).toBe('draft');

    // publish v2 → v2 published (prior published v1 enters grace/retired)
    await asTenant(T, () => workflows.publish(def!.id));
    wf = await find(def!.id);
    expect(wf.latestVersion).toBe(2);
    expect(wf.state).toBe('published');

    // nothing to publish now (no draft) → conflict
    await expectAppCode(() => asTenant(T, () => workflows.publish(def!.id)), 'TW-GEN-409');
  });
});
