import { describe, it, expect } from 'vitest';
import { toApiError, isNetworkError, isQueuedOffline, ApiError, QueuedOfflineError } from './api-error';

describe('toApiError', () => {
  it('parses the standard error envelope (code, friendly message, requestId, details)', async () => {
    const res = new Response(JSON.stringify({ error: { code: 'TW-X', message: 'friendly text', details: ['a', 'b'] } }), {
      status: 409,
      headers: { 'x-request-id': 'rid-1' },
    });
    const err = await toApiError(res);
    expect(err).toBeInstanceOf(ApiError);
    expect(err.code).toBe('TW-X');
    expect(err.message).toBe('friendly text');
    expect(err.status).toBe(409);
    expect(err.requestId).toBe('rid-1');
    expect(err.details).toEqual(['a', 'b']);
  });

  it('falls back to a generic message on a non-JSON body', async () => {
    const res = new Response('gateway boom', { status: 500 });
    const err = await toApiError(res);
    expect(err.status).toBe(500);
    expect(err.code).toBe('HTTP-500');
    expect(err.message).toMatch(/something went wrong/i);
  });
});

describe('error type guards', () => {
  it('isNetworkError only matches fetch TypeErrors', () => {
    expect(isNetworkError(new TypeError('Failed to fetch'))).toBe(true);
    expect(isNetworkError(new Error('nope'))).toBe(false);
    expect(isNetworkError(new ApiError('TW-X', 'm', 400))).toBe(false);
  });

  it('isQueuedOffline matches the queued-offline sentinel', () => {
    expect(isQueuedOffline(new QueuedOfflineError('saved offline'))).toBe(true);
    expect(isQueuedOffline(new Error('x'))).toBe(false);
  });
});
