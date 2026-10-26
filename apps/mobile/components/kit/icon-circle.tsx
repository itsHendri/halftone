import { Icon } from '@/components/ui/icon';
import { cn } from '@/lib/utils';
import type { LucideIcon } from 'lucide-react-native';
import { View } from 'react-native';

export type IconCircleTone = 'muted' | 'primary' | 'success' | 'warning' | 'destructive' | 'info';

type Props = React.ComponentProps<typeof View> & {
  as: LucideIcon;
  /** Diameter. Default 36 (list rows). */
  size?: number;
  /** `square` is the rounded-square well. Default `circle`. */
  shape?: 'circle' | 'square';
  tone?: IconCircleTone;
  iconClassName?: string;
};

const WELL: Record<IconCircleTone, string> = {
  muted: 'bg-muted',
  primary: 'bg-primary-subtle',
  success: 'bg-success-subtle',
  warning: 'bg-warning-subtle',
  destructive: 'bg-destructive-subtle',
  info: 'bg-info-subtle',
};

const GLYPH: Record<IconCircleTone, string> = {
  muted: 'text-foreground',
  primary: 'text-primary',
  success: 'text-success',
  warning: 'text-warning',
  destructive: 'text-destructive',
  info: 'text-info',
};

/**
 * A lucide icon in a small well — the leading slot of a ListRow, a feature bullet.
 *
 * Row scale only. At illustration scale (64px and up) use `Spot`.
 */
export function IconCircle({ as, size = 36, shape = 'circle', tone = 'muted', className, iconClassName, style, ...props }: Props) {
  return (
    <View
      className={cn(WELL[tone], shape === 'circle' ? 'rounded-full' : 'rounded-xl', 'items-center justify-center', className)}
      style={[{ width: size, height: size }, style]}
      {...props}>
      <Icon as={as} size={Math.round(size * 0.5)} className={cn(GLYPH[tone], iconClassName)} />
    </View>
  );
}
