import { cn } from 'cn';
import type { LucideIcon } from 'lucide-react';
import type * as React from 'react';

type Props = Omit<React.ComponentProps<'button'>, 'children'> & {
  icon: LucideIcon;
  /** Adds a label: an extended button instead of a square. Without one, pass `aria-label`. */
  label?: string;
  variant?: 'primary' | 'secondary';
  /** `inline` renders in flow; the others pin to the corner or centre of the nearest positioned parent (`fixed` it yourself to pin to the viewport). */
  position?: 'inline' | 'bottom-right' | 'bottom-center';
};

/**
 * A button that floats OVER the scroll rather than sitting in it, so a page's one most important action
 * stays reachable however far down you are: add, compose, new.
 *
 * Material calls this a FAB. Use an ordinary `Button` for anything that belongs in the content flow. One per page.
 */
export function FloatingButton({ icon: Icon, label, variant = 'primary', position = 'inline', className, type = 'button', ...props }: Props) {
  return (
    <button
      type={type}
      className={cn(
        'focus-visible:ring-ring/50 inline-flex h-14 items-center justify-center gap-2 rounded-xl shadow-lg shadow-black/20 transition-colors outline-none focus-visible:ring-[3px] disabled:pointer-events-none disabled:opacity-50',
        label ? 'px-5' : 'w-14',
        variant === 'primary' ? 'bg-primary text-primary-foreground hover:bg-primary/90' : 'bg-secondary text-secondary-foreground hover:bg-secondary/80',
        position === 'bottom-right' && 'absolute right-5 bottom-6',
        position === 'bottom-center' && 'absolute bottom-6 left-1/2 -translate-x-1/2',
        className
      )}
      {...props}>
      <Icon className="size-[22px]" aria-hidden />
      {label ? <span className="font-semibold">{label}</span> : null}
    </button>
  );
}
