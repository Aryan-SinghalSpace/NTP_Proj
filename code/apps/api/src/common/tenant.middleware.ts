import { Injectable, type NestMiddleware } from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import type { NextFunction, Request, Response } from 'express';
import { tenantStorage, type AppRole } from '../db/tenant-context';

/**
 * Scaffold tenant resolution + request correlation. Reads `x-tenant-id` (and
 * `x-platform: 1` for Super-Admin cross-tenant access), assigns a `requestId`
 * (echoed back in the `x-request-id` response header so the client can quote it
 * when reporting a problem), and stashes them in the AsyncLocalStorage that the
 * DB service, logger and exception filter all read. This is a stand-in — real
 * OIDC/JWT auth will populate the same context from a verified token.
 */
@Injectable()
export class TenantMiddleware implements NestMiddleware {
  use(req: Request, res: Response, next: NextFunction): void {
    const tenantId = (req.header('x-tenant-id') ?? '').trim() || null;
    const role: AppRole = req.header('x-platform') === '1' ? 'platform' : 'tenant';
    const requestId = (req.header('x-request-id') ?? '').trim() || randomUUID();
    res.setHeader('x-request-id', requestId);
    tenantStorage.run({ tenantId, role, requestId }, () => next());
  }
}
