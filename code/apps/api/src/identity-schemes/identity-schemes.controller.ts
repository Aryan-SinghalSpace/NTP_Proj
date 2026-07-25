import { BadRequestException, Body, Controller, Get, Param, Patch, Post } from '@nestjs/common';
import { z } from 'zod';
import { IdentitySchemesService, createSchemeSchema } from './identity-schemes.service';

const togglePatch = z.object({ enabled: z.boolean() });

@Controller('identity-schemes')
export class IdentitySchemesController {
  constructor(private readonly schemes: IdentitySchemesService) {}

  /** GET /api/identity-schemes */
  @Get()
  list() {
    return this.schemes.list();
  }

  /** POST /api/identity-schemes — add a custom scheme. */
  @Post()
  create(@Body() body: unknown) {
    const parsed = createSchemeSchema.safeParse(body);
    if (!parsed.success) {
      throw new BadRequestException(parsed.error.issues.map((i) => `${i.path.join('.')}: ${i.message}`));
    }
    return this.schemes.create(parsed.data);
  }

  /** PATCH /api/identity-schemes/:id — enable/disable. */
  @Patch(':id')
  toggle(@Param('id') id: string, @Body() body: unknown) {
    const parsed = togglePatch.safeParse(body);
    if (!parsed.success) throw new BadRequestException('enabled (boolean) is required');
    return this.schemes.setEnabled(id, parsed.data.enabled);
  }
}
