'use client';

import { useEffect, useState } from 'react';
import { PageShell } from '../../components/PageShell';
import { SearchIcon, PlusIcon, DownloadIcon, ChevronRightIcon, XIcon, CheckIcon } from '../../components/icons';
import { getUsers, getRoles, createUser, type ApiUser, type ApiRole } from '../../lib/api';

type UserStatus = ApiUser['status'];

const statusChip: Record<UserStatus, { label: string; cls: string }> = {
  active: { label: 'Active', cls: 'bg-[var(--success-soft)] text-[var(--success-fg)]' },
  invited: { label: 'Invited', cls: 'bg-[var(--warning-soft)] text-[var(--warning-fg)]' },
  disabled: { label: 'Disabled', cls: 'bg-surface-2 text-muted' },
};
const dotColor: Record<UserStatus, string> = {
  active: 'var(--success-fg)',
  invited: 'var(--warning-fg)',
  disabled: 'var(--subtle)',
};

function initials(name: string): string {
  const parts = name.trim().split(/\s+/);
  return ((parts[0]?.[0] ?? '') + (parts[1]?.[0] ?? '')).toUpperCase() || '?';
}
function lastActive(iso: string | null): string {
  if (!iso) return 'Never';
  const diff = Date.now() - new Date(iso).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return 'Just now';
  if (m < 60) return `${m} min ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h} hr ago`;
  const d = Math.floor(h / 24);
  return d === 1 ? 'Yesterday' : `${d} days ago`;
}

