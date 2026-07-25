import { Controller, Get } from '@nestjs/common';
import { BrandOwnersService } from './brand-owners.service';

@Controller('brand-owners')
export class BrandOwnersController {
  constructor(private readonly owners: BrandOwnersService) {}

  /** GET /api/brand-owners — tenant's brand owners with live product/brand counts. */
  @Get()
  list() {
    return this.owners.list();
  }
}
