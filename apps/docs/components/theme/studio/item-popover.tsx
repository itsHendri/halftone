'use client';
import { Popover, PopoverContent, PopoverTrigger } from 'fumadocs-ui/components/ui/popover';
import { LockIcon, Trash2Icon, XIcon } from 'lucide-react';
import * as React from 'react';
import { createPortal } from 'react-dom';

/**
 * The Foundations popover (apps/docs/design/studio-wireframes.md › Popovers, wireframe 2). One shape for every item:
 *   1. a name row: a lock and the slot tag for a fixed slot (`h2`, `md`), or an editable name and a trash for an extra
 *   2. a preview
 *   3. the values
 *   4. a status footer: "edited · reset", contrast, "used by…"
 * Edits apply live and save themselves (lib/studio/foundations.ts); ⌘Z undoes them. Esc or a click outside closes it,
 * and focus goes back to the item. One is open at a time (`openItem`). It opens beside its item and flips at the
 * window's edge; under 640px it is a bottom sheet. Built on the docs UI's Popover (Radix), modal, so focus stays in it.
 */

// ---- which one is open ----------------------------------------------------------------------------------------

let openId: string | null = null;
const listeners = new Set<() => void>();
/** Open an item's popover by id (closing any other), or close it (null). "+ New" opens the new extra's this way. */
export function openItem(id: string | null) {
  if (openId === id) return;
  openId = id;
  listeners.forEach((l) => l());
}
const subscribe = (l: () => void) => {
  listeners.add(l);
  return () => {
    listeners.delete(l);
  };
};
export const useOpenItem = () => React.useSyncExternalStore(subscribe, () => openId, () => null);

const PHONE = '(max-width: 639px)';
/** Under 640px popovers are bottom sheets (wireframe 6). */
export function usePhone() {
  return React.useSyncExternalStore(
    (l) => {
      const mq = window.matchMedia(PHONE);
      mq.addEventListener('change', l);
      return () => mq.removeEventListener('change', l);
    },
    () => window.matchMedia(PHONE).matches,
    () => false
  );
}

// ---- the popover ----------------------------------------------------------------------------------------

export type Extra = {
  /** The name as shown ("Trendy green"); its token is the kebab-case version. */
  name: string;
  token: string;
  /** Returns an error to show inline (a taken name), or null once renamed. */
  onRename: (name: string) => string | null;
  onDelete: () => void;
};

export type Status = {
  /** "edited · reset" (or "N edited · reset all"). */
  edited?: { label?: string; action?: string; onReset: () => void } | null;
  contrast?: React.ReactNode;
  usedBy?: React.ReactNode;
  note?: React.ReactNode;
};

type Props = {
  id: string;
  /** The item's name: the title of a fixed slot, and the popover's accessible name. */
  title: string;
  /** A fixed slot's tag (`h2`, `md`, `600`): shown with a lock. */
  slot?: string;
  extra?: Extra;
  /** The item itself: a button (it gets the popover's ARIA). */
  trigger: React.ReactElement;
  preview?: React.ReactNode;
  children?: React.ReactNode;
  status?: Status;
  side?: 'top' | 'right' | 'bottom' | 'left';
  align?: 'start' | 'center' | 'end';
  /** Width on larger screens, as a class. */
  width?: string;
};

