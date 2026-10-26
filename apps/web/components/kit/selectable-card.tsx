'use client';
import { cn } from 'cn';
import { CheckIcon, type LucideIcon } from 'lucide-react';

type Props = {
  title: string;
  description?: string;
  icon?: LucideIcon;
  /** Right-aligned detail, e.g. a price. */
  detail?: string;
  selected: boolean;
  onClick: () => void;
  /** `radio` shows a ring, `checkbox` a square. */
  mode?: 'radio' | 'checkbox';
  disabled?: boolean;
  className?: string;
};

/** A whole card as a choice: plans, delivery options, payment methods. Selection is shape and colour. */
export function SelectableCard({ title, description, icon: Icon, detail, selected, onClick, mode = 'radio', disabled, className }: Props) {
  return (
    <button
      type="button"
      role={mode}
      aria-checked={selected}
      disabled={disabled}
      onClick={onClick}
      className={cn(
        'focus-visible:ring-ring/50 flex min-h-14 w-full items-center gap-3 rounded-lg border p-4 text-left shadow-sm transition-colors outline-none focus-visible:ring-[3px] disabled:pointer-events-none disabled:opacity-50',
        selected ? 'border-primary bg-primary-subtle' : 'border-border bg-card hover:bg-accent',
        className
      )}>
      {Icon ? <Icon className={cn('size-5 shrink-0', selected ? 'text-primary' : 'text-muted-foreground')} aria-hidden /> : null}
      <span className="min-w-0 flex-1">
        <span className="block font-medium">{title}</span>
        {description ? <span className="text-muted-foreground block text-sm">{description}</span> : null}
      </span>
      {detail ? <span className="font-semibold">{detail}</span> : null}
      <span
        aria-hidden
        className={cn(
          'flex size-5 shrink-0 items-center justify-center border-2',
          mode === 'radio' ? 'rounded-full' : 'rounded-sm',
          selected ? 'border-primary bg-primary' : 'border-muted-foreground'
        )}>
        {selected ? <CheckIcon className="text-primary-foreground size-3" strokeWidth={3} /> : null}
      </span>
    </button>
  );
}
