import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
import { DbModule } from './db/db.module';
import { TenantMiddleware } from './common/tenant.middleware';
import { HealthModule } from './health/health.module';
import { FieldsModule } from './fields/fields.module';
import { ProductsModule } from './products/products.module';
import { MasterDataModule } from './master-data/master-data.module';
import { BatchesModule } from './batches/batches.module';
import { EventsModule } from './events/events.module';
import { AccessModule } from './access/access.module';

@Module({
  imports: [
    DbModule,
    HealthModule,
    FieldsModule,
    ProductsModule,
    MasterDataModule,
    BatchesModule,
    EventsModule,
    AccessModule,
  ],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer): void {
    consumer.apply(TenantMiddleware).forRoutes('*');
  }
}
