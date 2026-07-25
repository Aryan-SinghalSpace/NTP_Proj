import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
import { DbModule } from './db/db.module';
import { TenantMiddleware } from './common/tenant.middleware';
import { HealthModule } from './health/health.module';
import { FieldsModule } from './fields/fields.module';
import { ProductsModule } from './products/products.module';

@Module({
  imports: [DbModule, HealthModule, FieldsModule, ProductsModule],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer): void {
    consumer.apply(TenantMiddleware).forRoutes('*');
  }
}
