import { Controller, Get } from '@nestjs/common';
import { ManufacturingUnitsService } from './manufacturing-units.service';

@Controller('manufacturing-units')
export class ManufacturingUnitsController {
  constructor(private readonly units: ManufacturingUnitsService) {}

  /** GET /api/manufacturing-units — tenant's units with live product counts. */
  @Get()
  list() {
    return this.units.list();
  }
}
