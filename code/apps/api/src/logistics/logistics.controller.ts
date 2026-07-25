import { BadRequestException, Body, Controller, Get, Param, Patch, Post, Query } from '@nestjs/common';
import { DealersService } from './dealers.service';
import { ShipmentsService } from './shipments.service';
import { createDealerSchema, createShipmentSchema, updateLegSchema } from './logistics.dto';

@Controller()
export class LogisticsController {
  constructor(
    private readonly dealers: DealersService,
    private readonly shipments: ShipmentsService,
  ) {}

  @Get('dealers')
  listDealers() {
    return this.dealers.list();
  }

  @Post('dealers')
  createDealer(@Body() body: unknown) {
    const parsed = createDealerSchema.safeParse(body);
    if (!parsed.success) throw new BadRequestException(parsed.error.issues.map((i) => `${i.path.join('.')}: ${i.message}`));
    return this.dealers.create(parsed.data);
  }

  @Get('shipments')
  listShipments() {
    return this.shipments.list();
  }

  /** POST /api/shipments — multi-dealer dispatch (also appends a Dispatch event). */
  @Post('shipments')
  createShipment(@Body() body: unknown) {
    const parsed = createShipmentSchema.safeParse(body);
    if (!parsed.success) throw new BadRequestException(parsed.error.issues.map((i) => `${i.path.join('.')}: ${i.message}`));
    return this.shipments.create(parsed.data);
  }

  /** PATCH /api/shipment-legs/:id — receive / update a leg. */
  @Patch('shipment-legs/:id')
  updateLeg(@Param('id') id: string, @Body() body: unknown) {
    const parsed = updateLegSchema.safeParse(body);
    if (!parsed.success) throw new BadRequestException(parsed.error.issues.map((i) => `${i.path.join('.')}: ${i.message}`));
    return this.shipments.updateLeg(id, parsed.data);
  }

  /** GET /api/recall-fanout?batchId= — dealers impacted by a recalled batch. */
  @Get('recall-fanout')
  recallFanout(@Query('batchId') batchId?: string) {
    if (!batchId) throw new BadRequestException('batchId is required');
    return this.shipments.recallFanout(batchId);
  }
}
