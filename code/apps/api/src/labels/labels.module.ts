import { Module } from '@nestjs/common';
import { LabelsController, LabelsService } from './labels.controller';

@Module({
  controllers: [LabelsController],
  providers: [LabelsService],
})
export class LabelsModule {}
