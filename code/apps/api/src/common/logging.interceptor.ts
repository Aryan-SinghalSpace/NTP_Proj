import { CallHandler, ExecutionContext, Injectable, type NestInterceptor } from '@nestjs/common';
import type { Request, Response } from 'express';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { currentTenant } from '../db/tenant-context';
import { logEvent } from './logger';

/**
 * Logs the lifecycle of every request (the "always-on" logging layer): one
 * structured line per completed request with method, path, status, duration,
 * requestId and tenant. Errors are logged separately (with the cause) by the
 * exception filter, so this only needs the success path — but `now` is computed
 * before handling so the duration is accurate either way.
 */
@Injectable()
export class LoggingInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const http = context.switchToHttp();
    const req = http.getRequest<Request>();
    const res = http.getResponse<Response>();
    const { requestId, tenantId } = currentTenant();
    const start = Date.now();

    return next.handle().pipe(
      tap({
        next: () => {
          logEvent('info', {
            event: 'request.completed',
            requestId,
            tenantId,
            method: req.method,
            path: req.originalUrl ?? req.url,
            status: res.statusCode,
            durationMs: Date.now() - start,
          });
        },
        // Errors are logged by AllExceptionsFilter (with the cause); nothing here.
      }),
    );
  }
}
