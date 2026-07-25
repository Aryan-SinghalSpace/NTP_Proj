import { BadRequestException, Body, Controller, Get, Post, Query } from '@nestjs/common';
import { EventsService } from './events.service';
import { createEventSchema } from './event.dto';

@Controller('events')
export class EventsController {
  constructor(private readonly events: EventsService) {}

  /** GET /api/events?type=&subjectId=&limit= — the event stream (newest first). */
  @Get()
  list(
    @Query('type') type?: string,
    @Query('subjectId') subjectId?: string,
    @Query('limit') limit?: string,
  ) {
    return this.events.list({
      type: type?.trim() || undefined,
      subjectId: subjectId?.trim() || undefined,
      limit: limit ? Number(limit) : undefined,
    });
  }

  /** POST /api/events — append an event. */
  @Post()
  create(@Body() body: unknown) {
    const parsed = createEventSchema.safeParse(body);
    if (!parsed.success) {
      throw new BadRequestException(parsed.error.issues.map((i) => `${i.path.join('.')}: ${i.message}`));
    }
    return this.events.create(parsed.data);
  }
}
