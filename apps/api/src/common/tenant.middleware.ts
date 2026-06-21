import { Injectable, type NestMiddleware } from '@nestjs/common';
import type { NextFunction, Request, Response } from 'express';
import { tenantStorage, type AppRole } from '../db/tenant-context';

/**
 * Scaffold tenant resolution: reads `x-tenant-id` (and `x-platform: 1` for
 * Super-Admin cross-tenant access) from headers and stashes them in the
 * AsyncLocalStorage that TenantDbService reads. This is a stand-in — real
 * OIDC/JWT auth will populate the same context from a verified token.
 */
@Injectable()
export class TenantMiddleware implements NestMiddleware {
  use(req: Request, _res: Response, next: NextFunction): void {
    const tenantId = (req.header('x-tenant-id') ?? '').trim() || null;
    const role: AppRole = req.header('x-platform') === '1' ? 'platform' : 'tenant';
    tenantStorage.run({ tenantId, role }, () => next());
  }
}
