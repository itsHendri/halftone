'use client';
import { Popover, PopoverClose, PopoverContent, PopoverTrigger } from 'fumadocs-ui/components/ui/popover';
import { EllipsisIcon, LinkIcon, MoonIcon, Redo2Icon, ShuffleIcon, SparklesIcon, SunIcon, Undo2Icon, XIcon } from 'lucide-react';
import { useTheme } from 'next-themes';
import * as React from 'react';
import { ExportPanel } from '@/components/theme/export-panel';
import { AccessibilityTab } from '@/components/theme/studio/accessibility-tab';
import { ComponentsTab, readView, writeView, type ComponentsView } from '@/components/theme/studio/components-tab';
import { outlineButton, primaryButton } from '@/components/theme/studio/dialog';
import { Foundations } from '@/components/theme/studio/foundations';
import { useStudioDialogs } from '@/components/theme/studio/shell';
import { toast } from '@/components/theme/studio/toast';
import { dismissMigrated, discardShared, saveShared, useSystems } from '@/lib/studio/systems';
import { useMode } from '@/lib/theme/mode';
import { redo, shuffle, undo, useLiveTheme } from '@/lib/theme/store';

const iconButton =
  'text-muted-foreground hover:bg-accent hover:text-foreground focus-visible:ring-ring inline-flex size-9 shrink-0 items-center justify-center rounded-full focus-visible:outline-none focus-visible:ring-2 disabled:pointer-events-none disabled:opacity-40';
const menuRow =
  'hover:bg-accent focus-visible:ring-ring flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-left text-sm focus-visible:outline-none focus-visible:ring-2 disabled:pointer-events-none disabled:opacity-40';

function useScheme() {
  const { setTheme } = useTheme();
  const dark = useMode() === 'dark';
  return { dark, toggle: () => setTheme(dark ? 'light' : 'dark') };
}

/** Undo, redo, shuffle, light/dark: in the toolbar from sm up, in the ⋯ menu on a phone. */
function Actions() {
  const { canUndo, canRedo } = useLiveTheme();
  const { dark, toggle } = useScheme();
  return (
    <>
      <div className="flex items-center max-sm:hidden">
        <button type="button" className={iconButton} onClick={undo} disabled={!canUndo} aria-label="Undo" title="Undo (⌘Z)">
          <Undo2Icon className="size-4" aria-hidden />
        </button>
        <button type="button" className={iconButton} onClick={redo} disabled={!canRedo} aria-label="Redo" title="Redo (⇧⌘Z)">
          <Redo2Icon className="size-4" aria-hidden />
        </button>
        <button type="button" className={iconButton} onClick={shuffle} aria-label="Shuffle" title="Shuffle">
          <ShuffleIcon className="size-4" aria-hidden />
        </button>
        <button type="button" className={iconButton} onClick={toggle} aria-label="Dark mode" aria-pressed={dark} title={dark ? 'Light mode' : 'Dark mode'}>
          {dark ? <SunIcon className="size-4" aria-hidden /> : <MoonIcon className="size-4" aria-hidden />}
        </button>
      </div>
      <Popover>
        <PopoverTrigger className={`${iconButton} sm:hidden`} aria-label="More">
          <EllipsisIcon className="size-4" aria-hidden />
        </PopoverTrigger>
        <PopoverContent align="end" className="flex w-52 flex-col p-1.5">
          <button type="button" className={menuRow} onClick={undo} disabled={!canUndo}>
            <Undo2Icon className="size-4" aria-hidden />
            Undo
          </button>
          <button type="button" className={menuRow} onClick={redo} disabled={!canRedo}>
            <Redo2Icon className="size-4" aria-hidden />
            Redo
          </button>
          <button type="button" className={menuRow} onClick={shuffle}>
            <ShuffleIcon className="size-4" aria-hidden />
            Shuffle
          </button>
          {/* Undo, redo and shuffle keep the menu open for another go; a scheme is picked once, so it closes. */}
          <PopoverClose asChild>
            <button type="button" className={menuRow} onClick={toggle}>
              {dark ? <SunIcon className="size-4" aria-hidden /> : <MoonIcon className="size-4" aria-hidden />}
              {dark ? 'Light mode' : 'Dark mode'}
            </button>
          </PopoverClose>
        </PopoverContent>
      </Popover>
    </>
  );
}

