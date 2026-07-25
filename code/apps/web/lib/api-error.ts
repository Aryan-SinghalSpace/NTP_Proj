/**
 * Client-side error model that mirrors the API's two-layer contract.
 * - `ApiError` carries the server's stable code + FRIENDLY message + requestId,
 *   so the UI can show something a customer understands and the user can quote
 *   the requestId when reporting a problem.
 * - `QueuedOfflineError` means the write couldn't reach the API and was saved to
 *   the offline outbox instead — the caller should treat it as "accepted, will
 *   sync", not as a failure.
 */

export interface ApiErrorEnvelope {
  code: string;
  message: string;
  requestId?: string;
  timestamp?: string;
  details?: string[];
}

export class ApiError extends Error {
  constructor(
    public code: string,
    message: string,
    public status: number,
    public requestId?: string,
    public details?: string[],
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

export class QueuedOfflineError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'QueuedOfflineError';
  }
}

/** Build a typed ApiError from a non-OK Response (reads the standard envelope). */
export async function toApiError(res: Response): Promise<ApiError> {
  const requestId = res.headers.get('x-request-id') ?? undefined;
  let code = `HTTP-${res.status}`;
  let message = 'Something went wrong. Please try again.';
  let details: string[] | undefined;
  try {
    const j = (await res.json()) as { error?: ApiErrorEnvelope; message?: unknown };
    if (j?.error) {
      code = j.error.code ?? code;
      message = j.error.message ?? message;
      details = j.error.details;
    } else if (j?.message) {
      message = Array.isArray(j.message) ? j.message.join(', ') : String(j.message);
    }
  } catch {
    /* non-JSON body — keep the generic message */
  }
  return new ApiError(code, message, res.status, requestId, details);
}

/** A fetch rejection (TypeError) means the network/API is unreachable — not an HTTP error. */
export function isNetworkError(e: unknown): boolean {
  return e instanceof TypeError;
}

export function isQueuedOffline(e: unknown): e is QueuedOfflineError {
  return e instanceof QueuedOfflineError;
}
