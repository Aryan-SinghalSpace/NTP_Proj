import { Module } from '@nestjs/common';
import { RolesController } from './roles.controller';
import { RolesService } from './roles.service';
import { UsersController } from './users.controller';
import { UsersService } from './users.service';

/** Tenant identity & access: configurable roles + tenant users. */
@Module({
  controllers: [RolesController, UsersController],
  providers: [RolesService, UsersService],
})
export class AccessModule {}
