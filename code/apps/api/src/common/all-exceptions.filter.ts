import { ArgumentsHost, Catch, HttpException, HttpStatus, type ExceptionFilter } from '@nestjs/common';
import type { Request, Response } from 'express';
import { currentTenant } from '../db/tenant-context';
import { logEvent } from './logger';
import { AppException } from './errors/app-exception';
import { ERROR_CATALOG, type ErrorCode } from './errors/error-catalog';

/** Map a bare HTTP status (from a framework HttpException) to a catalog code. */
function codeForStatus(status: number): ErrorCode {
  switch (status) {
    case HttpStatus.BAD_REQUEST:
      return 'TW-GEN-400';
    case HttpStatus.UNAUTHORIZED:
      return 'TW-AUTH-401';
    case HttpStatus.FORBIDDEN:
      return 'TW-TENANT-403';
    case HttpStatus.NOT_FOUND:
      return 'TW-GEN-404';
    case HttpStatus.CONFLICT:
      return 'TW-GEN-409';
    default:
      return 'TW-GEN-500';
  }
}

/**
 * Catches EVERY exception and produces the two layers of our error model:
 *  1. Customer-facing: a stable JSON envelope { error: { code, message,
 *     requestId, timestamp, details? } } — friendly, no internals, no stack.
 *  2. Internal: one structured error log line with the real cause + stack +
 *     requestId + tenant, so we can always trace what happened.
 */
@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const res = ctx.getResponse<Response>();
    const req = ctx.getRequest<Request>();
    const { requestId, tenantId } = currentTenant();

    let code: ErrorCode;
    let status: number;
    let details: unknown;
    let internal: string;

    if (exception instanceof AppException) {
      code = exception.code;
      status = exception.getStatus();
      internal = exception.internal;
    } else if (exception instanceof HttpException) {
      status = exception.getStatus();
      code = codeForStatus(status);
      const body = exception.getResponse();
      // Framework/validation exceptions carry a `message` (string or string[]).
      const raw = typeof body === 'object' && body !== null ? (body as { message?: unknown }).message : body;
      details = Array.isArray(raw) ? raw : undefined;
      internal = `${exception.name}: ${typeof raw === 'string' ? raw : JSON.stringify(raw)}`;
    } else if ((exception as { code?: string })?.code === '22P02') {
      // Postgres invalid_text_representation — e.g. a malformed UUID in the path.
      status = HttpStatus.BAD_REQUEST;
      code = 'TW-GEN-400';
      internal = `invalid input (22P02): ${exception instanceof Error ? exception.message : String(exception)}`;
    } else {
      status = HttpStatus.INTERNAL_SERVER_ERROR;
      code = 'TW-GEN-500';
      internal = exception instanceof Error ? exception.message : String(exception);
    }

    const message = ERROR_CATALOG[code].message;

    // Layer 2 — internal structured log (full detail; 5xx as error, else warn).
    logEvent(status >= 500 ? 'error' : 'warn', {
      event: 'error.handled',
      requestId,
      tenantId,
      code,
      status,
      method: req.method,
      path: req.originalUrl ?? req.url,
      detail: internal,
      stack: exception instanceof Error ? exception.stack : undefined,
    });

    // Layer 1 — customer-facing envelope (friendly; never leaks internals).
    res.status(status).json({
      error: {
        code,
        message,
        requestId,
        timestamp: new Date().toISOString(),
        ...(details ? { details } : {}),
      },
    });
  }
}
