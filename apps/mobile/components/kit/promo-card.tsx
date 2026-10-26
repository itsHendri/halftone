import { Placeholder } from '@/components/kit/placeholder';
import { Icon } from '@/components/ui/icon';
import { Text } from '@/components/ui/text';
import { haptic } from '@/lib/haptics';
import { cn } from '@/lib/utils';
import { ArrowRightIcon, XIcon, type LucideIcon } from 'lucide-react-native';
import { Pressable, View } from 'react-native';

export type PromoTone = 'primary' | 'success' | 'info' | 'warning' | 'muted';

type Props = {
  title: string;
  body?: string;
  /** The circular arrow button. `label` is its accessible name. */
  action?: { label?: string; onPress: () => void };
  /** Adds the dismiss X. */
  onDismiss?: () => void;
  tone?: PromoTone;
  /** Seed for the generated art on the right. Defaults to the title. */
  seed?: string;
  /** Show an icon instead of the generated art. */
  icon?: LucideIcon;
  className?: string;
};

const SURFACE: Record<PromoTone, string> = {
  primary: 'bg-primary-subtle',
  success: 'bg-success-subtle',
  info: 'bg-info-subtle',
  warning: 'bg-warning-subtle',
  muted: 'bg-muted',
};

const BUTTON: Record<PromoTone, string> = {
  primary: 'bg-primary',
  success: 'bg-success',
  info: 'bg-info',
  warning: 'bg-warning',
  muted: 'bg-foreground',
};

const GLYPH: Record<PromoTone, string> = {
  primary: 'text-primary-foreground',
  success: 'text-success-foreground',
  info: 'text-info-foreground',
  warning: 'text-warning-foreground',
  muted: 'text-background',
};

/**
 * The tinted offer card — an upsell, a nudge, a feature announcement.
 *
 * At most one per screen, and always dismissible when it is promotional rather than
 * required. The art bleeds off the right edge; it is generated, so it needs no asset.
 */
export function PromoCard({ title, body, action, onDismiss, tone = 'primary', seed, icon, className }: Props) {
  return (
    <View className={cn('overflow-hidden rounded-2xl', SURFACE[tone], className)}>
      <View className="flex-row">
        <View className="flex-1 gap-2 p-5">
          <Text className="pr-6 text-base font-semibold">{title}</Text>
          {body ? <Text className="text-muted-foreground text-sm leading-5">{body}</Text> : null}
          {action ? (
            <Pressable
              onPress={() => {
                haptic('selection');
                action.onPress();
              }}
              accessibilityRole="button"
              accessibilityLabel={action.label ?? title}
              className={cn('mt-2 size-11 items-center justify-center rounded-full active:opacity-80', BUTTON[tone])}>
              <Icon as={ArrowRightIcon} size={18} className={GLYPH[tone]} />
            </Pressable>
          ) : null}
        </View>
        <View className="w-28 justify-end">
          {icon ? (
            <View className="flex-1 items-center justify-center">
              <Icon as={icon} size={44} className="text-foreground opacity-20" />
            </View>
          ) : (
            <View className="-mb-6 -mr-6 h-32 w-32 opacity-70">
              <Placeholder seed={seed ?? title} ratio={1} className="rounded-full bg-transparent" />
            </View>
          )}
        </View>
      </View>
      {onDismiss ? (
        <Pressable
          onPress={onDismiss}
          hitSlop={8}
          accessibilityRole="button"
          accessibilityLabel="Dismiss"
          className="absolute right-2 top-2 size-11 items-center justify-center rounded-full active:opacity-70">
          <Icon as={XIcon} size={18} className="text-muted-foreground" />
        </Pressable>
      ) : null}
    </View>
  );
}
