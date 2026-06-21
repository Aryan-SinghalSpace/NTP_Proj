import Link from 'next/link';
import { TopNav } from '../components/TopNav';

export default function DashboardPage() {
  return (
    <>
      <TopNav active="/" />
      <main className="mx-auto max-w-[1180px] px-6 py-7">
        <div className="mb-6">
          <h1 className="font-display text-[27px] font-bold tracking-tight">Good morning, Riya</h1>
          <p className="mt-1 text-sm text-muted">
            Acme Foods · production snapshot · scaffold preview
          </p>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Stat label="Active GTINs" value="12,480" foot="▲ 3.2% vs last week" tone="primary" />
          <Stat label="Events today" value="48,210" foot="▲ 12% · 14s lag" tone="teal" />
          <Stat label="QC holds" value="7" foot="2 awaiting release" tone="amber" />
          <Stat label="Open recalls" value="1" foot="B-240517 active" tone="rose" />
        </div>

        <div className="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-3">
          <div
            className="flex flex-col rounded-3xl p-6 text-white lg:col-span-2"
            style={{ background: 'linear-gradient(135deg, #6a6af4, #8b6df0)' }}
          >
            <span className="self-start rounded-full bg-white/20 px-3 py-1 text-xs font-bold">
              Event volume · 7 days
            </span>
            <div className="mt-4 font-display text-4xl font-bold">312,540</div>
            <div className="text-sm opacity-85">events this week</div>
          </div>

          <Link
            href="/fields"
            className="flex flex-col justify-between rounded-3xl border border-border bg-surface p-6 transition hover:shadow-lg"
          >
            <span className="self-start rounded-xl bg-primary-soft px-3 py-1 text-xs font-bold text-primary">
              Field Library
            </span>
            <div>
              <div className="mt-4 font-display text-2xl font-bold">Live data →</div>
              <p className="mt-1 text-sm text-muted">
                See the meta-model served by the API through Postgres RLS.
              </p>
            </div>
          </Link>
        </div>

        <p className="mt-8 text-sm text-subtle">
          Scaffold v0 — design system from <code>mockups/final</code>. Wire-up of the full
          Command&nbsp;×&nbsp;Bento shell comes next.
        </p>
      </main>
    </>
  );
}

function Stat({
  label,
  value,
  foot,
  tone,
}: {
  label: string;
  value: string;
  foot: string;
  tone: 'primary' | 'teal' | 'amber' | 'rose';
}) {
  const dot = {
    primary: 'var(--primary)',
    teal: 'var(--teal)',
    amber: 'var(--amber)',
    rose: 'var(--rose)',
  }[tone];
  return (
    <div className="rounded-3xl border border-border bg-surface p-5">
      <div className="mb-3 flex items-center gap-2.5">
        <span className="h-2.5 w-2.5 rounded-full" style={{ background: dot }} />
        <span className="text-[12.5px] font-semibold text-muted">{label}</span>
      </div>
      <div className="font-display text-3xl font-bold tracking-tight">{value}</div>
      <div className="mt-1.5 text-xs font-semibold text-muted">{foot}</div>
    </div>
  );
}
