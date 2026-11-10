'use client';
import { cn } from 'cn';

/**
 * On or off, in a panel row. The thumb's side says which, not only the fill: off sits left on the input colour, on
 * sits right on the primary colour. Space or Enter toggles.
 */
export function ControlSwitch({ label, checked, onChange, id, className }: { label: string; checked: boolean; onChange: (checked: boolean) => void; id?: string; className?: string }) {
  return (
    <button
      id={id}
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={id ? undefined : label}
      onClick={() => onChange(!checked)}
      className={cn(
        'focus-visible:ring-ring/50 relative inline-flex h-5 w-9 shrink-0 items-center rounded-full p-0.5 outline-none focus-visible:ring-[3px]',
        checked ? 'bg-primary' : 'bg-input',
        className
      )}>
      <span aria-hidden className={cn('bg-card block size-4 rounded-full shadow-sm motion-safe:transition-transform motion-safe:duration-150', checked && 'translate-x-4')} />
    </button>
  );
}
