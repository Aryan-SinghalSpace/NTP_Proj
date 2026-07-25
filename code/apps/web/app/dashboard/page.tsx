'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { TopNav } from '../../components/TopNav';
import {
  LayersIcon,
  ActivityIcon,
  AlertIcon,
  RecallIcon,
  ClockIcon,
  CheckIcon,
  CalendarIcon,
  DownloadIcon,
  PlusIcon,
} from '../../components/icons';
import {
  getProducts,
  getAllBatches,
  getEvents,
  type ApiProduct,
  type ApiBatch,
  type ApiEvent,
} from '../../lib/api';

type Tone = 'primary' | 'teal' | 'amber' | 'rose' | 'sky';

const toneColor: Record<Tone, string> = {
  primary: 'var(--primary)',
  teal: 'var(--teal)',
  amber: 'var(--amber)',
  rose: 'var(--rose)',
  sky: 'var(--sky)',
};
const toneSoft: Record<Tone, string> = {
  primary: 'var(--primary-soft)',
  teal: 'var(--teal-soft)',
  amber: 'var(--amber-soft)',
  rose: 'var(--rose-soft)',
  sky: 'var(--sky-soft)',
};
const kpiIcon: Record<Tone, typeof LayersIcon> = {
  primary: LayersIcon,
  teal: ActivityIcon,
  amber: AlertIcon,
  rose: RecallIcon,
  sky: ActivityIcon,
};

/* compact event display (label + badge + dot) */
const EV: Record<string, { label: string; badge: string; dot: string }> = {
  Commission: { label: 'Commission', badge: 'bg-[var(--success-soft)] text-[var(--success-fg)]', dot: 'var(--success)' },
  Aggregate: { label: 'Aggregate', badge: 'bg-surface-2 text-muted', dot: 'var(--success)' },
  Disaggregate: { label: 'Disaggregate', badge: 'bg-surface-2 text-muted', dot: 'var(--success)' },
  Transform: { label: 'Transform', badge: 'bg-[var(--violet-soft)] text-[var(--violet)]', dot: 'var(--success)' },
  Pack: { label: 'Pack', badge: 'bg-[var(--info-soft)] text-[var(--info-fg)]', dot: 'var(--success)' },
  Store: { label: 'Store', badge: 'bg-surface-2 text-muted', dot: 'var(--success)' },
  Dispatch: { label: 'Dispatch', badge: 'bg-[var(--info-soft)] text-[var(--info-fg)]', dot: 'var(--success)' },
  Receive: { label: 'Receive', badge: 'bg-[var(--primary-soft)] text-[var(--primary-soft-fg)]', dot: 'var(--success)' },
  Dispense: { label: 'Dispense', badge: 'bg-[var(--teal-soft)] text-[var(--teal)]', dot: 'var(--success)' },
  QCHold: { label: 'QC Hold', badge: 'bg-[var(--warning-soft)] text-[var(--warning-fg)]', dot: 'var(--amber)' },
  Sample: { label: 'Sample', badge: 'bg-surface-2 text-muted', dot: 'var(--success)' },
  Decommission: { label: 'Decommission', badge: 'bg-surface-2 text-muted', dot: 'var(--success)' },
  RejectReturn: { label: 'Reject/Return', badge: 'bg-[var(--danger-soft)] text-[var(--danger-fg)]', dot: 'var(--danger)' },
  Recall: { label: 'Recall', badge: 'bg-[var(--danger-soft)] text-[var(--danger-fg)]', dot: 'var(--danger)' },
};
function ev(type: string) {
  return EV[type] ?? { label: type, badge: 'bg-surface-2 text-muted', dot: 'var(--success)' };
}

function fmtTime(iso: string): string {
  return new Date(iso).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false });
}
function fmtDay(iso: string): string {
  return new Date(iso).toLocaleDateString([], { day: '2-digit', month: 'short' });
}

interface Kpi {
  label: string;
  value: string;
  foot: string;
  tone: Tone;
}

