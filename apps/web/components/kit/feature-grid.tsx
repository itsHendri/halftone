import type { LucideIcon } from 'lucide-react';
import { cn } from 'cn';

export type Feature = { icon: LucideIcon; title: string; description: string };

type Props = {
  features: Feature[];
  /** 2 for detail, 3 for a scan (default). */
  columns?: 2 | 3;
  className?: string;
};

/**
 * What the product does, in 3–6 short blocks. Vary the copy: identical icon-title-body cards repeated
 * twelve times is the anti-pattern this replaces, not the goal.
 */
export function FeatureGrid({ features, columns = 3, className }: Props) {
  return (
    <ul className={cn('grid gap-8 sm:grid-cols-2', columns === 3 && 'lg:grid-cols-3', className)}>
      {features.map(({ icon: Icon, title, description }) => (
        <li key={title} className="flex flex-col gap-3">
          {/* halftone-tokens-ignore tint-text: holds only an icon, which needs 3:1 (the token gate checks it) */}
          <span className="bg-primary/10 text-primary flex size-10 items-center justify-center rounded-lg">
            <Icon className="size-5" aria-hidden />
          </span>
          <h3 className="font-semibold">{title}</h3>
          <p className="text-muted-foreground leading-7">{description}</p>
        </li>
      ))}
    </ul>
  );
}
