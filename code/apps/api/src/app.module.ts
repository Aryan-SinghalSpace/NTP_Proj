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
import { AuditModule } from './audit/audit.module';
import { TenantModule } from './tenant/tenant.module';
import { IdentitySchemesModule } from './identity-schemes/identity-schemes.module';
import { ApprovalsModule } from './approvals/approvals.module';
import { NotificationsModule } from './notifications/notifications.module';

@Module({
  imports: [
    DbModule,
    AuditModule,
    HealthModule,
    FieldsModule,
    ProductsModule,
    MasterDataModule,
    BatchesModule,
    EventsModule,
    AccessModule,
    TenantModule,
    IdentitySchemesModule,
    ApprovalsModule,
    NotificationsModule,
  ],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer): void {
    consumer.apply(TenantMiddleware).forRoutes('*');
  }
}