export function ItemPopover({ id, title, slot, extra, trigger, preview, children, status, side = 'bottom', align = 'start', width = 'w-80' }: Props) {
  const current = useOpenItem();
  const open = current === id;
  const phone = usePhone();
  const titleId = React.useId();
  const footer = status && (status.edited || status.contrast || status.usedBy || status.note);
  // A renamed extra gets a new id: stay open under it.
  const previous = React.useRef(id);
  React.useEffect(() => {
    if (previous.current === id) return;
    if (openId === previous.current) openItem(id);
    previous.current = id;
  }, [id]);
  return (
    <Popover modal open={open} onOpenChange={(next) => openItem(next ? id : current === id ? null : current)}>
      <PopoverTrigger asChild>{trigger}</PopoverTrigger>
      {open && phone ? createPortal(<div className="fixed inset-0 z-40 bg-black/40" aria-hidden />, document.body) : null}
      <PopoverContent
        side={side}
        align={align}
        sideOffset={6}
        collisionPadding={12}
        aria-labelledby={titleId}
        data-studio-popover=""
        data-sheet={phone ? '' : undefined}
        onOpenAutoFocus={(e) => {
          // A new extra opens with its name selected; otherwise the first value's control takes focus (not Close).
          const root = e.currentTarget as HTMLElement | null;
          const target =
            root?.querySelector<HTMLElement>('[data-autofocus]') ??
            root?.querySelector<HTMLElement>('[data-values] :is(input, select, textarea, button, [tabindex="0"]):not(:disabled)');
          if (target) {
            e.preventDefault();
            target.focus();
            if (target instanceof HTMLInputElement) target.select();
          }
        }}
        className={`bg-popover text-popover-foreground flex flex-col gap-0 overflow-y-auto p-0 backdrop-blur-none ${
          phone ? 'max-h-[85dvh] w-screen max-w-none min-w-0 rounded-b-none rounded-t-2xl border-x-0 border-b-0 pb-[env(safe-area-inset-bottom)]' : `${width} max-w-[calc(100vw-1.5rem)]`
        }`}>
        {phone ? <span className="bg-border mx-auto mt-2 h-1 w-10 shrink-0 rounded-full" aria-hidden /> : null}
        <div className="flex items-center gap-2 px-3 pb-2 pt-3">
          {extra ? (
            <ExtraName extra={extra} titleId={titleId} />
          ) : (
            <>
              <LockIcon className="text-muted-foreground size-3.5 shrink-0" aria-label="Built-in slot" />
              <h3 id={titleId} className="min-w-0 flex-1 truncate text-sm font-semibold">
                {title}
              </h3>
              {slot ? <code className="bg-muted text-muted-foreground shrink-0 rounded px-1.5 py-0.5 font-mono text-[11px]">{slot}</code> : null}
            </>
          )}
          <button
            type="button"
            onClick={() => openItem(null)}
            aria-label="Close"
            className="text-muted-foreground hover:bg-accent hover:text-foreground focus-visible:ring-ring -mr-1 inline-flex size-7 shrink-0 items-center justify-center rounded-md focus-visible:outline-none focus-visible:ring-2">
            <XIcon className="size-4" aria-hidden />
          </button>
        </div>
        {preview ? <div className="px-3 pb-3">{preview}</div> : null}
        {children ? (
          <div data-values="" className="border-border flex flex-col gap-3 border-t px-3 py-3">
            {children}
          </div>
        ) : null}
        {footer ? (
          <div className="border-border text-muted-foreground flex flex-col gap-1.5 border-t px-3 py-2.5 text-xs">
            {status.edited ? (
              <p className="flex items-center gap-1.5">
                <EditedDot />
                <span>{status.edited.label ?? 'edited'}</span>
                <span aria-hidden>·</span>
                <button type="button" onClick={status.edited.onReset} className="text-foreground font-medium underline underline-offset-2">
                  {status.edited.action ?? 'reset'}
                </button>
              </p>
            ) : null}
            {status.contrast ? <div>{status.contrast}</div> : null}
            {status.usedBy ? <div>{status.usedBy}</div> : null}
            {status.note ? <div>{status.note}</div> : null}
          </div>
        ) : null}
      </PopoverContent>
    </Popover>
  );
}

/** An extra's name: edited in place; its token name under it; a taken name is refused inline. */
function ExtraName({ extra, titleId }: { extra: Extra; titleId: string }) {
  const [value, setValue] = React.useState(extra.name);
  const [error, setError] = React.useState<string | null>(null);
  const errorId = React.useId();
  const commit = () => {
    if (value.trim() === extra.name) return setError(null);
    setError(extra.onRename(value));
  };
  return (
    <div className="flex min-w-0 flex-1 items-start gap-1">
      <div className="flex min-w-0 flex-1 flex-col gap-0.5">
        <input
          id={titleId}
          data-autofocus
          value={value}
          aria-label="Name"
          aria-invalid={!!error}
          aria-describedby={errorId}
          onChange={(e) => setValue(e.target.value)}
          onBlur={commit}
          onKeyDown={(e) => {
            if (e.key === 'Enter') commit();
          }}
          className="focus-visible:ring-ring -mx-1 rounded px-1 text-sm font-semibold focus-visible:outline-none focus-visible:ring-2 aria-invalid:ring-destructive aria-invalid:ring-2"
        />
        <p id={errorId} className={`text-xs ${error ? 'text-destructive' : 'text-muted-foreground'}`}>
          {error ?? (
            <>
              Token <code className="font-mono">{extra.token}</code>
            </>
          )}
        </p>
      </div>
      <button
        type="button"
        onClick={extra.onDelete}
        aria-label={`Delete ${extra.name}`}
        className="text-muted-foreground hover:bg-accent hover:text-destructive focus-visible:ring-ring inline-flex size-7 shrink-0 items-center justify-center rounded-md focus-visible:outline-none focus-visible:ring-2">
        <Trash2Icon className="size-3.5" aria-hidden />
      </button>
    </div>
  );
}

/** The mark an edited item carries, on the page and in its popover. */
export function EditedDot({ className = '' }: { className?: string }) {
  return <span className={`bg-primary inline-block size-1.5 shrink-0 rounded-full ${className}`} aria-hidden />;
}

/** A label and its control on one line, as the popovers lay their values out. */
export function Field({ label, htmlFor, children, hint }: { label: string; htmlFor?: string; children: React.ReactNode; hint?: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-1">
      <div className="flex items-center gap-2">
        <label htmlFor={htmlFor} className="text-muted-foreground w-16 shrink-0 text-xs font-medium">
          {label}
        </label>
        <div className="flex min-w-0 flex-1 items-center gap-2">{children}</div>
      </div>
      {hint ? <div className="text-muted-foreground pl-[4.5rem] text-xs">{hint}</div> : null}
    </div>
  );
}

export const inputClass =
  'border-border bg-background focus-visible:ring-ring h-8 min-w-0 rounded-md border px-2 text-sm focus-visible:outline-none focus-visible:ring-2 aria-invalid:border-destructive';
export const smallButton =
  'border-border hover:bg-accent focus-visible:ring-ring inline-flex h-8 shrink-0 items-center justify-center gap-1.5 rounded-md border px-2.5 text-xs font-medium focus-visible:outline-none focus-visible:ring-2 disabled:pointer-events-none disabled:opacity-50';
