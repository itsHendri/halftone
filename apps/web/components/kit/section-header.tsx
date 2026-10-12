import { cn } from 'cn';
import Link from 'next/link';

type Props = {
  title: string;
  /** Optional trailing text action ("See all"). */
  action?: string;
  onAction?: () => void;
  /** Or make the action a link. */
  actionHref?: string;
  /** Heading level. Default 2. */
  level?: 2 | 3;
  className?: string;
};

/** Section title with optional action. Sits OUTSIDE the card it introduces. */
export function SectionHeader({ title, action, onAction, actionHref, level = 2, className }: Props) {
  const Heading = level === 3 ? 'h3' : 'h2';
  const actionClass = 'text-primary focus-visible:ring-ring/50 rounded-sm text-sm font-medium outline-none hover:underline focus-visible:ring-[3px]';
  return (
    <div className={cn('flex items-end justify-between gap-4', className)}>
      <Heading className="text-lg font-semibold">{title}</Heading>
      {action ? (
        actionHref ? (
          <Link href={actionHref} className={actionClass}>
            {action}
          </Link>
        ) : (
          <button type="button" onClick={onAction} className={actionClass}>
            {action}
          </button>
        )
      ) : null}
    </div>
  );
}
