'use client';

import { useState } from 'react';
import { TopNav } from '../../components/TopNav';
import {
  ActivityIcon,
  RecallIcon,
  SearchIcon,
  DownloadIcon,
  ClockIcon,
  ChevronRightIcon,
  AlertIcon,
} from '../../components/icons';
import {
  kpis,
  events,
  eventTypeChips,
  traceTargets,
  traces,
  recall,
  toneStyle,
  type StreamEvent,
  type Trace,
  type TraceStep,
} from '../../data_mock/events';

type Tab = 'stream' | 'trace' | 'recall';

const tabs: { key: Tab; label: string; Icon: typeof ActivityIcon }[] = [
  { key: 'stream', label: 'Event Stream', Icon: ActivityIcon },
  { key: 'trace', label: 'Trace Explorer', Icon: SearchIcon },
  { key: 'recall', label: 'Recall', Icon: RecallIcon },
];

const dotColor: Record<string, string> = {
  on: 'var(--success)',
  warn: 'var(--amber)',
  danger: 'var(--danger)',
};

export default function EventsPage() {
  const [tab, setTab] = useState<Tab>('stream');
  const [query, setQuery] = useState('');
  const [type, setType] = useState<(typeof eventTypeChips)[number]>('All');
  const [traceId, setTraceId] = useState(traceTargets[0]!.id);
  const [notice, setNotice] = useState<string | null>(null);

  const flash = (t: string) => {
    setNotice(t);
    window.setTimeout(() => setNotice(null), 2600);
  };

  const filtered = events.filter((e) => {
    const matchType = type === 'All' || e.type === type;
    const q = query.trim().toLowerCase();
    const matchQuery =
      !q ||
      e.entity.toLowerCase().includes(q) ||
      e.type.toLowerCase().includes(q) ||
      e.location.toLowerCase().includes(q);
    return matchType && matchQuery;
  });

  return (
    <>
      <TopNav active="/events" />

      {notice && (
        <div className="fixed left-1/2 top-[74px] z-50 -translate-x-1/2 rounded-xl bg-[var(--success-soft)] px-4 py-2 text-[12.5px] font-semibold text-[var(--success-fg)] shadow">
          {notice}
        </div>
      )}

      <main className="mx-auto max-w-[1180px] px-6 py-7">
        <div className="mb-6 flex flex-wrap items-end gap-3">
          <div>
            <h1 className="font-display text-[27px] font-bold tracking-tight">Events &amp; Trace</h1>
            <p className="mt-1 text-[13.5px] text-muted">
              Acme Foods · append-only event stream · forward &amp; backward trace · recall fan-out
            </p>
          </div>
          <div className="ml-auto flex gap-2.5">
            <button
              onClick={() => flash('Event export queued (EPCIS-style JSON)')}
              className="inline-flex h-10 items-center gap-2 rounded-xl border border-border-strong bg-surface px-4 text-[13.5px] font-semibold hover:bg-surface-hover"
            >
              <DownloadIcon width={16} height={16} /> Export
            </button>
          </div>
        </div>

        {/* KPI tiles */}
        <div className="mb-5 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {kpis.map((k) => {
            const s = toneStyle(k.tone);
            return (
              <div key={k.label} className="rounded-3xl border border-border bg-surface p-5">
                <div className="mb-3 flex items-center gap-2.5">
                  <span className="grid h-9 w-9 place-items-center rounded-xl" style={s}>
                    <ActivityIcon width={18} height={18} />
                  </span>
                  <span className="text-[12.5px] font-semibold text-muted">{k.label}</span>
                </div>
                <div className="font-display text-3xl font-bold tracking-tight">{k.value}</div>
                <div className="mt-1.5 text-xs font-semibold text-muted">{k.foot}</div>
              </div>
            );
          })}
        </div>

        {/* tabs */}
        <div className="mb-4 flex gap-1 border-b border-border">
          {tabs.map(({ key, label, Icon }) => (
            <button
              key={key}
              onClick={() => setTab(key)}
              className={`flex items-center gap-1.5 border-b-2 px-3.5 py-2.5 text-[13.5px] font-semibold ${
                tab === key ? 'border-primary text-primary' : 'border-transparent text-muted hover:text-text'
              }`}
            >
              <Icon width={16} height={16} />
              {label}
            </button>
          ))}
        </div>

        {tab === 'stream' && (
          <StreamTab
            rows={filtered}
            total={events.length}
            query={query}
            setQuery={setQuery}
            type={type}
            setType={setType}
          />
        )}
        {tab === 'trace' && (
          <TraceTab traceId={traceId} setTraceId={setTraceId} trace={traces[traceId]!} />
        )}
        {tab === 'recall' && <RecallTab onFlash={flash} />}

        <p className="mt-8 text-[13px] text-subtle">
          Scaffold v0 · Command × Bento · mock data (frontend-first). Live data arrives when this
          page is connected to the API.
        </p>
      </main>
    </>
  );
}

/* ── Event stream ─────────────────────────────────────────── */

