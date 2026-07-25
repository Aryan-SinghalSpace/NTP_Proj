import { Module } from '@nestjs/common';
import { IdentitySchemesController } from './identity-schemes.controller';
import { IdentitySchemesService } from './identity-schemes.service';

@Module({
  controllers: [IdentitySchemesController],
  providers: [IdentitySchemesService],
})
export class IdentitySchemesModule {}
