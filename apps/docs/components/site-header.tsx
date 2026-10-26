'use client';
import { Popover, PopoverContent, PopoverTrigger } from 'fumadocs-ui/components/ui/popover';
import { useNotebookLayout } from 'fumadocs-ui/layouts/notebook';
import { FullSearchTrigger, SearchTrigger } from 'fumadocs-ui/layouts/shared/slots/search-trigger';
import { ThemeSwitch } from 'fumadocs-ui/layouts/shared/slots/theme-switch';
import { ArrowLeftIcon, MenuIcon } from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import kitJson from '../../../kit.json';
import { SECTIONS } from '@/lib/sections';

/**
 * The one top bar every page shares (apps/docs/design/navigation-wireframes.md): the four sections, search,
 * Get started, the theme switch and GitHub, always in the same place. Both Fumadocs layouts render it in place
 * of their own header (`nav.component`), so moving between sections never moves the navigation.
 *   variant 'home'  the home layout (Home, Screens, Studio): a menu of sections on phones
 *   variant 'docs'  the notebook layout (Docs, Components): sits in its grid; the phone button opens the sidebar
 * On /studio it shrinks to a slim bar (the logo, back to the docs, search): the Studio is a tool, and its own bar sits
 * right under this one (design/studio-wireframes.md). The logo stays where it is on every other page.
 */

const isCurrent = (pathname: string, url: string) => pathname === url || pathname.startsWith(`${url}/`);

function GithubIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" className="size-5">
      <path d="M12 .3a12 12 0 0 0-3.8 23.4c.6.1.8-.3.8-.6v-2c-3.3.7-4-1.6-4-1.6-.6-1.4-1.4-1.8-1.4-1.8-1-.7.1-.7.1-.7 1.2.1 1.8 1.2 1.8 1.2 1 1.8 2.8 1.3 3.5 1 0-.8.4-1.3.7-1.6-2.7-.3-5.5-1.3-5.5-6 0-1.2.5-2.3 1.3-3.1-.2-.4-.6-1.6 0-3.2 0 0 1-.3 3.4 1.2a11.5 11.5 0 0 1 6 0c2.3-1.5 3.3-1.2 3.3-1.2.6 1.6.2 2.8 0 3.2.9.8 1.3 1.9 1.3 3.2 0 4.6-2.8 5.6-5.5 5.9.5.4.9 1.1.9 2.2v3.3c0 .3.1.7.8.6A12 12 0 0 0 12 .3" />
    </svg>
  );
}

const iconButton =
  'text-muted-foreground hover:bg-accent hover:text-foreground focus-visible:ring-ring inline-flex size-9 items-center justify-center rounded-full focus-visible:outline-none focus-visible:ring-2';

/** Phones, home layout: the sections and Get started in a menu. */
function HomeMenu({ pathname }: { pathname: string }) {
  return (
    <Popover>
      <PopoverTrigger className={iconButton} aria-label="Menu">
        <MenuIcon className="size-5" aria-hidden />
      </PopoverTrigger>
      <PopoverContent align="end" className="flex w-56 flex-col p-1.5">
        {SECTIONS.map((s) => (
          <Link
            key={s.url}
            href={s.url}
            aria-current={isCurrent(pathname, s.url) ? 'page' : undefined}
            className="hover:bg-accent aria-[current=page]:text-foreground text-muted-foreground rounded-md px-3 py-2 text-sm aria-[current=page]:font-medium">
            {s.text}
          </Link>
        ))}
        <div className="border-border my-1.5 border-t" />
        <Link href="/docs/install" className="hover:bg-accent rounded-md px-3 py-2 text-sm font-medium">
          Get started
        </Link>
        <div className="flex items-center justify-between px-1.5 pt-1.5">
          <ThemeSwitch />
          <a href={kitJson.repo} className={iconButton} aria-label="GitHub repository">
            <GithubIcon />
          </a>
        </div>
      </PopoverContent>
    </Popover>
  );
}

