'use client';
import { Popover, PopoverContent, PopoverTrigger } from 'fumadocs-ui/components/ui/popover';
import { ArrowLeftIcon, CopyIcon, CopyPlusIcon, EllipsisIcon, EyeIcon, LockIcon, RotateCcwIcon, Trash2Icon } from 'lucide-react';
import * as React from 'react';
import { openItem, useOpenItem } from '@/components/theme/studio/item-popover';
import { toast } from '@/components/theme/studio/toast';
import { SIDE_LABEL } from '@/lib/catalogue';
import { usageOf } from '@/lib/studio/usage';
import { toggleLock, useLocks, type LockKey } from '@/lib/theme/store';

/**
 * The item menu (apps/docs/design/studio-wireframes.md › The item menu, wireframe 8): right-click any item, or its ⋯
 * on hover or focus, or a long press on a phone. Show usage, Copy class / variable / value, Reset to generated,
 * Duplicate as extra, Lock for shuffle, and Delete for extras (a built-in slot says it can't be deleted).
 * It shares "one open at a time" with the item popovers (`openItem`).
 */

export type MenuSpec = {
  /** "Primary · role": the menu's title. */
  title: string;
  /** Usage keys (color.primary, radius.md…), joined; `also` lists other roles on the same step. */
  usage?: { keys: string[]; label: string; also?: string[] };
  copy?: { cls?: string; variable?: string; value?: string };
  /** Reset to generated, when the item is edited. */
  onReset?: (() => void) | null;
  onDuplicate?: () => void;
  /** Extras only. */
  onDelete?: () => void;
  /** What shuffle leaves alone while locked. */
  lock?: LockKey[];
};

/** Open the Components tab filtered to what uses a token (components/theme/studio.tsx listens). */
export function showInComponents(uses: string) {
  window.dispatchEvent(new CustomEvent('studio:tab', { detail: { tab: 'components', uses } }));
}

function copy(text: string, what: string) {
  navigator.clipboard?.writeText(text).then(
    () => toast(`Copied ${what}: ${text}`),
    () => toast('This browser blocked the clipboard.')
  );
}

const row =
  'hover:bg-accent focus-visible:bg-accent flex w-full items-center gap-2.5 rounded-md px-2 py-1.5 text-left text-sm outline-none disabled:pointer-events-none disabled:opacity-60';

