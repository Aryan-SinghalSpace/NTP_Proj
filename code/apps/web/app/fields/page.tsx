'use client';

import { useCallback, useEffect, useState } from 'react';
import { TopNav } from '../../components/TopNav';
import { PlusIcon, LockIcon, XIcon, CheckIcon, SearchIcon } from '../../components/icons';
import {
  getFields,
  createField,
  deactivateField,
  reactivateField,
  type FieldDefinitionRow,
  type CreateFieldPayload,
} from '../../lib/api';
import { isQueuedOffline } from '../../lib/api-error';

const ENTITIES = ['product', 'batch', 'unit', 'event', 'label', 'location'] as const;
type Entity = (typeof ENTITIES)[number];

const DATA_TYPES = [
  'text',
  'number',
  'decimal',
  'boolean',
  'date',
  'datetime',
  'single_select',
  'multi_select',
  'file',
  'gtin',
  'batch_ref',
  'unit_ref',
  'geo',
  'signature',
  'rich_text',
];

const tierClass: Record<string, string> = {
  core: 'bg-surface-2 text-muted',
  super: 'bg-primary-soft text-primary',
  tenant_custom: 'bg-[var(--teal-soft)] text-teal',
};
const tierLabel: Record<string, string> = { core: 'Core', super: 'Super', tenant_custom: 'Tenant' };

