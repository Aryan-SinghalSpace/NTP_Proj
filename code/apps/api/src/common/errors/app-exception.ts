import { HttpException } from '@nestjs/common';
import { ERROR_CATALOG, type ErrorCode } from './error-catalog';

/**
 * The only exception the app should throw for expected error conditions. It
 * carries a catalog code; the global filter turns it into the customer-facing
 * envelope and the structured log. `detail` is internal-only (never sent to the
 * client) and is appended to the log line.
 */
export class AppException extends HttpException {
  readonly code: ErrorCode;
  readonly internal: string;

  constructor(code: ErrorCode, opts?: { detail?: string; cause?: unknown }) {
    const def = ERROR_CATALOG[code];
    // The HttpException body doubles as a fallback response shape; the filter
    // rewrites it into the standard envelope.
    super({ code: def.code, message: def.message }, def.httpStatus);
    this.code = code;
    this.internal = opts?.detail ? `${def.internal} — ${opts.detail}` : def.internal;
    if (opts?.cause !== undefined) this.cause = opts.cause;
  }
}
