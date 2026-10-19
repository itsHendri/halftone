'use client';
import { Logo } from '@/components/kit/logo';
import { FileTextIcon, LayoutDashboardIcon, SettingsIcon } from 'lucide-react';
import type * as React from 'react';
import { AppShell } from '@/components/kit/app-shell';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { KitChip } from '@/components/site/kit-chip';
import Link from 'next/link';

const NAV = [
  { href: '/dashboard', label: 'Overview', icon: LayoutDashboardIcon },
  { href: '/dashboard/invoices', label: 'Invoices', icon: FileTextIcon },
  { href: '/dashboard/settings', label: 'Settings', icon: SettingsIcon },
];

/** The dashboard sample's frame. A client component because the nav carries icon components. */
export function DashboardShell({ children }: { children: React.ReactNode }) {
  return (
    <AppShell
      brand={<Logo name="Northwind" />}
      nav={NAV}
      footer={
        <div className="flex flex-col gap-1 px-2 text-sm">
          <Badge variant="secondary">Studio plan</Badge>
          <span className="text-muted-foreground">3 of 5 seats used</span>
        </div>
      }
      topbar={
        <>
          <KitChip />
          <DropdownMenu>
            <DropdownMenuTrigger className="focus-visible:ring-ring rounded-full focus-visible:ring-2 focus-visible:outline-none" aria-label="Account">
              <Avatar className="size-8">
                <AvatarFallback>AM</AvatarFallback>
              </Avatar>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              <DropdownMenuLabel>Alex Morgan</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem asChild>
                <Link href="/dashboard/settings">Settings</Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link href="/landing">Sign out</Link>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </>
      }>
      {children}
    </AppShell>
  );
}
