import { cn } from 'cn';
import type * as React from 'react';

type Props = {
  title: string;
  description?: React.ReactNode;
  /** Buttons on the right (wraps under the title on small screens). One primary action at most. */
  actions?: React.ReactNode;
  /** Small line above the title: a breadcrumb or a section name. */
  eyebrow?: React.ReactNode;
  className?: string;
};

/** The page title block: one per page, first in the content. */
export function PageHeader({ title, description, actions, eyebrow, className }: Props) {
  return (
    <header className={cn('flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between', className)}>
      <div className="flex min-w-0 flex-col gap-1.5">
        {eyebrow ? <div className="text-muted-foreground text-sm">{eyebrow}</div> : null}
        <h1 className="type-h3 sm:type-h2">{title}</h1>
        {description ? <p className="text-muted-foreground max-w-2xl">{description}</p> : null}
      </div>
      {actions ? <div className="flex shrink-0 flex-wrap gap-2">{actions}</div> : null}
    </header>
  );
}
