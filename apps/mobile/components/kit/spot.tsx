import { Icon } from '@/components/ui/icon';
import { cn } from '@/lib/utils';
import type { LucideIcon } from 'lucide-react-native';
import { View } from 'react-native';

export type SpotTone = 'muted' | 'primary' | 'success' | 'warning' | 'destructive' | 'info';
export type SpotSize = 'md' | 'lg' | 'xl';

type Props = {
  icon: LucideIcon;
  /** md 64 · lg 80 · xl 96. Default `lg`. */
  size?: SpotSize;
  tone?: SpotTone;
  shape?: 'circle' | 'square';
  /** Draw a soft halo behind the well — the success/celebration treatment. */
  ring?: boolean;
  className?: string;
};

const SIZES: Record<SpotSize, { well: number; icon: number; halo: number }> = {
  md: { well: 64, icon: 28, halo: 88 },
  lg: { well: 80, icon: 36, halo: 108 },
  xl: { well: 96, icon: 44, halo: 128 },
};

const WELL: Record<SpotTone, string> = {
  muted: 'bg-muted',
  primary: 'bg-primary',
  success: 'bg-success',
  warning: 'bg-warning',
  destructive: 'bg-destructive',
  info: 'bg-info',
};

const GLYPH: Record<SpotTone, string> = {
  muted: 'text-muted-foreground',
  primary: 'text-primary-foreground',
  success: 'text-success-foreground',
  warning: 'text-warning-foreground',
  destructive: 'text-destructive-foreground',
  info: 'text-info-foreground',
};

const HALO: Record<SpotTone, string> = {
  muted: 'bg-muted-subtle',
  primary: 'bg-primary-subtle',
  success: 'bg-success-subtle',
  warning: 'bg-warning-subtle',
  destructive: 'bg-destructive-subtle',
  info: 'bg-info-subtle',
};

/**
 * An icon at illustration scale — the kit's stand-in for a spot illustration.
 *
 * This is the whole illustration vocabulary: a bell for notifications, a lock for security,
 * a shield for privacy. Themed, so it follows light/dark and re-brands with the tokens.
 * For the leading slot of a row use `IconCircle` instead; the boundary is 44px.
 */
export function Spot({ icon, size = 'lg', tone = 'muted', shape = 'circle', ring, className }: Props) {
  const s = SIZES[size];
  const radius = shape === 'circle' ? 'rounded-full' : 'rounded-2xl';
  const well = (
    <View className={cn(WELL[tone], radius, 'items-center justify-center')} style={{ width: s.well, height: s.well }}>
      <Icon as={icon} size={s.icon} className={GLYPH[tone]} />
    </View>
  );
  if (!ring) {
    return (
      <View className={className} accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
        {well}
      </View>
    );
  }
  return (
    <View
      className={cn(HALO[tone], radius, 'items-center justify-center', className)}
      style={{ width: s.halo, height: s.halo }}
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants">
      {well}
    </View>
  );
}
