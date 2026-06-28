import Link from 'next/link';
import type { ComponentType, SVGProps } from 'react';
import {
  GridIcon,
  BoxIcon,
  LayersIcon,
  FlowIcon,
  ActivityIcon,
  TagIcon,
  SearchIcon,
  BellIcon,
  AppsIcon,
} from './icons';

type IconType = ComponentType<SVGProps<SVGSVGElement>>;

const tabs: { href: string; label: string; Icon: IconType }[] = [
  { href: '/dashboard', label: 'Overview', Icon: GridIcon },
  { href: '/master-data', label: 'Master Data', Icon: BoxIcon },
  { href: '/fields', label: 'Field Library', Icon: LayersIcon },
  { href: '/workflows', label: 'Workflows', Icon: FlowIcon },
  { href: '/events', label: 'Events', Icon: ActivityIcon },
  { href: '/labels', label: 'Labels', Icon: TagIcon },
];

export function TopNav({ active }: { active: string }) {
  return (
    <header className="sticky top-0 z-20 flex h-[62px] items-center gap-1.5 border-b border-border bg-surface px-5">
      <Link href="/launcher" className="flex items-center gap-2.5 pr-2 font-display text-base font-bold">
        <span className="grid h-8 w-8 place-items-center rounded-xl font-extrabold text-white brand-grad">
          S
        </span>
        Strings
      </Link>
      <nav className="ml-2.5 flex gap-0.5">
        {tabs.map(({ href, label, Icon }) => {
          const on = active === href;
          return (
            <Link
              key={href}
              href={href}
              className={`flex items-center gap-1.5 rounded-[10px] px-3 py-2 text-[13.5px] font-semibold ${
                on ? 'bg-primary-soft text-[var(--primary-soft-fg)]' : 'text-muted hover:bg-surface-2'
              }`}
            >
              <Icon width={16} height={16} />
              {label}
            </Link>
          );
        })}
      </nav>
      <Link
        href="/launcher"
        title="All pages"
        className="ml-auto grid h-10 w-10 place-items-center rounded-xl border border-border bg-surface text-muted hover:bg-surface-hover"
      >
        <AppsIcon width={18} height={18} />
      </Link>
      <div className="flex h-10 w-[260px] max-w-[26vw] items-center gap-2 rounded-xl border border-border-strong bg-surface-2 px-3 text-[13.5px] text-subtle">
        <SearchIcon width={15} height={15} />
        <span className="truncate">Search or run a command…</span>
        <span className="ml-auto rounded-md border border-border-strong px-1.5 py-0.5 font-mono text-[11px]">
          ⌘K
        </span>
      </div>
      <Link
        href="/notifications"
        title="Notifications"
        className="relative grid h-10 w-10 place-items-center rounded-xl border border-border bg-surface text-muted hover:bg-surface-hover"
      >
        <BellIcon />
        <span className="absolute right-2.5 top-2.5 h-1.5 w-1.5 rounded-full bg-rose ring-2 ring-surface" />
      </Link>
      <Link
        href="/account"
        title="Account"
        className="grid h-9 w-9 place-items-center rounded-xl font-bold text-white avatar-grad"
      >
        RS
      </Link>
    </header>
  );
}
