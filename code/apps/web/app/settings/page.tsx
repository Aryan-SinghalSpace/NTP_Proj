'use client';

import { useState } from 'react';
import { PageShell } from '../../components/PageShell';
import {
  BuildingIcon,
  SettingsIcon,
  ShieldIcon,
  CheckIcon,
  AlertIcon,
} from '../../components/icons';

export default function SettingsPage() {
  const [gs1, setGs1] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);

  const flash = (t: string) => {
    setNotice(t);
    window.setTimeout(() => setNotice(null), 2600);
  };

  const toggleGs1 = () => {
    setGs1((v) => {
      const next = !v;
      flash(next ? 'GS1 conformance mode enabled' : 'GS1 conformance mode disabled');
      return next;
    });
  };

  return (
    <PageShell
      active="/settings"
      title="Settings"
      subtitle="Acme Foods · tenant-level configuration · organisation profile, branding & compliance"
      actions={
        <Btn grad icon={<CheckIcon width={16} height={16} />} onClick={() => flash('Settings saved')}>
          Save changes
        </Btn>
      }
    >
      {notice && (
        <div className="fixed left-1/2 top-[74px] z-50 -translate-x-1/2 rounded-xl bg-[var(--success-soft)] px-4 py-2 text-[12.5px] font-semibold text-[var(--success-fg)] shadow">
          {notice}
        </div>
      )}

      <div className="flex flex-col gap-5">
        {/* Organisation profile */}
        <Section
          icon={<BuildingIcon width={18} height={18} />}
          title="Organisation profile"
          desc="How this tenant identifies itself across the platform."
        >
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Field label="Organisation name" value="Acme Foods Pvt. Ltd." />
            <Field label="Region" value="India" locked hint="Single-region (India) for v1 — DPDP residency." />
            <Field label="Locale" value="en-IN" />
            <Field label="Time zone" value="Asia/Kolkata (IST · UTC+5:30)" />
          </div>
        </Section>

        {/* Branding */}
        <Section
          icon={<SettingsIcon width={18} height={18} />}
          title="Branding"
          desc="Colours and logo shown on this tenant's surfaces and labels."
        >
          <div className="flex flex-wrap items-center gap-4">
            <span className="grid h-14 w-14 place-items-center rounded-2xl text-xl font-extrabold text-white brand-grad">
              A
            </span>
            <div className="flex flex-col gap-2">
              <span className="text-[12.5px] font-semibold text-muted">Brand mark & accent</span>
              <div className="flex items-center gap-2">
                <Swatch label="Primary" color="var(--primary)" />
                <Swatch label="Teal" color="var(--teal)" />
                <Swatch label="Amber" color="var(--amber)" />
              </div>
            </div>
            <Btn className="ml-auto" onClick={() => flash('Logo upload — coming soon')}>
              Replace logo
            </Btn>
          </div>
        </Section>

        {/* GS1 conformance mode — toggle row */}
        <Section
          icon={<ShieldIcon width={18} height={18} />}
          title="GS1 conformance mode"
          desc="Opt-in. Enforces GS1 allocation rules, Digital Link & EPCIS-style export. The platform is not bound to GS1."
        >
          <div className="flex items-center gap-4 rounded-2xl border border-border bg-surface-2 p-4">
            <div className="min-w-0">
              <div className="text-[13.5px] font-semibold">Enforce GS1 conformance</div>
              <div className="text-[12.5px] text-muted">
                {gs1
                  ? 'Active — GTIN allocation validated against GS1 rules.'
                  : 'Inactive — GTIN supported as the primary scheme without GS1 enforcement.'}
              </div>
            </div>
            <Toggle on={gs1} onClick={toggleGs1} />
          </div>
        </Section>

        {/* Data residency note */}
        <Section
          icon={<AlertIcon width={18} height={18} />}
          title="Data residency"
          desc="Where this tenant's data lives."
        >
          <div className="flex items-start gap-3 rounded-2xl bg-[var(--warning-soft)] p-4 text-[var(--warning-fg)]">
            <AlertIcon width={18} height={18} className="mt-0.5 shrink-0" />
            <p className="text-[12.5px] font-semibold">
              All data for this tenant is stored in the India region (DPDP-compliant). Multi-region
              support is planned for v2 — residency cannot be changed in v1.
            </p>
          </div>
        </Section>

        {/* Danger zone */}
        <Section
          icon={<AlertIcon width={18} height={18} />}
          title="Danger zone"
          desc="Irreversible tenant-level actions."
          danger
        >
          <div className="flex flex-col gap-3">
            <DangerRow
              title="Suspend tenant"
              desc="Freeze all access; data is preserved. Reversible by a Platform Admin."
              action="Suspend"
              onClick={() => flash('Suspend requires Platform Admin approval')}
            />
            <DangerRow
              title="Deactivate organisation"
              desc="Deactivate, never delete — historical records remain viewable."
              action="Deactivate"
              onClick={() => flash('Deactivation requires Platform Admin approval')}
            />
          </div>
        </Section>
      </div>

      <p className="mt-8 text-[13px] text-subtle">
        Scaffold v0 · Command × Bento · mock data (frontend-first). Live data arrives when this
        page is connected to the API.
      </p>
    </PageShell>
  );
}

