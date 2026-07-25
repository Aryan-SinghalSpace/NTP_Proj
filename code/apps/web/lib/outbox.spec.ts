import { describe, it, expect, beforeEach } from 'vitest';
import { enqueue, readOutbox, flushOutbox, subscribe, type Poster } from './outbox';
import { ApiError } from './api-error';

const item = (label: string) => ({ kind: 'event' as const, label, method: 'POST' as const, path: '/api/events', body: { x: 1 } });

describe('offline outbox', () => {
  beforeEach(() => localStorage.clear());

  it('enqueue persists an item with an id/createdAt/attempts', () => {
    enqueue(item('one'));
    const all = readOutbox();
    expect(all).toHaveLength(1);
    expect(all[0]!.id).toBeTruthy();
    expect(all[0]!.createdAt).toBeTruthy();
    expect(all[0]!.attempts).toBe(0);
    expect(all[0]!.label).toBe('one');
  });

  it('flush removes items whose POST succeeds', async () => {
    enqueue(item('ok'));
    const poster: Poster = async () => ({});
    const res = await flushOutbox(poster);
    expect(res.synced).toBe(1);
    expect(readOutbox()).toHaveLength(0);
  });

  it('keeps items on a network failure (still offline) but drops permanent 4xx', async () => {
    enqueue(item('net'));
    const networkPoster: Poster = async () => {
      throw new TypeError('Failed to fetch');
    };
    const kept = await flushOutbox(networkPoster);
    expect(kept.kept).toBe(1);
    expect(readOutbox()).toHaveLength(1); // survives to retry later

    const badRequestPoster: Poster = async () => {
      throw new ApiError('TW-GEN-400', 'invalid', 400);
    };
    const dropped = await flushOutbox(badRequestPoster);
    expect(dropped.dropped).toBe(1);
    expect(readOutbox()).toHaveLength(0); // permanent rejection → not retried forever
  });

  it('treats a 409 as already-synced (idempotent replay)', async () => {
    enqueue(item('dup'));
    const conflictPoster: Poster = async () => {
      throw new ApiError('TW-EVENT-409-IDEMPOTENT', 'already recorded', 409);
    };
    const res = await flushOutbox(conflictPoster);
    expect(res.synced).toBe(1);
    expect(readOutbox()).toHaveLength(0);
  });

  it('notifies subscribers on change', () => {
    let latestLen = -1;
    const unsub = subscribe((items) => (latestLen = items.length));
    expect(latestLen).toBe(0); // called immediately with current state
    enqueue(item('sub'));
    expect(latestLen).toBe(1);
    unsub();
  });
});
