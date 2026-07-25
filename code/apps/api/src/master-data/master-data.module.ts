import { Module } from '@nestjs/common';
import { ManufacturingUnitsController } from './manufacturing-units.controller';
import { ManufacturingUnitsService } from './manufacturing-units.service';
import { BrandOwnersController } from './brand-owners.controller';
import { BrandOwnersService } from './brand-owners.service';

/** Identity & Master Data secondary entities: manufacturing units + brand owners. */
@Module({
  controllers: [ManufacturingUnitsController, BrandOwnersController],
  providers: [ManufacturingUnitsService, BrandOwnersService],
})
export class MasterDataModule {}
