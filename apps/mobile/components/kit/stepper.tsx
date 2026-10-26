import { Text } from '@/components/ui/text';
import { cn } from '@/lib/utils';
import * as React from 'react';
import { View } from 'react-native';

type Props = {
  /** 1-indexed current step. */
  current: number;
  total: number;
  /** Optional labels; must have `total` entries to render. */
  labels?: string[];
  variant?: 'numbered' | 'compact';
  className?: string;
};

/** Progress for multi-step flows (onboarding, checkout). Distinct from PagerDots. */
export function Stepper({ current, total, labels, variant = 'numbered', className }: Props) {
  const step = Math.max(1, Math.min(current, total));

  if (variant === 'compact') {
    return (
      <View className={cn('gap-2', className)} accessibilityLabel={`Step ${step} of ${total}`}>
        <View className="bg-muted h-1 overflow-hidden rounded-full">
          <View className="bg-primary h-full rounded-full" style={{ width: `${(step / total) * 100}%` }} />
        </View>
        <Text className="text-muted-foreground text-sm">
          Step {step} of {total}
        </Text>
      </View>
    );
  }

  const hasLabels = !!labels && labels.length === total;
  return (
    <View className={className} accessibilityLabel={`Step ${step} of ${total}`}>
      <View className="flex-row items-start">
        {Array.from({ length: total }).map((_, i) => {
          const n = i + 1;
          const done = n < step;
          const active = n === step;
          return (
            <React.Fragment key={n}>
              {i > 0 ? (
                <View className={cn('mx-1.5 mt-3 h-0.5 flex-1 rounded-full', n <= step ? 'bg-primary' : 'bg-border')} />
              ) : null}
              {/* One column per step so the label sits under its own circle. */}
              <View className="items-center" style={{ width: hasLabels ? 60 : 24 }}>
                <View
                  className={cn(
                    'size-6 items-center justify-center rounded-full',
                    done ? 'bg-primary' : active ? 'bg-primary-subtle border-primary border' : 'bg-muted'
                  )}>
                  <Text className={cn('text-xs font-semibold', done ? 'text-primary-foreground' : active ? 'text-primary' : 'text-muted-foreground')}>
                    {n}
                  </Text>
                </View>
                {hasLabels ? (
                  <Text
                    numberOfLines={1}
                    className={cn('mt-2 text-center text-xs', active ? 'text-foreground font-medium' : 'text-muted-foreground')}>
                    {labels[i]}
                  </Text>
                ) : null}
              </View>
            </React.Fragment>
          );
        })}
      </View>
    </View>
  );
}
