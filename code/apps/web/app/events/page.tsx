'use client';

import { useEffect, useMemo, useState } from 'react';
import { TopNav } from '../../components/TopNav';
import {
  ActivityIcon,
  RecallIcon,
  SearchIcon,
  DownloadIcon,
  ClockIcon,
  ChevronRightIcon,
  AlertIcon,
  PlusIcon,
  XIcon,
  CheckIcon,
} from '../../components/icons';
import {
  getEvents,
  getAllBatches,
  createEvent,
  type ApiEvent,
  type ApiBatch,
  type CreateEventPayload,
} from '../../lib/api';

/* ── event-type display mapping ───────────────────────────── */

type Tone = 'success' | 'info' | 'warning' | 'danger' | 'muted' | 'teal' | 'violet' | 'primary';

function toneStyle(tone: Tone): { background: string; color: string } {
  switch (tone) {
    case 'success':
      return { background: 'var(--success-soft)', color: 'var(--success-fg)' };
    case 'info':
      return { background: 'var(--info-soft)', color: 'var(--info-fg)' };
    case 'warning':
      return { background: 'var(--warning-soft)', color: 'var(--warning-fg)' };
    case 'danger':
      return { background: 'var(--danger-soft)', color: 'var(--danger-fg)' };
    case 'teal':
      return { background: 'var(--teal-soft)', color: 'var(--teal)' };
    case 'violet':
      return { background: 'var(--violet-soft)', color: 'var(--violet)' };
    case 'primary':
      return { background: 'var(--primary-soft)', color: 'var(--primary-soft-fg)' };
    default:
      return { background: 'var(--surface-2)', color: 'var(--muted)' };
  }
}

interface EventMeta {
  label: string;
  tone: Tone;
  status: string;
  dot: 'on' | 'warn' | 'danger';
}

const EVENT_META: Record<string, EventMeta> = {
  Commission: { label: 'Commission', tone: 'success', status: 'Live', dot: 'on' },
  Decommission: { label: 'Decommission', tone: 'muted', status: 'Done', dot: 'on' },
  Aggregate: { label: 'Aggregate', tone: 'muted', status: 'Done', dot: 'on' },
  Disaggregate: { label: 'Disaggregate', tone: 'muted', status: 'Done', dot: 'on' },
  Transform: { label: 'Transform', tone: 'violet', status: 'Done', dot: 'on' },
  QCHold: { label: 'QC Hold', tone: 'warning', status: 'On hold', dot: 'warn' },
  Sample: { label: 'Sample', tone: 'muted', status: 'Done', dot: 'on' },
  Pack: { label: 'Pack', tone: 'info', status: 'Done', dot: 'on' },
  Store: { label: 'Store', tone: 'muted', status: 'Done', dot: 'on' },
  Dispatch: { label: 'Dispatch', tone: 'info', status: 'Done', dot: 'on' },
  Receive: { label: 'Receive', tone: 'primary', status: 'Done', dot: 'on' },
  Dispense: { label: 'Dispense', tone: 'teal', status: 'Done', dot: 'on' },
  RejectReturn: { label: 'Reject/Return', tone: 'danger', status: 'Returned', dot: 'danger' },
  Recall: { label: 'Recall', tone: 'danger', status: 'Recalled', dot: 'danger' },
};

function metaFor(type: string): EventMeta {
  return EVENT_META[type] ?? { label: type, tone: 'muted', status: '—', dot: 'on' };
}

const EVENT_TYPES = Object.keys(EVENT_META);

/** Filter chips (subset of the 14 types, plus All). value = raw event_type. */
const chips: { label: string; value: string }[] = [
  { label: 'All', value: 'All' },
  { label: 'Commission', value: 'Commission' },
  { label: 'Aggregate', value: 'Aggregate' },
  { label: 'Dispatch', value: 'Dispatch' },
  { label: 'Receive', value: 'Receive' },
  { label: 'QC Hold', value: 'QCHold' },
  { label: 'Recall', value: 'Recall' },
];

const dotColor: Record<string, string> = {
  on: 'var(--success)',
  warn: 'var(--amber)',
  danger: 'var(--danger)',
};

