'use client';
import { Logo } from '@/components/kit/logo';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import type * as React from 'react';
import { cn } from 'cn';
import { KitChip } from '@/components/site/kit-chip';

const NAV = [
  { href: '/habits', label: 'Today' },
  { href: '/habits/insights', label: 'Insights' },
  { href: '/habits/calendar', label: 'Calendar' },
  { href: '/habits/settings', label: 'Settings' },
];

/** The habit tracker's frame: a header with its four sections over one centred column. */
export function HabitsShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const active = (href: string) => (href === '/habits' ? pathname === '/habits' || pathname.startsWith('/habits/habit') : pathname.startsWith(href));
  return (
    <div className="flex min-h-screen flex-col">
      <header className="border-border bg-background/90 sticky top-0 z-40 border-b backdrop-blur">
        <div className="mx-auto flex min-h-14 w-full max-w-4xl flex-wrap items-center gap-x-6 px-4 sm:flex-nowrap sm:px-6">
          <Link href="/habits" className="flex h-14 items-center gap-2 font-semibold">
            <Logo name="Habits" />
          </Link>
          {/* Under the brand on a phone, beside it from sm up. */}
          <nav aria-label="Habits" className="order-last -mx-2.5 flex w-full items-center gap-1 overflow-x-auto pb-2 text-sm sm:order-none sm:mx-0 sm:w-auto sm:pb-0">
            {NAV.map((l) => (
              <Link
                key={l.href}
                href={l.href}
                aria-current={active(l.href) ? 'page' : undefined}
                className={cn('shrink-0 rounded-md px-2.5 py-1.5 font-medium transition-colors', active(l.href) ? 'bg-accent text-accent-foreground' : 'text-muted-foreground hover:text-foreground')}>
                {l.label}
              </Link>
            ))}
          </nav>
          <div className="ml-auto">
            <KitChip />
          </div>
        </div>
      </header>
      <main className="mx-auto flex w-full max-w-4xl flex-1 flex-col gap-6 px-4 py-6 sm:px-6 sm:py-8">{children}</main>
    </div>
  );
}
