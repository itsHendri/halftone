'use client';
import { Popover, PopoverContent, PopoverTrigger } from 'fumadocs-ui/components/ui/popover';
import { CheckIcon, ChevronDownIcon, CopyIcon, DownloadIcon, EllipsisIcon, EyeIcon, FileInputIcon, LaptopIcon, PencilIcon, PlusIcon, Trash2Icon } from 'lucide-react';
import * as React from 'react';
import { fontFamily } from '@/components/theme/studio/parts';
import { toast } from '@/components/theme/studio/toast';
import {
  deleteSystem,
  downloadSystem,
  duplicateSystem,
  restoreSystem,
  shareLink,
  STARTER,
  switchSystem,
  systemLabel,
  systemTheme,
  useSystems,
  type HalftoneSystem,
} from '@/lib/studio/systems';

/** What the Studio opens from the menu: the New system dialog (on its Import tab), or Rename / Delete for a system. */
export type StudioDialog = { kind: 'new'; mode: 'preset' | 'import' } | { kind: 'rename'; id: string } | { kind: 'delete'; id: string } | null;

/** "now", "5m", "3h", "2d", "3w", or the date. */
function ago(iso: string | undefined) {
  if (!iso) return '';
  const s = (Date.now() - Date.parse(iso)) / 1000;
  if (!Number.isFinite(s) || s < 60) return 'now';
  if (s < 3600) return `${Math.floor(s / 60)}m`;
  if (s < 86400) return `${Math.floor(s / 3600)}h`;
  if (s < 7 * 86400) return `${Math.floor(s / 86400)}d`;
  if (s < 35 * 86400) return `${Math.floor(s / (7 * 86400))}w`;
  return new Date(iso).toLocaleDateString(undefined, { day: 'numeric', month: 'short' });
}

/** A system's heading font, as CSS: a font picked by name (any Google Font), else the recipe's. */
export const headingFamily = (doc: HalftoneSystem) => (doc.fonts.heading ? `"${doc.fonts.heading}", ui-serif, serif` : fontFamily(doc.recipe.font.heading));

/** Four colours that say which system it is: brand, a light brand tint, the neutral surface and the text. */
export function Strip({ doc }: { doc: HalftoneSystem }) {
  const t = systemTheme(doc);
  const colours = [t.resolved.light.primary, t.primitives.brand['300'], t.primitives.neutral['100'], t.resolved.light.foreground];
  return (
    <span className="ring-border flex h-5 w-8 shrink-0 overflow-hidden rounded ring-1" aria-hidden>
      {colours.map((c, i) => (
        <span key={i} className="flex-1" style={{ background: c }} />
      ))}
    </span>
  );
}

export async function copyShareLink(doc: HalftoneSystem) {
  try {
    await navigator.clipboard.writeText(await shareLink(doc));
    toast(doc.brand.logo ? 'Link copied. Links don’t carry the logo.' : 'Link copied.');
  } catch {
    toast('The link couldn’t be copied.');
  }
}

export function removeSystem(id: string) {
  const undo = deleteSystem(id);
  if (undo) toast(`Deleted “${undo.doc.name}”.`, { label: 'Undo', run: () => restoreSystem(undo) });
}

const rowClass =
  'hover:bg-accent focus-visible:ring-ring flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-left text-sm focus-visible:outline-none focus-visible:ring-2';

/** One saved system's actions (the ⋯ beside it). */
function SystemActions({ doc, onDialog, close }: { doc: HalftoneSystem; onDialog: (d: StudioDialog) => void; close: () => void }) {
  const [open, setOpen] = React.useState(false);
  const act = (fn: () => void) => () => {
    setOpen(false);
    close();
    fn();
  };
  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger
        aria-label={`Actions for ${doc.name}`}
        className="text-muted-foreground hover:bg-accent hover:text-foreground focus-visible:ring-ring inline-flex size-8 shrink-0 items-center justify-center rounded-md focus-visible:outline-none focus-visible:ring-2">
        <EllipsisIcon className="size-4" aria-hidden />
      </PopoverTrigger>
      <PopoverContent side="right" align="start" className="flex w-56 flex-col p-1.5">
        <button type="button" className={rowClass} onClick={act(() => onDialog({ kind: 'rename', id: doc.id }))}>
          <PencilIcon className="size-4" aria-hidden />
          Rename
        </button>
        <button type="button" className={rowClass} onClick={act(() => duplicateSystem(doc.id) && toast(`Made “${doc.name} copy”.`))}>
          <CopyIcon className="size-4" aria-hidden />
          Duplicate
        </button>
        <button type="button" className={rowClass} onClick={act(() => downloadSystem(doc))}>
          <DownloadIcon className="size-4" aria-hidden />
          Export .halftone.json
        </button>
        <button type="button" className={rowClass} onClick={act(() => void copyShareLink(doc))}>
          <CopyIcon className="size-4" aria-hidden />
          Copy share link
        </button>
        <div className="border-border my-1 border-t" />
        <button type="button" className={`${rowClass} text-destructive`} onClick={act(() => onDialog({ kind: 'delete', id: doc.id }))}>
          <Trash2Icon className="size-4" aria-hidden />
          Delete…
        </button>
      </PopoverContent>
    </Popover>
  );
}