function Usage({ spec, onBack }: { spec: MenuSpec; onBack: () => void }) {
  const usage = spec.usage!;
  const list = usageOf(usage.keys);
  return (
    <div className="flex flex-col gap-2 p-1">
      <div className="flex items-center gap-1.5">
        <button type="button" onClick={onBack} aria-label="Back to the menu" className="hover:bg-accent focus-visible:ring-ring inline-flex size-7 items-center justify-center rounded-md focus-visible:outline-none focus-visible:ring-2">
          <ArrowLeftIcon className="size-4" aria-hidden />
        </button>
        <p className="text-sm font-semibold">
          {usage.label} · used by {list.length}
        </p>
      </div>
      {list.length ? (
        <ul aria-label="Components" className="flex max-h-48 flex-wrap gap-1 overflow-y-auto">
          {list.map(({ entry, sides }) => (
            <li key={entry.id} className="bg-muted rounded-md px-1.5 py-0.5 text-xs" title={sides.map((s) => SIDE_LABEL[s]).join(' and ')}>
              {entry.title}
              {sides.length === 1 ? <span className="text-muted-foreground"> · {SIDE_LABEL[sides[0]]}</span> : null}
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-muted-foreground text-xs">No kit component draws it directly.</p>
      )}
      {usage.also?.length ? (
        <p className="text-muted-foreground text-xs">
          Other roles on it: <span className="text-foreground font-mono">{usage.also.join(', ')}</span>
        </p>
      ) : null}
      {list.length ? (
        <button
          type="button"
          className={`${row} text-primary font-medium`}
          onClick={() => {
            openItem(null);
            showInComponents(usage.keys.join(','));
          }}>
          <EyeIcon className="size-4" aria-hidden />
          See them in Components
        </button>
      ) : null}
    </div>
  );
}

function Menu({ spec, onUsage }: { spec: MenuSpec; onUsage: () => void }) {
  const locks = useLocks();
  const locked = spec.lock?.length ? spec.lock.every((k) => locks.has(k)) : false;
  const done = (fn: () => void) => () => {
    openItem(null);
    fn();
  };
  return (
    <div
      role="menu"
      aria-label={spec.title}
      className="flex flex-col p-1"
      onKeyDown={(e) => {
        if (!['ArrowDown', 'ArrowUp', 'Home', 'End'].includes(e.key)) return;
        e.preventDefault();
        const items = [...e.currentTarget.querySelectorAll<HTMLElement>('[role^="menuitem"]:not(:disabled)')];
        const i = items.indexOf(document.activeElement as HTMLElement);
        const n = e.key === 'Home' ? 0 : e.key === 'End' ? items.length - 1 : (i + (e.key === 'ArrowDown' ? 1 : items.length - 1)) % items.length;
        items[n]?.focus();
      }}>
      <p className="text-muted-foreground px-2 pb-1 pt-1 text-xs font-medium">{spec.title}</p>
      {spec.usage ? (
        <button type="button" role="menuitem" className={row} onClick={onUsage}>
          <EyeIcon className="size-4" aria-hidden />
          Show usage
        </button>
      ) : null}
      {spec.copy?.cls ? (
        <button type="button" role="menuitem" className={row} onClick={done(() => copy(spec.copy!.cls!, 'class'))}>
          <CopyIcon className="size-4" aria-hidden />
          <span className="flex-1">Copy class</span>
          <code className="text-muted-foreground max-w-32 truncate font-mono text-[11px]">{spec.copy.cls}</code>
        </button>
      ) : null}
      {spec.copy?.variable ? (
        <button type="button" role="menuitem" className={row} onClick={done(() => copy(spec.copy!.variable!, 'variable'))}>
          <CopyIcon className="size-4" aria-hidden />
          <span className="flex-1">Copy variable</span>
          <code className="text-muted-foreground max-w-32 truncate font-mono text-[11px]">{spec.copy.variable}</code>
        </button>
      ) : null}
      {spec.copy?.value ? (
        <button type="button" role="menuitem" className={row} onClick={done(() => copy(spec.copy!.value!, 'value'))}>
          <CopyIcon className="size-4" aria-hidden />
          <span className="flex-1">Copy value</span>
          <code className="text-muted-foreground max-w-32 truncate font-mono text-[11px]">{spec.copy.value}</code>
        </button>
      ) : null}
      {spec.onReset ? (
        <button type="button" role="menuitem" className={row} onClick={done(spec.onReset)}>
          <RotateCcwIcon className="size-4" aria-hidden />
          Reset to generated
        </button>
      ) : null}
      {spec.onDuplicate ? (
        <button type="button" role="menuitem" className={row} onClick={done(spec.onDuplicate)}>
          <CopyPlusIcon className="size-4" aria-hidden />
          Duplicate as extra
        </button>
      ) : null}
      {spec.lock?.length ? (
        <button
          type="button"
          role="menuitemcheckbox"
          aria-checked={locked}
          className={row}
          onClick={() => {
            for (const k of spec.lock!) if (locks.has(k) === locked) toggleLock(k);
          }}>
          <LockIcon className="size-4" aria-hidden />
          <span className="flex-1">Lock for shuffle</span>
          <span className={`text-xs ${locked ? 'text-foreground font-medium' : 'text-muted-foreground'}`}>{locked ? 'On' : 'Off'}</span>
        </button>
      ) : null}
      <div className="bg-border mx-1 my-1 h-px" role="separator" />
      {spec.onDelete ? (
        <button type="button" role="menuitem" className={`${row} text-destructive`} onClick={done(spec.onDelete)}>
          <Trash2Icon className="size-4" aria-hidden />
          Delete
        </button>
      ) : (
        <button type="button" role="menuitem" disabled aria-disabled className={`${row} text-muted-foreground`}>
          <LockIcon className="size-4" aria-hidden />
          Built-in slot, can’t delete
        </button>
      )}
    </div>
  );
}

/**
 * Wraps an item (its ItemPopover trigger) with the menu: right-click, the ⋯ that shows on hover or focus, or a long
 * press. `id` is the item's popover id; the menu's is `menu:<id>`. The ⋯ sits in the item's corner (`compact`: a
 * small one on the corner), or `above` it, for a small chip whose middle it would otherwise cover.
 */
export function ItemMenu({ id, spec, children, className = '', compact, above }: { id: string; spec: MenuSpec; children: React.ReactNode; className?: string; compact?: boolean; above?: boolean }) {
  const menuId = `menu:${id}`;
  const open = useOpenItem() === menuId;
  const [view, setView] = React.useState<'menu' | 'usage'>('menu');
  const press = React.useRef<{ timer?: ReturnType<typeof setTimeout>; fired: boolean }>({ fired: false });
  const show = () => {
    setView('menu');
    openItem(menuId);
  };
  return (
    <div
      className={`group/item relative min-w-0 ${className}`}
      onContextMenu={(e) => {
        e.preventDefault();
        show();
      }}
      onKeyDown={(e) => {
        // The keyboard's context menu: the Menu key, or Shift+F10.
        if (e.key === 'ContextMenu' || (e.shiftKey && e.key === 'F10')) {
          e.preventDefault();
          show();
        }
      }}
      onTouchStart={() => {
        press.current.fired = false;
        press.current.timer = setTimeout(() => {
          press.current.fired = true;
          show();
        }, 500);
      }}
      onTouchMove={() => clearTimeout(press.current.timer)}
      onTouchEnd={() => clearTimeout(press.current.timer)}
      onClickCapture={(e) => {
        // The click that ends a long press would open the item's popover too.
        if (press.current.fired) {
          press.current.fired = false;
          e.preventDefault();
          e.stopPropagation();
        }
      }}>
      {children}
      <Popover open={open} onOpenChange={(next) => (next ? show() : openItem(null))}>
        <PopoverTrigger
          aria-label={`${spec.title}: more`}
          aria-haspopup="menu"
          title="More (right-click, or Shift+F10)"
          className={`bg-background/90 border-border text-muted-foreground hover:text-foreground focus-visible:ring-ring absolute z-10 inline-flex items-center justify-center rounded-md border opacity-0 shadow-sm focus-visible:opacity-100 focus-visible:outline-none focus-visible:ring-2 group-hover/item:opacity-100 data-[state=open]:opacity-100 [@media(hover:none)]:pointer-events-none ${
            above ? '-top-5 right-0 size-5' : compact ? '-right-1.5 -top-1.5 size-5' : 'right-1 top-1 size-6'
          }`}>
          <EllipsisIcon className="size-3.5" aria-hidden />
        </PopoverTrigger>
        <PopoverContent align="end" sideOffset={4} className="bg-popover w-64 p-0 backdrop-blur-none" onOpenAutoFocus={(e) => {
          e.preventDefault();
          (e.currentTarget as HTMLElement | null)?.querySelector<HTMLElement>('[role^="menuitem"]:not(:disabled), button')?.focus();
        }}>
          {view === 'usage' && spec.usage ? <Usage spec={spec} onBack={() => setView('menu')} /> : <Menu spec={spec} onUsage={() => setView('usage')} />}
        </PopoverContent>
      </Popover>
    </div>
  );
}
