'use client';
import { XIcon } from 'lucide-react';
import * as React from 'react';

/**
 * A modal on the native <dialog>: the browser traps focus, Esc closes it, and focus goes back to what opened it.
 * Clicking the backdrop closes it too. The content mounts only while it is open, so each opening starts fresh; the
 * element marked `data-autofocus` takes focus.
 */
export function Dialog({ open, onClose, title, children, wide }: { open: boolean; onClose: () => void; title: string; children: React.ReactNode; wide?: boolean }) {
  const ref = React.useRef<HTMLDialogElement>(null);
  const id = React.useId();
  React.useEffect(() => {
    const d = ref.current;
    if (!d) return;
    if (open && !d.open) {
      d.showModal();
      // showModal focuses the first control (the close button); a form wants its first field instead.
      d.querySelector<HTMLElement>('[data-autofocus]')?.focus();
    } else if (!open && d.open) d.close();
  }, [open]);
  return (
    <dialog
      ref={ref}
      aria-labelledby={id}
      onClose={onClose}
      onClick={(e) => e.target === ref.current && onClose()}
      className={`bg-popover text-popover-foreground border-border m-auto max-h-[calc(100dvh-2rem)] w-[calc(100vw-2rem)] overflow-y-auto rounded-xl border p-0 shadow-xl backdrop:bg-black/50 ${wide ? 'max-w-2xl' : 'max-w-md'}`}>
      {open ? (
        <div className="flex flex-col gap-4 p-5">
          <div className="flex items-start justify-between gap-4">
            <h2 id={id} className="text-base font-semibold">
              {title}
            </h2>
            <button type="button" onClick={onClose} aria-label="Close" className="text-muted-foreground hover:bg-accent hover:text-foreground focus-visible:ring-ring -m-1.5 inline-flex size-8 items-center justify-center rounded-md focus-visible:outline-none focus-visible:ring-2">
              <XIcon className="size-4" aria-hidden />
            </button>
          </div>
          {children}
        </div>
      ) : null}
    </dialog>
  );
}

export const buttonClass =
  'focus-visible:ring-ring inline-flex h-9 shrink-0 items-center justify-center gap-2 rounded-full px-4 text-sm font-medium focus-visible:outline-none focus-visible:ring-2 disabled:pointer-events-none disabled:opacity-50';
export const primaryButton = `${buttonClass} bg-primary text-primary-foreground hover:opacity-90`;
export const outlineButton = `${buttonClass} border-border hover:bg-accent border`;
export const destructiveButton = `${buttonClass} bg-destructive text-destructive-foreground hover:opacity-90`;
