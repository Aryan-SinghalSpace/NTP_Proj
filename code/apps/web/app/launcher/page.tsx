import Link from 'next/link';
import type { ComponentType, SVGProps } from 'react';
import {
  GridIcon,
  BoxIcon,
  LayersIcon,
  FlowIcon,
  ActivityIcon,
  TagIcon,
  ScanIcon,
  TruckIcon,
  BarChartIcon,
  SettingsIcon,
  UsersIcon,
  ShieldIcon,
  KeyIcon,
  MailIcon,
  InboxIcon,
  HistoryIcon,
  UserIcon,
  BuildingsIcon,
  StarIcon,
  LogInIcon,
  ArrowRightIcon,
} from '../../components/icons';
import { registry, type PageStatus } from '../../data_mock/launcher';

type IconType = ComponentType<SVGProps<SVGSVGElement>>;

const iconMap: Record<string, IconType> = {
  grid: GridIcon,
  box: BoxIcon,
  layers: LayersIcon,
  flow: FlowIcon,
  activity: ActivityIcon,
  tag: TagIcon,
  scan: ScanIcon,
  truck: TruckIcon,
  barChart: BarChartIcon,
  settings: SettingsIcon,
  users: UsersIcon,
  shield: ShieldIcon,
  key: KeyIcon,
  mail: MailIcon,
  inbox: InboxIcon,
  history: HistoryIcon,
  user: UserIcon,
  buildings: BuildingsIcon,
  star: StarIcon,
  login: LogInIcon,
};

const statusBadge: Record<PageStatus, { label: string; cls: string }> = {
  built: { label: 'Built', cls: 'bg-[var(--success-soft)] text-[var(--success-fg)]' },
  partial: { label: 'Live API', cls: 'bg-[var(--info-soft)] text-[var(--info-fg)]' },
  pending: { label: 'Pending', cls: 'bg-[var(--warning-soft)] text-[var(--warning-fg)]' },
};

export default function LauncherPage() {
  const total = registry.reduce((n, g) => n + g.pages.length, 0);
  return (
    <main className="min-h-screen bg-bg">
      {/* header */}
      <header className="border-b border-border bg-surface">
        <div className="mx-auto flex max-w-[1180px] items-center gap-3 px-6 py-5">
          <Link href="/" className="flex items-center gap-2.5 font-display text-base font-bold">
            <span className="grid h-8 w-8 place-items-center rounded-xl font-extrabold text-white brand-grad">
              S
            </span>
            Strings
          </Link>
          <span className="ml-1 rounded-full bg-surface-2 px-2.5 py-1 text-[11.5px] font-semibold text-muted">
            Page launcher · {total} pages
          </span>
          <Link
            href="/dashboard"
            className="brand-grad ml-auto inline-flex h-9 items-center gap-2 rounded-xl px-4 text-[13px] font-semibold text-white"
          >
            Open dashboard
            <ArrowRightIcon width={15} height={15} />
          </Link>
        </div>
      </header>

      <div className="mx-auto max-w-[1180px] px-6 py-8">
        <h1 className="font-display text-[28px] font-bold tracking-tight">Every page, one click away</h1>
        <p className="mt-1.5 max-w-2xl text-[13.5px] text-muted">
          A temporary index of the whole platform surface for this build phase. Each card says what
          the page represents — the same descriptions live in{' '}
          <span className="font-mono text-[12.5px]">docs/RUNBOOK.md</span>.
        </p>

        {registry.map((grp) => (
          <section key={grp.group} className="mt-9">
            <div className="mb-3 flex items-baseline gap-3">
              <h2 className="font-display text-[17px] font-bold">{grp.group}</h2>
              <span className="text-[12.5px] text-subtle">{grp.note}</span>
            </div>
            <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-2 lg:grid-cols-3">
              {grp.pages.map((p) => {
                const Icon = iconMap[p.icon] ?? GridIcon;
                const badge = statusBadge[p.status];
                return (
                  <Link
                    key={p.href}
                    href={p.href}
                    className="group flex flex-col rounded-2xl border border-border bg-surface p-4 transition-shadow hover:shadow-[var(--shadow)]"
                  >
                    <div className="flex items-center gap-3">
                      <span className="grid h-10 w-10 place-items-center rounded-xl bg-primary-soft text-primary">
                        <Icon width={19} height={19} />
                      </span>
                      <span className="font-display text-[15px] font-bold">{p.title}</span>
                      <span className={`ml-auto rounded-full px-2 py-0.5 text-[10.5px] font-bold ${badge.cls}`}>
                        {badge.label}
                      </span>
                    </div>
                    <p className="mt-2.5 text-[12.5px] leading-relaxed text-muted">{p.blurb}</p>
                    <span className="mt-3 inline-flex items-center gap-1 font-mono text-[11.5px] text-subtle group-hover:text-primary">
                      {p.href}
                      <ArrowRightIcon width={13} height={13} />
                    </span>
                  </Link>
                );
              })}
            </div>
          </section>
        ))}

        <p className="mt-10 text-[12.5px] text-subtle">
          Strings · Command × Bento · frontend-first scaffold. Pages run on mock data until wired to
          the live API.
        </p>
      </div>
    </main>
  );
}
