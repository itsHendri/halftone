import { cn } from 'cn';
import { CheckIcon } from 'lucide-react';
import type * as React from 'react';
import { Spinner } from '@/components/kit/spinner';
import { Spot } from '@/components/kit/spot';

type Props = {
  title: string;
  body?: string;
  /** Big primary-coloured amount between title and body. */
  amount?: string;
  amountSubtitle?: string;
  /** Spinner instead of the check; hides the text, for in-flight operations. */
  loading?: boolean;
  /** Extra content under the body (SummaryCard, buttons…). */
  children?: React.ReactNode;
  className?: string;
};

/**
 * The one success template: check, title, optional amount, body, left-aligned in a column centred on the page.
 * Actions go under it (or in a StickyBottomBar).
 */
export function SuccessScreen({ title, body, amount, amountSubtitle, loading, children, className }: Props) {
  return (
    <div className={cn('flex flex-1 flex-col justify-center px-6 py-12', className)}>
      <div className="mx-auto flex w-full max-w-sm flex-col items-start">
        {loading ? (
          <span className="bg-muted mb-6 flex size-24 items-center justify-center rounded-full">
            <Spinner size="large" />
          </span>
        ) : (
          <>
            <Spot icon={CheckIcon} size="xl" tone="success" className="mb-6" />
            <div role="status" className="flex w-full flex-col gap-2">
              <h2 className="type-h3">{title}</h2>
              {amount ? <p className="text-primary text-4xl font-bold tabular-nums">{amount}</p> : null}
              {amountSubtitle ? <p className="text-muted-foreground">{amountSubtitle}</p> : null}
              {body ? <p className="text-muted-foreground">{body}</p> : null}
            </div>
            {children ? <div className="mt-6 w-full">{children}</div> : null}
          </>
        )}
      </div>
    </div>
  );
}
