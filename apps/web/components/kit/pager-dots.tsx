import { cn } from 'cn';

type Props = { count: number; activeIndex: number; className?: string };

/** Page indicator for pagers and intro sliders. Active dot is a short bar. */
export function PagerDots({ count, activeIndex, className }: Props) {
  return (
    <div role="img" aria-label={`Page ${activeIndex + 1} of ${count}`} className={cn('flex items-center justify-center gap-1.5', className)}>
      {Array.from({ length: count }).map((_, i) => (
        <span key={i} className={cn('h-1.5 rounded-full transition-[width] motion-reduce:transition-none', i === activeIndex ? 'bg-foreground w-4' : 'bg-border w-1.5')} />
      ))}
    </div>
  );
}
