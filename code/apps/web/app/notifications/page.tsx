'use client';

import { useEffect, useState } from 'react';
import { PageShell } from '../../components/PageShell';
import { PlusIcon, MailIcon, BellIcon, XIcon, CheckIcon } from '../../components/icons';
import {
  getNotificationRules,
  createNotificationRule,
  toggleNotificationRule,
  getNotificationDeliveries,
  type ApiNotificationRule,
  type ApiNotificationDelivery,
  type Channel,
} from '../../lib/api';

const channelStyle: Record<string, { background: string; color: string }> = {
  'in-app': { background: 'var(--info-soft)', color: 'var(--info-fg)' },
  email: { background: 'var(--violet-soft)', color: 'var(--violet)' },
  webhook: { background: 'var(--teal-soft)', color: 'var(--teal)' },
};
const logStyle: Record<string, { background: string; color: string }> = {
  delivered: { background: 'var(--success-soft)', color: 'var(--success-fg)' },
  pending: { background: 'var(--warning-soft)', color: 'var(--warning-fg)' },
  failed: { background: 'var(--danger-soft)', color: 'var(--danger-fg)' },
};
const ALL_CHANNELS: Channel[] = ['in-app', 'email', 'webhook'];

function when(iso: string): string {
  const d = new Date(iso);
  const diff = Math.round((Date.now() - d.getTime()) / 86400000);
  const t = d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false });
  if (diff === 0) return `${t} · today`;
  if (diff === 1) return `Yesterday · ${t}`;
  return `${d.toLocaleDateString([], { day: '2-digit', month: 'short' })} · ${t}`;
}