export default function FieldLibraryPage() {
  const [entity, setEntity] = useState<Entity>('batch');
  const [includeInactive, setIncludeInactive] = useState(false);
  const [rows, setRows] = useState<FieldDefinitionRow[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [query, setQuery] = useState('');
  const [creating, setCreating] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);

  const flash = (t: string) => {
    setNotice(t);
    window.setTimeout(() => setNotice(null), 2600);
  };

  const load = useCallback(async () => {
    setRows(null);
    try {
      setRows(await getFields(entity, includeInactive));
      setError(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load');
    }
  }, [entity, includeInactive]);

  useEffect(() => {
    void load();
  }, [load]);

  async function toggleStatus(f: FieldDefinitionRow) {
    setBusyId(f.id);
    try {
      if (f.status === 'active') {
        await deactivateField(f.id);
        flash(`“${f.displayName}” deactivated · historical data preserved`);
      } else {
        await reactivateField(f.id);
        flash(`“${f.displayName}” reactivated`);
      }
      await load();
    } catch (e) {
      flash(e instanceof Error ? e.message : 'Action failed');
    } finally {
      setBusyId(null);
    }
  }

  const filtered = (rows ?? []).filter((f) => {
    const q = query.trim().toLowerCase();
    return !q || f.displayName.toLowerCase().includes(q) || f.key.toLowerCase().includes(q);
  });
  const customCount = (rows ?? []).filter((f) => f.tier === 'tenant_custom').length;

  return (
    <>
      <TopNav active="/fields" />

      {notice && (
        <div className="fixed left-1/2 top-[74px] z-50 -translate-x-1/2 rounded-xl bg-[var(--success-soft)] px-4 py-2 text-[12.5px] font-semibold text-[var(--success-fg)] shadow">
          {notice}
        </div>
      )}

      <main className="mx-auto max-w-[1180px] px-6 py-7">
        <div className="mb-6 flex flex-wrap items-end gap-3">
          <div>
            <h1 className="font-display text-[27px] font-bold tracking-tight">Field Library</h1>
            <p className="mt-1 text-[13.5px] text-muted">
              Acme Foods · <span className="font-semibold text-teal">live via Postgres RLS</span> · Core /
              Super / Tenant Custom · deactivate-not-delete
            </p>
          </div>
          <div className="ml-auto flex gap-2.5">
            <button
              onClick={() => setCreating(true)}
              className="brand-grad inline-flex h-10 items-center gap-2 rounded-xl px-4 text-[13.5px] font-semibold text-white"
            >
              <PlusIcon width={16} height={16} /> New field
            </button>
          </div>
        </div>

        {/* entity tabs */}
        <div className="mb-4 flex flex-wrap gap-1 border-b border-border">
          {ENTITIES.map((e) => (
            <button
              key={e}
              onClick={() => setEntity(e)}
              className={`border-b-2 px-3.5 py-2.5 text-[13.5px] font-semibold capitalize ${
                entity === e ? 'border-primary text-primary' : 'border-transparent text-muted hover:text-text'
              }`}
            >
              {e}
            </button>
          ))}
        </div>

        {/* controls */}
        <div className="mb-3 flex flex-wrap items-center gap-2.5">
          <div className="flex h-10 w-[280px] max-w-[60vw] items-center gap-2 rounded-xl border border-border-strong bg-surface px-3 text-[13.5px]">
            <SearchIcon width={15} height={15} className="text-subtle" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search field or key…"
              className="w-full bg-transparent outline-none placeholder:text-subtle"
            />
          </div>
          <label className="flex cursor-pointer items-center gap-2 rounded-xl border border-border bg-surface px-3 py-2 text-[12.5px] font-semibold">
            <input
              type="checkbox"
              checked={includeInactive}
              onChange={(e) => setIncludeInactive(e.target.checked)}
              className="accent-[var(--primary)]"
            />
            View historic records
          </label>
          <span className="ml-auto text-[12.5px] text-muted">
            {filtered.length} field{filtered.length === 1 ? '' : 's'} · {customCount} tenant custom
          </span>
        </div>

        {error ? (
          <div className="rounded-2xl border border-rose/40 bg-surface p-6 text-sm text-rose">
            Could not reach the API ({error}). Start it from <code>code/</code>:{' '}
            <code>pnpm --filter @tracewell/api dev</code>.
          </div>
        ) : (
          <div className="overflow-hidden rounded-3xl border border-border bg-surface">
            <table className="w-full text-[13px]">
              <thead>
                <tr className="border-b border-border text-left text-[11.5px] uppercase tracking-wide text-muted">
                  <th className="px-4 py-3 font-semibold">Field</th>
                  <th className="px-4 py-3 font-semibold">Tier</th>
                  <th className="px-4 py-3 font-semibold">Type</th>
                  <th className="px-4 py-3 font-semibold">Status</th>
                  <th className="px-4 py-3 font-semibold">Ver.</th>
                  <th className="px-4 py-3" />
                </tr>
              </thead>
              <tbody>
                {rows === null && (
                  <tr>
                    <td colSpan={6} className="px-4 py-10 text-center text-muted">
                      Loading…
                    </td>
                  </tr>
                )}
                {rows !== null &&
                  filtered.map((f) => (
                    <tr key={`${f.id}:${f.version}`} className="border-b border-border last:border-0">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1.5 font-semibold">
                          {f.displayName}
                          {f.isLocked && <LockIcon width={12} height={12} className="text-subtle" />}
                        </div>
                        <div className="font-mono text-xs text-muted">{f.key}</div>
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={`rounded-full px-2.5 py-1 text-[11.5px] font-bold ${
                            tierClass[f.tier] ?? 'bg-surface-2 text-muted'
                          }`}
                        >
                          {tierLabel[f.tier] ?? f.tier}
                        </span>
                      </td>
                      <td className="px-4 py-3 font-mono text-[12px] text-muted">{f.dataType}</td>
                      <td className="px-4 py-3">
                        <span className="inline-flex items-center gap-2 text-[12.5px] font-semibold">
                          <span
                            className="h-1.5 w-1.5 rounded-full"
                            style={{ background: f.status === 'active' ? 'var(--teal)' : 'var(--subtle)' }}
                          />
                          {f.status === 'active' ? 'Active' : 'Deactivated'}
                        </span>
                      </td>
                      <td className="px-4 py-3 font-mono text-xs text-muted">v{f.version}</td>
                      <td className="px-4 py-3 text-right">
                        {f.tier === 'tenant_custom' ? (
                          <button
                            onClick={() => toggleStatus(f)}
                            disabled={busyId === f.id}
                            className="rounded-lg border border-border-strong px-2.5 py-1 text-[11.5px] font-semibold hover:bg-surface-2 disabled:opacity-50"
                          >
                            {busyId === f.id ? '…' : f.status === 'active' ? 'Deactivate' : 'Reactivate'}
                          </button>
                        ) : (
                          <span className="text-[11px] text-subtle">Platform-managed</span>
                        )}
                      </td>
                    </tr>
                  ))}
                {rows !== null && filtered.length === 0 && (
                  <tr>
                    <td colSpan={6} className="px-4 py-10 text-center text-muted">
                      No fields{query ? ' match your search' : ' for this entity yet'}.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}

        <p className="mt-6 text-[13px] text-subtle">
          Core &amp; Super fields are platform-managed. Tenant Custom fields you add here are versioned and
          <span className="font-semibold"> deactivated, never deleted</span> — turn on “View historic records”
          to see deactivated fields (invariant&nbsp;#4).
        </p>
      </main>

      {creating && (
        <NewFieldModal
          entity={entity}
          onClose={() => setCreating(false)}
          onCreated={(name) => {
            setCreating(false);
            flash(`Field “${name}” added`);
            void load();
          }}
          onError={flash}
        />
      )}
    </>
  );
}

function NewFieldModal({
  entity,
  onClose,
  onCreated,
  onError,
}: {
  entity: string;
  onClose: () => void;
  onCreated: (name: string) => void;
  onError: (msg: string) => void;
}) {
  const [displayName, setDisplayName] = useState('');
  const [key, setKey] = useState('');
  const [dataType, setDataType] = useState('text');
  const [required, setRequired] = useState(false);
  const [busy, setBusy] = useState(false);

  // auto-suggest a snake_case key from the display name until the user edits it.
  const [keyTouched, setKeyTouched] = useState(false);
  function onName(v: string) {
    setDisplayName(v);
    if (!keyTouched) setKey(v.toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_+|_+$/g, ''));
  }

  const valid = displayName.trim() && /^[a-z][a-z0-9_]*$/.test(key);

  async function submit() {
    if (!valid || busy) return;
    setBusy(true);
    try {
      const payload: CreateFieldPayload = { entity, key, displayName: displayName.trim(), dataType, required };
      await createField(payload);
      onCreated(displayName.trim());
    } catch (e) {
      if (isQueuedOffline(e)) {
        onError(e.message);
        onClose();
        return;
      }
      onError(e instanceof Error ? e.message : 'Could not create field');
      setBusy(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50">
      <div className="absolute inset-0 bg-[#1b1922]/30" onClick={onClose} />
      <aside className="absolute right-0 top-0 flex h-full w-full max-w-[440px] flex-col overflow-auto border-l border-border bg-surface shadow-lg">
        <div className="flex items-center gap-3 border-b border-border p-5">
          <span className="grid h-11 w-11 place-items-center rounded-2xl bg-[var(--teal-soft)] text-teal">
            <PlusIcon width={20} height={20} />
          </span>
          <div>
            <div className="font-display text-[17px] font-bold">New tenant field</div>
            <div className="text-[12px] text-muted capitalize">on the “{entity}” entity</div>
          </div>
          <button
            onClick={onClose}
            className="ml-auto grid h-9 w-9 place-items-center rounded-xl border border-border text-muted hover:bg-surface-2"
          >
            <XIcon width={16} height={16} />
          </button>
        </div>

        <div className="flex flex-col gap-3.5 p-5">
          <label className="block">
            <span className="mb-1 block text-[12px] font-semibold text-muted">Display name</span>
            <input
              value={displayName}
              onChange={(e) => onName(e.target.value)}
              placeholder="e.g. Distributor Code"
              className="h-10 w-full rounded-xl border border-border-strong bg-surface px-3 text-[13.5px] outline-none focus:border-primary placeholder:text-subtle"
            />
          </label>
          <label className="block">
            <span className="mb-1 block text-[12px] font-semibold text-muted">Key (snake_case)</span>
            <input
              value={key}
              onChange={(e) => {
                setKeyTouched(true);
                setKey(e.target.value);
              }}
              placeholder="distributor_code"
              className="h-10 w-full rounded-xl border border-border-strong bg-surface px-3 font-mono text-[13px] outline-none focus:border-primary placeholder:text-subtle"
            />
            {key && !/^[a-z][a-z0-9_]*$/.test(key) && (
              <span className="mt-1 block text-[11px] text-rose">Use a-z, 0-9 and _ ; start with a letter.</span>
            )}
          </label>
          <label className="block">
            <span className="mb-1 block text-[12px] font-semibold text-muted">Data type</span>
            <select
              value={dataType}
              onChange={(e) => setDataType(e.target.value)}
              className="h-10 w-full rounded-xl border border-border-strong bg-surface px-3 text-[13.5px] outline-none focus:border-primary"
            >
              {DATA_TYPES.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>
          </label>
          <label className="flex cursor-pointer items-center gap-2 text-[13px] font-semibold">
            <input
              type="checkbox"
              checked={required}
              onChange={(e) => setRequired(e.target.checked)}
              className="accent-[var(--primary)]"
            />
            Required field
          </label>
          <p className="text-[11.5px] text-subtle">
            Added as a <span className="font-semibold">Tenant Custom</span> field via{' '}
            <span className="font-mono">POST /api/fields</span>. Strict typing is enforced on both sides.
          </p>
        </div>

        <div className="mt-auto flex gap-2.5 border-t border-border p-5">
          <button
            onClick={onClose}
            className="inline-flex h-10 flex-1 items-center justify-center rounded-xl border border-border-strong bg-surface text-[13.5px] font-semibold hover:bg-surface-hover"
          >
            Cancel
          </button>
          <button
            onClick={submit}
            disabled={!valid || busy}
            className="brand-grad inline-flex h-10 flex-1 items-center justify-center gap-2 rounded-xl text-[13.5px] font-semibold text-white disabled:opacity-50"
          >
            <CheckIcon width={16} height={16} />
            {busy ? 'Adding…' : 'Add field'}
          </button>
        </div>
      </aside>
    </div>
  );
}
