import { cn } from 'cn';
import * as React from 'react';

type Props = {
  children: React.ReactNode;
  /** No fill and no top border, for actions floating over hero art. */
  transparent?: boolean;
  className?: string;
};

/**
 * An action bar that sticks to the bottom of its scroll container, clear of the home indicator. Children share
 * the width equally (one child fills it). Put it last inside the scrolling element.
 */
export function StickyBottomBar({ children, transparent, className }: Props) {
  const kids = React.Children.toArray(children);
  return (
    <div
      className={cn(
        'sticky bottom-0 z-10 flex gap-3 px-5 pt-3 pb-[max(0.75rem,env(safe-area-inset-bottom))]',
        !transparent && 'bg-background/95 border-border supports-[backdrop-filter]:bg-background/80 border-t backdrop-blur',
        className
      )}>
      {kids.map((k, i) => (
        <div key={i} className="flex min-w-0 flex-1 *:w-full">
          {k}
        </div>
      ))}
    </div>
  );
}
