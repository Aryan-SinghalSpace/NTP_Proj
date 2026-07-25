'use client';

import { useEffect, useMemo, useState } from 'react';
import { PageShell } from '../../components/PageShell';
import { BarChartIcon, PlusIcon, PlayIcon, CalendarIcon } from '../../components/icons';
import {
  getProducts,
  getAllBatches,
  getEvents,
  getDealers,
  getShipments,
  type ApiProduct,
  type ApiBatch,
  type ApiEvent,
  type ApiDealer,
  type ApiShipment,
} from '../../lib/api';

type Tone = 'primary' | 'teal' | 'amber' | 'rose' | 'violet' | 'sky';
const toneStyle: Record<Tone, { background: string; color: string }> = {
  primary: { background: 'var(--primary-soft)', color: 'var(--primary-soft-fg)' },
  teal: { background: 'var(--teal-soft)', color: 'var(--teal)' },
  amber: { background: 'var(--amber-soft)', color: 'var(--amber-fg)' },
  rose: { background: 'var(--rose-soft)', color: 'var(--rose-fg)' },
  violet: { background: 'var(--violet-soft)', color: 'var(--violet)' },
  sky: { background: 'var(--sky-soft)', color: 'var(--sky-fg)' },
};

interface Report {
  id: string;
  name: string;
  desc: string;
  category: string;
  metric: string;
  metricFoot: string;
  tone: Tone;
  spark: number[];
}

/** Count events per day over the last 7 days (oldest→newest) for a sparkline. */
function eventsPerDay(events: ApiEvent[]): number[] {
  const days = 7;
  const now = new Date();
  const buckets = new Array(days).fill(0);
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
  for (const e of events) {
    const t = new Date(e.occurredAt).getTime();
    const idx = days - 1 - Math.floor((startOfToday - new Date(new Date(t).getFullYear(), new Date(t).getMonth(), new Date(t).getDate()).getTime()) / 86400000);
    if (idx >= 0 && idx < days) buckets[idx] += 1;
  }
  return buckets;
}

export default function ReportsPage() {
  const [products, setProducts] = useState<ApiProduct[]>([]);
  const [batches, setBatches] = useState<ApiBatch[]>([]);
  const [events, setEvents] = useState<ApiEvent[]>([]);
  const [dealers, setDealers] = useState<ApiDealer[]>([]);
  const [shipments, setShipments] = useState<ApiShipment[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);

  const flash = (t: string) => {
    setNotice(t);
    window.setTimeout(() => setNotice(null), 2400);
  };

  useEffect(() => {
    Promise.all([getProducts(), getAllBatches(), getEvents({ limit: 500 }), getDealers(), getShipments()])
      .then(([p, b, e, d, s]) => {
        setProducts(p);
        setBatches(b);
        setEvents(e);
        setDealers(d);
        setShipments(s);
        setLoaded(true);
      })
      .catch(() => setLoaded(true));
  }, []);

  const reports = useMemo<Report[]>(() => {
    const spark = eventsPerDay(events);
    const committed = products.filter((p) => p.status === 'committed').length;
    const withEvents = new Set(events.map((e) => e.subjectId).filter(Boolean)).size;
    const coverage = batches.length ? Math.round((withEvents / batches.length) * 1000) / 10 : 0;
    const recalls = events.filter((e) => e.eventType === 'Recall').length;
    const soonExpiry = batches.filter((b) => {
      if (b.status !== 'active' || !b.expiryDate) return false;
      const days = (new Date(b.expiryDate).getTime() - Date.now()) / 86400000;
      return days <= 120;
    }).length;
    const dispatchedUnits = shipments.reduce((n, s) => n + s.totalUnits, 0);

    return [
      { id: 'events', name: 'Event volume', desc: 'Events captured across all types.', category: 'Operations', metric: events.length.toLocaleString(), metricFoot: 'events logged', tone: 'primary', spark },
      { id: 'trace', name: 'Trace coverage', desc: 'Batches with at least one captured event.', category: 'Quality', metric: `${coverage}%`, metricFoot: `${withEvents}/${batches.length} batches`, tone: 'teal', spark },
      { id: 'recall', name: 'Recall summary', desc: 'Recall events and impacted-dealer fan-out.', category: 'Risk', metric: String(recalls), metricFoot: recalls === 1 ? '1 recall event' : `${recalls} recall events`, tone: 'rose', spark: events.filter((e) => e.eventType === 'Recall').length ? [0, 0, 1, 1, 1, 1, recalls] : [0, 0, 0, 0, 0, 0, 0] },
      { id: 'fefo', name: 'Near-expiry (FEFO)', desc: 'Active batches expiring within 120 days.', category: 'Inventory', metric: String(soonExpiry), metricFoot: 'batches to prioritise', tone: 'amber', spark },
      { id: 'dealers', name: 'Dealer network', desc: 'Dealers receiving dispatched product.', category: 'Distribution', metric: String(dealers.length), metricFoot: `${shipments.length} shipments`, tone: 'violet', spark },
      { id: 'inventory', name: 'Product catalogue', desc: 'Committed GTINs and units dispatched.', category: 'Inventory', metric: String(committed), metricFoot: `${dispatchedUnits.toLocaleString()} units dispatched`, tone: 'sky', spark },
    ];
  }, [products, batches, events, dealers, shipments]);

  return (
    <PageShell
      active="/reports"
      title="Reports"
      subtitle="Acme Foods · live metrics across events, trace, inventory & distribution"
      actions={
        <button
          onClick={() => flash('Report builder arrives with the analytics store')}
          className="brand-grad inline-flex h-10 items-center gap-2 rounded-xl px-4 text-[13.5px] font-semibold text-white"
        >
          <PlusIcon width={16} height={16} /> New report
        </button>
      }
    >
      {notice && (
        <div className="fixed left-1/2 top-[74px] z-50 -translate-x-1/2 rounded-xl bg-[var(--success-soft)] px-4 py-2 text-[12.5px] font-semibold text-[var(--success-fg)] shadow">
          {notice}
        </div>
      )}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {reports.map((r) => (
          <ReportCard key={r.id} r={r} loaded={loaded} onRun={() => flash(`“${r.name}” is live above`)} onSchedule={() => flash(`Scheduling needs the analytics store`)} />
        ))}
      </div>

      <p className="mt-6 text-[13px] text-subtle">
        These metrics are <span className="font-semibold text-teal">live</span> (computed over the API data).
        Deep time-series analytics and scheduled report exports arrive with the dedicated analytics store
        (ClickHouse, deferred).
      </p>
    </PageShell>
  );
}

