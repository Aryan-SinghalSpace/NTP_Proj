import { Controller, Get, Query } from '@nestjs/common';
import { AuditService } from './audit.service';

@Controller('audit')
export class AuditController {
  constructor(private readonly audit: AuditService) {}

  /** GET /api/audit?limit= — the tenant's append-only audit log (newest first). */
  @Get()
  list(@Query('limit') limit?: string) {
    return this.audit.list(limit ? Number(limit) : undefined);
  }
}
