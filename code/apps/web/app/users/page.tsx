'use client';

import { useState } from 'react';
import { PageShell } from '../../components/PageShell';
import {
  SearchIcon,
  PlusIcon,
  DownloadIcon,
  ChevronRightIcon,
} from '../../components/icons';
import { users, type User, type UserStatus } from '../../data_mock/users';

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

export default function UsersPage() {
  const [query, setQuery] = useState('');
  const [notice, setNotice] = useState<string | null>(null);

  const flash = (t: string) => {
    setNotice(t);
    window.setTimeout(() => setNotice(null), 2600);
  };

  const q = query.trim().toLowerCase();
  const filtered = users.filter(
    (u) =>
      !q ||
      u.name.toLowerCase().includes(q) ||
      u.email.toLowerCase().includes(q) ||
      u.role.toLowerCase().includes(q),
  );

  return (
    <PageShell
      active="/users"
      title="Users"
      subtitle="Acme Foods · people with access to this tenant · roles & status managed here"
      actions={
        <>
          <Btn icon={<DownloadIcon width={16} height={16} />} onClick={() => flash('Export queued — 8 users (CSV)')}>
            Export
          </Btn>
          <Btn grad icon={<PlusIcon width={16} height={16} />} onClick={() => flash('Invitation sent — pending acceptance')}>
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

      {/* toolbar */}
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
          {filtered.length} of {users.length} users
        </span>
      </div>

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
            {filtered.map((u) => (
              <UserRow key={u.id} user={u} onOpen={() => flash(`Opened ${u.name}`)} />
            ))}
            {filtered.length === 0 && (
              <tr>
                <td colSpan={5} className="px-4 py-10 text-center text-muted">
                  No users match your search.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <p className="mt-8 text-[13px] text-subtle">
        Scaffold v0 · Command × Bento · mock data (frontend-first). Live data arrives when this
        page is connected to the API.
      </p>
    </PageShell>
  );
}

function UserRow({ user, onOpen }: { user: User; onOpen: () => void }) {
  const chip = statusChip[user.status];
  return (
    <tr
      onClick={onOpen}
      className="cursor-pointer border-b border-border last:border-0 hover:bg-surface-2"
    >
      <td className="px-4 py-3">
        <div className="flex items-center gap-3">
          <span className="grid h-9 w-9 place-items-center rounded-xl text-[12.5px] font-bold text-white avatar-grad">
            {user.initials}
          </span>
          <div>
            <div className="font-semibold">{user.name}</div>
            <div className="font-mono text-[12px] text-muted">{user.email}</div>
          </div>
        </div>
      </td>
      <td className="px-4 py-3 text-muted">{user.role}</td>
      <td className="px-4 py-3">
        <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-bold ${chip.cls}`}>
          <span className="h-1.5 w-1.5 rounded-full" style={{ background: dotColor[user.status] }} />
          {chip.label}
        </span>
      </td>
      <td className="px-4 py-3 text-muted">{user.lastActive}</td>
      <td className="px-4 py-3 text-right">
        <ChevronRightIcon width={16} height={16} className="text-subtle" />
      </td>
    </tr>
  );
}

function Btn({
  children,
  icon,
  grad,
  onClick,
}: {
  children: React.ReactNode;
  icon?: React.ReactNode;
  grad?: boolean;
  onClick?: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={`inline-flex h-10 items-center gap-2 rounded-xl px-4 text-[13.5px] font-semibold ${
        grad
          ? 'brand-grad border-transparent text-white'
          : 'border border-border-strong bg-surface text-text hover:bg-surface-hover'
      }`}
    >
      {icon}
      {children}
    </button>
  );
}