export default function DashboardPage() {
  const [products, setProducts] = useState<ApiProduct[] | null>(null);
  const [batches, setBatches] = useState<ApiBatch[]>([]);
  const [events, setEvents] = useState<ApiEvent[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let live = true;
    Promise.all([getProducts(), getAllBatches(), getEvents({ limit: 500 })])
      .then(([p, b, e]) => {
        if (!live) return;
        setProducts(p);
        setBatches(b);
        setEvents(e);
      })
      .catch((err) => live && setError(err instanceof Error ? err.message : 'Failed to load'));
    return () => {
      live = false;
    };
  }, []);

  const loading = products === null && !error;
  const prods = products ?? [];
  const committed = prods.filter((p) => p.status === 'committed');
  const recallEvents = events.filter((e) => e.eventType === 'Recall');
  const qcHolds = events.filter((e) => e.eventType === 'QCHold');

  const kpis: Kpi[] = [
    { label: 'Active GTINs', value: String(committed.length), foot: `${prods.length} products`, tone: 'primary' },
    { label: 'Events logged', value: String(events.length), foot: `${new Set(events.map((e) => e.eventType)).size} types used`, tone: 'teal' },
    { label: 'QC holds', value: String(qcHolds.length), foot: 'hold events', tone: 'amber' },
    { label: 'Recall events', value: String(recallEvents.length), foot: recallEvents[0]?.subjectLabel ?? 'none active', tone: 'rose' },
  ];

  // Events-by-type for the hero chart.
  const typeBars = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const e of events) counts[e.eventType] = (counts[e.eventType] ?? 0) + 1;
    const sorted = Object.entries(counts).sort((a, b) => b[1] - a[1]).slice(0, 7);
    const max = Math.max(1, ...sorted.map(([, n]) => n));
    return sorted.map(([type, n]) => ({ type, n, pct: Math.round((n / max) * 100) }));
  }, [events]);

  const productName = useMemo(() => {
    const m = new Map<string, string>();
    for (const p of prods) m.set(p.id, p.name);
    return m;
  }, [prods]);

  // Real FEFO advisories: soonest-expiring active batches.
  const fefo = useMemo(
    () =>
      batches
        .filter((b) => b.status === 'active' && b.expiryDate)
        .sort((a, b) => (a.expiryDate! < b.expiryDate! ? -1 : 1))
        .slice(0, 4),
    [batches],
  );

  const recentEvents = events.slice(0, 6);
  const latestRecall = recallEvents[0];

  return (
    <>
      <TopNav active="/dashboard" />
      <main className="mx-auto max-w-[1180px] px-6 py-7">
        {/* page head */}
        <div className="mb-6 flex flex-wrap items-end gap-3">
          <div>
            <h1 className="font-display text-[27px] font-bold tracking-tight">Production snapshot</h1>
            <p className="mt-1 text-[13.5px] text-muted">
              Acme Foods · <span className="font-semibold text-teal">live from the API</span> · products,
              batches &amp; the event log
            </p>
          </div>
          <div className="ml-auto flex gap-2.5">
            <Btn icon={<CalendarIcon width={16} height={16} />}>All time</Btn>
            <Btn icon={<DownloadIcon width={16} height={16} />}>Export</Btn>
            <Link
              href="/events"
              className="brand-grad inline-flex h-10 items-center gap-2 rounded-xl px-4 text-[13.5px] font-semibold text-white"
            >
              <PlusIcon width={16} height={16} /> New event
            </Link>
          </div>
        </div>

        {error && (
          <div className="mb-5 rounded-2xl border border-rose/40 bg-surface p-6 text-sm text-rose">
            Could not reach the API ({error}). Start it from <code>code/</code>:{' '}
            <code>pnpm --filter @tracewell/api dev</code>.
          </div>
        )}

        {/* KPI tiles */}
        <div className="mb-4 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {kpis.map((k) => (
            <StatTile key={k.label} kpi={k} loading={loading} />
          ))}
        </div>

        {/* hero bento */}
        <div className="mb-4 grid grid-cols-1 gap-4 lg:grid-cols-4 lg:grid-rows-2 lg:auto-rows-[172px]">
          {/* events by type hero */}
          <div className="relative flex flex-col overflow-hidden rounded-3xl p-6 grad-indigo lg:col-span-2 lg:row-span-2">
            <div className="absolute -right-12 -top-14 h-48 w-48 rounded-full bg-white/15" />
            <div className="flex items-center">
              <span className="rounded-full bg-white/20 px-3 py-1 text-xs font-bold">Events by type</span>
              <Link href="/events" className="ml-auto text-xs font-semibold opacity-90">
                Stream →
              </Link>
            </div>
            <div className="mt-3.5 flex items-end gap-3">
              <div className="font-display text-[38px] font-bold leading-none">
                {events.length.toLocaleString()}
              </div>
              <div className="pb-1.5 text-[13px] opacity-85">events logged</div>
            </div>
            <div className="mt-auto flex items-end gap-2.5">
              {typeBars.length === 0 ? (
                <div className="pb-4 text-[13px] opacity-80">No events yet.</div>
              ) : (
                typeBars.map((b) => (
                  <div key={b.type} className="flex flex-1 flex-col items-center gap-1.5">
                    <div className="flex h-[92px] w-full items-end">
                      <div
                        className="w-full rounded-t-md bg-white/90"
                        style={{ height: `${Math.max(b.pct, 6)}%` }}
                        title={`${ev(b.type).label}: ${b.n}`}
                      />
                    </div>
                    <span className="text-[9.5px] font-semibold opacity-90">{b.n}</span>
                    <span className="w-full truncate text-center text-[8.5px] opacity-75">
                      {ev(b.type).label}
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* recall */}
          <div className="flex flex-col rounded-3xl p-6 grad-rose lg:col-span-2">
            <div className="flex items-center">
              <span className="rounded-full bg-white/20 px-3 py-1 text-xs font-bold">
                {latestRecall ? '● Active recall' : 'Recalls'}
              </span>
              <span className="ml-auto font-mono text-sm font-semibold">
                {latestRecall ? fmtDay(latestRecall.occurredAt) : '—'}
              </span>
            </div>
            {latestRecall ? (
              <>
                <div className="mt-3 font-display text-[22px] font-bold">Batch {latestRecall.subjectLabel}</div>
                <div className="text-[13px] opacity-90">
                  {latestRecall.quantity ? `${latestRecall.quantity.toLocaleString()} units · ` : ''}
                  {latestRecall.detail ?? 'recall in progress'}
                </div>
                <Link
                  href="/events"
                  className="mt-auto inline-flex h-9 w-fit items-center rounded-xl bg-white px-3 text-[12.5px] font-semibold text-[var(--rose-fg)]"
                >
                  Open trace →
                </Link>
              </>
            ) : (
              <div className="mt-3 text-[14px] opacity-90">No active recalls. All batches clear.</div>
            )}
          </div>

          {/* FEFO count */}
          <MiniTile
            icon={<ClockIcon width={18} height={18} />}
            tone="amber"
            big={`${fefo.length} FEFO`}
            sub={fefo[0] ? `soonest ${fmtDay(fefo[0].expiryDate!)} · ${fefo.length} batches advised` : 'no active batches'}
          />
          {/* batches live */}
          <MiniTile
            icon={<CheckIcon width={18} height={18} />}
            tone="primary"
            big={`${batches.length} batches`}
            sub={`${batches.filter((b) => b.status === 'active').length} active · across ${committed.length} GTINs`}
          />
        </div>

        {/* recent events + FEFO list */}
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-[1.7fr_1fr]">
          <div className="overflow-hidden rounded-3xl border border-border bg-surface">
            <div className="flex items-center gap-2.5 border-b border-border px-5 py-4">
              <h3 className="text-[15px] font-bold">Recent events</h3>
              <Link className="ml-auto text-[12.5px] font-semibold text-primary" href="/events">
                Trace explorer →
              </Link>
            </div>
            <table className="w-full text-[13px]">
              <thead>
                <tr className="border-b border-border text-left text-[11.5px] uppercase tracking-wide text-muted">
                  <th className="px-4 py-2.5 font-semibold">Time</th>
                  <th className="px-4 py-2.5 font-semibold">Event</th>
                  <th className="px-4 py-2.5 font-semibold">Entity</th>
                  <th className="px-4 py-2.5 font-semibold">Location</th>
                </tr>
              </thead>
              <tbody>
                {loading && (
                  <tr>
                    <td colSpan={4} className="px-4 py-8 text-center text-muted">
                      Loading…
                    </td>
                  </tr>
                )}
                {!loading && recentEvents.length === 0 && (
                  <tr>
                    <td colSpan={4} className="px-4 py-8 text-center text-muted">
                      No events yet.
                    </td>
                  </tr>
                )}
                {recentEvents.map((e) => (
                  <tr key={e.id} className="border-b border-border last:border-0">
                    <td className="px-4 py-3 text-xs text-muted">
                      <div className="font-semibold text-text">{fmtTime(e.occurredAt)}</div>
                      {fmtDay(e.occurredAt)}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`rounded-full px-2.5 py-1 text-[11px] font-bold ${ev(e.eventType).badge}`}>
                        {ev(e.eventType).label}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="font-mono text-[12.5px] font-semibold">{e.subjectLabel ?? '—'}</div>
                      <div className="text-xs text-muted">{e.detail ?? ''}</div>
                    </td>
                    <td className="px-4 py-3 text-muted">{e.location ?? '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="overflow-hidden rounded-3xl border border-border bg-surface">
            <div className="flex items-center gap-2.5 border-b border-border px-5 py-4">
              <h3 className="text-[15px] font-bold">FEFO advisories</h3>
              <span className="ml-auto rounded-full bg-[var(--warning-soft)] px-2.5 py-1 text-[11.5px] font-bold text-[var(--warning-fg)]">
                Advisory
              </span>
            </div>
            <div className="px-5 py-2">
              {loading && <div className="py-4 text-[13px] text-muted">Loading…</div>}
              {!loading && fefo.length === 0 && (
                <div className="py-4 text-[13px] text-muted">No active batches with expiry dates.</div>
              )}
              {fefo.map((f) => (
                <div key={f.id} className="flex gap-3 border-b border-border py-2.5 last:border-0">
                  <ClockIcon width={18} height={18} style={{ color: 'var(--amber)' }} />
                  <div>
                    <div className="text-[13px] font-semibold">
                      {productName.get(f.productId) ?? 'Product'} · <span className="font-mono">{f.batchNumber}</span>
                    </div>
                    <div className="text-xs text-muted">
                      exp {fmtDay(f.expiryDate!)} · {f.quantity.toLocaleString()} units · dispatch FEFO-first
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <p className="mt-8 text-[13px] text-subtle">
          Every figure here is <span className="font-semibold text-teal">live</span> — products, batches and the
          append-only event log (Postgres + RLS). Event-volume-over-time and dealer fan-out arrive with the
          shipments slice.
        </p>
      </main>
    </>
  );
}

function StatTile({ kpi, loading }: { kpi: Kpi; loading: boolean }) {
  const Icon = kpiIcon[kpi.tone];
  return (
    <div
      className="rounded-3xl border border-border bg-surface p-5"
      style={kpi.tone === 'rose' ? { borderColor: 'var(--rose-soft)' } : undefined}
    >
      <div className="mb-3 flex items-center gap-2.5">
        <span
          className="grid h-9 w-9 place-items-center rounded-xl"
          style={{ background: toneSoft[kpi.tone], color: toneColor[kpi.tone] }}
        >
          <Icon width={18} height={18} />
        </span>
        <span className="text-[12.5px] font-semibold text-muted">{kpi.label}</span>
      </div>
      <div className="font-display text-3xl font-bold tracking-tight">{loading ? '—' : kpi.value}</div>
      <div className="mt-1.5 text-xs font-semibold text-muted">{kpi.foot}</div>
    </div>
  );
}

function MiniTile({
  icon,
  tone,
  big,
  sub,
}: {
  icon: React.ReactNode;
  tone: Tone;
  big: string;
  sub: string;
}) {
  return (
    <div className="flex flex-col rounded-3xl border border-border bg-surface p-6">
      <span
        className="grid h-9 w-9 place-items-center self-start rounded-xl"
        style={{ background: toneSoft[tone], color: toneColor[tone] }}
      >
        {icon}
      </span>
      <div className="mt-auto font-display text-2xl font-bold">{big}</div>
      <div className="text-xs text-muted">{sub}</div>
    </div>
  );
}

function Btn({ children, icon }: { children: React.ReactNode; icon?: React.ReactNode }) {
  return (
    <button className="inline-flex h-10 items-center gap-2 rounded-xl border border-border-strong bg-surface px-4 text-[13.5px] font-semibold text-text hover:bg-surface-hover">
      {icon}
      {children}
    </button>
  );
}
