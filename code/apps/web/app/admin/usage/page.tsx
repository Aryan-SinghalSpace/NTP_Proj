'use client';

import { useEffect, useState } from 'react';
import { PageShell } from '../../../components/PageShell';
import { BarChartIcon, DownloadIcon } from '../../../components/icons';
import { getAdminUsage, type ApiUsage } from '../../../lib/api';

type Tone = 'primary' | 'teal' | 'violet' | 'amber';
const tone: Record<Tone, { background: string; color: string }> = {
  primary: { background: 'var(--primary-soft)', color: 'var(--primary-soft-fg)' },
  teal: { background: 'var(--teal-soft)', color: 'var(--teal)' },
  violet: { background: 'var(--violet-soft)', color: 'var(--violet)' },
  amber: { background: 'var(--amber-soft)', color: 'var(--amber-fg)' },
};

export default function UsagePage() {
  const [usage, setUsage] = useState<ApiUsage | null>(null);

  useEffect(() => {
    getAdminUsage()
      .then(setUsage)
      .catch(() => setUsage(null));
  }, []);

  const kpis: { label: string; value: string; foot: string; tone: Tone }[] = usage
    ? [
        { label: 'Total tenants', value: String(usage.totalTenants), foot: `${usage.tenantsActive} active · ${usage.tenantsOnboarding} onboarding · ${usage.tenantsSuspended} suspended`, tone: 'primary' },
        { label: 'Events (all-time)', value: usage.totalEvents.toLocaleString(), foot: 'across all tenants', tone: 'teal' },
        { label: 'Products', value: usage.totalProducts.toLocaleString(), foot: 'GTINs & drafts', tone: 'amber' },
        { label: 'Active tenants', value: String(usage.tenantsActive), foot: 'live instances', tone: 'violet' },
      ]
    : [];

  const top = usage?.topTenants ?? [];
  const max = Math.max(...top.map((t) => t.events), 1);

  return (
    <PageShell
      active="/admin/usage"
      title="Usage Metrics"
      subtitle="Platform-wide usage across all tenants · live via the platform role. Metrics captured for v1 — no billing yet."
      actions={
        <button className="inline-flex h-10 items-center gap-2 rounded-xl border border-border-strong bg-surface px-4 text-[13.5px] font-semibold hover:bg-surface-hover">
          <DownloadIcon width={16} height={16} /> Export
        </button>
      }
    >
      <div className="mb-4 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {(usage ? kpis : [0, 1, 2, 3]).map((k, i) => {
          const kpi = usage ? (k as (typeof kpis)[number]) : null;
          return (
            <div key={i} className="rounded-3xl border border-border bg-surface p-5">
              <div className="mb-3 flex items-center gap-2.5">
                <span className="grid h-9 w-9 place-items-center rounded-xl" style={tone[kpi?.tone ?? 'primary']}>
                  <BarChartIcon width={18} height={18} />
                </span>
                <span className="text-[12.5px] font-semibold text-muted">{kpi?.label ?? 'Loading'}</span>
              </div>
              <div className="font-display text-3xl font-bold tracking-tight">{kpi?.value ?? '—'}</div>
              <div className="mt-1.5 text-xs font-semibold text-muted">{kpi?.foot ?? ''}</div>
            </div>
          );
        })}
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-[1.4fr_1fr]">
        <div className="rounded-3xl border border-border bg-surface p-6">
          <div className="mb-4 flex items-center">
            <h3 className="text-[15px] font-bold">Events by tenant</h3>
            <span className="ml-auto text-[12px] text-subtle">platform-wide</span>
          </div>
          <div className="flex h-[180px] items-end gap-3">
            {top.map((t) => (
              <div key={t.name} className="flex flex-1 flex-col items-center gap-2">
                <div className="w-full rounded-t-lg brand-grad" style={{ height: `${Math.max((t.events / max) * 150, 3)}px` }} />
                <span className="w-full truncate text-center text-[10.5px] text-muted">{t.name.split(' ')[0]}</span>
              </div>
            ))}
            {top.length === 0 && <div className="text-[13px] text-muted">Loading…</div>}
          </div>
        </div>

        <div className="rounded-3xl border border-border bg-surface p-6">
          <h3 className="mb-4 text-[15px] font-bold">Top tenants by events</h3>
          {top.map((t) => (
            <div key={t.name} className="mb-3.5 last:mb-0">
              <div className="mb-1 flex items-center text-[12.5px]">
                <span className="font-semibold">{t.name}</span>
                <span className="ml-auto text-muted">{t.events.toLocaleString()}</span>
              </div>
              <div className="h-2 overflow-hidden rounded-full bg-surface-2">
                <span className="block h-full rounded-full" style={{ width: `${t.share}%`, background: 'var(--primary)' }} />
              </div>
            </div>
          ))}
          {top.length === 0 && <div className="text-[13px] text-muted">Loading…</div>}
        </div>
      </div>
    </PageShell>
  );
}
