'use client';

import { useEffect, useState } from 'react';
import { PageShell } from '../../components/PageShell';
import { KeyIcon, CheckIcon, PlusIcon, XIcon } from '../../components/icons';
import {
  getIdentitySchemes,
  toggleIdentityScheme,
  createIdentityScheme,
  type ApiIdentityScheme,
} from '../../lib/api';

const tone: Record<string, { background: string; color: string }> = {
  success: { background: 'var(--success-soft)', color: 'var(--success-fg)' },
  info: { background: 'var(--info-soft)', color: 'var(--info-fg)' },
  violet: { background: 'var(--violet-soft)', color: 'var(--violet)' },
  teal: { background: 'var(--teal-soft)', color: 'var(--teal)' },
};

export default function IdentitySchemesPage() {
  const [schemes, setSchemes] = useState<ApiIdentityScheme[] | null>(null);
  const [creating, setCreating] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);

  const flash = (t: string) => {
    setNotice(t);
    window.setTimeout(() => setNotice(null), 2600);
  };

  async function load() {
    try {
      setSchemes(await getIdentitySchemes());
    } catch {
      flash('Could not reach the API');
    }
  }
  useEffect(() => {
    void load();
  }, []);

  const all = schemes ?? [];
  const standard = all.filter((s) => s.kind === 'standard');
  const custom = all.filter((s) => s.kind === 'custom');
  const activeCustom = custom.filter((c) => c.enabled).length;
  const issued = custom.reduce((n, c) => n + c.issued, 0);

  async function toggle(s: ApiIdentityScheme) {
    setBusyId(s.id);
    try {
      await toggleIdentityScheme(s.id, !s.enabled);
      flash(`${s.name} ${!s.enabled ? 'enabled' : 'disabled'}`);
      await load();
    } catch (e) {
      flash(e instanceof Error ? e.message : 'Action failed');
    } finally {
      setBusyId(null);
    }
  }

  return (
    <PageShell
      active="/identity-schemes"
      title="Identity Schemes"
      subtitle="Every entity is UUID-internal; GTIN / UUID / custom are validated attributes on top (invariant 1) · live via RLS"
      actions={
        <button
          onClick={() => setCreating(true)}
          className="brand-grad inline-flex h-10 items-center gap-2 rounded-xl px-4 text-[13.5px] font-semibold text-white"
        >
          <PlusIcon width={16} height={16} /> New scheme
        </button>
      }
    >
      {notice && (
        <div className="fixed left-1/2 top-[74px] z-50 -translate-x-1/2 rounded-xl bg-[var(--success-soft)] px-4 py-2 text-[12.5px] font-semibold text-[var(--success-fg)] shadow">
          {notice}
        </div>
      )}

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        {schemes === null && <div className="text-[13.5px] text-muted">Loading schemes…</div>}
        {standard.map((s) => (
          <div key={s.id} className="flex flex-col rounded-3xl border border-border bg-surface p-5">
            <div className="flex items-center gap-3">
              <span className="grid h-11 w-11 place-items-center rounded-2xl" style={tone[s.tone] ?? tone.info}>
                <KeyIcon width={20} height={20} />
              </span>
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-display text-[16px] font-bold">{s.name}</span>
                  {s.isPrimary && (
                    <span className="rounded-full bg-primary-soft px-2 py-0.5 text-[10.5px] font-bold text-[var(--primary-soft-fg)]">
                      Primary
                    </span>
                  )}
                </div>
                <div className="text-[12px] text-muted">{s.short}</div>
              </div>
              <span className="ml-auto inline-flex items-center gap-1.5 text-[12px] font-semibold">
                <span className="h-1.5 w-1.5 rounded-full" style={{ background: s.enabled ? 'var(--teal)' : 'var(--subtle)' }} />
                {s.enabled ? 'Enabled' : 'Off'}
              </span>
            </div>
            <p className="mt-3 text-[12.5px] leading-relaxed text-muted">{s.summary}</p>
            <div className="mt-4">
              <div className="mb-2 text-[11px] font-bold uppercase tracking-wide text-subtle">Validation</div>
              {s.rules.map((r) => (
                <div key={r} className="mb-1.5 flex items-start gap-2 text-[12.5px]">
                  <CheckIcon width={14} height={14} style={{ color: 'var(--success-fg)' }} />
                  <span>{r}</span>
                </div>
              ))}
            </div>
            {s.allocation.length > 0 && (
              <div className="mt-4 grid grid-cols-2 gap-px overflow-hidden rounded-xl bg-border">
                {s.allocation.map((a) => (
                  <div key={a.label} className="bg-surface p-2.5">
                    <div className="text-[11px] text-muted">{a.label}</div>
                    <div className={`text-[12.5px] font-semibold ${a.mono ? 'font-mono' : ''}`}>{a.value}</div>
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}

        {/* derived custom summary card */}
        {schemes !== null && (
          <div className="flex flex-col rounded-3xl border border-border bg-surface p-5">
            <div className="flex items-center gap-3">
              <span className="grid h-11 w-11 place-items-center rounded-2xl" style={tone.violet}>
                <KeyIcon width={20} height={20} />
              </span>
              <div>
                <div className="font-display text-[16px] font-bold">Custom</div>
                <div className="text-[12px] text-muted">Tenant-defined identifiers</div>
              </div>
            </div>
            <p className="mt-3 text-[12.5px] leading-relaxed text-muted">
              Coded identities for internal SKUs, asset tags and legacy codes. Validated by regex.
            </p>
            <div className="mt-4 grid grid-cols-2 gap-px overflow-hidden rounded-xl bg-border">
              <div className="bg-surface p-2.5">
                <div className="text-[11px] text-muted">Active schemes</div>
                <div className="text-[12.5px] font-semibold">{activeCustom}</div>
              </div>
              <div className="bg-surface p-2.5">
                <div className="text-[11px] text-muted">Codes issued</div>
                <div className="text-[12.5px] font-semibold">{issued.toLocaleString()}</div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* custom schemes table */}
      <div className="mt-5 overflow-hidden rounded-3xl border border-border bg-surface">
        <div className="flex items-center gap-2.5 border-b border-border px-5 py-4">
          <h3 className="text-[15px] font-bold">Custom schemes</h3>
          <button
            onClick={() => setCreating(true)}
            className="ml-auto inline-flex h-9 items-center gap-2 rounded-xl border border-border-strong bg-surface px-3 text-[12.5px] font-semibold hover:bg-surface-hover"
          >
            <PlusIcon width={15} height={15} /> New scheme
          </button>
        </div>
        <table className="w-full text-[13px]">
          <thead>
            <tr className="border-b border-border text-left text-[11.5px] uppercase tracking-wide text-muted">
              <th className="px-4 py-2.5 font-semibold">Scheme</th>
              <th className="px-4 py-2.5 font-semibold">Pattern</th>
              <th className="px-4 py-2.5 font-semibold">Example</th>
              <th className="px-4 py-2.5 font-semibold">Scope</th>
              <th className="px-4 py-2.5 font-semibold">Issued</th>
              <th className="px-4 py-2.5 font-semibold">Status</th>
              <th className="px-4 py-2.5" />
            </tr>
          </thead>
          <tbody>
            {custom.map((c) => (
              <tr key={c.id} className="border-b border-border last:border-0">
                <td className="px-4 py-3 font-semibold">{c.name}</td>
                <td className="px-4 py-3 font-mono text-[12px] text-muted">{c.pattern}</td>
                <td className="px-4 py-3 font-mono text-[12px] text-muted">{c.example}</td>
                <td className="px-4 py-3 text-muted">{c.scope}</td>
                <td className="px-4 py-3 text-muted">{c.issued.toLocaleString()}</td>
                <td className="px-4 py-3">
                  <span className="inline-flex items-center gap-1.5 text-[12.5px] font-semibold">
                    <span className="h-1.5 w-1.5 rounded-full" style={{ background: c.enabled ? 'var(--teal)' : 'var(--subtle)' }} />
                    {c.enabled ? 'Active' : 'Disabled'}
                  </span>
                </td>
                <td className="px-4 py-3 text-right">
                  <button
                    onClick={() => toggle(c)}
                    disabled={busyId === c.id}
                    className="rounded-lg border border-border-strong px-2.5 py-1 text-[11.5px] font-semibold hover:bg-surface-2 disabled:opacity-50"
                  >
                    {busyId === c.id ? '…' : c.enabled ? 'Disable' : 'Enable'}
                  </button>
                </td>
              </tr>
            ))}
            {custom.length === 0 && schemes !== null && (
              <tr>
                <td colSpan={7} className="px-4 py-8 text-center text-muted">
                  No custom schemes yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {creating && (
        <NewSchemeModal
          onClose={() => setCreating(false)}
          onCreated={(name) => {
            setCreating(false);
            flash(`Scheme “${name}” created`);
            void load();
          }}
          onError={flash}
        />
      )}
    </PageShell>
  );
}

function NewSchemeModal({
  onClose,
  onCreated,
  onError,
}: {
  onClose: () => void;
  onCreated: (name: string) => void;
  onError: (msg: string) => void;
}) {
  const [name, setName] = useState('');
  const [pattern, setPattern] = useState('');
  const [example, setExample] = useState('');
  const [scope, setScope] = useState('Product');
  const [busy, setBusy] = useState(false);
  const valid = name.trim() && pattern.trim();

  async function submit() {
    if (!valid || busy) return;
    setBusy(true);
    try {
      await createIdentityScheme({ name: name.trim(), pattern: pattern.trim(), example: example.trim() || undefined, scope });
      onCreated(name.trim());
    } catch (e) {
      onError(e instanceof Error ? e.message : 'Could not create scheme');
      setBusy(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50">
      <div className="absolute inset-0 bg-[#1b1922]/30" onClick={onClose} />
      <aside className="absolute right-0 top-0 flex h-full w-full max-w-[420px] flex-col overflow-auto border-l border-border bg-surface shadow-lg">
        <div className="flex items-center gap-3 border-b border-border p-5">
          <span className="grid h-11 w-11 place-items-center rounded-2xl" style={tone.violet}>
            <KeyIcon width={20} height={20} />
          </span>
          <div>
            <div className="font-display text-[17px] font-bold">New custom scheme</div>
            <div className="text-[12px] text-muted">Regex-validated tenant identifier</div>
          </div>
          <button onClick={onClose} className="ml-auto grid h-9 w-9 place-items-center rounded-xl border border-border text-muted hover:bg-surface-2">
            <XIcon width={16} height={16} />
          </button>
        </div>
        <div className="flex flex-col gap-3.5 p-5">
          <F label="Name" value={name} onChange={setName} placeholder="e.g. Internal SKU" />
          <F label="Regex pattern" value={pattern} onChange={setPattern} placeholder="^SKU-[A-Z]{2}-\d{6}$" mono />
          <F label="Example (optional)" value={example} onChange={setExample} placeholder="SKU-FD-004821" mono />
          <label className="block">
            <span className="mb-1 block text-[12px] font-semibold text-muted">Scope</span>
            <select value={scope} onChange={(e) => setScope(e.target.value)} className="h-10 w-full rounded-xl border border-border-strong bg-surface px-3 text-[13.5px] outline-none focus:border-primary">
              {['Product', 'Batch', 'Manufacturing unit', 'Unit'].map((o) => (
                <option key={o} value={o}>{o}</option>
              ))}
            </select>
          </label>
        </div>
        <div className="mt-auto flex gap-2.5 border-t border-border p-5">
          <button onClick={onClose} className="inline-flex h-10 flex-1 items-center justify-center rounded-xl border border-border-strong bg-surface text-[13.5px] font-semibold hover:bg-surface-hover">Cancel</button>
          <button onClick={submit} disabled={!valid || busy} className="brand-grad inline-flex h-10 flex-1 items-center justify-center gap-2 rounded-xl text-[13.5px] font-semibold text-white disabled:opacity-50">
            <CheckIcon width={16} height={16} /> {busy ? 'Creating…' : 'Create'}
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
