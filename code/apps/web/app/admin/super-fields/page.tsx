'use client';

import { useState } from 'react';
import { PageShell } from '../../../components/PageShell';
import { StarIcon, CheckIcon, XIcon, PlusIcon } from '../../../components/icons';
import { superFields, promotionQueue as seedQueue } from '../../../data_mock/admin';

export default function SuperFieldsPage() {
  const [queue, setQueue] = useState(seedQueue);
  const [notice, setNotice] = useState<string | null>(null);
  const flash = (t: string) => {
    setNotice(t);
    window.setTimeout(() => setNotice(null), 2400);
  };
  const resolve = (id: string, ok: boolean) => {
    setQueue((q) => q.filter((x) => x.id !== id));
    flash(ok ? 'Promoted to Super Field' : 'Promotion rejected');
  };

  return (
    <PageShell
      active="/admin/super-fields"
      title="Super Fields"
      subtitle="The canonical field library shared across all tenants — only the Super Admin can manage it."
      actions={
        <button
          onClick={() => flash('New Super Field draft')}
          className="brand-grad inline-flex h-10 items-center gap-2 rounded-xl px-4 text-[13.5px] font-semibold text-white"
        >
          <PlusIcon width={16} height={16} /> New Super Field
        </button>
      }
    >
      {notice && (
        <div className="fixed left-1/2 top-[74px] z-50 -translate-x-1/2 rounded-xl bg-[var(--success-soft)] px-4 py-2 text-[12.5px] font-semibold text-[var(--success-fg)] shadow">
          {notice}
        </div>
      )}

      {/* promotion queue */}
      <div className="mb-5 overflow-hidden rounded-3xl border border-border bg-surface">
        <div className="flex items-center gap-2.5 border-b border-border px-5 py-4">
          <h3 className="text-[15px] font-bold">Promotion queue</h3>
          <span className="rounded-full bg-[var(--warning-soft)] px-2.5 py-1 text-[11.5px] font-bold text-[var(--warning-fg)]">
            {queue.length} pending
          </span>
          <span className="ml-auto text-[12px] text-subtle">Tenant Custom → Super Field requests</span>
        </div>
        {queue.length === 0 ? (
          <div className="px-5 py-8 text-center text-[13px] text-muted">Queue is clear.</div>
        ) : (
          queue.map((p) => (
            <div key={p.id} className="flex flex-wrap items-center gap-3 border-b border-border px-5 py-3.5 last:border-0">
              <span className="grid h-9 w-9 place-items-center rounded-xl" style={{ background: 'var(--violet-soft)', color: 'var(--violet)' }}>
                <StarIcon width={17} height={17} />
              </span>
              <div>
                <div className="font-semibold">
                  {p.field} <span className="font-mono text-[11.5px] text-subtle">· {p.type}</span>
                </div>
                <div className="text-xs text-muted">
                  {p.tenant} · {p.requester} · {p.when}
                </div>
              </div>
              <div className="ml-auto flex gap-2">
                <button
                  onClick={() => resolve(p.id, true)}
                  className="inline-flex h-9 items-center gap-1.5 rounded-xl px-3 text-[12.5px] font-semibold text-white"
                  style={{ background: 'var(--success)' }}
                >
                  <CheckIcon width={14} height={14} /> Promote
                </button>
                <button
                  onClick={() => resolve(p.id, false)}
                  className="inline-flex h-9 items-center gap-1.5 rounded-xl border border-border-strong bg-surface px-3 text-[12.5px] font-semibold hover:bg-surface-hover"
                >
                  <XIcon width={14} height={14} /> Reject
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* canonical library */}
      <div className="overflow-hidden rounded-3xl border border-border bg-surface">
        <div className="border-b border-border px-5 py-4">
          <h3 className="text-[15px] font-bold">Canonical Super Fields</h3>
        </div>
        <table className="w-full text-[13px]">
          <thead>
            <tr className="border-b border-border text-left text-[11.5px] uppercase tracking-wide text-muted">
              <th className="px-4 py-2.5 font-semibold">Field</th>
              <th className="px-4 py-2.5 font-semibold">Type</th>
              <th className="px-4 py-2.5 font-semibold">Scope</th>
              <th className="px-4 py-2.5 font-semibold">Tenants using</th>
              <th className="px-4 py-2.5 font-semibold">Status</th>
            </tr>
          </thead>
          <tbody>
            {superFields.map((f) => (
              <tr key={f.key} className="border-b border-border last:border-0">
                <td className="px-4 py-3">
                  <div className="font-semibold">{f.name}</div>
                  <div className="font-mono text-[11.5px] text-muted">{f.key}</div>
                </td>
                <td className="px-4 py-3">
                  <span className="rounded-full bg-surface-2 px-2 py-0.5 text-[11px] font-bold text-muted">{f.type}</span>
                </td>
                <td className="px-4 py-3 text-muted">{f.scope}</td>
                <td className="px-4 py-3 text-muted">{f.tenantsUsing}</td>
                <td className="px-4 py-3">
                  <span className="inline-flex items-center gap-1.5 text-[12.5px] font-semibold">
                    <span
                      className="h-1.5 w-1.5 rounded-full"
                      style={{ background: f.status === 'active' ? 'var(--teal)' : 'var(--subtle)' }}
                    />
                    {f.status === 'active' ? 'Active' : 'Deactivated'}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </PageShell>
  );
}
