'use client';

import { useState } from 'react';
import { PageShell } from '../../components/PageShell';
import { DownloadIcon, SearchIcon } from '../../components/icons';
import { auditLog, auditActions, type AuditAction } from '../../data_mock/audit';

const actionStyle: Record<AuditAction, { background: string; color: string }> = {
  Created: { background: 'var(--success-soft)', color: 'var(--success-fg)' },
  Updated: { background: 'var(--info-soft)', color: 'var(--info-fg)' },
  Deactivated: { background: 'var(--warning-soft)', color: 'var(--warning-fg)' },
  Published: { background: 'var(--violet-soft)', color: 'var(--violet)' },
};

export default function AuditPage() {
  const [query, setQuery] = useState('');
  const [action, setAction] = useState<'All' | AuditAction>('All');

  const rows = auditLog.filter((e) => {
    const matchAction = action === 'All' || e.action === action;
    const q = query.trim().toLowerCase();
    const matchQuery =
      !q || e.entity.toLowerCase().includes(q) || e.entityId.toLowerCase().includes(q) || e.actor.toLowerCase().includes(q);
    return matchAction && matchQuery;
  });

  return (
    <PageShell
      active="/audit"
      title="Audit Log"
      subtitle="Append-only, versioned history of every configuration change (invariants 2 & 4)."
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
            placeholder="Search entity, id or actor…"
            className="w-full bg-transparent outline-none placeholder:text-subtle"
          />
        </div>
        <div className="flex flex-wrap gap-1 rounded-xl border border-border bg-surface-2 p-1">
          {(['All', ...auditActions] as const).map((a) => (
            <button
              key={a}
              onClick={() => setAction(a)}
              className={`rounded-lg px-2.5 py-1.5 text-[12.5px] font-semibold ${
                action === a ? 'bg-surface text-text shadow-sm' : 'text-muted'
              }`}
            >
              {a}
            </button>
          ))}
        </div>
        <span className="ml-auto text-[12.5px] text-muted">{rows.length} entries</span>
      </div>

      <div className="overflow-hidden rounded-3xl border border-border bg-surface">
        <table className="w-full text-[13px]">
          <thead>
            <tr className="border-b border-border text-left text-[11.5px] uppercase tracking-wide text-muted">
              <th className="px-4 py-2.5 font-semibold">When</th>
              <th className="px-4 py-2.5 font-semibold">Actor</th>
              <th className="px-4 py-2.5 font-semibold">Action</th>
              <th className="px-4 py-2.5 font-semibold">Entity</th>
              <th className="px-4 py-2.5 font-semibold">Version</th>
              <th className="px-4 py-2.5 font-semibold">Change</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((e) => (
              <tr key={e.id} className="border-b border-border last:border-0 align-top">
                <td className="px-4 py-3 text-xs text-muted">
                  <div className="font-mono font-semibold text-text">{e.time}</div>
                  {e.date}
                </td>
                <td className="px-4 py-3">
                  <div className="font-semibold">{e.actor}</div>
                  <div className="text-xs text-muted">{e.actorRole}</div>
                </td>
                <td className="px-4 py-3">
                  <span className="rounded-full px-2.5 py-1 text-[11px] font-bold" style={actionStyle[e.action]}>
                    {e.action}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <div className="font-mono text-[12px] text-muted">{e.entity}</div>
                  <div className="font-mono text-[12.5px] font-semibold">{e.entityId}</div>
                </td>
                <td className="px-4 py-3 font-mono text-[12px] text-muted">{e.version || '—'}</td>
                <td className="px-4 py-3 text-[12.5px] text-muted">{e.diff}</td>
              </tr>
            ))}
            {rows.length === 0 && (
              <tr>
                <td colSpan={6} className="px-4 py-10 text-center text-muted">
                  No entries match.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </PageShell>
  );
}