function UseSystem() {
  const { theme } = useLiveTheme();
  return (
    <Popover>
      <PopoverTrigger className={`${primaryButton} max-sm:px-3`}>Use system</PopoverTrigger>
      <PopoverContent align="end" sideOffset={8} className="max-h-[75vh] w-96 max-w-[calc(100vw-2rem)] overflow-y-auto p-4">
        <ExportPanel theme={theme} />
      </PopoverContent>
    </Popover>
  );
}

/** The first-run and shared-link notes, under the toolbar (wireframe 3). */
function Banners() {
  const { open: onDialog } = useStudioDialogs();
  const s = useSystems();
  if (s.shared) {
    return (
      <div className="bg-muted text-foreground flex flex-wrap items-center gap-3 rounded-xl px-4 py-3 text-sm">
        <LinkIcon className="size-4 shrink-0" aria-hidden />
        <p className="min-w-0 flex-1">You’re viewing a shared system. Edits are kept only once you save it.</p>
        <div className="flex gap-2">
          <button type="button" className={outlineButton} onClick={discardShared}>
            Discard
          </button>
          <button
            type="button"
            className={primaryButton}
            onClick={() => {
              const doc = saveShared();
              if (doc) toast(`Saved “${doc.name}” in this browser.`);
            }}>
            Save as new system
          </button>
        </div>
      </div>
    );
  }
  if (s.migrated && s.migrated === s.activeId) {
    return (
      <div className="bg-accent text-accent-foreground flex flex-wrap items-center gap-3 rounded-xl px-4 py-3 text-sm">
        <SparklesIcon className="size-4 shrink-0" aria-hidden />
        <p className="min-w-0 flex-1">Your theme and logo moved in as “{s.doc.name}”. It saves in this browser.</p>
        <button type="button" className="font-medium underline underline-offset-2" onClick={() => s.migrated && onDialog({ kind: 'rename', id: s.migrated })}>
          Rename
        </button>
        <button type="button" onClick={dismissMigrated} aria-label="Dismiss" className={iconButton}>
          <XIcon className="size-4" aria-hidden />
        </button>
      </div>
    );
  }
  return null;
}

export type StudioPageId = 'foundations' | 'components' | 'accessibility';
const TITLES: Record<StudioPageId, string> = { foundations: 'Foundations', components: 'Components', accessibility: 'Accessibility' };

/**
 * One Studio page (design/navigation-wireframes.md › Round two): /studio (Foundations), /studio/components and
 * /studio/accessibility, in the notebook layout's page column. The sidebar is the navigation; over the canvas sits
 * a slim toolbar (undo, redo, shuffle, light/dark, Use system), then the first-run and shared-link notes, then
 * the page. The toolbar's height is `--studio-bar`, for what sticks under it.
 */
export function StudioPage({ page }: { page: StudioPageId }) {
  const bar = React.useRef<HTMLDivElement>(null);
  React.useEffect(() => {
    const el = bar.current;
    const root = document.querySelector<HTMLElement>('[data-studio]');
    if (!el || !root) return;
    const ro = new ResizeObserver(() => root.style.setProperty('--studio-bar', `${el.offsetHeight}px`));
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  return (
    <div className="bg-muted-subtle flex min-w-0 flex-col [grid-area:main]">
      <h1 className="sr-only">Studio: {TITLES[page]}</h1>
      <div ref={bar} className="bg-background/90 border-border sticky top-14 z-20 border-b backdrop-blur-sm">
        <div className="flex items-center gap-2 px-4 py-2 md:px-6">
          <span className="text-muted-foreground text-sm font-medium">{TITLES[page]}</span>
          <div className="flex-1" />
          <Actions />
          <UseSystem />
        </div>
      </div>
      <div className="flex flex-col gap-4 px-4 pb-24 pt-4 md:px-6">
        <Banners />
        {page === 'foundations' ? <Foundations /> : page === 'components' ? <ComponentsPage /> : <AccessibilityTab />}
      </div>
    </div>
  );
}

/** The Components page, its view (group, kit, uses) kept in the URL's query, and the group scrolled to in the hash. */
function ComponentsPage() {
  const [view, setView] = React.useState<ComponentsView>({ group: null, kit: 'web', uses: null });
  React.useEffect(() => setView(readView(new URLSearchParams(window.location.search))), []);
  const onView = (patch: Partial<ComponentsView>) => {
    const next = { ...view, ...patch };
    const url = new URL(window.location.href);
    writeView(url.searchParams, next);
    // A new filter starts at the top.
    url.hash = '';
    window.history.replaceState(window.history.state, '', url);
    window.scrollTo({ top: 0 });
    setView(next);
  };
  return <ComponentsTab view={view} onView={onView} />;
}
