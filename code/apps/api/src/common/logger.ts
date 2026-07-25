/**
 * Structured JSON logger. Every log line is one JSON object on stdout (info/warn/
 * debug) or stderr (error), so logs are machine-parseable and every event is
 * captured — the "internal" layer of our two-layer error model. In production
 * these lines are shipped to the log aggregator; requestId ties a UI error
 * (shown to the customer) back to the exact server-side log entry.
 */
export type LogLevel = 'debug' | 'info' | 'warn' | 'error';

export interface LogFields {
  event: string; // short machine key, e.g. 'request.completed', 'error.handled'
  requestId?: string;
  tenantId?: string | null;
  code?: string;
  status?: number;
  method?: string;
  path?: string;
  durationMs?: number;
  detail?: string;
  stack?: string;
  [k: string]: unknown;
}

export function logEvent(level: LogLevel, fields: LogFields): void {
  const line = JSON.stringify({ ts: new Date().toISOString(), level, ...fields });
  if (level === 'error' || level === 'warn') {
    process.stderr.write(line + '\n');
  } else {
    process.stdout.write(line + '\n');
  }
}
