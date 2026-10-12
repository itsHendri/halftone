import { cn } from 'cn';
import type { LucideIcon } from 'lucide-react';

export type ActionTileItem = {
  icon: LucideIcon;
  label: string;
  onClick?: () => void;
  /** Or a link. */
  href?: string;
  /** A count, or `true` for a bare dot. */
  badge?: number | boolean;
  disabled?: boolean;
};

type Props = {
  /** 3 or 4. They share the width equally; more than 4 gets cramped. */
  items: ActionTileItem[];
  className?: string;
};

/**
 * The row of primary shortcuts under a page's hero: Add funds · Pay · Send · More.
 *
 * Keep to one row: the last tile should be "More" rather than a second row of tiles.
 */
export function ActionGrid({ items, className }: Props) {
  return (
    <div className={cn('flex gap-3', className)}>
      {items.map((item) => {
        const Icon = item.icon;
        const tileClass = cn(
          'group flex min-w-0 flex-1 flex-col items-center gap-2 rounded-lg outline-none focus-visible:ring-ring/50 focus-visible:ring-[3px]',
          item.disabled && 'pointer-events-none opacity-50'
        );
        const body = (
          <>
            <span className="bg-muted group-hover:bg-accent relative flex aspect-square w-full max-w-20 items-center justify-center rounded-xl transition-colors">
              <Icon className="text-foreground size-6" aria-hidden />
              {typeof item.badge === 'number' ? (
                <span
                  aria-label={`${item.badge} new`}
                  className="bg-destructive text-destructive-foreground border-background absolute -top-1 -right-1 flex h-5 min-w-5 items-center justify-center rounded-full border-2 px-1 text-xs leading-none font-bold">
                  {item.badge}
                </span>
              ) : item.badge ? (
                <span aria-label="New" className="bg-destructive border-background absolute top-1.5 right-1.5 size-3 rounded-full border-2" />
              ) : null}
            </span>
            <span className="line-clamp-2 text-center text-xs font-medium">{item.label}</span>
          </>
        );
        return item.href ? (
          <a key={item.label} href={item.href} aria-disabled={item.disabled} className={tileClass}>
            {body}
          </a>
        ) : (
          <button key={item.label} type="button" onClick={item.onClick} disabled={item.disabled} className={tileClass}>
            {body}
          </button>
        );
      })}
    </div>
  );
}
