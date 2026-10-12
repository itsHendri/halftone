import { cn } from 'cn';
import type { LucideIcon } from 'lucide-react';

export type IconCircleTone = 'muted' | 'primary' | 'success' | 'warning' | 'destructive' | 'info';

type Props = {
  as: LucideIcon;
  /** Diameter (px). Default 36 (list rows). */
  size?: number;
  /** `square` is the rounded-square well. Default `circle`. */
  shape?: 'circle' | 'square';
  tone?: IconCircleTone;
  className?: string;
  iconClassName?: string;
};

const WELL: Record<IconCircleTone, string> = {
  muted: 'bg-muted',
  primary: 'bg-primary/15',
  success: 'bg-success/15',
  warning: 'bg-warning/15',
  destructive: 'bg-destructive/15',
  info: 'bg-info/15',
};
const GLYPH: Record<IconCircleTone, string> = {
  muted: 'text-foreground',
  primary: 'text-primary',
  success: 'text-success',
  warning: 'text-warning',
  destructive: 'text-destructive',
  info: 'text-info',
};

/** A lucide icon in a small well: the leading slot of a ListRow, a feature bullet. Row scale only (32–64px). */
export function IconCircle({ as: Icon, size = 36, shape = 'circle', tone = 'muted', className, iconClassName }: Props) {
  const glyph = Math.round(size * 0.5);
  return (
    <span className={cn(WELL[tone], shape === 'circle' ? 'rounded-full' : 'rounded-xl', 'flex shrink-0 items-center justify-center', className)} style={{ width: size, height: size }} aria-hidden>
      <Icon className={cn(GLYPH[tone], iconClassName)} style={{ width: glyph, height: glyph }} />
    </span>
  );
}
