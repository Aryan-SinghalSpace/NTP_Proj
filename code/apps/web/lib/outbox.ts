/**
 * Offline write outbox — the robust fallback. When a write can't reach the API
 * (network down / server unreachable), it's saved here in localStorage instead of
 * being lost. A watcher retries the queue when the browser comes back online, so
 * data is never dropped. Retries are idempotency-keyed where the endpoint
 * supports it (events), and permanent server rejections (4xx) are dropped so the
 * queue can't loop forever.
 */
import { ApiError, isNetworkError } from './api-error';

export interface OutboxItem {
  id: string;
  kind: 'product' | 'commit' | 'batch' | 'event';
  label: string; // human description shown in the pending-sync UI
  method: 'POST';
  path: string;
  body: unknown;
  createdAt: string;
  attempts: number;
}

const KEY = 'tw.outbox.v1';
type Listener = (items: OutboxItem[]) => void;
const listeners = new Set<Listener>();

function ls(): Storage | null {
  return typeof window !== 'undefined' ? window.localStorage : null;
}

export function readOutbox(): OutboxItem[] {
  const store = ls();
  if (!store) return [];
  try {
    return JSON.parse(store.getItem(KEY) ?? '[]') as OutboxItem[];
  } catch {
    return [];
  }
}

function writeOutbox(items: OutboxItem[]): void {
  const store = ls();
  if (!store) return;
  store.setItem(KEY, JSON.stringify(items));
  for (const l of listeners) l(items);
}

export function subscribe(l: Listener): () => void {
  listeners.add(l);
  l(readOutbox());
  return () => {
    listeners.delete(l);
  };
}

function newId(): string {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) return crypto.randomUUID();
  return `ob_${Date.now()}_${Math.floor(Math.random() * 1e6)}`;
}

export function enqueue(item: Omit<OutboxItem, 'id' | 'createdAt' | 'attempts'>): OutboxItem {
  const full: OutboxItem = { ...item, id: newId(), createdAt: new Date().toISOString(), attempts: 0 };
  writeOutbox([...readOutbox(), full]);
  return full;
}

function remove(id: string): void {
  writeOutbox(readOutbox().filter((i) => i.id !== id));
}

function bumpAttempt(id: string): void {
  writeOutbox(readOutbox().map((i) => (i.id === id ? { ...i, attempts: i.attempts + 1 } : i)));
}

export type Poster = (path: string, body: unknown) => Promise<unknown>;

/**
 * Try to send every queued item. Network failures are kept (retried later);
 * server rejections are dropped (permanent) — a 409 "already recorded" counts as
 * a successful sync since the effect already exists on the server.
 */
export async function flushOutbox(post: Poster): Promise<{ synced: number; kept: number; dropped: number }> {
  let synced = 0;
  let kept = 0;
  let dropped = 0;
  for (const item of readOutbox()) {
    try {
      await post(item.path, item.body);
      remove(item.id);
      synced++;
    } catch (e) {
      if (isNetworkError(e)) {
        bumpAttempt(item.id); // still offline — keep it for the next attempt
        kept++;
      } else if (e instanceof ApiError && e.status === 409) {
        remove(item.id); // already applied on the server (idempotent) — resolved
        synced++;
      } else {
        remove(item.id); // permanent rejection (validation etc.) — drop, don't loop
        dropped++;
      }
    }
  }
  return { synced, kept, dropped };
}
