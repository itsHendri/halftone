import { Text } from '@/components/ui/text';
import { useReducedMotion } from '@/lib/reduced-motion';
import { cn } from '@/lib/utils';
import * as React from 'react';
import { Animated, Easing, View } from 'react-native';

type Props = { label?: string; className?: string };

function Dot({ delay, still }: { delay: number; still: boolean }) {
  const [y] = React.useState(() => new Animated.Value(0));
  React.useEffect(() => {
    if (still) return;
    const bounce = Animated.loop(
      Animated.sequence([
        Animated.delay(delay),
        Animated.timing(y, { toValue: -4, duration: 280, easing: Easing.out(Easing.quad), useNativeDriver: true }),
        Animated.timing(y, { toValue: 0, duration: 280, easing: Easing.in(Easing.quad), useNativeDriver: true }),
        Animated.delay(450 - delay),
      ])
    );
    bounce.start();
    return () => {
      bounce.stop();
      y.setValue(0);
    };
  }, [delay, still, y]);
  // The fill sits on a plain View: NativeWind classNames are dropped on Animated.View on web.
  return (
    <Animated.View style={{ transform: [{ translateY: y }] }}>
      <View className="bg-muted-foreground size-1.5 rounded-full" />
    </Animated.View>
  );
}

/** "The model is working": three dots and a label. Still dots under reduced motion. */
export function ThinkingIndicator({ label = 'Thinking', className }: Props) {
  const reduced = useReducedMotion();
  return (
    <View accessibilityRole="progressbar" accessibilityLabel={label} accessibilityLiveRegion="polite" className={cn('flex-row items-center gap-2 self-start', className)}>
      <View className="flex-row gap-1" importantForAccessibility="no-hide-descendants" accessibilityElementsHidden>
        {[0, 150, 300].map((d) => (
          <Dot key={d} delay={d} still={reduced} />
        ))}
      </View>
      <Text className="text-muted-foreground text-sm">{label}</Text>
    </View>
  );
}