/**
 * The system switcher: the system's name in the Studio bar. Lists the saved systems newest edit first, each with a
 * colour strip and its name in its own heading font; New and Import; and where they're kept.
 */
export function SystemsMenu({ onDialog }: { onDialog: (d: StudioDialog) => void }) {
  const s = useSystems();
  const [open, setOpen] = React.useState(false);
  const close = () => setOpen(false);
  const label = systemLabel(s);
  // The one on screen comes first when it isn't a saved one: "Halftone" (nothing saved yet) or a shared link.
  const unsaved = s.shared ? s.doc : s.activeId === null ? STARTER : null;
  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger
        aria-label={`System: ${label}. Switch, new, import`}
        className="border-border hover:bg-accent focus-visible:ring-ring inline-flex h-9 min-w-0 max-w-[14rem] shrink items-center gap-2 rounded-full border pl-2 pr-3 text-sm font-medium focus-visible:outline-none focus-visible:ring-2 sm:max-w-[18rem]">
        <Strip doc={s.doc} />
        <span className="min-w-0 truncate" style={{ fontFamily: headingFamily(s.doc) }}>
          {label}
        </span>
        {s.shared ? <EyeIcon className="text-muted-foreground size-3.5 shrink-0" aria-label="read-only" /> : null}
        <ChevronDownIcon className="text-muted-foreground size-3.5 shrink-0" aria-hidden />
      </PopoverTrigger>
      <PopoverContent align="start" sideOffset={8} className="flex max-h-[70vh] w-80 max-w-[calc(100vw-2rem)] flex-col overflow-y-auto p-1.5">
        <ul aria-label="Systems" className="flex flex-col">
          {unsaved ? (
            <li className="flex items-center gap-1">
              <button type="button" className={`${rowClass} min-w-0`} aria-current="true" onClick={close}>
                <Strip doc={unsaved} />
                <span className="min-w-0 flex-1 truncate text-[15px]" style={{ fontFamily: headingFamily(unsaved) }}>
                  {s.shared ? label : unsaved.name}
                </span>
                <span className="text-muted-foreground shrink-0 text-xs">{s.shared ? 'shared' : 'not saved'}</span>
                <CheckIcon className="size-4 shrink-0" aria-hidden />
              </button>
            </li>
          ) : null}
          {s.saved.map((doc) => {
            const current = !s.shared && s.activeId === doc.id;
            return (
              <li key={doc.id} className="flex items-center gap-1">
                <button
                  type="button"
                  className={`${rowClass} min-w-0`}
                  aria-current={current ? 'true' : undefined}
                  onClick={() => {
                    switchSystem(doc.id);
                    close();
                  }}>
                  <Strip doc={doc} />
                  <span className="min-w-0 flex-1 truncate text-[15px]" style={{ fontFamily: headingFamily(doc) }}>
                    {doc.name}
                  </span>
                  <span className="text-muted-foreground shrink-0 text-xs tabular-nums">{ago(doc.updatedAt)}</span>
                  {current ? <CheckIcon className="size-4 shrink-0" aria-hidden /> : <span className="size-4 shrink-0" />}
                </button>
                <SystemActions doc={doc} onDialog={onDialog} close={close} />
              </li>
            );
          })}
        </ul>
        <div className="border-border my-1.5 border-t" />
        <button
          type="button"
          className={rowClass}
          onClick={() => {
            close();
            onDialog({ kind: 'new', mode: 'preset' });
          }}>
          <PlusIcon className="size-4" aria-hidden />
          New system
        </button>
        <button
          type="button"
          className={rowClass}
          onClick={() => {
            close();
            onDialog({ kind: 'new', mode: 'import' });
          }}>
          <FileInputIcon className="size-4" aria-hidden />
          Import file or code…
        </button>
        <div className="border-border my-1.5 border-t" />
        <p className="text-muted-foreground flex items-center gap-2 px-2.5 py-1.5 text-xs">
          <LaptopIcon className="size-3.5 shrink-0" aria-hidden />
          {s.storage === 'browser' ? 'Saved in this browser' : 'Not saved: this browser is blocking storage, so systems last for this page'}
        </p>
      </PopoverContent>
    </Popover>
  );
}
