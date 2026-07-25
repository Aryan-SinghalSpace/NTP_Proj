'use client';

import { useEffect, useMemo, useState } from 'react';
import { PageShell } from '../../components/PageShell';
import { ShieldIcon, UsersIcon, PlusIcon, CheckIcon, XIcon, LockIcon } from '../../components/icons';
import { getRoles, createRole, updateRole, type ApiRole, type Crud } from '../../lib/api';

const RESOURCES = ['Master Data', 'Field Library', 'Workflows', 'Events', 'Labels', 'Users & Roles'] as const;
const cols: { key: keyof Crud; label: string }[] = [
  { key: 'create', label: 'Create' },
  { key: 'read', label: 'Read' },
  { key: 'update', label: 'Update' },
  { key: 'delete', label: 'Delete' },
];
const EMPTY: Crud = { create: false, read: false, update: false, delete: false };
const READ_ONLY: Crud = { create: false, read: true, update: false, delete: false };

function permsOf(role: ApiRole | undefined): Record<string, Crud> {
  const out: Record<string, Crud> = {};
  for (const r of RESOURCES) out[r] = { ...EMPTY, ...(role?.permissions?.[r] ?? {}) };
  return out;
}

export default function RolesPage() {
  const [roles, setRoles] = useState<ApiRole[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [draft, setDraft] = useState<Record<string, Crud>>({});
  const [saving, setSaving] = useState(false);
  const [creating, setCreating] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);

  const flash = (t: string) => {
    setNotice(t);
    window.setTimeout(() => setNotice(null), 2600);
  };

  async function load(selectId?: string) {
    try {
      const r = await getRoles();
      setRoles(r);
      setError(null);
      const pick = selectId ?? selectedId ?? r[0]?.id ?? null;
      setSelectedId(pick);
      setDraft(permsOf(r.find((x) => x.id === pick)));
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load');
    }
  }
  useEffect(() => {
    void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const all = roles ?? [];
  const selected = all.find((r) => r.id === selectedId);

  function select(r: ApiRole) {
    setSelectedId(r.id);
    setDraft(permsOf(r));
  }

  const dirty = useMemo(() => {
    if (!selected) return false;
    const base = permsOf(selected);
    return JSON.stringify(base) !== JSON.stringify(draft);
  }, [selected, draft]);

  function toggle(res: string, key: keyof Crud) {
    if (selected?.isSystem) return; // system role is read-only
    setDraft((d) => ({ ...d, [res]: { ...d[res]!, [key]: !d[res]![key] } }));
  }

  async function save() {
    if (!selected || saving) return;
    setSaving(true);
    try {
      await updateRole(selected.id, { permissions: draft });
      flash(`Permissions saved for “${selected.name}”`);
      await load(selected.id);
    } catch (e) {
      flash(e instanceof Error ? e.message : 'Could not save');
    } finally {
      setSaving(false);
    }
  }

  return (
    <PageShell
      active="/roles"
      title="Roles & permissions"
      subtitle="Acme Foods · live via Postgres RLS · configurable roles with a resource × CRUD matrix"
      actions={
        <Btn grad icon={<PlusIcon width={16} height={16} />} onClick={() => setCreating(true)}>
          New role
        </Btn>
      }
    >
      {notice && (
        <div className="fixed left-1/2 top-[74px] z-50 -translate-x-1/2 rounded-xl bg-[var(--success-soft)] px-4 py-2 text-[12.5px] font-semibold text-[var(--success-fg)] shadow">
          {notice}
        </div>
      )}

      {error && (
        <div className="mb-5 rounded-2xl border border-rose/40 bg-surface p-6 text-sm text-rose">
          Could not reach the API ({error}).
        </div>
      )}

      {/* role cards */}
      <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {roles === null && <div className="text-[13.5px] text-muted">Loading roles…</div>}
        {all.map((r) => {
          const on = r.id === selectedId;
          return (
            <button
              key={r.id}
              onClick={() => select(r)}
              className={`rounded-3xl border bg-surface p-5 text-left transition ${
                on ? 'border-primary ring-1 ring-primary' : 'border-border hover:bg-surface-2'
              }`}
            >
              <div className="mb-3 flex items-center gap-2.5">
                <span className="grid h-9 w-9 place-items-center rounded-xl bg-primary-soft text-primary">
                  <ShieldIcon width={18} height={18} />
                </span>
                <span className="font-semibold">{r.name}</span>
                {r.isSystem && (
                  <span className="ml-auto inline-flex items-center gap-1 rounded-full bg-surface-2 px-2 py-0.5 text-[10.5px] font-bold text-muted">
                    <LockIcon width={11} height={11} /> System
                  </span>
                )}
              </div>
              <p className="text-[12.5px] text-muted">{r.description || '—'}</p>
              <div className="mt-4 inline-flex items-center gap-1.5 text-[12px] font-semibold text-subtle">
                <UsersIcon width={14} height={14} />
                {r.members} {r.members === 1 ? 'member' : 'members'}
              </div>
            </button>
          );
        })}
      </div>

      {/* permission matrix */}
      {selected && (
        <div className="overflow-hidden rounded-3xl border border-border bg-surface">
          <div className="flex flex-wrap items-center gap-2.5 border-b border-border px-5 py-4">
            <span className="grid h-9 w-9 place-items-center rounded-xl bg-primary-soft text-primary">
              <ShieldIcon width={18} height={18} />
            </span>
            <div>
              <h3 className="text-[15px] font-bold">{selected.name}</h3>
              <p className="text-[12px] text-muted">
                {selected.isSystem
                  ? 'System role — permissions are fixed'
                  : 'Toggle grants, then save'}
              </p>
            </div>
            {!selected.isSystem && (
              <button
                onClick={save}
                disabled={!dirty || saving}
                className="brand-grad ml-auto inline-flex h-9 items-center gap-2 rounded-xl px-3.5 text-[12.5px] font-semibold text-white disabled:opacity-50"
              >
                <CheckIcon width={15} height={15} />
                {saving ? 'Saving…' : dirty ? 'Save changes' : 'Saved'}
              </button>
            )}
          </div>
          <table className="w-full text-[13px]">
            <thead>
              <tr className="border-b border-border text-left text-[11.5px] uppercase tracking-wide text-muted">
                <th className="px-5 py-2.5 font-semibold">Resource</th>
                {cols.map((c) => (
                  <th key={c.key} className="px-4 py-2.5 text-center font-semibold">
                    {c.label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {RESOURCES.map((res) => (
                <tr key={res} className="border-b border-border last:border-0">
                  <td className="px-5 py-3 font-semibold">{res}</td>
                  {cols.map((c) => (
                    <td key={c.key} className="px-4 py-3 text-center">
                      <PermCell
                        on={draft[res]?.[c.key] ?? false}
                        editable={!selected.isSystem}
                        onToggle={() => toggle(res, c.key)}
                      />
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <p className="mt-8 text-[13px] text-subtle">
        Roles &amp; permissions are <span className="font-semibold text-teal">live</span> (Postgres + RLS).
        Member counts are derived from the users table.
      </p>

      {creating && (
        <NewRoleModal
          onClose={() => setCreating(false)}
          onCreated={(id, name) => {
            setCreating(false);
            flash(`Role “${name}” created`);
            void load(id);
          }}
          onError={flash}
        />
      )}
    </PageShell>
  );
}

function PermCell({ on, editable, onToggle }: { on: boolean; editable: boolean; onToggle: () => void }) {
  const inner = on ? (
    <span className="inline-grid h-6 w-6 place-items-center rounded-lg bg-[var(--success-soft)] text-[var(--success-fg)]">
      <CheckIcon width={14} height={14} />
    </span>
  ) : (
    <span className="inline-grid h-6 w-6 place-items-center rounded-lg bg-surface-2 text-subtle">
      <XIcon width={13} height={13} />
    </span>
  );
  if (!editable) return inner;
  return (
    <button onClick={onToggle} className="transition hover:opacity-80" aria-label="toggle">
      {inner}
    </button>
  );
}

function NewRoleModal({
  onClose,
  onCreated,
  onError,
}: {
  onClose: () => void;
  onCreated: (id: string, name: string) => void;
  onError: (msg: string) => void;
}) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [busy, setBusy] = useState(false);

  async function submit() {
    if (!name.trim() || busy) return;
    setBusy(true);
    try {
      // start read-only across resources; the admin then grants more and saves.
      const permissions: Record<string, Crud> = {};
      for (const r of RESOURCES) permissions[r] = { ...READ_ONLY };
      const role = await createRole({ name: name.trim(), description: description.trim(), permissions });
      onCreated(role.id, role.name);
    } catch (e) {
      onError(e instanceof Error ? e.message : 'Could not create role');
      setBusy(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50">
      <div className="absolute inset-0 bg-[#1b1922]/30" onClick={onClose} />
      <aside className="absolute right-0 top-0 flex h-full w-full max-w-[420px] flex-col overflow-auto border-l border-border bg-surface shadow-lg">
        <div className="flex items-center gap-3 border-b border-border p-5">
          <span className="grid h-11 w-11 place-items-center rounded-2xl bg-primary-soft text-primary">
            <ShieldIcon width={20} height={20} />
          </span>
          <div>
            <div className="font-display text-[17px] font-bold">New role</div>
            <div className="text-[12px] text-muted">Starts read-only — grant more on the matrix</div>
          </div>
          <button onClick={onClose} className="ml-auto grid h-9 w-9 place-items-center rounded-xl border border-border text-muted hover:bg-surface-2">
            <XIcon width={16} height={16} />
          </button>
        </div>
        <div className="flex flex-col gap-3.5 p-5">
          <label className="block">
            <span className="mb-1 block text-[12px] font-semibold text-muted">Role name</span>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Warehouse Lead"
              className="h-10 w-full rounded-xl border border-border-strong bg-surface px-3 text-[13.5px] outline-none focus:border-primary placeholder:text-subtle"
            />
          </label>
          <label className="block">
            <span className="mb-1 block text-[12px] font-semibold text-muted">Description</span>
            <input
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="What can this role do?"
              className="h-10 w-full rounded-xl border border-border-strong bg-surface px-3 text-[13.5px] outline-none focus:border-primary placeholder:text-subtle"
            />
          </label>
        </div>
        <div className="mt-auto flex gap-2.5 border-t border-border p-5">
          <button onClick={onClose} className="inline-flex h-10 flex-1 items-center justify-center rounded-xl border border-border-strong bg-surface text-[13.5px] font-semibold hover:bg-surface-hover">
            Cancel
          </button>
          <button
            onClick={submit}
            disabled={!name.trim() || busy}
            className="brand-grad inline-flex h-10 flex-1 items-center justify-center gap-2 rounded-xl text-[13.5px] font-semibold text-white disabled:opacity-50"
          >
            <CheckIcon width={16} height={16} />
            {busy ? 'Creating…' : 'Create role'}
          </button>
        </div>
      </aside>
    </div>
  );
}

function Btn({ children, icon, grad, onClick }: { children: React.ReactNode; icon?: React.ReactNode; grad?: boolean; onClick?: () => void }) {
  return (
    <button
      onClick={onClick}
      className={`inline-flex h-10 items-center gap-2 rounded-xl px-4 text-[13.5px] font-semibold ${
        grad ? 'brand-grad border-transparent text-white' : 'border border-border-strong bg-surface text-text hover:bg-surface-hover'
      }`}
    >
      {icon}
      {children}
    </button>
  );
}
