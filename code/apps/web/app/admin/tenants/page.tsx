'use client';

import { useState } from 'react';
import { PageShell } from '../../../components/PageShell';
import { PlusIcon, SearchIcon, BuildingsIcon, DotsIcon } from '../../../components/icons';
import { tenants, tenantStatusStyle } from '../../../data_mock/admin';

export default function TenantsPage() {
  const [query, setQuery] = useState('');
  const [notice, setNotice] = useState<string | null>(null);
  const flash = (t: string) => {
    setNotice(t);
    window.setTimeout(() => setNotice(null), 2400);
  };

  const rows = tenants.filter((t) => {
    const q = query.trim().toLowerCase();
    return !q || t.name.toLowerCase().includes(q) || t.region.toLowerCase().includes(q);
  });

  return (
    <PageShell
      active="/admin/tenants"
      title="Tenants"
      subtitle="Platform super-admin · every customer instance. God-mode across all tenants (invariant 6 keeps their data isolated)."
      actions={
        <button
          onClick={() => flash('Tenant onboarding started')}
          className="brand-grad inline-flex h-10 items-center gap-2 rounded-xl px-4 text-[13.5px] font-semibold text-white"
        >
          <PlusIcon width={16} height={16} /> New tenant
        </button>
      }
    >
      {notice && (
        <div className="fixed left-1/2 top-[74px] z-50 -translate-x-1/2 rounded-xl bg-[var(--success-soft)] px-4 py-2 text-[12.5px] font-semibold text-[var(--success-fg)] shadow">
          {notice}
        </div>
      )}

      <div className="mb-3 flex items-center gap-2.5">
        <div className="flex h-10 w-[280px] max-w-[60vw] items-center gap-2 rounded-xl border border-border-strong bg-surface px-3 text-[13.5px]">
          <SearchIcon width={15} height={15} className="text-subtle" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search tenant or region…"
            className="w-full bg-transparent outline-none placeholder:text-subtle"
          />
        </div>
        <span className="ml-auto text-[12.5px] text-muted">{rows.length} tenants</span>
      </div>

      <div className="overflow-hidden rounded-3xl border border-border bg-surface">
        <table className="w-full text-[13px]">
          <thead>
            <tr className="border-b border-border text-left text-[11.5px] uppercase tracking-wide text-muted">
              <th className="px-4 py-2.5 font-semibold">Tenant</th>
              <th className="px-4 py-2.5 font-semibold">Region</th>
              <th className="px-4 py-2.5 font-semibold">Users</th>
              <th className="px-4 py-2.5 font-semibold">GTINs</th>
              <th className="px-4 py-2.5 font-semibold">Events · 30d</th>
              <th className="px-4 py-2.5 font-semibold">Status</th>
              <th className="px-4 py-2.5" />
            </tr>
          </thead>
          <tbody>
            {rows.map((t) => (
              <tr key={t.id} className="border-b border-border last:border-0 hover:bg-surface-2">
                <td className="px-4 py-3">
                  <div className="flex items-center gap-3">
                    <span className="grid h-9 w-9 place-items-center rounded-xl bg-primary-soft text-primary">
                      <BuildingsIcon width={17} height={17} />
                    </span>
                    <div>
                      <div className="font-semibold">{t.name}</div>
                      <div className="text-xs text-muted">since {t.since}</div>
                    </div>
                  </div>
                </td>
                <td className="px-4 py-3 text-muted">{t.region}</td>
                <td className="px-4 py-3 text-muted">{t.users}</td>
                <td className="px-4 py-3 text-muted">{t.gtins}</td>
                <td className="px-4 py-3 text-muted">{t.events30d}</td>
                <td className="px-4 py-3">
                  <span className="rounded-full px-2.5 py-1 text-[11px] font-bold capitalize" style={tenantStatusStyle[t.status]}>
                    {t.status}
                  </span>
                </td>
                <td className="px-4 py-3 text-right">
                  <button
                    onClick={() => flash(`Opened ${t.name}`)}
                    className="grid h-8 w-8 place-items-center rounded-lg text-subtle hover:bg-surface-hover"
                  >
                    <DotsIcon width={16} height={16} />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </PageShell>
  );
}
