import { BadRequestException, Body, Controller, Get, Post } from '@nestjs/common';
import { UsersService } from './users.service';
import { createUserSchema } from './access.dto';

@Controller('users')
export class UsersController {
  constructor(private readonly users: UsersService) {}

  /** GET /api/users — tenant users with their role name. */
  @Get()
  list() {
    return this.users.list();
  }

  /** POST /api/users — invite a user. */
  @Post()
  create(@Body() body: unknown) {
    const parsed = createUserSchema.safeParse(body);
    if (!parsed.success) {
      throw new BadRequestException(parsed.error.issues.map((i) => `${i.path.join('.')}: ${i.message}`));
    }
    return this.users.create(parsed.data);
  }
}
