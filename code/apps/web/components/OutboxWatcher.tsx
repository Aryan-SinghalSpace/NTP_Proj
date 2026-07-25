'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { subscribe, flushOutbox, readOutbox, type OutboxItem } from '../lib/outbox';
import { sendQueued } from '../lib/api';

/**
 * Watches the offline outbox. Retries queued writes on mount, whenever the
 * browser comes back online, and on a light interval — and shows a small pill so
 * the user always knows their offline changes are safe and syncing. Mounted once
 * in the root layout.
 */
export function OutboxWatcher() {
  const router = useRouter();
  const [items, setItems] = useState<OutboxItem[]>([]);
  const [syncing, setSyncing] = useState(false);
  const [offline, setOffline] = useState(false);

  useEffect(() => subscribe(setItems), []);

  useEffect(() => {
    let mounted = true;

    async function flush() {
      if (typeof navigator !== 'undefined' && navigator.onLine === false) {
        setOffline(true);
        return;
      }
      setOffline(false);
      if (readOutbox().length === 0) return;
      setSyncing(true);
      try {
        const { synced } = await flushOutbox(sendQueued);
        if (synced > 0) router.refresh(); // refresh server-rendered lists
      } finally {
        if (mounted) setSyncing(false);
      }
    }

    void flush();
    const onOnline = () => void flush();
    const onOffline = () => setOffline(true);
    window.addEventListener('online', onOnline);
    window.addEventListener('offline', onOffline);
    const iv = window.setInterval(() => void flush(), 15000);
    return () => {
      mounted = false;
      window.removeEventListener('online', onOnline);
      window.removeEventListener('offline', onOffline);
      window.clearInterval(iv);
    };
  }, [router]);

  if (items.length === 0 && !offline) return null;

  const count = items.length;
  return (
    <div className="fixed bottom-4 left-4 z-[60] flex items-center gap-2 rounded-xl border border-border bg-surface px-3 py-2 text-[12.5px] font-semibold shadow-lg">
      <span
        className="h-2 w-2 rounded-full"
        style={{ background: syncing ? 'var(--amber)' : offline ? 'var(--subtle)' : 'var(--teal)' }}
      />
      {count === 0
        ? 'Offline — changes will sync when you’re back'
        : syncing
          ? `Syncing ${count} change${count > 1 ? 's' : ''}…`
          : `${count} change${count > 1 ? 's' : ''} saved offline`}
      {count > 0 && !syncing && (
        <button
          onClick={() => void flushOutbox(sendQueued)}
          className="ml-1 rounded-lg border border-border-strong px-2 py-0.5 text-[11px] hover:bg-surface-2"
        >
          Retry now
        </button>
      )}
    </div>
  );
}