function StreamTab({
  rows,
  total,
  query,
  setQuery,
  type,
  setType,
}: {
  rows: StreamEvent[];
  total: number;
  query: string;
  setQuery: (v: string) => void;
  type: (typeof eventTypeChips)[number];
  setType: (v: (typeof eventTypeChips)[number]) => void;
}) {
  return (
    <>
      <div className="mb-3 flex flex-wrap items-center gap-2.5">
        <div className="flex h-10 w-[280px] max-w-[60vw] items-center gap-2 rounded-xl border border-border-strong bg-surface px-3 text-[13.5px]">
          <SearchIcon width={15} height={15} className="text-subtle" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search entity, type or location…"
            className="w-full bg-transparent outline-none placeholder:text-subtle"
          />
        </div>
        <div className="flex flex-wrap gap-1 rounded-xl border border-border bg-surface-2 p-1">
          {eventTypeChips.map((c) => (
            <button
              key={c}
              onClick={() => setType(c)}
              className={`rounded-lg px-2.5 py-1.5 text-[12.5px] font-semibold ${
                type === c ? 'bg-surface text-text shadow-sm' : 'text-muted'
              }`}
            >
              {c}
            </button>
          ))}
        </div>
        <span className="ml-auto text-[12.5px] text-muted">
          {rows.length} of {total} events
        </span>
      </div>

      <div className="overflow-hidden rounded-3xl border border-border bg-surface">
        <table className="w-full text-[13px]">
          <thead>
            <tr className="border-b border-border text-left text-[11.5px] uppercase tracking-wide text-muted">
              <th className="px-4 py-2.5 font-semibold">Time</th>
              <th className="px-4 py-2.5 font-semibold">Event</th>
              <th className="px-4 py-2.5 font-semibold">Entity</th>
              <th className="px-4 py-2.5 font-semibold">Location</th>
              <th className="px-4 py-2.5 font-semibold">Actor</th>
              <th className="px-4 py-2.5 font-semibold">Status</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((e) => (
              <tr key={e.id} className="border-b border-border last:border-0 hover:bg-surface-2">
                <td className="px-4 py-3 text-xs text-muted">
                  <div className="font-semibold text-text">{e.time}</div>
                  {e.date}
                </td>
                <td className="px-4 py-3">
                  <span
                    className="rounded-full px-2.5 py-1 text-[11px] font-bold"
                    style={toneStyle(e.tone)}
                  >
                    {e.type}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <div className="font-mono text-[12.5px] font-semibold">{e.entity}</div>
                  <div className="text-xs text-muted">{e.sub}</div>
                </td>
                <td className="px-4 py-3 text-muted">{e.location}</td>
                <td className="px-4 py-3 font-mono text-[12px] text-muted">{e.actor}</td>
                <td className="px-4 py-3">
                  <span className="inline-flex items-center gap-2 text-[12.5px] font-semibold">
                    <span className="h-1.5 w-1.5 rounded-full" style={{ background: dotColor[e.dot] }} />
                    {e.status}
                  </span>
                </td>
              </tr>
            ))}
            {rows.length === 0 && (
              <tr>
                <td colSpan={6} className="px-4 py-10 text-center text-muted">
                  No events match your filters.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </>
  );
}

/* ── Trace explorer ───────────────────────────────────────── */

function TraceTab({
  traceId,
  setTraceId,
  trace,
}: {
  traceId: string;
  setTraceId: (id: string) => void;
  trace: Trace;
}) {
  return (
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-[300px_1fr]">
      {/* target picker */}
      <div className="rounded-3xl border border-border bg-surface p-4">
        <div className="mb-2 px-1 text-[11px] font-bold uppercase tracking-wide text-subtle">
          Trace an entity
        </div>
        {traceTargets.map((t) => (
          <button
            key={t.id}
            onClick={() => setTraceId(t.id)}
            className={`mb-1.5 flex w-full items-center gap-3 rounded-xl border px-3 py-2.5 text-left last:mb-0 ${
              traceId === t.id ? 'border-primary bg-primary-soft' : 'border-border hover:bg-surface-2'
            }`}
          >
            <div>
              <div className="font-mono text-[13px] font-semibold">{t.label}</div>
              <div className="text-[11.5px] text-muted">{t.kind}</div>
            </div>
            <ChevronRightIcon width={15} height={15} className="ml-auto text-subtle" />
          </button>
        ))}
      </div>

      {/* trace chain */}
      <div className="rounded-3xl border border-border bg-surface p-6">
        <div className="mb-5 flex flex-wrap items-center gap-2.5">
          <div>
            <div className="font-display text-[18px] font-bold">{trace.title}</div>
            <div className="text-[12.5px] text-muted">
              {trace.product} · GTIN <span className="font-mono">{trace.gtin}</span>
            </div>
          </div>
          <span
            className="ml-auto rounded-full px-2.5 py-1 text-[11.5px] font-bold"
            style={toneStyle(trace.statusTone)}
          >
            {trace.status}
          </span>
        </div>

        <TraceLeg label="◀ Backward — origin & inputs" steps={trace.backward} />
        <div className="my-3 ml-[11px] h-5 border-l-2 border-dashed border-border" />
        <TraceLeg label="▶ Forward — distribution & outcome" steps={trace.forward} />
      </div>
    </div>
  );
}

function TraceLeg({ label, steps }: { label: string; steps: TraceStep[] }) {
  return (
    <div>
      <div className="mb-2 text-[11.5px] font-bold uppercase tracking-wide text-subtle">{label}</div>
      <div className="relative ml-[11px] border-l-2 border-border pl-6">
        {steps.map((s, i) => (
          <div key={i} className="relative pb-5 last:pb-0">
            <span
              className="absolute -left-[31px] grid h-[22px] w-[22px] place-items-center rounded-full ring-4 ring-surface"
              style={toneStyle(s.tone)}
            >
              <span className="h-1.5 w-1.5 rounded-full" style={{ background: 'currentColor' }} />
            </span>
            <div className="flex flex-wrap items-center gap-2">
              <span className="rounded-full px-2 py-0.5 text-[11px] font-bold" style={toneStyle(s.tone)}>
                {s.type}
              </span>
              <span className="text-[12px] text-muted">{s.location}</span>
              <span className="ml-auto font-mono text-[11.5px] text-subtle">{s.time}</span>
            </div>
            <div className="mt-1 text-[12.5px]">{s.detail}</div>
            <div className="text-[11.5px] text-muted">by {s.actor}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ── Recall fan-out ───────────────────────────────────────── */

function RecallTab({ onFlash }: { onFlash: (t: string) => void }) {
  const statusTone: Record<string, React.CSSProperties> = {
    Acknowledged: toneStyle('success'),
    Pending: toneStyle('warning'),
    Quarantined: toneStyle('danger'),
  };
  return (
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-[1fr_1.4fr]">
      {/* recall summary */}
      <div className="flex flex-col rounded-3xl p-6 grad-rose">
        <div className="flex items-center">
          <span className="rounded-full bg-white/20 px-3 py-1 text-xs font-bold">● Active recall</span>
          <span className="ml-auto font-mono text-sm font-semibold">{recall.id}</span>
        </div>
        <div className="mt-3 font-display text-[24px] font-bold">Batch {recall.batch}</div>
        <div className="text-[13px] opacity-90">
          {recall.product} · {recall.units.toLocaleString()} units · {recall.dealers} dealers
        </div>
        <div className="mt-3 flex items-start gap-2 rounded-xl bg-white/15 p-3 text-[12.5px]">
          <AlertIcon width={16} height={16} />
          <span>{recall.reason}</span>
        </div>
        <div className="mt-auto pt-4">
          <div className="h-2 overflow-hidden rounded-full bg-white/30">
            <span className="block h-full rounded-full bg-white" style={{ width: `${recall.fanout}%` }} />
          </div>
          <div className="mt-1.5 flex justify-between text-xs opacity-90">
            <span>
              Notification fan-out · {recall.acknowledged}/{recall.dealers} acknowledged
            </span>
            <span className="font-bold">{recall.fanout}%</span>
          </div>
        </div>
        <button
          onClick={() => onFlash('Reminder sent to pending dealers')}
          className="mt-4 inline-flex h-10 items-center justify-center gap-2 rounded-xl bg-white text-[13.5px] font-semibold text-[var(--rose-fg)]"
        >
          Notify pending dealers
        </button>
      </div>

      {/* dealer fan-out list */}
      <div className="overflow-hidden rounded-3xl border border-border bg-surface">
        <div className="flex items-center gap-2.5 border-b border-border px-5 py-4">
          <h3 className="text-[15px] font-bold">Dealer fan-out</h3>
          <span className="ml-auto rounded-full bg-[var(--danger-soft)] px-2.5 py-1 text-[11.5px] font-bold text-[var(--danger-fg)]">
            {recall.dealers} impacted
          </span>
        </div>
        <table className="w-full text-[13px]">
          <thead>
            <tr className="border-b border-border text-left text-[11.5px] uppercase tracking-wide text-muted">
              <th className="px-4 py-2.5 font-semibold">Dealer</th>
              <th className="px-4 py-2.5 font-semibold">City</th>
              <th className="px-4 py-2.5 font-semibold">Units</th>
              <th className="px-4 py-2.5 font-semibold">Status</th>
            </tr>
          </thead>
          <tbody>
            {recall.dealerList.map((d) => (
              <tr key={d.name} className="border-b border-border last:border-0">
                <td className="px-4 py-3 font-semibold">{d.name}</td>
                <td className="px-4 py-3 text-muted">{d.city}</td>
                <td className="px-4 py-3 text-muted">{d.units}</td>
                <td className="px-4 py-3">
                  <span className="rounded-full px-2.5 py-1 text-[11px] font-bold" style={statusTone[d.status]}>
                    {d.status}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        <div className="flex items-center gap-2 border-t border-border px-5 py-3 text-[12px] text-subtle">
          <ClockIcon width={14} height={14} />
          Recall {recall.id} started {recall.started} · fan-out in progress
        </div>
      </div>
    </div>
  );
}
