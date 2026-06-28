import { BadRequestException, Controller, Get, Query } from '@nestjs/common';
import { FIELD_ENTITIES, type FieldEntity } from '@tracewell/field-types';
import { FieldsService } from './fields.service';

@Controller('fields')
export class FieldsController {
  constructor(private readonly fields: FieldsService) {}

  /** GET /api/fields?entity=batch */
  @Get()
  list(@Query('entity') entity?: string) {
    if (!entity || !FIELD_ENTITIES.includes(entity as FieldEntity)) {
      throw new BadRequestException(`entity must be one of: ${FIELD_ENTITIES.join(', ')}`);
    }
    return this.fields.listByEntity(entity as FieldEntity);
  }
}
