'use client';
import { MenuIcon, type LucideIcon } from 'lucide-react';
import { cn } from 'cn';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import * as React from 'react';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';

export type NavItem = { href: string; label: string; icon: LucideIcon };

type Props = {
  /** Product name or logo, top of the sidebar. */
  brand: React.ReactNode;
  nav: NavItem[];
  /** Bottom of the sidebar: the account, a plan badge. */
  footer?: React.ReactNode;
  /** Right side of the top bar: search, notifications, an avatar menu. */
  topbar?: React.ReactNode;
  children: React.ReactNode;
};

/**
 * The frame of a web app: a sidebar of 4–8 destinations on desktop, a sheet behind a menu button on
 * small screens, and a content area. The active item follows the URL.
 */
export function AppShell({ brand, nav, footer, topbar, children }: Props) {
  const pathname = usePathname();
  const [open, setOpen] = React.useState(false);
  const links = (
    <nav aria-label="Main" className="flex flex-col gap-1">
      {nav.map(({ href, label, icon: Icon }) => {
        const active = pathname === href || (href !== '/' && pathname.startsWith(`${href}/`));
        return (
          <Link
            key={href}
            href={href}
            onClick={() => setOpen(false)}
            aria-current={active ? 'page' : undefined}
            className={cn(
              'flex h-9 items-center gap-3 rounded-md px-3 text-sm font-medium transition-colors',
              active ? 'bg-sidebar-accent text-sidebar-accent-foreground' : 'text-muted-foreground hover:bg-sidebar-accent hover:text-foreground'
            )}>
            <Icon className="size-4" aria-hidden />
            {label}
          </Link>
        );
      })}
    </nav>
  );

  return (
    <div className="flex min-h-screen">
      <aside className="bg-sidebar text-sidebar-foreground border-sidebar-border sticky top-0 hidden h-screen w-60 shrink-0 flex-col gap-6 overflow-y-auto border-r p-4 md:flex">
        <div className="px-2 font-semibold">{brand}</div>
        {links}
        {footer ? <div className="mt-auto">{footer}</div> : null}
      </aside>
      <div className="flex min-w-0 flex-1 flex-col">
        <div className="border-border flex h-14 items-center gap-3 border-b px-4 sm:px-6">
          <Sheet open={open} onOpenChange={setOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="md:hidden" aria-label="Open navigation">
                <MenuIcon />
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="bg-sidebar w-64 p-4">
              <SheetHeader className="px-2">
                <SheetTitle>{brand}</SheetTitle>
              </SheetHeader>
              {links}
            </SheetContent>
          </Sheet>
          <div className="ml-auto flex items-center gap-2">{topbar}</div>
        </div>
        <main className="flex-1 px-4 py-6 sm:px-6 lg:px-8">{children}</main>
      </div>
    </div>
  );
}
