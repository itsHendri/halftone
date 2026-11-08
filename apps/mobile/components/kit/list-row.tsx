import { Icon } from '@/components/ui/icon';
import { Text } from '@/components/ui/text';
import { cn } from '@/lib/utils';
import { CheckIcon, ChevronRightIcon } from 'lucide-react-native';
import type { ReactNode } from 'react';
import { Pressable, View } from 'react-native';

type Props = {
  /** Leading visual — usually an IconCircle or Avatar. */
  leading?: ReactNode;
  /** Turns the row into a choice. The whole row is the control, so pass `onPress` too. */
  select?: { mode: 'radio' | 'checkbox'; selected: boolean };
  title: string;
  subtitle?: string;
  /**
   * Let the title and subtitle run onto more lines instead of cutting them to one, and top-align the leading and
   * trailing content. For rows whose text is the point (a to-do, a note); keep one line for scannable lists.
   */
  wrap?: boolean;
  /** Right-aligned value. */
  value?: string;
  valueClassName?: string;
  /** Small line under the value. */
  sublabel?: string;
  sublabelClassName?: string;
  /** Custom trailing content; replaces value/sublabel. */
  trailing?: ReactNode;
  /** Show a chevron (navigation rows). */
  chevron?: boolean;
  onPress?: () => void;
  disabled?: boolean;
  /** Suppress the bottom divider (last row in a card). */
  last?: boolean;
  className?: string;
};

/**
 * The canonical list row: leading · title/subtitle · value/sublabel or trailing.
 * 12px vertical padding, hairline divider. Never rebuild this inline.
 */
export function ListRow({
  leading,
  select,
  title,
  subtitle,
  wrap,
  value,
  valueClassName,
  sublabel,
  sublabelClassName,
  trailing,
  chevron,
  onPress,
  disabled,
  last,
  className,
}: Props) {
  const body = (
    <>
      {leading}
      <View className="flex-1">
        <Text className="font-medium" numberOfLines={wrap ? undefined : 1}>
          {title}
        </Text>
        {subtitle ? (
          <Text className="text-muted-foreground text-sm" numberOfLines={wrap ? undefined : 1}>
            {subtitle}
          </Text>
        ) : null}
      </View>
      {trailing ??
        (value || sublabel ? (
          <View className="items-end">
            {value ? <Text className={cn('font-semibold', valueClassName)}>{value}</Text> : null}
            {sublabel ? <Text className={cn('text-muted-foreground text-sm', sublabelClassName)}>{sublabel}</Text> : null}
          </View>
        ) : null)}
      {select ? (
        <View
          className={cn(
            'size-6 items-center justify-center border-2',
            select.mode === 'radio' ? 'rounded-full' : 'rounded-md',
            select.selected ? 'border-foreground bg-foreground' : 'border-border'
          )}>
          {select.selected ? (
            select.mode === 'radio' ? (
              <View className="bg-background size-2 rounded-full" />
            ) : (
              <Icon as={CheckIcon} size={14} className="text-background" />
            )
          ) : null}
        </View>
      ) : null}
      {chevron ? <Icon as={ChevronRightIcon} className="text-muted-foreground" size={18} /> : null}
    </>
  );
  const base = cn('min-h-14 flex-row gap-3 py-3', wrap ? 'items-start' : 'items-center', !last && 'border-border border-b', disabled && 'opacity-50', className);
  if (onPress) {
    return (
      <Pressable
        accessibilityRole={select ? (select.mode === 'radio' ? 'radio' : 'checkbox') : 'button'}
        aria-checked={select ? select.selected : undefined}
        aria-disabled={!!disabled}
        onPress={onPress}
        disabled={disabled}
        className={cn(base, 'active:opacity-70')}>
        {body}
      </Pressable>
    );
  }
  return <View className={base}>{body}</View>;
}