export default function NotificationsPage() {
  const [tab, setTab] = useState<'rules' | 'log'>('rules');
  const [rules, setRules] = useState<ApiNotificationRule[] | null>(null);
  const [deliveries, setDeliveries] = useState<ApiNotificationDelivery[]>([]);
  const [creating, setCreating] = useState(false);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  const flash = (t: string) => {
    setNotice(t);
    window.setTimeout(() => setNotice(null), 2400);
  };

  async function load() {
    try {
      const [r, d] = await Promise.all([getNotificationRules(), getNotificationDeliveries()]);
      setRules(r);
      setDeliveries(d);
    } catch {
      flash('Could not reach the API');
    }
  }
  useEffect(() => {
    void load();
  }, []);

  async function toggle(r: ApiNotificationRule) {
    setBusyId(r.id);
    try {
      await toggleNotificationRule(r.id, !r.enabled);
      await load();
    } catch (e) {
      flash(e instanceof Error ? e.message : 'Action failed');
    } finally {
      setBusyId(null);
    }
  }

  return (
    <PageShell
      active="/notifications"
      title="Notifications"
      subtitle="Acme Foods · live via Postgres RLS · in-app / email / webhook rules + delivery log"
      actions={
        <button
          onClick={() => setCreating(true)}
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
        {([['rules', 'Rules', BellIcon], ['log', 'Delivery log', MailIcon]] as const).map(([key, label, Icon]) => (
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
        ))}
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
              {rules === null && (
                <tr>
                  <td colSpan={5} className="px-4 py-10 text-center text-muted">
                    Loading…
                  </td>
                </tr>
              )}
              {(rules ?? []).map((r) => (
                <tr key={r.id} className="border-b border-border last:border-0">
                  <td className="px-4 py-3 font-semibold">{r.name}</td>
                  <td className="px-4 py-3 font-mono text-[12px] text-muted">{r.trigger}</td>
                  <td className="px-4 py-3">
                    <div className="flex flex-wrap gap-1.5">
                      {r.channels.map((c) => (
                        <span key={c} className="rounded-full px-2 py-0.5 text-[10.5px] font-bold" style={channelStyle[c]}>
                          {c}
                        </span>
                      ))}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-muted">{r.recipients}</td>
                  <td className="px-4 py-3">
                    <button
                      onClick={() => toggle(r)}
                      disabled={busyId === r.id}
                      className="relative h-5 w-9 rounded-full transition-colors disabled:opacity-50"
                      style={{ background: r.enabled ? 'var(--primary)' : 'var(--border-strong)' }}
                      aria-label="toggle rule"
                    >
                      <span className="absolute top-0.5 h-4 w-4 rounded-full bg-white transition-all" style={{ left: r.enabled ? 18 : 2 }} />
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
              {deliveries.map((d) => (
                <tr key={d.id} className="border-b border-border last:border-0">
                  <td className="px-4 py-3 text-xs text-muted">{when(d.occurredAt)}</td>
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
              {deliveries.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-4 py-10 text-center text-muted">
                    No deliveries yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      <p className="mt-6 text-[13px] text-subtle">
        Rules are <span className="font-semibold text-teal">live</span> (Postgres + RLS). The delivery engine
        (actual in-app/email/webhook fan-out) is a later slice — the log shows seeded deliveries for now.
      </p>

      {creating && (
        <NewRuleModal
          onClose={() => setCreating(false)}
          onCreated={(name) => {
            setCreating(false);
            flash(`Rule “${name}” created`);
            void load();
          }}
          onError={flash}
        />
      )}
    </PageShell>
  );
}

function NewRuleModal({
  onClose,
  onCreated,
  onError,
}: {
  onClose: () => void;
  onCreated: (name: string) => void;
  onError: (msg: string) => void;
}) {
  const [name, setName] = useState('');
  const [trigger, setTrigger] = useState('');
  const [recipients, setRecipients] = useState('');
  const [channels, setChannels] = useState<Channel[]>(['in-app']);
  const [busy, setBusy] = useState(false);
  const valid = name.trim() && trigger.trim() && channels.length > 0;

  function toggleChannel(c: Channel) {
    setChannels((cs) => (cs.includes(c) ? cs.filter((x) => x !== c) : [...cs, c]));
  }

  async function submit() {
    if (!valid || busy) return;
    setBusy(true);
    try {
      await createNotificationRule({ name: name.trim(), trigger: trigger.trim(), channels, recipients: recipients.trim() || undefined });
      onCreated(name.trim());
    } catch (e) {
      onError(e instanceof Error ? e.message : 'Could not create rule');
      setBusy(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50">
      <div className="absolute inset-0 bg-[#1b1922]/30" onClick={onClose} />
      <aside className="absolute right-0 top-0 flex h-full w-full max-w-[420px] flex-col overflow-auto border-l border-border bg-surface shadow-lg">
        <div className="flex items-center gap-3 border-b border-border p-5">
          <span className="grid h-11 w-11 place-items-center rounded-2xl bg-primary-soft text-primary">
            <BellIcon width={20} height={20} />
          </span>
          <div>
            <div className="font-display text-[17px] font-bold">New rule</div>
            <div className="text-[12px] text-muted">Fires when the trigger event occurs</div>
          </div>
          <button onClick={onClose} className="ml-auto grid h-9 w-9 place-items-center rounded-xl border border-border text-muted hover:bg-surface-2">
            <XIcon width={16} height={16} />
          </button>
        </div>
        <div className="flex flex-col gap-3.5 p-5">
          <F label="Rule name" value={name} onChange={setName} placeholder="e.g. Recall fan-out" />
          <F label="Trigger" value={trigger} onChange={setTrigger} placeholder="Recall · initiated" mono />
          <F label="Recipients" value={recipients} onChange={setRecipients} placeholder="Quality team, dealers" />
          <div>
            <span className="mb-1.5 block text-[12px] font-semibold text-muted">Channels</span>
            <div className="flex gap-2">
              {ALL_CHANNELS.map((c) => {
                const on = channels.includes(c);
                return (
                  <button
                    key={c}
                    onClick={() => toggleChannel(c)}
                    className={`rounded-lg border px-3 py-1.5 text-[12px] font-semibold ${
                      on ? 'border-primary bg-primary-soft text-primary' : 'border-border-strong bg-surface text-muted'
                    }`}
                  >
                    {c}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
        <div className="mt-auto flex gap-2.5 border-t border-border p-5">
          <button onClick={onClose} className="inline-flex h-10 flex-1 items-center justify-center rounded-xl border border-border-strong bg-surface text-[13.5px] font-semibold hover:bg-surface-hover">Cancel</button>
          <button onClick={submit} disabled={!valid || busy} className="brand-grad inline-flex h-10 flex-1 items-center justify-center gap-2 rounded-xl text-[13.5px] font-semibold text-white disabled:opacity-50">
            <CheckIcon width={16} height={16} /> {busy ? 'Creating…' : 'Create rule'}
          </button>
        </div>
      </aside>
    </div>
  );
}

function F({ label, value, onChange, placeholder, mono }: { label: string; value: string; onChange: (v: string) => void; placeholder?: string; mono?: boolean }) {
  return (
    <label className="block">
      <span className="mb-1 block text-[12px] font-semibold text-muted">{label}</span>
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className={`h-10 w-full rounded-xl border border-border-strong bg-surface px-3 text-[13.5px] outline-none focus:border-primary placeholder:text-subtle ${mono ? 'font-mono text-[13px]' : ''}`}
      />
    </label>
  );
}