function Section({
  icon,
  title,
  desc,
  danger,
  children,
}: {
  icon: React.ReactNode;
  title: string;
  desc: string;
  danger?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div className={`rounded-3xl border bg-surface p-6 ${danger ? 'border-[var(--rose)]/40' : 'border-border'}`}>
      <div className="mb-4 flex items-start gap-3">
        <span
          className={`grid h-9 w-9 shrink-0 place-items-center rounded-xl ${
            danger ? 'bg-[var(--rose-soft)] text-rose' : 'bg-primary-soft text-primary'
          }`}
        >
          {icon}
        </span>
        <div>
          <h3 className={`text-[15px] font-bold ${danger ? 'text-rose' : ''}`}>{title}</h3>
          <p className="mt-0.5 text-[12.5px] text-muted">{desc}</p>
        </div>
      </div>
      {children}
    </div>
  );
}

function Field({
  label,
  value,
  locked,
  hint,
}: {
  label: string;
  value: string;
  locked?: boolean;
  hint?: string;
}) {
  return (
    <div>
      <label className="mb-1.5 block text-[12px] font-semibold text-muted">{label}</label>
      <div className="flex h-10 items-center gap-2 rounded-xl border border-border-strong bg-surface px-3 text-[13.5px]">
        <span className="font-semibold">{value}</span>
        {locked && (
          <span className="ml-auto inline-flex items-center gap-1 rounded-full bg-surface-2 px-2 py-0.5 text-[10.5px] font-bold text-muted">
            Locked
          </span>
        )}
      </div>
      {hint && <p className="mt-1 text-[11.5px] text-subtle">{hint}</p>}
    </div>
  );
}

function Swatch({ label, color }: { label: string; color: string }) {
  return (
    <span className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-surface px-2 py-1 text-[11px] font-semibold text-muted">
      <span className="h-3 w-3 rounded-full" style={{ background: color }} />
      {label}
    </span>
  );
}

function Toggle({ on, onClick }: { on: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      role="switch"
      aria-checked={on}
      className={`relative ml-auto h-6 w-11 shrink-0 rounded-full transition ${
        on ? 'bg-primary' : 'bg-border-strong'
      }`}
    >
      <span
        className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-all ${
          on ? 'left-[22px]' : 'left-0.5'
        }`}
      />
    </button>
  );
}

function DangerRow({
  title,
  desc,
  action,
  onClick,
}: {
  title: string;
  desc: string;
  action: string;
  onClick: () => void;
}) {
  return (
    <div className="flex flex-wrap items-center gap-3 rounded-2xl border border-border p-4">
      <div className="min-w-0">
        <div className="text-[13.5px] font-semibold">{title}</div>
        <div className="text-[12.5px] text-muted">{desc}</div>
      </div>
      <button
        onClick={onClick}
        className="ml-auto inline-flex h-10 items-center rounded-xl border border-[var(--rose)]/50 bg-[var(--rose-soft)] px-4 text-[13.5px] font-semibold text-rose hover:opacity-90"
      >
        {action}
      </button>
    </div>
  );
}

function Btn({
  children,
  icon,
  grad,
  className,
  onClick,
}: {
  children: React.ReactNode;
  icon?: React.ReactNode;
  grad?: boolean;
  className?: string;
  onClick?: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={`inline-flex h-10 items-center gap-2 rounded-xl px-4 text-[13.5px] font-semibold ${
        grad
          ? 'brand-grad border-transparent text-white'
          : 'border border-border-strong bg-surface text-text hover:bg-surface-hover'
      } ${className ?? ''}`}
    >
      {icon}
      {children}
    </button>
  );
}
