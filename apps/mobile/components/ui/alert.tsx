import { Icon } from '@/components/ui/icon';
import { Text, TextClassContext } from '@/components/ui/text';
import { cn } from '@/lib/utils';
import { cva, type VariantProps } from 'class-variance-authority';
import { XIcon, type LucideIcon } from 'lucide-react-native';
import * as React from 'react';
import { Pressable, View } from 'react-native';

/** Tone-tinted alert surfaces: background, border and icon share the semantic colour. */
const alertVariants = cva('relative w-full rounded-lg border px-4 py-4', {
  variants: {
    variant: {
      default: 'bg-card border-border',
      info: 'bg-info-subtle border-info-border',
      success: 'bg-success-subtle border-success-border',
      warning: 'bg-warning-subtle border-warning-border',
      destructive: 'bg-destructive-subtle border-destructive-border',
    },
  },
  defaultVariants: { variant: 'default' },
});

const ICON_TONE: Record<NonNullable<VariantProps<typeof alertVariants>['variant']>, string> = {
  default: 'text-foreground',
  info: 'text-info',
  success: 'text-success',
  warning: 'text-warning',
  destructive: 'text-destructive',
};

function Alert({
  className,
  variant = 'default',
  children,
  icon,
  iconClassName,
  onDismiss,
  action,
  ...props
}: React.ComponentProps<typeof View> &
  React.RefAttributes<View> &
  VariantProps<typeof alertVariants> & {
    icon: LucideIcon;
    iconClassName?: string;
    /** Adds the dismiss X. Use it for nudges, never for errors the user must act on. */
    onDismiss?: () => void;
    /** Inline text link under the description. */
    action?: { label: string; onPress: () => void };
  }) {
  const tone = variant ?? 'default';
  return (
    <TextClassContext.Provider value="text-foreground">
      <View
        role="alert"
        accessibilityLiveRegion="polite"
        className={cn(alertVariants({ variant: tone }), onDismiss && 'pr-12', className)}
        {...props}>
        <View className="absolute left-4 top-4">
          <Icon as={icon} className={cn('size-5', ICON_TONE[tone], iconClassName)} size={20} />
        </View>
        {children}
        {action ? (
          <Pressable
            onPress={action.onPress}
            hitSlop={8}
            accessibilityRole="button"
            className="mt-2 min-h-6 justify-center pl-8">
            <Text className={cn('text-sm font-semibold', ICON_TONE[tone])}>{action.label} →</Text>
          </Pressable>
        ) : null}
        {onDismiss ? (
          <Pressable
            onPress={onDismiss}
            hitSlop={8}
            accessibilityRole="button"
            accessibilityLabel="Dismiss"
            className="absolute right-1 top-1 size-11 items-center justify-center rounded-full active:opacity-70">
            <Icon as={XIcon} size={16} className="text-muted-foreground" />
          </Pressable>
        ) : null}
      </View>
    </TextClassContext.Provider>
  );
}

function AlertTitle({ className, ...props }: React.ComponentProps<typeof Text>) {
  return <Text className={cn('mb-1 min-h-5 pl-8 text-base font-semibold leading-5', className)} {...props} />;
}

function AlertDescription({ className, ...props }: React.ComponentProps<typeof Text>) {
  return <Text className={cn('text-muted-foreground pl-8 text-sm leading-relaxed', className)} {...props} />;
}

export { Alert, AlertDescription, AlertTitle };
