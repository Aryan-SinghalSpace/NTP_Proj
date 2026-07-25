import { BadRequestException, Body, Controller, Get, Param, Post } from '@nestjs/common';
import { ProductsService } from './products.service';
import { createProductSchema } from './product.dto';

@Controller('products')
export class ProductsController {
  constructor(private readonly products: ProductsService) {}

  /** GET /api/products — the current tenant's products (RLS-scoped). */
  @Get()
  list() {
    return this.products.list();
  }

  /** GET /api/products/:id */
  @Get(':id')
  getOne(@Param('id') id: string) {
    return this.products.getById(id);
  }

  /** POST /api/products — create a draft product. */
  @Post()
  create(@Body() body: unknown) {
    const parsed = createProductSchema.safeParse(body);
    if (!parsed.success) {
      throw new BadRequestException(parsed.error.issues.map((i) => `${i.path.join('.')}: ${i.message}`));
    }
    return this.products.create(parsed.data);
  }
}