/* ── date/time formatting (client-only; no SSR data → tz-safe) ── */

function fmtTime(iso: string): string {
  return new Date(iso).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false });
}
function startOfDay(d: Date): number {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
}
function fmtDate(iso: string): string {
  const d = new Date(iso);
  const diff = Math.round((startOfDay(new Date()) - startOfDay(d)) / 86400000);
  if (diff === 0) return 'Today';
  if (diff === 1) return 'Yesterday';
  return d.toLocaleDateString([], { day: '2-digit', month: 'short' });
}

type Tab = 'stream' | 'trace' | 'recall';

const tabs: { key: Tab; label: string; Icon: typeof ActivityIcon }[] = [
  { key: 'stream', label: 'Event Stream', Icon: ActivityIcon },
  { key: 'trace', label: 'Trace Explorer', Icon: SearchIcon },
  { key: 'recall', label: 'Recall', Icon: RecallIcon },
];

export default function EventsPage() {
  const [events, setEvents] = useState<ApiEvent[] | null>(null);
  const [batches, setBatches] = useState<ApiBatch[]>([]);
  const [error, setError] = useState<string | null>(null);

  const [tab, setTab] = useState<Tab>('stream');
  const [query, setQuery] = useState('');
  const [type, setType] = useState('All');
  const [traceId, setTraceId] = useState<string | null>(null);
  const [recording, setRecording] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);

  const flash = (t: string) => {
    setNotice(t);
    window.setTimeout(() => setNotice(null), 2600);
  };

  async function load() {
    try {
      const [ev, bs] = await Promise.all([getEvents({ limit: 300 }), getAllBatches()]);
      setEvents(ev);
      setBatches(bs);
      setError(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load');
    }
  }
  useEffect(() => {
    void load();
  }, []);

  const all = events ?? [];

  // KPIs from live events.
  const kpis = [
    { label: 'Total events', value: String(all.length), foot: 'append-only log', tone: 'teal' as Tone },
    { label: 'Event types used', value: String(new Set(all.map((e) => e.eventType)).size), foot: `of ${EVENT_TYPES.length} v1 types`, tone: 'primary' as Tone },
    { label: 'QC holds', value: String(all.filter((e) => e.eventType === 'QCHold').length), foot: 'hold events', tone: 'warning' as Tone },
    { label: 'Recall events', value: String(all.filter((e) => e.eventType === 'Recall').length), foot: 'recall fan-outs', tone: 'danger' as Tone },
  ];

  const filtered = all.filter((e) => {
    const matchType = type === 'All' || e.eventType === type;
    const q = query.trim().toLowerCase();
    const matchQuery =
      !q ||
      (e.subjectLabel ?? '').toLowerCase().includes(q) ||
      e.eventType.toLowerCase().includes(q) ||
      (e.location ?? '').toLowerCase().includes(q);
    return matchType && matchQuery;
  });

  // Trace targets = distinct subjects that actually have events.
  const traceTargets = useMemo(() => {
    const seen = new Map<string, { id: string; label: string; kind: string }>();
    for (const e of all) {
      if (e.subjectId && !seen.has(e.subjectId)) {
        seen.set(e.subjectId, { id: e.subjectId, label: e.subjectLabel ?? e.subjectId, kind: e.subjectKind });
      }
    }
    return [...seen.values()];
  }, [all]);

  const activeTrace = traceId ?? traceTargets[0]?.id ?? null;
  const timeline = all
    .filter((e) => e.subjectId === activeTrace)
    .slice()
    .sort((a, b) => a.occurredAt.localeCompare(b.occurredAt));

  const recallEvents = all.filter((e) => e.eventType === 'Recall');

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
              Acme Foods · <span className="font-semibold text-teal">live append-only event log</span> ·
              forward &amp; backward trace · Postgres RLS
            </p>
          </div>
          <div className="ml-auto flex gap-2.5">
            <button
              onClick={() => flash('Event export queued (EPCIS-style JSON)')}
              className="inline-flex h-10 items-center gap-2 rounded-xl border border-border-strong bg-surface px-4 text-[13.5px] font-semibold hover:bg-surface-hover"
            >
              <DownloadIcon width={16} height={16} /> Export
            </button>
            <button
              onClick={() => setRecording(true)}
              className="brand-grad inline-flex h-10 items-center gap-2 rounded-xl px-4 text-[13.5px] font-semibold text-white"
            >
              <PlusIcon width={16} height={16} /> Record event
            </button>
          </div>
        </div>

        {error && (
          <div className="mb-5 rounded-2xl border border-rose/40 bg-surface p-6 text-sm text-rose">
            Could not reach the API ({error}). Start it from <code>code/</code>:{' '}
            <code>pnpm --filter @tracewell/api dev</code>.
          </div>
        )}

        {/* KPI tiles */}
        <div className="mb-5 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {kpis.map((k) => (
            <div key={k.label} className="rounded-3xl border border-border bg-surface p-5">
              <div className="mb-3 flex items-center gap-2.5">
                <span className="grid h-9 w-9 place-items-center rounded-xl" style={toneStyle(k.tone)}>
                  <ActivityIcon width={18} height={18} />
                </span>
                <span className="text-[12.5px] font-semibold text-muted">{k.label}</span>
              </div>
              <div className="font-display text-3xl font-bold tracking-tight">
                {events === null ? '—' : k.value}
              </div>
              <div className="mt-1.5 text-xs font-semibold text-muted">{k.foot}</div>
            </div>
          ))}
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

        {events === null && !error ? (
          <div className="rounded-3xl border border-border bg-surface p-10 text-center text-[13.5px] text-muted">
            Loading events…
          </div>
        ) : (
          <>
            {tab === 'stream' && (
              <StreamTab rows={filtered} total={all.length} query={query} setQuery={setQuery} type={type} setType={setType} />
            )}
            {tab === 'trace' && (
              <TraceTab targets={traceTargets} activeId={activeTrace} setTraceId={setTraceId} timeline={timeline} />
            )}
            {tab === 'recall' && <RecallTab recalls={recallEvents} onFlash={flash} />}
          </>
        )}

        <p className="mt-8 text-[13px] text-subtle">
          Events are <span className="font-semibold text-teal">live</span> (append-only, Postgres + RLS). Recall
          dealer fan-out (shipments &amp; dealers) is a later slice.
        </p>
      </main>

      {recording && (
        <RecordEventModal
          batches={batches}
          onClose={() => setRecording(false)}
          onCreated={(t) => {
            setRecording(false);
            flash(`${metaFor(t).label} event recorded`);
            void load();
          }}
          onError={flash}
        />
      )}
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
  rows: ApiEvent[];
  total: number;
  query: string;
  setQuery: (v: string) => void;
  type: string;
  setType: (v: string) => void;
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
          {chips.map((c) => (
            <button
              key={c.value}
              onClick={() => setType(c.value)}
              className={`rounded-lg px-2.5 py-1.5 text-[12.5px] font-semibold ${
                type === c.value ? 'bg-surface text-text shadow-sm' : 'text-muted'
              }`}
            >
              {c.label}
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
            {rows.map((e) => {
              const m = metaFor(e.eventType);
              return (
                <tr key={e.id} className="border-b border-border last:border-0 hover:bg-surface-2">
                  <td className="px-4 py-3 text-xs text-muted">
                    <div className="font-semibold text-text">{fmtTime(e.occurredAt)}</div>
                    {fmtDate(e.occurredAt)}
                  </td>
                  <td className="px-4 py-3">
                    <span className="rounded-full px-2.5 py-1 text-[11px] font-bold" style={toneStyle(m.tone)}>
                      {m.label}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="font-mono text-[12.5px] font-semibold">{e.subjectLabel ?? '—'}</div>
                    <div className="text-xs text-muted">
                      {e.detail ?? ''}
                      {e.quantity ? `${e.detail ? ' · ' : ''}${e.quantity.toLocaleString()} u` : ''}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-muted">{e.location ?? '—'}</td>
                  <td className="px-4 py-3 font-mono text-[12px] text-muted">{e.actor ?? '—'}</td>
                  <td className="px-4 py-3">
                    <span className="inline-flex items-center gap-2 text-[12.5px] font-semibold">
                      <span className="h-1.5 w-1.5 rounded-full" style={{ background: dotColor[m.dot] }} />
                      {m.status}
                    </span>
                  </td>
                </tr>
              );
            })}
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
  targets,
  activeId,
  setTraceId,
  timeline,
}: {
  targets: { id: string; label: string; kind: string }[];
  activeId: string | null;
  setTraceId: (id: string) => void;
  timeline: ApiEvent[];
}) {
  if (targets.length === 0) {
    return (
      <div className="rounded-3xl border border-border bg-surface p-10 text-center text-[13.5px] text-muted">
        No traceable entities yet — record an event against a batch to start a trace.
      </div>
    );
  }
  const header = timeline[timeline.length - 1];
  return (
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-[300px_1fr]">
      {/* target picker */}
      <div className="rounded-3xl border border-border bg-surface p-4">
        <div className="mb-2 px-1 text-[11px] font-bold uppercase tracking-wide text-subtle">Trace an entity</div>
        {targets.map((t) => (
          <button
            key={t.id}
            onClick={() => setTraceId(t.id)}
            className={`mb-1.5 flex w-full items-center gap-3 rounded-xl border px-3 py-2.5 text-left last:mb-0 ${
              activeId === t.id ? 'border-primary bg-primary-soft' : 'border-border hover:bg-surface-2'
            }`}
          >
            <div>
              <div className="font-mono text-[13px] font-semibold">{t.label}</div>
              <div className="text-[11.5px] capitalize text-muted">{t.kind}</div>
            </div>
            <ChevronRightIcon width={15} height={15} className="ml-auto text-subtle" />
          </button>
        ))}
      </div>

      {/* trace timeline */}
      <div className="rounded-3xl border border-border bg-surface p-6">
        <div className="mb-5 flex flex-wrap items-center gap-2.5">
          <div>
            <div className="font-display text-[18px] font-bold">
              {header?.subjectLabel ?? 'Trace'}
            </div>
            <div className="text-[12.5px] text-muted capitalize">
              {header?.subjectKind ?? 'entity'} · {timeline.length} events
            </div>
          </div>
          {header && (
            <span className="ml-auto rounded-full px-2.5 py-1 text-[11.5px] font-bold" style={toneStyle(metaFor(header.eventType).tone)}>
              {metaFor(header.eventType).status}
            </span>
          )}
        </div>

        <div className="mb-2 text-[11.5px] font-bold uppercase tracking-wide text-subtle">
          ◀ oldest — newest ▶ (append-only chain)
        </div>
        <div className="relative ml-[11px] border-l-2 border-border pl-6">
          {timeline.map((s) => {
            const m = metaFor(s.eventType);
            return (
              <div key={s.id} className="relative pb-5 last:pb-0">
                <span
                  className="absolute -left-[31px] grid h-[22px] w-[22px] place-items-center rounded-full ring-4 ring-surface"
                  style={toneStyle(m.tone)}
                >
                  <span className="h-1.5 w-1.5 rounded-full" style={{ background: 'currentColor' }} />
                </span>
                <div className="flex flex-wrap items-center gap-2">
                  <span className="rounded-full px-2 py-0.5 text-[11px] font-bold" style={toneStyle(m.tone)}>
                    {m.label}
                  </span>
                  <span className="text-[12px] text-muted">{s.location ?? '—'}</span>
                  <span className="ml-auto font-mono text-[11.5px] text-subtle">
                    {fmtDate(s.occurredAt)} {fmtTime(s.occurredAt)}
                  </span>
                </div>
                <div className="mt-1 text-[12.5px]">{s.detail ?? '—'}</div>
                <div className="text-[11.5px] text-muted">by {s.actor ?? '—'}</div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

/* ── Recall ───────────────────────────────────────────────── */

function RecallTab({ recalls, onFlash }: { recalls: ApiEvent[]; onFlash: (t: string) => void }) {
  if (recalls.length === 0) {
    return (
      <div className="rounded-3xl border border-border bg-surface p-10 text-center text-[13.5px] text-muted">
        No active recalls. Record a <span className="font-semibold">Recall</span> event to start a fan-out.
      </div>
    );
  }
  const latest = recalls[0]!;
  return (
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-[1fr_1.4fr]">
      {/* recall summary */}
      <div className="flex flex-col rounded-3xl p-6 grad-rose">
        <div className="flex items-center">
          <span className="rounded-full bg-white/20 px-3 py-1 text-xs font-bold">● Active recall</span>
          <span className="ml-auto font-mono text-sm font-semibold">{fmtDate(latest.occurredAt)}</span>
        </div>
        <div className="mt-3 font-display text-[24px] font-bold">Batch {latest.subjectLabel}</div>
        <div className="text-[13px] opacity-90">
          {latest.quantity ? `${latest.quantity.toLocaleString()} units affected` : 'quantity —'}
        </div>
        <div className="mt-3 flex items-start gap-2 rounded-xl bg-white/15 p-3 text-[12.5px]">
          <AlertIcon width={16} height={16} />
          <span>{latest.detail ?? 'Recall in progress'}</span>
        </div>
        <div className="mt-auto pt-4 text-[12px] opacity-90">
          Dealer fan-out (shipments &amp; dealer acknowledgements) arrives with the dealer/shipment slice.
        </div>
        <button
          onClick={() => onFlash('Dealer fan-out needs the shipments slice')}
          className="mt-4 inline-flex h-10 items-center justify-center gap-2 rounded-xl bg-white text-[13.5px] font-semibold text-[var(--rose-fg)]"
        >
          Notify pending dealers
        </button>
      </div>

      {/* recall events list */}
      <div className="overflow-hidden rounded-3xl border border-border bg-surface">
        <div className="flex items-center gap-2.5 border-b border-border px-5 py-4">
          <h3 className="text-[15px] font-bold">Recall events</h3>
          <span className="ml-auto rounded-full bg-[var(--danger-soft)] px-2.5 py-1 text-[11.5px] font-bold text-[var(--danger-fg)]">
            {recalls.length} total
          </span>
        </div>
        <table className="w-full text-[13px]">
          <thead>
            <tr className="border-b border-border text-left text-[11.5px] uppercase tracking-wide text-muted">
              <th className="px-4 py-2.5 font-semibold">Batch</th>
              <th className="px-4 py-2.5 font-semibold">Reason</th>
              <th className="px-4 py-2.5 font-semibold">Units</th>
              <th className="px-4 py-2.5 font-semibold">When</th>
            </tr>
          </thead>
          <tbody>
            {recalls.map((r) => (
              <tr key={r.id} className="border-b border-border last:border-0">
                <td className="px-4 py-3 font-mono font-semibold">{r.subjectLabel ?? '—'}</td>
                <td className="px-4 py-3 text-muted">{r.detail ?? '—'}</td>
                <td className="px-4 py-3 text-muted">{r.quantity?.toLocaleString() ?? '—'}</td>
                <td className="px-4 py-3 text-muted">
                  {fmtDate(r.occurredAt)} {fmtTime(r.occurredAt)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        <div className="flex items-center gap-2 border-t border-border px-5 py-3 text-[12px] text-subtle">
          <ClockIcon width={14} height={14} />
          Backward trace resolves each recalled batch to its origin; forward trace to its distribution.
        </div>
      </div>
    </div>
  );
}

/* ── Record event modal (POST /api/events) ────────────────── */

function RecordEventModal({
  batches,
  onClose,
  onCreated,
  onError,
}: {
  batches: ApiBatch[];
  onClose: () => void;
  onCreated: (eventType: string) => void;
  onError: (msg: string) => void;
}) {
  const [eventType, setEventType] = useState('Commission');
  const [subjectId, setSubjectId] = useState(batches[0]?.id ?? '');
  const [actor, setActor] = useState('');
  const [location, setLocation] = useState('');
  const [quantity, setQuantity] = useState('');
  const [detail, setDetail] = useState('');
  const [busy, setBusy] = useState(false);

  const subject = batches.find((b) => b.id === subjectId);

  async function submit() {
    if (busy) return;
    setBusy(true);
    try {
      const payload: CreateEventPayload = {
        eventType,
        subjectKind: 'batch',
        subjectId: subjectId || undefined,
        subjectLabel: subject?.batchNumber,
        actor: actor.trim() || undefined,
        location: location.trim() || undefined,
        quantity: quantity ? Number(quantity) : undefined,
        detail: detail.trim() || undefined,
      };
      await createEvent(payload);
      onCreated(eventType);
    } catch (e) {
      onError(e instanceof Error ? e.message : 'Could not record event');
      setBusy(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50">
      <div className="absolute inset-0 bg-[#1b1922]/30" onClick={onClose} />
      <aside className="absolute right-0 top-0 flex h-full w-full max-w-[440px] flex-col overflow-auto border-l border-border bg-surface shadow-lg">
        <div className="flex items-center gap-3 border-b border-border p-5">
          <span className="grid h-11 w-11 place-items-center rounded-2xl bg-primary-soft text-primary">
            <ActivityIcon width={20} height={20} />
          </span>
          <div>
            <div className="font-display text-[17px] font-bold">Record event</div>
            <div className="text-[12px] text-muted">Appended to the immutable event log</div>
          </div>
          <button
            onClick={onClose}
            className="ml-auto grid h-9 w-9 place-items-center rounded-xl border border-border text-muted hover:bg-surface-2"
          >
            <XIcon width={16} height={16} />
          </button>
        </div>

        <div className="flex flex-col gap-3.5 p-5">
          <label className="block">
            <span className="mb-1 block text-[12px] font-semibold text-muted">Event type</span>
            <select
              value={eventType}
              onChange={(e) => setEventType(e.target.value)}
              className="h-10 w-full rounded-xl border border-border-strong bg-surface px-3 text-[13.5px] outline-none focus:border-primary"
            >
              {EVENT_TYPES.map((t) => (
                <option key={t} value={t}>
                  {metaFor(t).label}
                </option>
              ))}
            </select>
          </label>
          <label className="block">
            <span className="mb-1 block text-[12px] font-semibold text-muted">Subject batch</span>
            <select
              value={subjectId}
              onChange={(e) => setSubjectId(e.target.value)}
              className="h-10 w-full rounded-xl border border-border-strong bg-surface px-3 text-[13.5px] outline-none focus:border-primary"
            >
              {batches.length === 0 && <option value="">No batches — create one first</option>}
              {batches.map((b) => (
                <option key={b.id} value={b.id}>
                  {b.batchNumber}
                </option>
              ))}
            </select>
          </label>
          <div className="grid grid-cols-2 gap-3.5">
            <Field label="Actor" value={actor} onChange={setActor} placeholder="line-1 / r.shah" />
            <Field label="Quantity" value={quantity} onChange={(v) => setQuantity(v.replace(/[^\d]/g, ''))} placeholder="1240" />
          </div>
          <Field label="Location" value={location} onChange={setLocation} placeholder="Plant MUM-1" />
          <Field label="Detail" value={detail} onChange={setDetail} placeholder="e.g. 1,240 units commissioned" />
          <p className="text-[11.5px] text-subtle">
            Persists through <span className="font-mono">POST /api/events</span>; the tenant is scoped by RLS and
            the event is append-only.
          </p>
        </div>

        <div className="mt-auto flex gap-2.5 border-t border-border p-5">
          <button
            onClick={onClose}
            className="inline-flex h-10 flex-1 items-center justify-center rounded-xl border border-border-strong bg-surface text-[13.5px] font-semibold hover:bg-surface-hover"
          >
            Cancel
          </button>
          <button
            onClick={submit}
            disabled={busy || !subjectId}
            className="brand-grad inline-flex h-10 flex-1 items-center justify-center gap-2 rounded-xl text-[13.5px] font-semibold text-white disabled:opacity-50"
          >
            <CheckIcon width={16} height={16} />
            {busy ? 'Recording…' : 'Record event'}
          </button>
        </div>
      </aside>
    </div>
  );
}

function Field({
  label,
  value,
  onChange,
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
}) {
  return (
    <label className="block">
      <span className="mb-1 block text-[12px] font-semibold text-muted">{label}</span>
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="h-10 w-full rounded-xl border border-border-strong bg-surface px-3 text-[13.5px] outline-none focus:border-primary placeholder:text-subtle"
      />
    </label>
  );
}
