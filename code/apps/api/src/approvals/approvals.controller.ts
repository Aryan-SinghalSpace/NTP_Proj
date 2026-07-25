import { BadRequestException, Body, Controller, Get, Param, Patch } from '@nestjs/common';
import { z } from 'zod';
import { ApprovalsService } from './approvals.service';

const decisionSchema = z.object({ decision: z.enum(['approved', 'rejected']) });

@Controller('approvals')
export class ApprovalsController {
  constructor(private readonly approvals: ApprovalsService) {}

  /** GET /api/approvals — the approval queue. */
  @Get()
  list() {
    return this.approvals.list();
  }

  /** PATCH /api/approvals/:id — approve or reject. */
  @Patch(':id')
  decide(@Param('id') id: string, @Body() body: unknown) {
    const parsed = decisionSchema.safeParse(body);
    if (!parsed.success) throw new BadRequestException('decision must be "approved" or "rejected"');
    return this.approvals.decide(id, parsed.data.decision);
  }
}
