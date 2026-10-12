import { cn } from '@/lib/utils';
import { View } from 'react-native';

type Props = { count: number; activeIndex: number; className?: string };

/** Page indicator for pagers and intro sliders. Active dot is a short pill. */
export function PagerDots({ count, activeIndex, className }: Props) {
  return (
    <View className={cn('flex-row items-center justify-center gap-1.5', className)} role="img" accessibilityLabel={`Page ${activeIndex + 1} of ${count}`}>
      {Array.from({ length: count }).map((_, i) => (
        <View key={i} className={cn('h-1.5 rounded-full', i === activeIndex ? 'bg-foreground w-4' : 'bg-border w-1.5')} />
      ))}
    </View>
  );
}
