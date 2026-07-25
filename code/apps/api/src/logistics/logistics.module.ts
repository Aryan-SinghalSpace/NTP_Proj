import { Module } from '@nestjs/common';
import { EventsModule } from '../events/events.module';
import { LogisticsController } from './logistics.controller';
import { DealersService } from './dealers.service';
import { ShipmentsService } from './shipments.service';

@Module({
  imports: [EventsModule], // ShipmentsService appends Dispatch/Receive events
  controllers: [LogisticsController],
  providers: [DealersService, ShipmentsService],
})
export class LogisticsModule {}
