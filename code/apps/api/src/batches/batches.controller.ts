import { BadRequestException, Body, Controller, Get, Post, Query } from '@nestjs/common';
import { BatchesService } from './batches.service';
import { createBatchSchema } from './batch.dto';

@Controller('batches')
export class BatchesController {
  constructor(private readonly batches: BatchesService) {}

  /** GET /api/batches?productId=… — tenant's batches, optionally one product. */
  @Get()
  list(@Query('productId') productId?: string) {
    return this.batches.list(productId?.trim() || undefined);
  }

  /** POST /api/batches — create a batch. */
  @Post()
  create(@Body() body: unknown) {
    const parsed = createBatchSchema.safeParse(body);
    if (!parsed.success) {
      throw new BadRequestException(parsed.error.issues.map((i) => `${i.path.join('.')}: ${i.message}`));
    }
    return this.batches.create(parsed.data);
  }
}
