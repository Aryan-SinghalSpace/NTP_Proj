'use client';

import { useState } from 'react';
import { PageShell } from '../../components/PageShell';
import { PlusIcon, MailIcon, BellIcon } from '../../components/icons';
import {
  rules as seedRules,
  deliveryLog,
  type Channel,
  type LogStatus,
} from '../../data_mock/notifications';

const channelStyle: Record<Channel, { background: string; color: string }> = {
  'in-app': { background: 'var(--info-soft)', color: 'var(--info-fg)' },
  email: { background: 'var(--violet-soft)', color: 'var(--violet)' },
  webhook: { background: 'var(--teal-soft)', color: 'var(--teal)' },
};
const logStyle: Record<LogStatus, { background: string; color: string }> = {
  delivered: { background: 'var(--success-soft)', color: 'var(--success-fg)' },
  pending: { background: 'var(--warning-soft)', color: 'var(--warning-fg)' },
  failed: { background: 'var(--danger-soft)', color: 'var(--danger-fg)' },
};

export default function NotificationsPage() {
  const [tab, setTab] = useState<'rules' | 'log'>('rules');
  const [rules, setRules] = useState(seedRules);
  const [notice, setNotice] = useState<string | null>(null);

  const flash = (t: string) => {
    setNotice(t);
    window.setTimeout(() => setNotice(null), 2400);
  };
  const toggle = (id: string) =>
    setRules((rs) => rs.map((r) => (r.id === id ? { ...r, enabled: !r.enabled } : r)));

  return (
    <PageShell
      active="/notifications"
      title="Notifications"
      subtitle="In-app / email / webhook rules that fire on trigger events, plus the delivery log."
      actions={
        <button
          onClick={() => flash('New rule draft created')}
          className="brand-grad inline-flex h-10 items-center gap-2 rounded-xl px-4 text-[13.5px] font-semibold text-white"
        >
          <PlusIcon width={16} height={16} /> New rule
        </button>
      }
    >
      {notice && (
        <div className="fixed left-1/2 top-[74px] z-50 -translate-x-1/2 rounded-xl bg-[var(--success-soft)] px-4 py-2 text-[12.5px] font-semibold text-[var(--success-fg)] shadow">
          {notice}
        </div>
      )}

      <div className="mb-4 flex gap-1 border-b border-border">
        {([['rules', 'Rules', BellIcon], ['log', 'Delivery log', MailIcon]] as const).map(
          ([key, label, Icon]) => (
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
          ),
        )}
      </div>

      {tab === 'rules' ? (
        <div className="overflow-hidden rounded-3xl border border-border bg-surface">
          <table className="w-full text-[13px]">
            <thead>
              <tr className="border-b border-border text-left text-[11.5px] uppercase tracking-wide text-muted">
                <th className="px-4 py-2.5 font-semibold">Rule</th>
                <th className="px-4 py-2.5 font-semibold">Trigger</th>
                <th className="px-4 py-2.5 font-semibold">Channels</th>
                <th className="px-4 py-2.5 font-semibold">Recipients</th>
                <th className="px-4 py-2.5 font-semibold">Enabled</th>
              </tr>
            </thead>
            <tbody>
              {rules.map((r) => (
                <tr key={r.id} className="border-b border-border last:border-0">
                  <td className="px-4 py-3 font-semibold">{r.name}</td>
                  <td className="px-4 py-3 font-mono text-[12px] text-muted">{r.trigger}</td>
                  <td className="px-4 py-3">
                    <div className="flex flex-wrap gap-1.5">
                      {r.channels.map((c) => (
                        <span
                          key={c}
                          className="rounded-full px-2 py-0.5 text-[10.5px] font-bold"
                          style={channelStyle[c]}
                        >
                          {c}
                        </span>
                      ))}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-muted">{r.recipients}</td>
                  <td className="px-4 py-3">
                    <button
                      onClick={() => toggle(r.id)}
                      className="relative h-5 w-9 rounded-full transition-colors"
                      style={{ background: r.enabled ? 'var(--primary)' : 'var(--border-strong)' }}
                      aria-label="toggle rule"
                    >
                      <span
                        className="absolute top-0.5 h-4 w-4 rounded-full bg-white transition-all"
                        style={{ left: r.enabled ? 18 : 2 }}
                      />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="overflow-hidden rounded-3xl border border-border bg-surface">
          <table className="w-full text-[13px]">
            <thead>
              <tr className="border-b border-border text-left text-[11.5px] uppercase tracking-wide text-muted">
                <th className="px-4 py-2.5 font-semibold">Time</th>
                <th className="px-4 py-2.5 font-semibold">Rule</th>
                <th className="px-4 py-2.5 font-semibold">Channel</th>
                <th className="px-4 py-2.5 font-semibold">Recipient</th>
                <th className="px-4 py-2.5 font-semibold">Status</th>
              </tr>
            </thead>
            <tbody>
              {deliveryLog.map((d) => (
                <tr key={d.id} className="border-b border-border last:border-0">
                  <td className="px-4 py-3 text-xs text-muted">{d.time}</td>
                  <td className="px-4 py-3 font-semibold">{d.rule}</td>
                  <td className="px-4 py-3">
                    <span className="rounded-full px-2 py-0.5 text-[10.5px] font-bold" style={channelStyle[d.channel]}>
                      {d.channel}
                    </span>
                  </td>
                  <td className="px-4 py-3 font-mono text-[12px] text-muted">{d.recipient}</td>
                  <td className="px-4 py-3">
                    <span className="rounded-full px-2.5 py-1 text-[11px] font-bold" style={logStyle[d.status]}>
                      {d.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </PageShell>
  );
}
