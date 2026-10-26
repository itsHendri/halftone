import { Icon } from '@/components/ui/icon';
import { Text } from '@/components/ui/text';
import { haptic } from '@/lib/haptics';
import { cn } from '@/lib/utils';
import { CheckIcon, type LucideIcon } from 'lucide-react-native';
import { Pressable, View } from 'react-native';

type Props = {
  title: string;
  description?: string;
  icon?: LucideIcon;
  /** Right-aligned detail, e.g. a price. */
  detail?: string;
  selected: boolean;
  onPress: () => void;
  /** `radio` shows a ring, `checkbox` a square. */
  mode?: 'radio' | 'checkbox';
  disabled?: boolean;
  className?: string;
};

/** A whole card as a choice — plans, delivery options, payment methods. Selection is shape + colour. */
export function SelectableCard({ title, description, icon, detail, selected, onPress, mode = 'radio', disabled, className }: Props) {
  return (
    <Pressable
      accessibilityRole={mode === 'radio' ? 'radio' : 'checkbox'}
      // react-native-web renders the aria-* props and ignores accessibilityState; native merges both.
      // `selected` stays native-only: aria-selected is not allowed on a radio or checkbox.
      accessibilityState={{ selected }}
      aria-checked={selected}
      aria-disabled={disabled}
      disabled={disabled}
      onPress={() => {
        haptic('selection');
        onPress();
      }}
      className={cn(
        'min-h-14 flex-row items-center gap-3 rounded-lg border p-4 shadow-md',
        selected ? 'border-primary bg-primary-subtle' : 'border-border bg-card active:bg-accent',
        disabled && 'opacity-50',
        className
      )}>
      {icon ? <Icon as={icon} size={22} className={selected ? 'text-primary' : 'text-muted-foreground'} /> : null}
      <View className="flex-1">
        <Text className="font-medium">{title}</Text>
        {description ? <Text className="text-muted-foreground text-sm">{description}</Text> : null}
      </View>
      {detail ? <Text className="font-semibold">{detail}</Text> : null}
      <View
        className={cn(
          'size-5 items-center justify-center border-2',
          mode === 'radio' ? 'rounded-full' : 'rounded-sm',
          selected ? 'border-primary bg-primary' : 'border-muted-foreground'
        )}>
        {selected ? <Icon as={CheckIcon} size={12} className="text-primary-foreground" strokeWidth={3} /> : null}
      </View>
    </Pressable>
  );
}
