import { cn } from 'cn';

type Props = {
  children: string;
  /** Trailing link: "Learn more", "Read the terms". */
  action?: { label: string; href?: string; onClick?: () => void };
  className?: string;
};

/** Small print at the foot of a page: disclosures, legal copy, data notes. */
export function Footnote({ children, action, className }: Props) {
  const linkClass = 'focus-visible:ring-ring/50 self-start rounded-sm text-xs font-semibold underline underline-offset-2 outline-none focus-visible:ring-[3px]';
  return (
    <div className={cn('flex flex-col gap-2', className)}>
      <p className="text-muted-foreground text-xs leading-5">{children}</p>
      {action ? (
        action.href ? (
          <a href={action.href} className={linkClass}>
            {action.label}
          </a>
        ) : (
          <button type="button" onClick={action.onClick} className={linkClass}>
            {action.label}
          </button>
        )
      ) : null}
    </div>
  );
}
