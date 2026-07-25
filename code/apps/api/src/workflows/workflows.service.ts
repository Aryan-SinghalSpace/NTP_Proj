import { Injectable } from '@nestjs/common';
import { and, asc, desc, eq } from 'drizzle-orm';
import { TenantDbService } from '../db/tenant-db.service';
import { currentTenant } from '../db/tenant-context';
import { workflowDefinition, workflowVersion } from '../db/schema';
import { AppException } from '../common/errors/app-exception';
import { AuditService } from '../audit/audit.service';

@Injectable()
export class WorkflowsService {
  constructor(
    private readonly db: TenantDbService,
    private readonly audit: AuditService,
  ) {}

  /** All workflow definitions with their latest version (state, version, graph). */
  async list() {
    return this.db.run(async (tx) => {
      const defs = await tx.select().from(workflowDefinition).orderBy(asc(workflowDefinition.createdAt));
      const versions = await tx.select().from(workflowVersion).orderBy(desc(workflowVersion.version));
      return defs.map((d) => {
        const vs = versions.filter((v) => v.definitionId === d.id);
        const latest = vs[0];
        const published = vs.find((v) => v.state === 'published');
        return {
          id: d.id,
          name: d.name,
          latestVersion: latest?.version ?? 0,
          state: latest?.state ?? 'draft',
          graph: latest?.graph ?? {},
          publishedVersion: published?.version ?? null,
          graceUntil: published?.graceUntil ?? null,
          versionCount: vs.length,
        };
      });
    });
  }

  /** Create a workflow with a draft v1 graph. */
  async create(name: string, graph: unknown) {
    const { tenantId } = currentTenant();
    const def = await this.db.run(async (tx) => {
      const d = (await tx.insert(workflowDefinition).values({ tenantId: tenantId!, name }).returning())[0]!;
      await tx.insert(workflowVersion).values({ tenantId: tenantId!, definitionId: d.id, version: 1, state: 'draft', graph: graph ?? {} });
      return d;
    });
    await this.audit.record({ action: 'Created', entity: 'workflow', entityId: name, diff: 'New workflow · draft v1' });
    return def;
  }

  /**
   * Save the graph. If the latest version is a draft, update it in place; else
   * open a new draft version (append-only for published versions).
   */
  async saveGraph(definitionId: string, graph: unknown) {
    const { tenantId } = currentTenant();
    return this.db.run(async (tx) => {
      const def = (await tx.select().from(workflowDefinition).where(eq(workflowDefinition.id, definitionId)).limit(1))[0];
      if (!def) throw new AppException('TW-GEN-404', { detail: `workflow ${definitionId}` });
      const latest = (
        await tx.select().from(workflowVersion).where(eq(workflowVersion.definitionId, definitionId)).orderBy(desc(workflowVersion.version)).limit(1)
      )[0];
      if (latest && latest.state === 'draft') {
        return (await tx.update(workflowVersion).set({ graph: graph ?? {} }).where(eq(workflowVersion.id, latest.id)).returning())[0];
      }
      const nextVersion = (latest?.version ?? 0) + 1;
      return (
        await tx.insert(workflowVersion).values({ tenantId: tenantId!, definitionId, version: nextVersion, state: 'draft', graph: graph ?? {} }).returning()
      )[0];
    });
  }

  /** Publish the latest draft; the prior published version enters a 30-day grace. */
  async publish(definitionId: string) {
    const result = await this.db.run(async (tx) => {
      const def = (await tx.select().from(workflowDefinition).where(eq(workflowDefinition.id, definitionId)).limit(1))[0];
      if (!def) throw new AppException('TW-GEN-404', { detail: `workflow ${definitionId}` });
      const draft = (
        await tx
          .select()
          .from(workflowVersion)
          .where(and(eq(workflowVersion.definitionId, definitionId), eq(workflowVersion.state, 'draft')))
          .orderBy(desc(workflowVersion.version))
          .limit(1)
      )[0];
      if (!draft) throw new AppException('TW-GEN-409', { detail: 'no draft version to publish' });

      // prior published → retired (its consumers finish on it during the grace window)
      const now = new Date();
      const grace = new Date(now.getTime() + 30 * 86400000);
      await tx
        .update(workflowVersion)
        .set({ state: 'retired', graceUntil: grace })
        .where(and(eq(workflowVersion.definitionId, definitionId), eq(workflowVersion.state, 'published')));
      const published = (
        await tx
          .update(workflowVersion)
          .set({ state: 'published', publishedAt: now, graceUntil: grace })
          .where(eq(workflowVersion.id, draft.id))
          .returning()
      )[0];
      return { def, published };
    });
    await this.audit.record({
      action: 'Published',
      entity: 'workflow',
      entityId: result.def.name,
      version: `v${result.published!.version}`,
      diff: `Published v${result.published!.version}; prior version enters 30-day grace.`,
    });
    return result.published;
  }
}