/** Phones, notebook layout: the sidebar drawer, which holds the sections and the section's tree. */
function DocsMenu() {
  const { slots } = useNotebookLayout();
  const Trigger = slots.sidebar.trigger;
  return (
    <Trigger className={iconButton} aria-label="Menu">
      <MenuIcon className="size-5" aria-hidden />
    </Trigger>
  );
}

/** The slim bar on /studio. */
function StudioHeader() {
  return (
    <header className="bg-background/80 sticky top-0 z-40 border-b backdrop-blur-sm">
      <div className="flex h-12 items-center gap-4 px-4 md:px-6">
        <Link href="/" className="inline-flex shrink-0 items-center gap-2 font-semibold">
          <span aria-hidden className="bg-primary size-5 rounded-md" />
          {kitJson.name}
        </Link>
        <Link
          href="/docs"
          className="text-muted-foreground hover:text-foreground focus-visible:ring-ring inline-flex items-center gap-1.5 rounded-md px-1.5 py-1 text-sm font-medium focus-visible:outline-none focus-visible:ring-2">
          <ArrowLeftIcon className="size-3.5" aria-hidden />
          Docs
        </Link>
        <div className="flex flex-1 items-center justify-end">
          <FullSearchTrigger hideIfDisabled className="w-full max-w-[240px] rounded-full ps-2.5 max-md:hidden" />
          <SearchTrigger hideIfDisabled className="p-2 md:hidden" />
        </div>
      </div>
    </header>
  );
}

export function SiteHeader({ variant }: { variant: 'home' | 'docs' }) {
  const pathname = usePathname() ?? '/';
  if (variant === 'home' && isCurrent(pathname, '/studio')) return <StudioHeader />;
  return (
    <header
      id={variant === 'docs' ? 'nd-subnav' : undefined}
      className={
        variant === 'docs'
          ? // The notebook layout's grid slot and header height (fumadocs-ui notebook/slots/header).
            'bg-background/80 sticky top-(--fd-docs-row-1) z-10 border-b backdrop-blur-sm [grid-area:header] layout:[--fd-header-height:--spacing(14)]'
          : 'bg-background/80 sticky top-0 z-40 border-b backdrop-blur-sm'
      }>
      <div className="flex h-14 items-center gap-6 px-4 md:px-6">
        <Link href="/" className="inline-flex shrink-0 items-center gap-2 font-semibold">
          <span aria-hidden className="bg-primary size-5 rounded-md" />
          {kitJson.name}
        </Link>
        <nav aria-label="Sections" className="flex items-center gap-1 max-md:hidden">
          {SECTIONS.map((s) => (
            <Link
              key={s.url}
              href={s.url}
              aria-current={isCurrent(pathname, s.url) ? 'page' : undefined}
              // The current section is underlined in the foreground colour, never the brand (it passes under any theme).
              className="text-muted-foreground hover:text-foreground aria-[current=page]:text-foreground aria-[current=page]:after:bg-foreground relative px-2.5 py-1.5 text-sm font-medium transition-colors after:absolute after:inset-x-2.5 after:-bottom-[13px] after:h-0.5 after:rounded-full">
              {s.text}
            </Link>
          ))}
        </nav>
        <div className="flex flex-1 items-center justify-end gap-2">
          <FullSearchTrigger hideIfDisabled className="w-full max-w-[240px] rounded-full ps-2.5 max-md:hidden" />
          <SearchTrigger hideIfDisabled className="p-2 md:hidden" />
          <Link
            href="/docs/install"
            className="border-border hover:bg-accent focus-visible:ring-ring inline-flex h-9 shrink-0 items-center rounded-full border px-4 text-sm font-medium focus-visible:outline-none focus-visible:ring-2 max-md:hidden">
            Get started
          </Link>
          <ThemeSwitch className="max-md:hidden" />
          <a href={kitJson.repo} className={`${iconButton} max-md:hidden`} aria-label="GitHub repository">
            <GithubIcon />
          </a>
          <div className="md:hidden">{variant === 'docs' ? <DocsMenu /> : <HomeMenu pathname={pathname} />}</div>
        </div>
      </div>
    </header>
  );
}
