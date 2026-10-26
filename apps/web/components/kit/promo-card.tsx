import { cn } from 'cn';
import { ArrowRightIcon, type LucideIcon, XIcon } from 'lucide-react';
import Link from 'next/link';
import { Placeholder } from '@/components/kit/placeholder';

export type PromoTone = 'primary' | 'success' | 'info' | 'warning' | 'muted';

type Props = {
  title: string;
  body?: string;
  /** The arrow button. `label` is its accessible name (default: the title). Pass `href` to make it a link. */
  action?: { label?: string; onClick?: () => void; href?: string };
  /** Adds the dismiss X. */
  onDismiss?: () => void;
  tone?: PromoTone;
  /** Seed for the generated art on the right. Defaults to the title. */
  seed?: string;
  /** Show an icon instead of the generated art. */
  icon?: LucideIcon;
  className?: string;
};

const SURFACE: Record<PromoTone, string> = {
  primary: 'bg-primary-subtle',
  success: 'bg-success-subtle',
  info: 'bg-info-subtle',
  warning: 'bg-warning-subtle',
  muted: 'bg-muted',
};

const BUTTON: Record<PromoTone, string> = {
  primary: 'bg-primary text-primary-foreground',
  success: 'bg-success text-success-foreground',
  info: 'bg-info text-info-foreground',
  warning: 'bg-warning text-warning-foreground',
  muted: 'bg-foreground text-background',
};

/**
 * The tinted offer card: an upsell, a nudge, a feature announcement.
 *
 * At most one per page, and always dismissible when it is promotional rather than required. The art bleeds off
 * the right edge; it is generated, so it needs no asset.
 */
export function PromoCard({ title, body, action, onDismiss, tone = 'primary', seed, icon: Icon, className }: Props) {
  const buttonClass = cn(
    'focus-visible:ring-ring/50 mt-2 inline-flex size-10 items-center justify-center rounded-lg outline-none transition-opacity hover:opacity-90 focus-visible:ring-[3px]',
    BUTTON[tone]
  );
  return (
    <section aria-label={title} className={cn('relative flex overflow-hidden rounded-xl', SURFACE[tone], className)}>
      <div className="flex min-w-0 flex-1 flex-col items-start gap-2 p-5">
        <p className="pr-6 font-semibold">{title}</p>
        {body ? <p className="text-muted-foreground text-sm leading-5">{body}</p> : null}
        {action ? (
          action.href ? (
            <Link href={action.href} aria-label={action.label ?? title} className={buttonClass}>
              <ArrowRightIcon className="size-[18px]" aria-hidden />
            </Link>
          ) : (
            <button type="button" onClick={action.onClick} aria-label={action.label ?? title} className={buttonClass}>
              <ArrowRightIcon className="size-[18px]" aria-hidden />
            </button>
          )
        ) : null}
      </div>
      <div className="flex w-28 shrink-0 items-end justify-end">
        {Icon ? (
          <span className="flex size-full items-center justify-center">
            <Icon className="text-foreground size-11 opacity-20" aria-hidden />
          </span>
        ) : (
          <div className="-mr-6 -mb-6 size-32 opacity-70">
            <Placeholder seed={seed ?? title} className="rounded-full bg-transparent" />
          </div>
        )}
      </div>
      {onDismiss ? (
        <button
          type="button"
          onClick={onDismiss}
          aria-label="Dismiss"
          className="text-muted-foreground hover:text-foreground focus-visible:ring-ring/50 absolute top-2 right-2 inline-flex size-8 items-center justify-center rounded-md outline-none focus-visible:ring-[3px]">
          <XIcon className="size-4" aria-hidden />
        </button>
      ) : null}
    </section>
  );
}
