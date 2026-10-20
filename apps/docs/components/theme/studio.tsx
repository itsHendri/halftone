'use client';
import { Popover, PopoverContent, PopoverTrigger } from 'fumadocs-ui/components/ui/popover';
import { EllipsisIcon, LinkIcon, MoonIcon, Redo2Icon, ShuffleIcon, SparklesIcon, SunIcon, Undo2Icon, XIcon } from 'lucide-react';
import { useTheme } from 'next-themes';
import * as React from 'react';
import { ExportPanel } from '@/components/theme/export-panel';
import { Canvas, TABS, type Tab } from '@/components/theme/studio/canvas';
import { outlineButton, primaryButton } from '@/components/theme/studio/dialog';
import { ALL_FONTS, PRESET_FONTS } from '@/components/theme/studio/parts';
import { SystemDialogs } from '@/components/theme/studio/system-dialogs';
import { SystemsMenu, type StudioDialog } from '@/components/theme/studio/systems-menu';
import { toast, Toaster } from '@/components/theme/studio/toast';
import { dismissMigrated, discardShared, saveShared, useSystems } from '@/lib/studio/systems';
import { holdAmbient } from '@/lib/theme/ambient';
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

/** The tabs, with the number of contrast warnings on Accessibility. Arrow keys move between them. */
function Tabs({ tab, onTab }: { tab: Tab; onTab: (t: Tab) => void }) {
  const { theme } = useLiveTheme();
  const warnings = theme.warnings.length;
  const onKey = (e: React.KeyboardEvent<HTMLDivElement>) => {
    const keys = ['ArrowRight', 'ArrowLeft', 'Home', 'End'];
    if (!keys.includes(e.key)) return;
    e.preventDefault();
    const i = TABS.findIndex((t) => t.id === tab);
    const n = e.key === 'Home' ? 0 : e.key === 'End' ? TABS.length - 1 : (i + (e.key === 'ArrowRight' ? 1 : TABS.length - 1)) % TABS.length;
    onTab(TABS[n].id);
    e.currentTarget.querySelector<HTMLElement>(`[data-tab="${TABS[n].id}"]`)?.focus();
  };
  return (
    <div role="tablist" aria-label="Studio" onKeyDown={onKey} className="flex gap-0.5">
      {TABS.map((t) => (
        <button
          key={t.id}
          type="button"
          role="tab"
          id={`studio-tab-${t.id}`}
          data-tab={t.id}
          aria-selected={tab === t.id}
          aria-controls="studio-panel"
          tabIndex={tab === t.id ? 0 : -1}
          onClick={() => onTab(t.id)}
          className={`focus-visible:ring-ring inline-flex h-8 items-center gap-1.5 rounded-full px-3 text-sm font-medium focus-visible:outline-none focus-visible:ring-2 ${
            tab === t.id ? 'bg-accent text-accent-foreground' : 'text-muted-foreground hover:text-foreground'
          }`}>
          {t.label}
          {t.id === 'accessibility' && warnings ? (
            <span className="bg-destructive text-destructive-foreground rounded-full px-1.5 text-xs tabular-nums" aria-label={`${warnings} warnings`}>
              {warnings}
            </span>
          ) : null}
        </button>
      ))}
    </div>
  );
}

/** Undo, redo, shuffle, light/dark: in the bar from sm up, in the ⋯ menu on a phone. */
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
          <button type="button" className={menuRow} onClick={toggle}>
            {dark ? <SunIcon className="size-4" aria-hidden /> : <MoonIcon className="size-4" aria-hidden />}
            {dark ? 'Light mode' : 'Dark mode'}
          </button>
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

/** The first-run and shared-link notes, under the bar (wireframe 3). */
function Banners({ onDialog }: { onDialog: (d: StudioDialog) => void }) {
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

/**
 * Studio (/studio): a design system manager (apps/docs/design/studio-wireframes.md). A bar with the system switcher,
 * the Foundations / Components / Accessibility tabs, undo, redo, shuffle, light/dark and Use system; then the tab.
 * The tab is kept in `?tab=`; an old `/themes/?view=contrast` link lands on Accessibility.
 */
export function Studio() {
  const [tab, setTab] = React.useState<Tab>('foundations');
  const [dialog, setDialog] = React.useState<StudioDialog>(null);

  // The Studio shows the system being edited, so the ambient drift holds still here.
  React.useEffect(() => holdAmbient('studio'), []);

  // ?tab= in, and out on every change (the page is static: read it on the client).
  React.useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const t = params.get('tab') ?? (params.get('view') === 'contrast' ? 'accessibility' : null);
    if (TABS.some((x) => x.id === t)) setTab(t as Tab);
  }, []);
  const changeTab = (t: Tab) => {
    setTab(t);
    const url = new URL(window.location.href);
    url.searchParams.delete('view');
    if (t === 'foundations') url.searchParams.delete('tab');
    else url.searchParams.set('tab', t);
    window.history.replaceState(window.history.state, '', url);
  };

  // The bar's height (it wraps on a phone), for what sticks under it: the section index and the jump menu.
  const root = React.useRef<HTMLDivElement>(null);
  const bar = React.useRef<HTMLDivElement>(null);
  React.useEffect(() => {
    const el = bar.current;
    if (!el) return;
    const ro = new ResizeObserver(() => root.current?.style.setProperty('--studio-bar', `${el.offsetHeight}px`));
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  // Undo / redo from the keyboard (not while typing in a field).
  React.useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.target as HTMLElement).closest('input, textarea, select, [contenteditable], dialog')) return;
      if (!(e.metaKey || e.ctrlKey) || e.key.toLowerCase() !== 'z') return;
      e.preventDefault();
      if (e.shiftKey) redo();
      else undo();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  return (
    <div ref={root} data-studio className="bg-muted/40 flex w-full flex-1 flex-col">
      {/* The switcher shows each system's name in its own heading font, and the preset cards theirs. */}
      {ALL_FONTS ? <link rel="stylesheet" href={ALL_FONTS} /> : null}
      {PRESET_FONTS ? <link rel="stylesheet" href={PRESET_FONTS} /> : null}
      <h1 className="sr-only">Studio</h1>

      <div ref={bar} className="bg-background/90 border-border sticky top-12 z-30 border-b backdrop-blur-sm">
        <div className="flex flex-wrap items-center gap-x-2 gap-y-2 px-4 py-2 md:px-6">
          <SystemsMenu onDialog={setDialog} />
          <div className="max-sm:order-last max-sm:w-full sm:ml-2">
            <Tabs tab={tab} onTab={changeTab} />
          </div>
          <div className="flex-1" />
          <Actions />
          <UseSystem />
        </div>
      </div>

      <div className="flex flex-col gap-4 px-4 pb-24 pt-4 md:px-6">
        <Banners onDialog={setDialog} />
        <div id="studio-panel" role="tabpanel" aria-labelledby={`studio-tab-${tab}`}>
          <Canvas tab={tab} />
        </div>
      </div>

      <SystemDialogs dialog={dialog} onClose={() => setDialog(null)} />
      <Toaster />
    </div>
  );
}
