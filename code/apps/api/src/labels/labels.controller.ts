import { BadRequestException, Body, Controller, Get, Injectable, Post } from '@nestjs/common';
import { asc } from 'drizzle-orm';
import { z } from 'zod';
import { TenantDbService } from '../db/tenant-db.service';
import { currentTenant } from '../db/tenant-context';
import { labelTemplate } from '../db/schema';
import { AuditService } from '../audit/audit.service';

const createSchema = z.object({
  name: z.string().trim().min(1),
  symbology: z.string().trim().optional(),
  size: z.string().trim().optional(),
  payload: z.string().trim().optional(),
  fields: z.array(z.object({ label: z.string(), value: z.string(), mono: z.boolean().optional() })).optional(),
});

@Injectable()
export class LabelsService {
  constructor(
    private readonly db: TenantDbService,
    private readonly audit: AuditService,
  ) {}

  list() {
    return this.db.run((tx) => tx.select().from(labelTemplate).orderBy(asc(labelTemplate.createdAt)));
  }

  async create(input: z.infer<typeof createSchema>) {
    const { tenantId } = currentTenant();
    const rows = await this.db.run((tx) =>
      tx
        .insert(labelTemplate)
        .values({
          tenantId: tenantId!,
          name: input.name,
          symbology: input.symbology ?? '',
          size: input.size ?? '',
          payload: input.payload ?? '',
          fields: input.fields ?? [],
        })
        .returning(),
    );
    await this.audit.record({ action: 'Created', entity: 'label_template', entityId: input.name, diff: `${input.symbology ?? 'label'} template` });
    return rows[0];
  }
}

@Controller('label-templates')
export class LabelsController {
  constructor(private readonly labels: LabelsService) {}

  @Get()
  list() {
    return this.labels.list();
  }

  @Post()
  create(@Body() body: unknown) {
    const parsed = createSchema.safeParse(body);
    if (!parsed.success) throw new BadRequestException(parsed.error.issues.map((i) => `${i.path.join('.')}: ${i.message}`));
    return this.labels.create(parsed.data);
  }
}
