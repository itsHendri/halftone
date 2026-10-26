import { Icon } from '@/components/ui/icon';
import { Text } from '@/components/ui/text';
import { labelClass } from '@/lib/component-classes';
import { haptic } from '@/lib/haptics';
import { TOKENS } from '@/lib/theme';
import { cn } from '@/lib/utils';
import type { LucideIcon } from 'lucide-react-native';
import { Platform, Pressable, ScrollView, View } from 'react-native';

type ChipProps = {
  label: string;
  /** S, M or L (h-chip-*); M by default. */
  size?: 'sm' | 'md' | 'lg';
  selected?: boolean;
  onPress?: () => void;
  icon?: LucideIcon;
  disabled?: boolean;
  className?: string;
};

const chip = TOKENS.components.chip;
const HEIGHT = { sm: 'h-chip-sm', md: 'h-chip-md', lg: 'h-chip-lg' } as const;
/** Phones raise a tap target under 44pt to 44 (hitSlop): the chip keeps its drawn height. */
const slop = (size: keyof typeof HEIGHT) => (Platform.OS === 'web' ? 0 : Math.max(0, Math.ceil((44 - chip.height[size]) / 2)));
const TEXT = cn(
  'text-type-chip leading-type-chip',
  labelClass(chip.text),
  (Platform.OS === 'web' || chip.text.tracking !== 0) && 'tracking-type-chip',
  chip.text.font === 'heading' && 'font-heading',
  chip.text.font === 'mono' && 'font-mono'
);

/**
 * A filter chip, drawn from the theme's Chip (semantic.component.chip, --chip-*): its size, border, gap, text and
 * icon. Selected is a role: inverted (foreground on background) by default, so it reads as a filter rather than an
 * action.
 */
export function FilterChip({ label, selected, onPress, icon, size = 'md', disabled, className }: ChipProps) {
  const SLOP = slop(size);
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ selected: !!selected, disabled: !!disabled }}
      // aria-pressed is web-only (react-native-web drops accessibilityState, and a button may not carry aria-selected).
      aria-pressed={!!selected}
      disabled={disabled}
      hitSlop={SLOP ? { top: SLOP, bottom: SLOP } : undefined}
      onPress={() => {
        haptic('selection');
        onPress?.();
      }}
      className={cn(
        HEIGHT[size],
        'flex-row items-center gap-chip-gap rounded-chip border-chip px-chip-x',
        selected
          ? 'bg-chip-selected-bg border-chip-selected-border active:bg-chip-selected-pressed'
          : 'bg-chip-unselected-bg border-chip-unselected-border active:bg-chip-unselected-pressed',
        disabled && 'opacity-50',
        className
      )}>
      {icon ? <Icon as={icon} size={chip.icon ?? 14} className={selected ? 'text-chip-selected-fg' : 'text-chip-unselected-fg'} /> : null}
      <Text className={cn(TEXT, selected ? 'text-chip-selected-fg' : 'text-chip-unselected-fg')}>{label}</Text>
    </Pressable>
  );
}

type RowProps = { children: React.ReactNode; className?: string };

/** Horizontal, scrollable row of FilterChips. */
export function FilterChipRow({ children, className }: RowProps) {
  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} className={cn('flex-grow-0 self-stretch', className)} contentContainerClassName="gap-2 px-5">
      <View className="flex-row gap-2">{children}</View>
    </ScrollView>
  );
}
