'use client';
import { ShieldAlertIcon } from 'lucide-react';
import { cn } from 'cn';
import * as React from 'react';
import { Button } from '@/components/ui/button';

type Props = {
  /** The action, as a sentence the person can say yes to: "Refund £48.00 to Alex Morgan". */
  title: string;
  /** The consequence: what changes, and whether it can be undone. */
  description?: string;
  /** Read-only details that matter for the decision. */
  details?: { label: string; value: string }[];
  onApprove: () => void;
  onDeny: () => void;
  approveLabel?: string;
  denyLabel?: string;
  className?: string;
};

/**
 * Consent before consequence: the assistant asks before it does something irreversible or costly. Once
 * answered it shows the decision instead of the buttons.
 */
export function ApprovalCard({ title, description, details, onApprove, onDeny, approveLabel = 'Approve', denyLabel = 'Not now', className }: Props) {
  const [decision, setDecision] = React.useState<'approved' | 'denied' | null>(null);
  return (
    <div className={cn('border-warning-border bg-warning-subtle flex flex-col gap-3 rounded-xl border p-4', className)}>
      <div className="flex gap-3">
        <ShieldAlertIcon className="text-warning mt-0.5 size-5 shrink-0" aria-hidden />
        <div className="flex flex-col gap-1">
          <p className="font-semibold">{title}</p>
          {description ? <p className="text-muted-foreground text-sm">{description}</p> : null}
        </div>
      </div>
      {details?.length ? (
        <dl className="bg-card grid gap-x-4 gap-y-1 rounded-lg p-3 text-sm sm:grid-cols-[auto_1fr]">
          {details.map((d) => (
            <React.Fragment key={d.label}>
              <dt className="text-muted-foreground">{d.label}</dt>
              <dd className="font-medium">{d.value}</dd>
            </React.Fragment>
          ))}
        </dl>
      ) : null}
      {decision ? (
        <p role="status" className="text-sm font-medium">
          {decision === 'approved' ? 'Approved. The assistant will go ahead.' : 'Declined. Nothing was changed.'}
        </p>
      ) : (
        <div className="flex flex-wrap gap-2">
          <Button
            size="sm"
            onClick={() => {
              setDecision('approved');
              onApprove();
            }}>
            {approveLabel}
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={() => {
              setDecision('denied');
              onDeny();
            }}>
            {denyLabel}
          </Button>
        </div>
      )}
    </div>
  );
}
