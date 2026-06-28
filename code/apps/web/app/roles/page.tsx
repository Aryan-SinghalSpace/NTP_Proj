'use client';

import { useState } from 'react';
import { PageShell } from '../../components/PageShell';
import {
  ShieldIcon,
  UsersIcon,
  PlusIcon,
  CheckIcon,
  XIcon,
  LockIcon,
} from '../../components/icons';
import {
  roles,
  resources,
  permissionMatrix,
  type Crud,
} from '../../data_mock/users';

const cols: { key: keyof Crud; label: string }[] = [
  { key: 'create', label: 'Create' },
  { key: 'read', label: 'Read' },
  { key: 'update', label: 'Update' },
  { key: 'delete', label: 'Delete' },
];

export default function RolesPage() {
  const [selectedId, setSelectedId] = useState(roles[0]!.id);
  const [notice, setNotice] = useState<string | null>(null);

  const flash = (t: string) => {
    setNotice(t);
    window.setTimeout(() => setNotice(null), 2600);
  };

  const selected = roles.find((r) => r.id === selectedId)!;
  const matrix = permissionMatrix[selectedId]!;

  return (
    <PageShell
      active="/roles"
      title="Roles & permissions"
      subtitle="Acme Foods · configurable roles · granular resource-level grants per role"
      actions={
        <Btn grad icon={<PlusIcon width={16} height={16} />} onClick={() => flash('New role draft created')}>
          New role
        </Btn>
      }
    >
      {notice && (
        <div className="fixed left-1/2 top-[74px] z-50 -translate-x-1/2 rounded-xl bg-[var(--success-soft)] px-4 py-2 text-[12.5px] font-semibold text-[var(--success-fg)] shadow">
          {notice}
        </div>
      )}

      {/* role cards */}
      <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {roles.map((r) => {
          const on = r.id === selectedId;
          return (
            <button
              key={r.id}
              onClick={() => setSelectedId(r.id)}
              className={`rounded-3xl border bg-surface p-5 text-left transition ${
                on ? 'border-primary ring-1 ring-primary' : 'border-border hover:bg-surface-2'
              }`}
            >
              <div className="mb-3 flex items-center gap-2.5">
                <span className="grid h-9 w-9 place-items-center rounded-xl bg-primary-soft text-primary">
                  <ShieldIcon width={18} height={18} />
                </span>
                <span className="font-semibold">{r.name}</span>
                {r.system && (
                  <span className="ml-auto inline-flex items-center gap-1 rounded-full bg-surface-2 px-2 py-0.5 text-[10.5px] font-bold text-muted">
                    <LockIcon width={11} height={11} /> System
                  </span>
                )}
              </div>
              <p className="text-[12.5px] text-muted">{r.description}</p>
              <div className="mt-4 inline-flex items-center gap-1.5 text-[12px] font-semibold text-subtle">
                <UsersIcon width={14} height={14} />
                {r.members} {r.members === 1 ? 'member' : 'members'}
              </div>
            </button>
          );
        })}
      </div>

      {/* permission matrix */}
      <div className="overflow-hidden rounded-3xl border border-border bg-surface">
        <div className="flex flex-wrap items-center gap-2.5 border-b border-border px-5 py-4">
          <span className="grid h-9 w-9 place-items-center rounded-xl bg-primary-soft text-primary">
            <ShieldIcon width={18} height={18} />
          </span>
          <div>
            <h3 className="text-[15px] font-bold">{selected.name}</h3>
            <p className="text-[12px] text-muted">Permission matrix · resources × create / read / update / delete</p>
          </div>
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
            {resources.map((res) => {
              const grants = matrix[res];
              return (
                <tr key={res} className="border-b border-border last:border-0">
                  <td className="px-5 py-3 font-semibold">{res}</td>
                  {cols.map((c) => (
                    <td key={c.key} className="px-4 py-3 text-center">
                      <PermCell on={grants[c.key]} />
                    </td>
                  ))}
                </tr>
              );
            })}
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

function PermCell({ on }: { on: boolean }) {
  if (on) {
    return (
      <span className="inline-grid h-6 w-6 place-items-center rounded-lg bg-[var(--success-soft)] text-[var(--success-fg)]">
        <CheckIcon width={14} height={14} />
      </span>
    );
  }
  return (
    <span className="inline-grid h-6 w-6 place-items-center rounded-lg bg-surface-2 text-subtle">
      <XIcon width={13} height={13} />
    </span>
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
