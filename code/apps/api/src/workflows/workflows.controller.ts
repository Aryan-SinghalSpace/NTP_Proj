import { BadRequestException, Body, Controller, Get, Param, Patch, Post } from '@nestjs/common';
import { z } from 'zod';
import { WorkflowsService } from './workflows.service';

const createSchema = z.object({ name: z.string().trim().min(1), graph: z.unknown().optional() });
const saveSchema = z.object({ graph: z.unknown() });

@Controller('workflows')
export class WorkflowsController {
  constructor(private readonly workflows: WorkflowsService) {}

  /** GET /api/workflows — definitions with their latest version. */
  @Get()
  list() {
    return this.workflows.list();
  }

  /** POST /api/workflows — create a workflow (draft v1). */
  @Post()
  create(@Body() body: unknown) {
    const parsed = createSchema.safeParse(body);
    if (!parsed.success) throw new BadRequestException(parsed.error.issues.map((i) => `${i.path.join('.')}: ${i.message}`));
    return this.workflows.create(parsed.data.name, parsed.data.graph);
  }

  /** POST /api/workflows/:id/save — persist the current graph (draft). */
  @Post(':id/save')
  save(@Param('id') id: string, @Body() body: unknown) {
    const parsed = saveSchema.safeParse(body);
    if (!parsed.success) throw new BadRequestException('graph is required');
    return this.workflows.saveGraph(id, parsed.data.graph);
  }

  /** PATCH /api/workflows/:id/publish — publish the latest draft. */
  @Patch(':id/publish')
  publish(@Param('id') id: string) {
    return this.workflows.publish(id);
  }
}
