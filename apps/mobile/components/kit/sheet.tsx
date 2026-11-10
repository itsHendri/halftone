import { Icon } from '@/components/ui/icon';
import { Text } from '@/components/ui/text';
import { haptic } from '@/lib/haptics';
import { MOTION } from '@/lib/theme';
import { cn } from '@/lib/utils';
import { useMotion } from '@/lib/reduced-motion';
import { CheckIcon, type LucideIcon } from 'lucide-react-native';
import * as React from 'react';
import { Animated, Easing, Modal, Pressable, ScrollView, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

type SheetProps = {
  open: boolean;
  onClose: () => void;
  title?: string;
  description?: string;
  children: React.ReactNode;
  /** Extra classes for the panel. */
  className?: string;
};

/**
 * Bottom sheet shell: scrim + slide-up panel + drag handle. Scrolls, capped at 85% height.
 * Base for OptionSheet and ActionSheet; use directly for custom content.
 */
export function Sheet({ open, onClose, title, description, children, className }: SheetProps) {
  const insets = useSafeAreaInsets();
  const [translateY] = React.useState(() => new Animated.Value(400));
  const motion = useMotion();

  React.useEffect(() => {
    if (!open) return;
    translateY.setValue(400);
    Animated.timing(translateY, {
      toValue: 0,
      duration: motion(MOTION.duration.slow),
      easing: Easing.bezier(...MOTION.easing.emphasized),
      useNativeDriver: true,
    }).start();
  }, [open, translateY, motion]);

  return (
    <Modal visible={open} transparent animationType="fade" statusBarTranslucent onRequestClose={onClose}>
      <View className="flex-1 justify-end">
        <Pressable className="absolute inset-0 bg-black/50" onPress={onClose} accessibilityRole="button" accessibilityLabel="Close" />
        {/* The surface lives on a plain View: NativeWind classNames are dropped on
            Animated.View on web, which left the panel transparent in the preview. */}
        <Animated.View style={{ maxHeight: '85%', transform: [{ translateY }] }}>
          <View
            className={cn('bg-card rounded-t-2xl', className)}
            style={{ paddingBottom: Math.max(insets.bottom, 16) }}>
            <View className="items-center pb-3 pt-3">
              <View className="bg-border h-1 w-9 rounded-full" />
            </View>
            {title || description ? (
              <View className="gap-0.5 px-5 pb-3">
                {title ? <Text variant="large" className="font-heading">{title}</Text> : null}
                {description ? <Text className="text-muted-foreground text-sm">{description}</Text> : null}
              </View>
            ) : null}
            <ScrollView bounces={false} keyboardShouldPersistTaps="handled">
              {children}
            </ScrollView>
          </View>
        </Animated.View>
      </View>
    </Modal>
  );
}

export type SheetOption<T extends string> = { value: T; label: string; description?: string; icon?: LucideIcon };

type OptionSheetProps<T extends string> = {
  open: boolean;
  onClose: () => void;
  title: string;
  options: readonly SheetOption<T>[];
  value?: T;
  onChange: (value: T) => void;
};

/** Pick one of N values; closes on selection. */
export function OptionSheet<T extends string>({ open, onClose, title, options, value, onChange }: OptionSheetProps<T>) {
  return (
    <Sheet open={open} onClose={onClose} title={title}>
      {options.map((o, i) => {
        const selected = o.value === value;
        return (
          <Pressable
            key={o.value}
            accessibilityRole="button"
            accessibilityState={{ selected }}
            // aria-pressed is web-only (react-native-web drops accessibilityState, and a button may not carry aria-selected).
            aria-pressed={selected}
            onPress={() => {
              haptic('selection');
              onChange(o.value);
              onClose();
            }}
            className={cn('min-h-14 flex-row items-center gap-3 px-5 py-3 active:bg-accent', i < options.length - 1 && 'border-border border-b')}>
            {o.icon ? <Icon as={o.icon} size={20} className="text-muted-foreground" /> : null}
            <View className="flex-1">
              <Text className={cn(selected ? 'font-semibold' : 'font-normal')}>{o.label}</Text>
              {o.description ? <Text className="text-muted-foreground text-sm">{o.description}</Text> : null}
            </View>
            {selected ? <Icon as={CheckIcon} size={20} className="text-primary" /> : null}
          </Pressable>
        );
      })}
    </Sheet>
  );
}

export type ActionSheetItem = { label: string; icon?: LucideIcon; destructive?: boolean; disabled?: boolean; onPress: () => void };

type ActionSheetProps = {
  open: boolean;
  onClose: () => void;
  title?: string;
  description?: string;
  items: ActionSheetItem[];
  cancelLabel?: string;
};

/** A list of actions (share, edit, delete…) plus Cancel. Each row fires its own callback. */
export function ActionSheet({ open, onClose, title, description, items, cancelLabel = 'Cancel' }: ActionSheetProps) {
  return (
    <Sheet open={open} onClose={onClose} title={title} description={description}>
      {items.map((item, i) => (
        <Pressable
          key={item.label}
          accessibilityRole="button"
          disabled={item.disabled}
          onPress={() => {
            haptic(item.destructive ? 'heavy' : 'selection');
            item.onPress();
            onClose();
          }}
          className={cn('min-h-14 flex-row items-center gap-3 px-5 py-3 active:bg-accent', i < items.length - 1 && 'border-border border-b', item.disabled && 'opacity-40')}>
          {item.icon ? <Icon as={item.icon} size={20} className={item.destructive ? 'text-destructive' : 'text-foreground'} /> : null}
          <Text className={cn('flex-1', item.destructive && 'text-destructive')}>{item.label}</Text>
        </Pressable>
      ))}
      <Pressable accessibilityRole="button" onPress={onClose} className="bg-muted mx-5 mt-3 h-control items-center justify-center rounded-lg active:opacity-70">
        <Text className="font-semibold">{cancelLabel}</Text>
      </Pressable>
    </Sheet>
  );
}