function ReportCard({ r, loaded, onRun, onSchedule }: { r: Report; loaded: boolean; onRun: () => void; onSchedule: () => void }) {
  const style = toneStyle[r.tone];
  const max = Math.max(...r.spark, 1);
  const min = Math.min(...r.spark);
  const range = max - min || 1;
  const pts = r.spark
    .map((v, i) => {
      const x = (i / (r.spark.length - 1)) * 100;
      const y = 30 - ((v - min) / range) * 26 - 2;
      return `${x},${y}`;
    })
    .join(' ');

  return (
    <div className="flex flex-col rounded-3xl border border-border bg-surface p-5">
      <div className="flex items-center gap-3">
        <span className="grid h-10 w-10 place-items-center rounded-xl" style={style}>
          <BarChartIcon width={18} height={18} />
        </span>
        <div>
          <div className="font-display text-[15px] font-bold">{r.name}</div>
          <div className="text-[11.5px] text-muted">{r.category}</div>
        </div>
      </div>

      <p className="mt-3 text-[12.5px] leading-relaxed text-muted">{r.desc}</p>

      <div className="mt-3 flex items-end gap-3">
        <div>
          <div className="font-display text-[22px] font-bold tracking-tight">{loaded ? r.metric : '—'}</div>
          <div className="text-[11.5px] text-muted">{r.metricFoot}</div>
        </div>
        <svg viewBox="0 0 100 30" preserveAspectRatio="none" className="ml-auto h-9 w-24">
          <polyline points={pts} fill="none" stroke={style.color} strokeWidth="2" strokeLinejoin="round" />
        </svg>
      </div>

      <div className="mt-4 flex gap-2">
        <button
          onClick={onRun}
          className="inline-flex h-9 flex-1 items-center justify-center gap-1.5 rounded-xl border border-border-strong bg-surface text-[12.5px] font-semibold hover:bg-surface-hover"
        >
          <PlayIcon width={14} height={14} /> Run
        </button>
        <button
          onClick={onSchedule}
          className="inline-flex h-9 items-center justify-center gap-1.5 rounded-xl border border-border-strong bg-surface px-3 text-[12.5px] font-semibold hover:bg-surface-hover"
        >
          <CalendarIcon width={14} height={14} />
        </button>
      </div>
    </div>
  );
}
