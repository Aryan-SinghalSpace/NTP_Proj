'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { buttonVariants } from '../ui/button';
import { cn } from '../../lib/utils';

const links = [
  { label: 'Platform', href: '#platform' },
  { label: 'How it works', href: '#how' },
  { label: 'Standards', href: '#standards' },
];

export function Nav() {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <header
      className={cn(
        'fixed inset-x-0 top-0 z-50 transition-all duration-300',
        scrolled ? 'border-b border-border bg-surface/80 backdrop-blur-xl' : 'border-b border-transparent',
      )}
    >
      <nav className="mx-auto flex h-16 max-w-6xl items-center justify-between px-5 sm:px-8">
        <Link href="/" className="flex items-center gap-2.5">
          <span className="brand-grad grid h-9 w-9 place-items-center rounded-xl font-display text-lg font-extrabold text-white shadow-sm">
            S
          </span>
          <span className="font-display text-lg font-bold tracking-tight">Strings</span>
        </Link>

        <div className="hidden items-center gap-1 md:flex">
          {links.map((l) => (
            <a
              key={l.href}
              href={l.href}
              className="rounded-lg px-3.5 py-2 text-sm font-medium text-muted transition-colors hover:bg-surface-hover hover:text-text"
            >
              {l.label}
            </a>
          ))}
        </div>

        <div className="flex items-center gap-2">
          <Link href="/login" className={cn(buttonVariants({ variant: 'ghost', size: 'sm' }), 'hidden sm:inline-flex')}>
            Sign in
          </Link>
          <Link href="/register" className={buttonVariants({ variant: 'gradient', size: 'sm' })}>
            Get started
          </Link>
        </div>
      </nav>
    </header>
  );
}
