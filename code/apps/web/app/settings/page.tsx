'use client';

import { useEffect, useState } from 'react';
import { PageShell } from '../../components/PageShell';
import { BuildingIcon, SettingsIcon, ShieldIcon, CheckIcon, AlertIcon } from '../../components/icons';
import { getTenant, updateTenant, type ApiTenant } from '../../lib/api';

export default function SettingsPage() {
  const [tenant, setTenant] = useState<ApiTenant | null>(null);
  const [name, setName] = useState('');
  const [gs1, setGs1] = useState(false);
  const [locale, setLocale] = useState('en-IN');
  const [timezone, setTimezone] = useState('Asia/Kolkata');
  const [saving, setSaving] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);

  const flash = (t: string) => {
    setNotice(t);
    window.setTimeout(() => setNotice(null), 2600);
  };

  useEffect(() => {
    getTenant()
      .then((t) => {
        setTenant(t);
        setName(t.name);
        setGs1(!!t.settings?.gs1Mode);
        setLocale(t.settings?.locale ?? 'en-IN');
        setTimezone(t.settings?.timezone ?? 'Asia/Kolkata');
      })
      .catch(() => flash('Could not reach the API'));
  }, []);

  async function save() {
    if (saving) return;
    setSaving(true);
    try {
      const t = await updateTenant({ name, settings: { gs1Mode: gs1, locale, timezone } });
      setTenant(t);
      flash('Settings saved');
    } catch (e) {
      flash(e instanceof Error ? e.message : 'Could not save');
    } finally {
      setSaving(false);
    }
  }

  return (
    <PageShell
      active="/settings"
      title="Settings"
      subtitle="Acme Foods · live via Postgres RLS · organisation profile & compliance"
      actions={
        <button
          onClick={save}
          disabled={saving || !tenant}
          className="brand-grad inline-flex h-10 items-center gap-2 rounded-xl px-4 text-[13.5px] font-semibold text-white disabled:opacity-50"
        >
          <CheckIcon width={16} height={16} /> {saving ? 'Saving…' : 'Save changes'}
        </button>
      }
    >
      {notice && (
        <div className="fixed left-1/2 top-[74px] z-50 -translate-x-1/2 rounded-xl bg-[var(--success-soft)] px-4 py-2 text-[12.5px] font-semibold text-[var(--success-fg)] shadow">
          {notice}
        </div>
      )}

      <div className="flex flex-col gap-5">
        <Section icon={<BuildingIcon width={18} height={18} />} title="Organisation profile" desc="How this tenant identifies itself across the platform.">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <EditField label="Organisation name" value={name} onChange={setName} />
            <ReadField label="Region" value={tenant?.region === 'in' ? 'India' : tenant?.region ?? '—'} locked hint="Single-region (India) for v1 — DPDP residency." />
            <EditField label="Locale" value={locale} onChange={setLocale} />
            <EditField label="Time zone" value={timezone} onChange={setTimezone} />
          </div>
        </Section>

        <Section icon={<ShieldIcon width={18} height={18} />} title="GS1 conformance mode" desc="Opt-in. Enforces GS1 allocation rules, Digital Link & EPCIS-style export. The platform is not bound to GS1.">
          <div className="flex items-center gap-4 rounded-2xl border border-border bg-surface-2 p-4">
            <div className="min-w-0">
              <div className="text-[13.5px] font-semibold">Enforce GS1 conformance</div>
              <div className="text-[12.5px] text-muted">
                {gs1
                  ? 'Active — GTIN allocation validated against GS1 rules.'
                  : 'Inactive — GTIN supported as the primary scheme without GS1 enforcement.'}
              </div>
            </div>
            <Toggle on={gs1} onClick={() => setGs1((v) => !v)} />
          </div>
          <p className="mt-2 text-[11.5px] text-subtle">Persisted to the tenant’s settings — remember to Save.</p>
        </Section>

        <Section icon={<AlertIcon width={18} height={18} />} title="Data residency" desc="Where this tenant's data lives.">
          <div className="flex items-start gap-3 rounded-2xl bg-[var(--warning-soft)] p-4 text-[var(--warning-fg)]">
            <AlertIcon width={18} height={18} className="mt-0.5 shrink-0" />
            <p className="text-[12.5px] font-semibold">
              All data for this tenant is stored in the India region (DPDP-compliant). Multi-region support is
              planned for v2 — residency cannot be changed in v1.
            </p>
          </div>
        </Section>

        <Section icon={<SettingsIcon width={18} height={18} />} title="Tenant" desc="Read-only platform-managed attributes.">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <ReadField label="Slug" value={tenant?.slug ?? '—'} mono />
            <ReadField label="Tier" value={tenant?.tier ?? '—'} />
            <ReadField label="Status" value={tenant?.status ?? '—'} />
          </div>
        </Section>
      </div>
    </PageShell>
  );
}

function Section({ icon, title, desc, children }: { icon: React.ReactNode; title: string; desc: string; children: React.ReactNode }) {
  return (
    <div className="rounded-3xl border border-border bg-surface p-6">
      <div className="mb-4 flex items-start gap-3">
        <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-primary-soft text-primary">{icon}</span>
        <div>
          <h3 className="text-[15px] font-bold">{title}</h3>
          <p className="mt-0.5 text-[12.5px] text-muted">{desc}</p>
        </div>
      </div>
      {children}
    </div>
  );
}

function EditField({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  return (
    <div>
      <label className="mb-1.5 block text-[12px] font-semibold text-muted">{label}</label>
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="h-10 w-full rounded-xl border border-border-strong bg-surface px-3 text-[13.5px] font-semibold outline-none focus:border-primary"
      />
    </div>
  );
}

function ReadField({ label, value, locked, hint, mono }: { label: string; value: string; locked?: boolean; hint?: string; mono?: boolean }) {
  return (
    <div>
      <label className="mb-1.5 block text-[12px] font-semibold text-muted">{label}</label>
      <div className="flex h-10 items-center gap-2 rounded-xl border border-border-strong bg-surface-2 px-3 text-[13.5px]">
        <span className={`font-semibold capitalize ${mono ? 'font-mono normal-case' : ''}`}>{value}</span>
        {locked && (
          <span className="ml-auto inline-flex items-center gap-1 rounded-full bg-surface px-2 py-0.5 text-[10.5px] font-bold text-muted">Locked</span>
        )}
      </div>
      {hint && <p className="mt-1 text-[11.5px] text-subtle">{hint}</p>}
    </div>
  );
}

function Toggle({ on, onClick }: { on: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      role="switch"
      aria-checked={on}
      className={`relative ml-auto h-6 w-11 shrink-0 rounded-full transition ${on ? 'bg-primary' : 'bg-border-strong'}`}
    >
      <span className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-all ${on ? 'left-[22px]' : 'left-0.5'}`} />
    </button>
  );
}
