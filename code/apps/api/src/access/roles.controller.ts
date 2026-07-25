import { BadRequestException, Body, Controller, Get, Param, Patch, Post } from '@nestjs/common';
import { RolesService } from './roles.service';
import { createRoleSchema, updateRoleSchema } from './access.dto';

@Controller('roles')
export class RolesController {
  constructor(private readonly roles: RolesService) {}

  /** GET /api/roles — roles with live member counts. */
  @Get()
  list() {
    return this.roles.list();
  }

  /** POST /api/roles — create a configurable role. */
  @Post()
  create(@Body() body: unknown) {
    const parsed = createRoleSchema.safeParse(body);
    if (!parsed.success) {
      throw new BadRequestException(parsed.error.issues.map((i) => `${i.path.join('.')}: ${i.message}`));
    }
    return this.roles.create(parsed.data);
  }

  /** PATCH /api/roles/:id — update name/description/permission matrix. */
  @Patch(':id')
  update(@Param('id') id: string, @Body() body: unknown) {
    const parsed = updateRoleSchema.safeParse(body);
    if (!parsed.success) {
      throw new BadRequestException(parsed.error.issues.map((i) => `${i.path.join('.')}: ${i.message}`));
    }
    return this.roles.update(id, parsed.data);
  }
}
