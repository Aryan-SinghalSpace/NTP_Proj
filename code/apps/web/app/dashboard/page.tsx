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
  kpis,
  eventVolume,
  recall,
  recentEvents,
  fefo,
  type Kpi,
  type Tone,
  type EventTone,
} from '../../data_mock/dashboard';
import Link from 'next/link';

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

const eventBadge: Record<EventTone, string> = {
  info: 'bg-[var(--info-soft)] text-[var(--info-fg)]',
  warning: 'bg-[var(--warning-soft)] text-[var(--warning-fg)]',
  success: 'bg-[var(--success-soft)] text-[var(--success-fg)]',
  muted: 'bg-surface-2 text-muted',
  danger: 'bg-[var(--danger-soft)] text-[var(--danger-fg)]',
};
const dotColor: Record<string, string> = {
  on: 'var(--success)',
  warn: 'var(--amber)',
  danger: 'var(--danger)',
};

export default function DashboardPage() {
  return (
    <>
      <TopNav active="/dashboard" />
      <main className="mx-auto max-w-[1180px] px-6 py-7">
        {/* page head */}
        <div className="mb-6 flex flex-wrap items-end gap-3">
          <div>
            <h1 className="font-display text-[27px] font-bold tracking-tight">Good morning, Riya</h1>
            <p className="mt-1 text-[13.5px] text-muted">
              Acme Foods · production snapshot · refreshed 2 minutes ago
            </p>
          </div>
          <div className="ml-auto flex gap-2.5">
            <Btn icon={<CalendarIcon width={16} height={16} />}>Last 7 days</Btn>
            <Btn icon={<DownloadIcon width={16} height={16} />}>Export</Btn>
            <Btn grad icon={<PlusIcon width={16} height={16} />}>
              New event
            </Btn>
          </div>
        </div>

        {/* KPI tiles */}
        <div className="mb-4 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {kpis.map((k) => (
            <StatTile key={k.label} kpi={k} />
          ))}
        </div>

        {/* hero bento */}
        <div className="mb-4 grid grid-cols-1 gap-4 lg:grid-cols-4 lg:grid-rows-2 lg:auto-rows-[172px]">
          {/* event volume hero */}
          <div className="relative flex flex-col overflow-hidden rounded-3xl p-6 grad-indigo lg:col-span-2 lg:row-span-2">
            <div className="absolute -right-12 -top-14 h-48 w-48 rounded-full bg-white/15" />
            <div className="flex items-center">
              <span className="rounded-full bg-white/20 px-3 py-1 text-xs font-bold">
                Event volume · 7 days
              </span>
              <span className="ml-auto text-xs font-semibold opacity-90">Report →</span>
            </div>
            <div className="mt-3.5 flex items-end gap-3">
              <div className="font-display text-[38px] font-bold leading-none">
                {eventVolume.total}
              </div>
              <div className="pb-1.5 text-[13px] opacity-85">{eventVolume.caption}</div>
            </div>
            <svg
              viewBox="0 0 520 120"
              className="mt-auto h-[120px] w-full"
              preserveAspectRatio="none"
            >
              {eventVolume.bars.map((h, i) => (
                <rect
                  key={`b${i}`}
                  x={6 + i * 74}
                  y={120 - h}
                  width={52}
                  height={h}
                  rx={7}
                  fill="#fff"
                  opacity={0.92}
                />
              ))}
              {eventVolume.overlay.map((h, i) => (
                <rect
                  key={`o${i}`}
                  x={6 + i * 74}
                  y={120 - h}
                  width={52}
                  height={h}
                  rx={7}
                  fill="#fff"
                  opacity={0.45}
                />
              ))}
            </svg>
          </div>

          {/* recall */}
          <div className="flex flex-col rounded-3xl p-6 grad-rose lg:col-span-2">
            <div className="flex items-center">
              <span className="rounded-full bg-white/20 px-3 py-1 text-xs font-bold">
                ● Active recall
              </span>
              <span className="ml-auto font-mono text-sm font-semibold">{recall.id}</span>
            </div>
            <div className="mt-3 font-display text-[22px] font-bold">Batch {recall.batch}</div>
            <div className="text-[13px] opacity-90">
              {recall.units.toLocaleString()} units · {recall.dealers} dealers impacted
            </div>
            <div className="mt-auto h-2 overflow-hidden rounded-full bg-white/30">
              <span className="block h-full rounded-full bg-white" style={{ width: `${recall.fanout}%` }} />
            </div>
            <div className="mt-1.5 flex justify-between text-xs opacity-90">
              <span>Notification fan-out</span>
              <span className="font-bold">{recall.fanout}%</span>
            </div>
          </div>

          {/* FEFO */}
          <MiniTile
            icon={<ClockIcon width={18} height={18} />}
            tone="amber"
            big="2 FEFO"
            sub="older batches still available · Mumbai & Pune DC"
          />
          {/* approvals */}
          <MiniTile
            icon={<CheckIcon width={18} height={18} />}
            tone="primary"
            big="2 approvals"
            sub="1 field promotion · 1 workflow publish"
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
                  <th className="px-4 py-2.5 font-semibold">Status</th>
                </tr>
              </thead>
              <tbody>
                {recentEvents.map((e) => (
                  <tr key={e.time + e.entity} className="border-b border-border last:border-0">
                    <td className="px-4 py-3 text-xs text-muted">{e.time}</td>
                    <td className="px-4 py-3">
                      <span
                        className={`rounded-full px-2.5 py-1 text-[11px] font-bold ${eventBadge[e.tone]}`}
                      >
                        {e.type}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="font-mono text-[12.5px] font-semibold">{e.entity}</div>
                      <div className="text-xs text-muted">{e.sub}</div>
                    </td>
                    <td className="px-4 py-3 text-muted">{e.location}</td>
                    <td className="px-4 py-3">
                      <span className="inline-flex items-center gap-2 text-[12.5px] font-semibold">
                        <span
                          className="h-1.5 w-1.5 rounded-full"
                          style={{ background: dotColor[e.dot] }}
                        />
                        {e.status}
                      </span>
                    </td>
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
              {fefo.map((f) => (
                <div key={f.product} className="flex gap-3 border-b border-border py-2.5 last:border-0">
                  <ClockIcon width={18} height={18} style={{ color: 'var(--amber)' }} />
                  <div>
                    <div className="text-[13px] font-semibold">
                      {f.product} · {f.dc}
                    </div>
                    <div className="text-xs text-muted">
                      older <span className="font-mono">{f.batch}</span> exp {f.expiry} still available
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <p className="mt-8 text-[13px] text-subtle">
          Scaffold v0 · Command × Bento · mock data (frontend-first). Live data arrives when this
          page is connected to the API.
        </p>
      </main>
    </>
  );
}

function StatTile({ kpi }: { kpi: Kpi }) {
  const Icon = kpiIcon[kpi.tone];
  const trendColor =
    kpi.trend === 'up'
      ? 'var(--success-fg)'
      : kpi.trend === 'down'
        ? 'var(--danger-fg)'
        : 'var(--muted)';
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
      <div className="font-display text-3xl font-bold tracking-tight">{kpi.value}</div>
      <div className="mt-1.5 text-xs font-semibold" style={{ color: trendColor }}>
        {kpi.trend === 'up' ? '▲ ' : kpi.trend === 'down' ? '▼ ' : ''}
        {kpi.foot}
      </div>
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

function Btn({
  children,
  icon,
  grad,
}: {
  children: React.ReactNode;
  icon?: React.ReactNode;
  grad?: boolean;
}) {
  return (
    <button
      className={`inline-flex h-10 items-center gap-2 rounded-xl px-4 text-[13.5px] font-semibold ${
        grad
          ? 'brand-grad border-transparent text-white'
          : 'border border-border-strong bg-surface text-text hover:bg-surface-hover'
      }`}
    >
      {icon}
      {children}
    </button>
  );
}
