import { BadRequestException, Body, Controller, Get, Patch } from '@nestjs/common';
import { z } from 'zod';
import { TenantService } from './tenant.service';

const patchSchema = z.object({
  name: z.string().trim().min(1).optional(),
  settings: z.record(z.unknown()).optional(),
});

@Controller()
export class TenantController {
  constructor(private readonly tenant: TenantService) {}

  /** GET /api/tenant — current tenant profile + settings. */
  @Get('tenant')
  get() {
    return this.tenant.get();
  }

  /** PATCH /api/tenant — update name + settings. */
  @Patch('tenant')
  update(@Body() body: unknown) {
    const parsed = patchSchema.safeParse(body);
    if (!parsed.success) {
      throw new BadRequestException(parsed.error.issues.map((i) => `${i.path.join('.')}: ${i.message}`));
    }
    return this.tenant.update(parsed.data);
  }

  /** GET /api/me — current user (auth stand-in). */
  @Get('me')
  me() {
    return this.tenant.me();
  }
}
