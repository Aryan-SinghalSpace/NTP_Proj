import Link from 'next/link';

const tabs = [
  { href: '/', label: 'Overview' },
  { href: '/fields', label: 'Field Library' },
];

export function TopNav({ active }: { active: string }) {
  return (
    <header className="sticky top-0 z-10 flex h-16 items-center gap-2 border-b border-border bg-surface px-6">
      <div className="flex items-center gap-2.5 pr-2 font-display text-base font-bold">
        <span
          className="grid h-8 w-8 place-items-center rounded-xl font-extrabold text-white"
          style={{ background: 'linear-gradient(135deg, var(--primary), var(--teal))' }}
        >
          T
        </span>
        Tracewell
      </div>
      <nav className="ml-3 flex gap-1">
        {tabs.map((t) => (
          <Link
            key={t.href}
            href={t.href}
            className={`rounded-[10px] px-3 py-2 text-sm font-semibold ${
              active === t.href ? 'bg-primary-soft text-primary' : 'text-muted hover:bg-surface-2'
            }`}
          >
            {t.label}
          </Link>
        ))}
      </nav>
      <div className="ml-auto flex h-10 w-72 max-w-[30vw] items-center gap-2 rounded-xl border border-border bg-surface-2 px-3 text-sm text-subtle">
        Search or run a command…
        <span className="ml-auto rounded-md border border-border px-1.5 py-0.5 font-mono text-[11px]">
          ⌘K
        </span>
      </div>
      <div
        className="grid h-9 w-9 place-items-center rounded-xl font-bold text-white"
        style={{ background: 'linear-gradient(135deg, #8b6df0, var(--rose))' }}
      >
        RS
      </div>
    </header>
  );
}
