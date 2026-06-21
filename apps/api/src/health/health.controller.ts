import { Controller, Get } from '@nestjs/common';

@Controller('health')
export class HealthController {
  @Get()
  health(): { status: string; service: string; ts: string } {
    return { status: 'ok', service: 'api', ts: new Date().toISOString() };
  }
}
