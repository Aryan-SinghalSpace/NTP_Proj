import { BadRequestException, Body, Controller, Get, Param, Patch, Post, Query } from '@nestjs/common';
import { FIELD_ENTITIES, type FieldEntity } from '@tracewell/field-types';
import { FieldsService } from './fields.service';
import { createFieldSchema } from './field.dto';

@Controller('fields')
export class FieldsController {
  constructor(private readonly fields: FieldsService) {}

  /** GET /api/fields?entity=batch&includeInactive=1 */
  @Get()
  list(@Query('entity') entity?: string, @Query('includeInactive') includeInactive?: string) {
    if (!entity || !FIELD_ENTITIES.includes(entity as FieldEntity)) {
      throw new BadRequestException(`entity must be one of: ${FIELD_ENTITIES.join(', ')}`);
    }
    const inactive = includeInactive === '1' || includeInactive === 'true';
    return this.fields.listByEntity(entity as FieldEntity, inactive);
  }

  /** POST /api/fields — add a Tenant Custom field. */
  @Post()
  create(@Body() body: unknown) {
    const parsed = createFieldSchema.safeParse(body);
    if (!parsed.success) {
      throw new BadRequestException(parsed.error.issues.map((i) => `${i.path.join('.')}: ${i.message}`));
    }
    return this.fields.create(parsed.data);
  }

  /** PATCH /api/fields/:id/deactivate — deactivate-not-delete (invariant #4). */
  @Patch(':id/deactivate')
  deactivate(@Param('id') id: string) {
    return this.fields.setStatus(id, 'deactivated');
  }

  /** PATCH /api/fields/:id/reactivate */
  @Patch(':id/reactivate')
  reactivate(@Param('id') id: string) {
    return this.fields.setStatus(id, 'active');
  }
}
