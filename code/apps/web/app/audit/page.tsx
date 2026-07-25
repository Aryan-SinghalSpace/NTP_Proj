'use client';

import { useEffect, useState } from 'react';
import { PageShell } from '../../components/PageShell';
import { DownloadIcon, SearchIcon } from '../../components/icons';
import { getAudit, type ApiAudit } from '../../lib/api';

const actionStyle: Record<string, { background: string; color: string }> = {
  Created: { background: 'var(--success-soft)', color: 'var(--success-fg)' },
  Updated: { background: 'var(--info-soft)', color: 'var(--info-fg)' },
  Deactivated: { background: 'var(--warning-soft)', color: 'var(--warning-fg)' },
  Reactivated: { background: 'var(--teal-soft)', color: 'var(--teal)' },
  Published: { background: 'var(--violet-soft)', color: 'var(--violet)' },
};
const FILTERS = ['All', 'Created', 'Updated', 'Deactivated', 'Reactivated', 'Published'];

function fmtTime(iso: string): string {
  return new Date(iso).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false });
}
function startOfDay(d: Date): number {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
}
function fmtDay(iso: string): string {
  const d = new Date(iso);
  const diff = Math.round((startOfDay(new Date()) - startOfDay(d)) / 86400000);
  if (diff === 0) return 'Today';
  if (diff === 1) return 'Yesterday';
  return d.toLocaleDateString([], { day: '2-digit', month: 'short' });
}

export default function AuditPage() {
  const [rows, setRows] = useState<ApiAudit[] | null>(null);
  const [query, setQuery] = useState('');
  const [action, setAction] = useState('All');

  useEffect(() => {
    getAudit(300)
      .then(setRows)
      .catch(() => setRows([]));
  }, []);

  const all = rows ?? [];
  const filtered = all.filter((e) => {
    const matchAction = action === 'All' || e.action === action;
    const q = query.trim().toLowerCase();
    const matchQuery =
      !q ||
      e.entity.toLowerCase().includes(q) ||
      e.entityId.toLowerCase().includes(q) ||
      e.actor.toLowerCase().includes(q) ||
      e.diff.toLowerCase().includes(q);
    return matchAction && matchQuery;
  });

  return (
    <PageShell
      active="/audit"
      title="Audit Log"
      subtitle="Acme Foods · live append-only change history · every change auditable (invariant 2)"
      actions={
        <button className="inline-flex h-10 items-center gap-2 rounded-xl border border-border-strong bg-surface px-4 text-[13.5px] font-semibold hover:bg-surface-hover">
          <DownloadIcon width={16} height={16} /> Export
        </button>
      }
    >
      <div className="mb-3 flex flex-wrap items-center gap-2.5">
        <div className="flex h-10 w-[280px] max-w-[60vw] items-center gap-2 rounded-xl border border-border-strong bg-surface px-3 text-[13.5px]">
          <SearchIcon width={15} height={15} className="text-subtle" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search entity, actor or change…"
            className="w-full bg-transparent outline-none placeholder:text-subtle"
          />
        </div>
        <div className="flex flex-wrap gap-1 rounded-xl border border-border bg-surface-2 p-1">
          {FILTERS.map((f) => (
            <button
              key={f}
              onClick={() => setAction(f)}
              className={`rounded-lg px-2.5 py-1.5 text-[12.5px] font-semibold ${
                action === f ? 'bg-surface text-text shadow-sm' : 'text-muted'
              }`}
            >
              {f}
            </button>
          ))}
        </div>
        <span className="ml-auto text-[12.5px] text-muted">
          {filtered.length} of {all.length} entries
        </span>
      </div>

      <div className="overflow-hidden rounded-3xl border border-border bg-surface">
        <table className="w-full text-[13px]">
          <thead>
            <tr className="border-b border-border text-left text-[11.5px] uppercase tracking-wide text-muted">
              <th className="px-4 py-2.5 font-semibold">When</th>
              <th className="px-4 py-2.5 font-semibold">Actor</th>
              <th className="px-4 py-2.5 font-semibold">Action</th>
              <th className="px-4 py-2.5 font-semibold">Entity</th>
              <th className="px-4 py-2.5 font-semibold">Change</th>
            </tr>
          </thead>
          <tbody>
            {rows === null && (
              <tr>
                <td colSpan={5} className="px-4 py-10 text-center text-muted">
                  Loading…
                </td>
              </tr>
            )}
            {rows !== null &&
              filtered.map((e) => (
                <tr key={e.id} className="border-b border-border last:border-0 align-top">
                  <td className="px-4 py-3 text-xs text-muted">
                    <div className="font-mono font-semibold text-text">{fmtTime(e.occurredAt)}</div>
                    {fmtDay(e.occurredAt)}
                  </td>
                  <td className="px-4 py-3">
                    <div className="font-semibold">{e.actor}</div>
                    <div className="text-[11.5px] text-muted">{e.actorRole}</div>
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className="rounded-full px-2.5 py-1 text-[11px] font-bold"
                      style={actionStyle[e.action] ?? { background: 'var(--surface-2)', color: 'var(--muted)' }}
                    >
                      {e.action}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="font-mono text-[12px] font-semibold">{e.entity}</div>
                    <div className="font-mono text-[11.5px] text-muted">
                      {e.entityId}
                      {e.version ? ` · ${e.version}` : ''}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-[12.5px] text-muted">{e.diff}</td>
                </tr>
              ))}
            {rows !== null && filtered.length === 0 && (
              <tr>
                <td colSpan={5} className="px-4 py-10 text-center text-muted">
                  No audit entries match your filters.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <p className="mt-6 text-[13px] text-subtle">
        Entries are <span className="font-semibold text-teal">live</span> and append-only — recorded
        automatically whenever a product, field, role, user, scheme, approval or setting changes.
      </p>
    </PageShell>
  );
}
