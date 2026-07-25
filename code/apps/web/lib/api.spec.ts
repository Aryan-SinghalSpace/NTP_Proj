import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { getProducts, createProduct } from './api';
import { ApiError, QueuedOfflineError } from './api-error';
import { readOutbox } from './outbox';

const jsonRes = (body: unknown, init?: ResponseInit) => new Response(JSON.stringify(body), { status: 200, ...init });

describe('API client', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.restoreAllMocks();
  });
  afterEach(() => vi.restoreAllMocks());

  it('getProducts returns the rows on 200', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(jsonRes([{ id: 'p1', name: 'X' }])));
    const rows = await getProducts();
    expect(rows).toHaveLength(1);
    expect(rows[0]!.id).toBe('p1');
  });

  it('getProducts throws a typed ApiError on a non-OK response', async () => {
    // fresh Response per call — a Response body can only be read once
    vi.stubGlobal(
      'fetch',
      vi.fn(() =>
        Promise.resolve(
          new Response(JSON.stringify({ error: { code: 'TW-TENANT-403', message: 'no access' } }), { status: 403 }),
        ),
      ),
    );
    const err = (await getProducts().catch((e) => e)) as ApiError;
    expect(err).toBeInstanceOf(ApiError);
    expect(err.code).toBe('TW-TENANT-403');
    expect(err.status).toBe(403);
  });

  it('a write while offline is saved to the outbox and throws QueuedOfflineError', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new TypeError('Failed to fetch')));
    await expect(
      createProduct({ brand: 'V', name: 'Offline Bar', netContent: '1', packType: 'FW', brandOwner: 'Co', category: 'C' }),
    ).rejects.toBeInstanceOf(QueuedOfflineError);

    const queued = readOutbox();
    expect(queued).toHaveLength(1);
    expect(queued[0]!.kind).toBe('product');
    expect(queued[0]!.path).toBe('/api/products');
  });
});
