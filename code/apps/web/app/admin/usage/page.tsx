import { PageShell } from '../../../components/PageShell';
import { BarChartIcon, DownloadIcon } from '../../../components/icons';
import { usageKpis, usageSeries, topTenants, type UsageKpi } from '../../../data_mock/admin';

const tone: Record<UsageKpi['tone'], { background: string; color: string }> = {
  primary: { background: 'var(--primary-soft)', color: 'var(--primary-soft-fg)' },
  teal: { background: 'var(--teal-soft)', color: 'var(--teal)' },
  violet: { background: 'var(--violet-soft)', color: 'var(--violet)' },
  amber: { background: 'var(--amber-soft)', color: 'var(--amber-fg)' },
};

export default function UsagePage() {
  const max = Math.max(...usageSeries);
  const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
  return (
    <PageShell
      active="/admin/usage"
      title="Usage Metrics"
      subtitle="Platform-wide usage across all tenants. Metrics captured for v1 — no billing yet."
      actions={
        <button className="inline-flex h-10 items-center gap-2 rounded-xl border border-border-strong bg-surface px-4 text-[13.5px] font-semibold hover:bg-surface-hover">
          <DownloadIcon width={16} height={16} /> Export
        </button>
      }
    >
      <div className="mb-4 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {usageKpis.map((k) => (
          <div key={k.label} className="rounded-3xl border border-border bg-surface p-5">
            <div className="mb-3 flex items-center gap-2.5">
              <span className="grid h-9 w-9 place-items-center rounded-xl" style={tone[k.tone]}>
                <BarChartIcon width={18} height={18} />
              </span>
              <span className="text-[12.5px] font-semibold text-muted">{k.label}</span>
            </div>
            <div className="font-display text-3xl font-bold tracking-tight">{k.value}</div>
            <div className="mt-1.5 text-xs font-semibold text-muted">{k.foot}</div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-[1.4fr_1fr]">
        {/* event volume chart */}
        <div className="rounded-3xl border border-border bg-surface p-6">
          <div className="mb-4 flex items-center">
            <h3 className="text-[15px] font-bold">Event volume · this week</h3>
            <span className="ml-auto text-[12px] text-subtle">platform-wide</span>
          </div>
          <div className="flex h-[180px] items-end gap-3">
            {usageSeries.map((v, i) => (
              <div key={i} className="flex flex-1 flex-col items-center gap-2">
                <div
                  className="w-full rounded-t-lg brand-grad"
                  style={{ height: `${(v / max) * 150}px` }}
                />
                <span className="text-[11px] text-muted">{days[i]}</span>
              </div>
            ))}
          </div>
        </div>

        {/* top tenants */}
        <div className="rounded-3xl border border-border bg-surface p-6">
          <h3 className="mb-4 text-[15px] font-bold">Top tenants by events</h3>
          {topTenants.map((t) => (
            <div key={t.name} className="mb-3.5 last:mb-0">
              <div className="mb-1 flex items-center text-[12.5px]">
                <span className="font-semibold">{t.name}</span>
                <span className="ml-auto text-muted">{t.events}</span>
              </div>
              <div className="h-2 overflow-hidden rounded-full bg-surface-2">
                <span className="block h-full rounded-full" style={{ width: `${t.share}%`, background: 'var(--primary)' }} />
              </div>
            </div>
          ))}
        </div>
      </div>
    </PageShell>
  );
}
