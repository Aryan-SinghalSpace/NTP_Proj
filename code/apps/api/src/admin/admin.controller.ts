import { Controller, Get } from '@nestjs/common';
import { AdminService } from './admin.service';

/** Platform Super-Admin console — cross-tenant reads (platform role required). */
@Controller('admin')
export class AdminController {
  constructor(private readonly admin: AdminService) {}

  /** GET /api/admin/tenants */
  @Get('tenants')
  tenants() {
    return this.admin.tenants();
  }

  /** GET /api/admin/super-fields — canonical Super Fields + pending promotions. */
  @Get('super-fields')
  superFields() {
    return this.admin.superFields();
  }

  /** GET /api/admin/usage — platform-wide usage aggregates. */
  @Get('usage')
  usage() {
    return this.admin.usage();
  }
}
