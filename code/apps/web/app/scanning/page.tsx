'use client';

import { useEffect, useState } from 'react';
import { PageShell } from '../../components/PageShell';
import { ScanIcon, TruckIcon, BoxIcon, CheckIcon, ClockIcon } from '../../components/icons';
import { getAllBatches, getEvents, createEvent, sendQueued, type ApiBatch, type ApiEvent } from '../../lib/api';
import { isQueuedOffline } from '../../lib/api-error';
import { subscribe, flushOutbox, type OutboxItem } from '../../lib/outbox';

const MODES = [
  { key: 'tag', name: 'Tag', desc: 'Commission a unit against a label', icon: ScanIcon, eventType: 'Commission' },
  { key: 'dispatch', name: 'Dispatch', desc: 'Scan out to a dealer leg', icon: TruckIcon, eventType: 'Dispatch' },
  { key: 'receive', name: 'Receive', desc: 'Confirm inbound at a location', icon: BoxIcon, eventType: 'Receive' },
] as const;

function fmtTime(iso: string): string {
  return new Date(iso).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false });
}

export default function ScanningPage() {
  const [mode, setMode] = useState<(typeof MODES)[number]['key']>('tag');
  const [batches, setBatches] = useState<ApiBatch[]>([]);
  const [subjectId, setSubjectId] = useState('');
  const [events, setEvents] = useState<ApiEvent[]>([]);
  const [queued, setQueued] = useState<OutboxItem[]>([]);
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);
  const [online, setOnline] = useState(true);

  const active = MODES.find((m) => m.key === mode)!;
  const flash = (t: string) => {
    setNotice(t);
    window.setTimeout(() => setNotice(null), 2200);
  };

  async function load() {
    try {
      const [b, e] = await Promise.all([getAllBatches(), getEvents({ limit: 20 })]);
      setBatches(b);
      setEvents(e);
      if (!subjectId && b[0]) setSubjectId(b[0].id);
    } catch {
      /* offline / API down — scanning still queues */
    }
  }
  useEffect(() => {
    void load();
    const unsub = subscribe(setQueued);
    setOnline(typeof navigator === 'undefined' ? true : navigator.onLine);
    const on = () => setOnline(true);
    const off = () => setOnline(false);
    window.addEventListener('online', on);
    window.addEventListener('offline', off);
    return () => {
      unsub();
      window.removeEventListener('online', on);
      window.removeEventListener('offline', off);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function scan() {
    const batch = batches.find((b) => b.id === subjectId);
    if (!batch || busy) return;
    setBusy(true);
    try {
      await createEvent({
        eventType: active.eventType,
        subjectKind: 'batch',
        subjectId: batch.id,
        subjectLabel: batch.batchNumber,
        actor: 'scan.pwa',
        location: 'Scan surface',
        detail: `${active.name} scan · ${batch.batchNumber}`,
      });
      flash(`${active.name} recorded · ${batch.batchNumber}`);
      await load();
    } catch (e) {
      if (isQueuedOffline(e)) {
        flash(`Saved offline · will sync`);
      } else {
        flash(e instanceof Error ? e.message : 'Scan failed');
      }
    } finally {
      setBusy(false);
    }
  }

  return (
    <PageShell
      active="/scanning"
      title="Scanning App"
      subtitle="Mobile PWA preview · tag / dispatch / receive against labels · offline-first with automatic sync"
    >
      {notice && (
        <div className="fixed left-1/2 top-[74px] z-50 -translate-x-1/2 rounded-xl bg-[var(--success-soft)] px-4 py-2 text-[12.5px] font-semibold text-[var(--success-fg)] shadow">
          {notice}
        </div>
      )}

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[340px_1fr]">
        {/* phone frame */}
        <div className="flex justify-center">
          <div className="w-[300px] rounded-[36px] border-[6px] border-[#1b1922] bg-[#1b1922] p-2 shadow-lg">
            <div className="overflow-hidden rounded-[28px] bg-bg">
              <div className="flex items-center justify-between px-4 py-2 text-[11px] font-semibold text-muted">
                <span>{new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false })}</span>
                <span
                  className="rounded-full px-2 py-0.5 text-[10px] font-bold"
                  style={online ? { background: 'var(--success-soft)', color: 'var(--success-fg)' } : { background: 'var(--warning-soft)', color: 'var(--warning-fg)' }}
                >
                  {online ? 'Online' : 'Offline'}
                </span>
              </div>

              <div className="relative mx-3 grid h-[150px] place-items-center overflow-hidden rounded-2xl bg-[#14121a]">
                <div className="absolute inset-6 rounded-xl border-2 border-white/30" />
                <div className="absolute left-6 right-6 h-0.5 bg-[var(--teal)]" style={{ top: '50%' }} />
                <div className="z-10 flex flex-col items-center text-white/80">
                  <ScanIcon width={28} height={28} />
                  <span className="mt-2 text-[11.5px]">Point at a label</span>
                </div>
              </div>

              <div className="m-3 flex gap-1 rounded-xl bg-surface-2 p-1">
                {MODES.map((m) => {
                  const Icon = m.icon;
                  return (
                    <button
                      key={m.key}
                      onClick={() => setMode(m.key)}
                      className={`flex flex-1 flex-col items-center gap-1 rounded-lg py-2 text-[11px] font-semibold ${
                        mode === m.key ? 'bg-surface text-primary shadow-sm' : 'text-muted'
                      }`}
                    >
                      <Icon width={16} height={16} />
                      {m.name}
                    </button>
                  );
                })}
              </div>

              <div className="px-3 pb-2 text-center text-[11px] text-muted">{active.desc}</div>

              {/* subject + scan */}
              <div className="px-3 pb-3">
                <select
                  value={subjectId}
                  onChange={(e) => setSubjectId(e.target.value)}
                  className="mb-2 h-9 w-full rounded-lg border border-border-strong bg-surface px-2 text-[12px] outline-none focus:border-primary"
                >
                  {batches.length === 0 && <option value="">No batches</option>}
                  {batches.map((b) => (
                    <option key={b.id} value={b.id}>
                      {b.batchNumber}
                    </option>
                  ))}
                </select>
                <button
                  onClick={scan}
                  disabled={!subjectId || busy}
                  className="brand-grad inline-flex h-10 w-full items-center justify-center gap-2 rounded-xl text-[13px] font-semibold text-white disabled:opacity-50"
                >
                  <ScanIcon width={15} height={15} /> {busy ? 'Recording…' : `Scan · ${active.name}`}
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* side: sync + feed */}
        <div className="flex flex-col gap-4">
          <div className="flex items-center gap-4 rounded-3xl border border-border bg-surface p-5">
            <span
              className="grid h-11 w-11 place-items-center rounded-2xl"
              style={queued.length ? { background: 'var(--warning-soft)', color: 'var(--warning-fg)' } : { background: 'var(--success-soft)', color: 'var(--success-fg)' }}
            >
              <ClockIcon width={20} height={20} />
            </span>
            <div>
              <div className="font-semibold">
                {queued.length ? `${queued.length} scan${queued.length > 1 ? 's' : ''} queued offline` : 'All scans synced'}
              </div>
              <div className="text-[12.5px] text-muted">
                {online ? 'Online · auto-syncs continuously' : 'Offline · will sync when back online'}
              </div>
            </div>
            <button
              onClick={() => void flushOutbox(sendQueued).then(() => load())}
              disabled={!queued.length}
              className="ml-auto inline-flex h-9 items-center gap-2 rounded-xl border border-border-strong bg-surface px-3 text-[12.5px] font-semibold hover:bg-surface-hover disabled:opacity-50"
            >
              Sync now
            </button>
          </div>

          <div className="overflow-hidden rounded-3xl border border-border bg-surface">
            <div className="border-b border-border px-5 py-4">
              <h3 className="text-[15px] font-bold">Recent scans</h3>
            </div>
            <div className="px-5 py-2">
              {queued.map((q) => (
                <div key={q.id} className="flex items-center gap-3 border-b border-border py-3 last:border-0">
                  <span className="grid h-8 w-8 place-items-center rounded-lg bg-[var(--warning-soft)] text-[var(--warning-fg)]">
                    <ScanIcon width={15} height={15} />
                  </span>
                  <div>
                    <div className="font-mono text-[12.5px] font-semibold">{q.label}</div>
                    <div className="text-[11.5px] text-muted">Queued · offline</div>
                  </div>
                  <span className="ml-auto rounded-full bg-[var(--warning-soft)] px-2.5 py-1 text-[11px] font-bold text-[var(--warning-fg)]">
                    Queued
                  </span>
                </div>
              ))}
              {events.map((s) => (
                <div key={s.id} className="flex items-center gap-3 border-b border-border py-3 last:border-0">
                  <span className="grid h-8 w-8 place-items-center rounded-lg bg-surface-2 text-muted">
                    <ScanIcon width={15} height={15} />
                  </span>
                  <div>
                    <div className="font-mono text-[12.5px] font-semibold">{s.subjectLabel ?? '—'}</div>
                    <div className="text-[11.5px] text-muted">
                      {s.eventType} · {fmtTime(s.occurredAt)}
                    </div>
                  </div>
                  <span className="ml-auto inline-flex items-center gap-1 rounded-full bg-[var(--success-soft)] px-2.5 py-1 text-[11px] font-bold text-[var(--success-fg)]">
                    <CheckIcon width={12} height={12} /> Synced
                  </span>
                </div>
              ))}
              {events.length === 0 && queued.length === 0 && (
                <div className="py-6 text-center text-[13px] text-muted">No scans yet — record one on the left.</div>
              )}
            </div>
          </div>

          <p className="text-[13px] text-subtle">
            Scans record real <span className="font-mono">events</span> through the same offline outbox as the
            rest of the app — if you’re offline they queue locally and sync automatically when you reconnect.
          </p>
        </div>
      </div>
    </PageShell>
  );
}
