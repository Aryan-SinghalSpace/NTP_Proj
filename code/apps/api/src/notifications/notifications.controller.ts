import { BadRequestException, Body, Controller, Get, Param, Patch, Post } from '@nestjs/common';
import { z } from 'zod';
import { NotificationsService, createRuleSchema } from './notifications.service';

const togglePatch = z.object({ enabled: z.boolean() });

@Controller()
export class NotificationsController {
  constructor(private readonly notifications: NotificationsService) {}

  /** GET /api/notification-rules */
  @Get('notification-rules')
  listRules() {
    return this.notifications.listRules();
  }

  /** POST /api/notification-rules */
  @Post('notification-rules')
  createRule(@Body() body: unknown) {
    const parsed = createRuleSchema.safeParse(body);
    if (!parsed.success) {
      throw new BadRequestException(parsed.error.issues.map((i) => `${i.path.join('.')}: ${i.message}`));
    }
    return this.notifications.createRule(parsed.data);
  }

  /** PATCH /api/notification-rules/:id — enable/disable. */
  @Patch('notification-rules/:id')
  toggle(@Param('id') id: string, @Body() body: unknown) {
    const parsed = togglePatch.safeParse(body);
    if (!parsed.success) throw new BadRequestException('enabled (boolean) is required');
    return this.notifications.setEnabled(id, parsed.data.enabled);
  }

  /** GET /api/notification-deliveries — the delivery log. */
  @Get('notification-deliveries')
  listDeliveries() {
    return this.notifications.listDeliveries();
  }
}
