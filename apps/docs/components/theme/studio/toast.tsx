'use client';
import { XIcon } from 'lucide-react';
import * as React from 'react';

/** The Studio's toasts: a message and maybe one action (Undo), gone after a few seconds. Announced politely. */
type Toast = { id: number; message: string; action?: { label: string; run: () => void } };
let toasts: Toast[] = [];
let next = 1;
const listeners = new Set<() => void>();
const emit = () => listeners.forEach((l) => l());

export function dismissToast(id: number) {
  toasts = toasts.filter((t) => t.id !== id);
  emit();
}

export function toast(message: string, action?: Toast['action']) {
  const id = next++;
  toasts = [...toasts.slice(-2), { id, message, action }];
  emit();
  setTimeout(() => dismissToast(id), action ? 8000 : 4000);
  return id;
}

const subscribe = (l: () => void) => {
  listeners.add(l);
  return () => {
    listeners.delete(l);
  };
};

export function Toaster() {
  const list = React.useSyncExternalStore(subscribe, () => toasts, () => toasts);
  return (
    // Always in the page, so a screen reader hears what is added to it.
    <div role="status" aria-live="polite" className="pointer-events-none fixed inset-x-0 bottom-4 z-50 flex flex-col items-center gap-2 px-4">
      {list.map((t) => (
        <div key={t.id} className="bg-foreground text-background pointer-events-auto flex max-w-full items-center gap-3 rounded-full py-1.5 pl-4 pr-1.5 text-sm shadow-lg">
          <span className="min-w-0">{t.message}</span>
          {t.action ? (
            <button
              type="button"
              onClick={() => {
                t.action?.run();
                dismissToast(t.id);
              }}
              className="focus-visible:ring-background hover:bg-background/15 rounded-full px-3 py-1 font-medium underline-offset-2 focus-visible:outline-none focus-visible:ring-2">
              {t.action.label}
            </button>
          ) : null}
          <button type="button" onClick={() => dismissToast(t.id)} aria-label="Dismiss" className="focus-visible:ring-background hover:bg-background/15 inline-flex size-7 items-center justify-center rounded-full focus-visible:outline-none focus-visible:ring-2">
            <XIcon className="size-3.5" aria-hidden />
          </button>
        </div>
      ))}
    </div>
  );
}