export default function UsersPage() {
  const [users, setUsers] = useState<ApiUser[] | null>(null);
  const [roles, setRoles] = useState<ApiRole[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [query, setQuery] = useState('');
  const [inviting, setInviting] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);

  const flash = (t: string) => {
    setNotice(t);
    window.setTimeout(() => setNotice(null), 2600);
  };

  async function load() {
    try {
      const [u, r] = await Promise.all([getUsers(), getRoles()]);
      setUsers(u);
      setRoles(r);
      setError(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load');
    }
  }
  useEffect(() => {
    void load();
  }, []);

  const all = users ?? [];
  const q = query.trim().toLowerCase();
  const filtered = all.filter(
    (u) =>
      !q ||
      u.name.toLowerCase().includes(q) ||
      u.email.toLowerCase().includes(q) ||
      (u.roleName ?? '').toLowerCase().includes(q),
  );

  return (
    <PageShell
      active="/users"
      title="Users"
      subtitle="Acme Foods · live via Postgres RLS · people with access to this tenant"
      actions={
        <>
          <Btn icon={<DownloadIcon width={16} height={16} />} onClick={() => flash(`Export queued — ${all.length} users (CSV)`)}>
            Export
          </Btn>
          <Btn grad icon={<PlusIcon width={16} height={16} />} onClick={() => setInviting(true)}>
            Invite user
          </Btn>
        </>
      }
    >
      {notice && (
        <div className="fixed left-1/2 top-[74px] z-50 -translate-x-1/2 rounded-xl bg-[var(--success-soft)] px-4 py-2 text-[12.5px] font-semibold text-[var(--success-fg)] shadow">
          {notice}
        </div>
      )}

      <div className="mb-3 flex flex-wrap items-center gap-2.5">
        <div className="flex h-10 w-[280px] max-w-[60vw] items-center gap-2 rounded-xl border border-border-strong bg-surface px-3 text-[13.5px]">
          <SearchIcon width={15} height={15} className="text-subtle" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search name, email or role…"
            className="w-full bg-transparent outline-none placeholder:text-subtle"
          />
        </div>
        <span className="ml-auto text-[12.5px] text-muted">
          {filtered.length} of {all.length} users
        </span>
      </div>

      {error ? (
        <div className="rounded-2xl border border-rose/40 bg-surface p-6 text-sm text-rose">
          Could not reach the API ({error}).
        </div>
      ) : (
        <div className="overflow-hidden rounded-3xl border border-border bg-surface">
          <table className="w-full text-[13px]">
            <thead>
              <tr className="border-b border-border text-left text-[11.5px] uppercase tracking-wide text-muted">
                <th className="px-4 py-2.5 font-semibold">User</th>
                <th className="px-4 py-2.5 font-semibold">Role</th>
                <th className="px-4 py-2.5 font-semibold">Status</th>
                <th className="px-4 py-2.5 font-semibold">Last active</th>
                <th className="px-4 py-2.5" />
              </tr>
            </thead>
            <tbody>
              {users === null && (
                <tr>
                  <td colSpan={5} className="px-4 py-10 text-center text-muted">
                    Loading…
                  </td>
                </tr>
              )}
              {users !== null &&
                filtered.map((u) => {
                  const chip = statusChip[u.status];
                  return (
                    <tr
                      key={u.id}
                      onClick={() => flash(`Opened ${u.name}`)}
                      className="cursor-pointer border-b border-border last:border-0 hover:bg-surface-2"
                    >
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <span className="avatar-grad grid h-9 w-9 place-items-center rounded-xl text-[12.5px] font-bold text-white">
                            {initials(u.name)}
                          </span>
                          <div>
                            <div className="font-semibold">{u.name}</div>
                            <div className="font-mono text-[12px] text-muted">{u.email}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-muted">{u.roleName ?? '—'}</td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-bold ${chip.cls}`}>
                          <span className="h-1.5 w-1.5 rounded-full" style={{ background: dotColor[u.status] }} />
                          {chip.label}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-muted">{lastActive(u.lastActiveAt)}</td>
                      <td className="px-4 py-3 text-right">
                        <ChevronRightIcon width={16} height={16} className="text-subtle" />
                      </td>
                    </tr>
                  );
                })}
              {users !== null && filtered.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-4 py-10 text-center text-muted">
                    No users match your search.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      <p className="mt-8 text-[13px] text-subtle">
        Users are <span className="font-semibold text-teal">live</span> (Postgres + RLS). Auth is still the
        <span className="font-mono"> x-tenant-id</span> stand-in until OIDC.
      </p>

      {inviting && (
        <InviteModal
          roles={roles}
          onClose={() => setInviting(false)}
          onInvited={(name) => {
            setInviting(false);
            flash(`Invitation sent to ${name}`);
            void load();
          }}
          onError={flash}
        />
      )}
    </PageShell>
  );
}

function InviteModal({
  roles,
  onClose,
  onInvited,
  onError,
}: {
  roles: ApiRole[];
  onClose: () => void;
  onInvited: (name: string) => void;
  onError: (msg: string) => void;
}) {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [roleId, setRoleId] = useState(roles[0]?.id ?? '');
  const [busy, setBusy] = useState(false);
  const valid = name.trim() && /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email);

  async function submit() {
    if (!valid || busy) return;
    setBusy(true);
    try {
      await createUser({ name: name.trim(), email: email.trim(), roleId: roleId || undefined });
      onInvited(name.trim());
    } catch (e) {
      onError(e instanceof Error ? e.message : 'Could not invite user');
      setBusy(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50">
      <div className="absolute inset-0 bg-[#1b1922]/30" onClick={onClose} />
      <aside className="absolute right-0 top-0 flex h-full w-full max-w-[420px] flex-col overflow-auto border-l border-border bg-surface shadow-lg">
        <div className="flex items-center gap-3 border-b border-border p-5">
          <span className="avatar-grad grid h-11 w-11 place-items-center rounded-2xl font-bold text-white">
            {name ? initials(name) : '+'}
          </span>
          <div>
            <div className="font-display text-[17px] font-bold">Invite user</div>
            <div className="text-[12px] text-muted">They’ll start as “invited”</div>
          </div>
          <button onClick={onClose} className="ml-auto grid h-9 w-9 place-items-center rounded-xl border border-border text-muted hover:bg-surface-2">
            <XIcon width={16} height={16} />
          </button>
        </div>
        <div className="flex flex-col gap-3.5 p-5">
          <Field label="Full name" value={name} onChange={setName} placeholder="e.g. Anita Desai" />
          <Field label="Email" value={email} onChange={setEmail} placeholder="anita.desai@acmefoods.in" />
          <label className="block">
            <span className="mb-1 block text-[12px] font-semibold text-muted">Role</span>
            <select
              value={roleId}
              onChange={(e) => setRoleId(e.target.value)}
              className="h-10 w-full rounded-xl border border-border-strong bg-surface px-3 text-[13.5px] outline-none focus:border-primary"
            >
              <option value="">No role</option>
              {roles.map((r) => (
                <option key={r.id} value={r.id}>
                  {r.name}
                </option>
              ))}
            </select>
          </label>
        </div>
        <div className="mt-auto flex gap-2.5 border-t border-border p-5">
          <button onClick={onClose} className="inline-flex h-10 flex-1 items-center justify-center rounded-xl border border-border-strong bg-surface text-[13.5px] font-semibold hover:bg-surface-hover">
            Cancel
          </button>
          <button
            onClick={submit}
            disabled={!valid || busy}
            className="brand-grad inline-flex h-10 flex-1 items-center justify-center gap-2 rounded-xl text-[13.5px] font-semibold text-white disabled:opacity-50"
          >
            <CheckIcon width={16} height={16} />
            {busy ? 'Inviting…' : 'Send invite'}
          </button>
        </div>
      </aside>
    </div>
  );
}

function Field({ label, value, onChange, placeholder }: { label: string; value: string; onChange: (v: string) => void; placeholder?: string }) {
  return (
    <label className="block">
      <span className="mb-1 block text-[12px] font-semibold text-muted">{label}</span>
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="h-10 w-full rounded-xl border border-border-strong bg-surface px-3 text-[13.5px] outline-none focus:border-primary placeholder:text-subtle"
      />
    </label>
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
