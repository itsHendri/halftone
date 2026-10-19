'use client';
import { Logo } from '@/components/kit/logo';
import { ShoppingCartIcon } from 'lucide-react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import type * as React from 'react';
import { cn } from 'cn';
import { IconBadge } from '@/components/kit/icon-badge';
import { KitChip } from '@/components/site/kit-chip';
import { cartCount } from './data';
import { useShop } from './store';

const NAV = [
  { href: '/shop', label: 'Shop' },
  { href: '/shop/orders', label: 'Orders' },
  { href: '/shop/account', label: 'Account' },
];

/** The shop sample's frame: a store header (brand, sections, the cart) over a centred page. */
export function ShopShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { cart } = useShop();
  const active = (href: string) => (href === '/shop' ? pathname === '/shop' || pathname.startsWith('/shop/product') : pathname.startsWith(href));
  return (
    <div className="flex min-h-screen flex-col">
      <header className="border-border bg-background/90 sticky top-0 z-40 border-b backdrop-blur">
        <div className="mx-auto flex min-h-14 w-full max-w-6xl flex-wrap items-center gap-x-4 px-4 sm:flex-nowrap sm:gap-6 sm:px-6">
          <Link href="/shop" className="flex h-14 items-center gap-2 font-semibold">
            <Logo name="Shop" />
          </Link>
          {/* Under the brand on a phone, beside it from sm up. */}
          <nav aria-label="Shop" className="order-last -mx-2.5 flex w-full items-center gap-1 pb-2 text-sm sm:order-none sm:mx-0 sm:w-auto sm:pb-0">
            {NAV.map((l) => (
              <Link
                key={l.href}
                href={l.href}
                aria-current={active(l.href) ? 'page' : undefined}
                className={cn('rounded-md px-2.5 py-1.5 font-medium transition-colors', active(l.href) ? 'bg-accent text-accent-foreground' : 'text-muted-foreground hover:text-foreground')}>
                {l.label}
              </Link>
            ))}
          </nav>
          <div className="ml-auto flex items-center gap-1">
            <KitChip />
            <IconBadge icon={ShoppingCartIcon} count={cartCount(cart)} aria-label="Cart" onClick={() => router.push('/shop/cart')} />
          </div>
        </div>
      </header>
      <main className="mx-auto flex w-full max-w-6xl flex-1 flex-col gap-6 px-4 py-6 sm:px-6 sm:py-8">{children}</main>
    </div>
  );
}
