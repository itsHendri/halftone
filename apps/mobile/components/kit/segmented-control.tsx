import { Text } from '@/components/ui/text';
import { haptic } from '@/lib/haptics';
import { TOKENS } from '@/lib/theme';
import { cn } from '@/lib/utils';
import { useMotion } from '@/lib/reduced-motion';
import * as React from 'react';
import { Animated, Easing, type LayoutChangeEvent, Pressable, ScrollView, View } from 'react-native';

type Props<T extends string> = {
  segments: readonly { value: T; label: string }[];
  value: T;
  onChange: (value: T) => void;
  className?: string;
};

const INSET = 3;
type Box = { x: number; width: number };

/**
 * iOS-style sliding segmented control for 2–4 mutually exclusive options.
 * Labels never truncate: each segment is at least as wide as its label, spare width is shared, and when the labels
 * can't fit the control scrolls sideways inside itself.
 */
export function SegmentedControl<T extends string>({ segments, value, onChange, className }: Props<T>) {
  const activeIndex = Math.max(
    0,
    segments.findIndex((s) => s.value === value)
  );
  // Each segment's measured place in the row: the thumb follows the active one, so unequal widths line up.
  const [boxes, setBoxes] = React.useState<(Box | undefined)[]>([]);
  const [viewW, setViewW] = React.useState(0);
  const [contentW, setContentW] = React.useState(0);
  const [anim] = React.useState(() => new Animated.Value(activeIndex));
  const scroll = React.useRef<ScrollView>(null);
  const motion = useMotion();

  React.useEffect(() => {
    // Width can't run on the native driver, so the thumb's slide and resize both run on the JS one.
    Animated.timing(anim, {
      toValue: activeIndex,
      duration: motion(TOKENS.duration.base),
      easing: Easing.out(Easing.cubic),
      useNativeDriver: false,
    }).start();
  }, [activeIndex, anim, motion]);

  // Keep the active segment in view when the row is wider than the control.
  // The first time it jumps there; after that it scrolls, unless the viewer asked for less motion.
  const active = boxes[activeIndex];
  const scrolled = React.useRef(false);
  React.useEffect(() => {
    if (!active || contentW <= viewW) return;
    scroll.current?.scrollTo({ x: Math.max(0, active.x - (viewW - active.width) / 2), animated: scrolled.current && motion(1) > 0 });
    scrolled.current = true;
  }, [active, contentW, viewW, motion]);

  const onSegmentLayout = (i: number) => (e: LayoutChangeEvent) => {
    const { x, width } = e.nativeEvent.layout;
    setBoxes((b) => {
      if (b[i]?.x === x && b[i]?.width === width) return b;
      const next = b.slice(0, segments.length);
      next[i] = { x, width };
      return next;
    });
  };

  const measured = segments.map((_, i) => boxes[i]);
  const ready = measured.every(Boolean);
  // interpolate needs two points; a single segment repeats its own.
  const input = segments.length > 1 ? segments.map((_, i) => i) : [0, 1];
  const pick = (f: (b: Box) => number) => (segments.length > 1 ? measured.map((b) => f(b!)) : [f(measured[0]!), f(measured[0]!)]);

  return (
    <View className={cn('bg-muted overflow-hidden rounded-lg', className)}>
      <ScrollView
        ref={scroll}
        horizontal
        showsHorizontalScrollIndicator={false}
        onLayout={(e) => setViewW(e.nativeEvent.layout.width)}
        onContentSizeChange={(w) => setContentW(w)}
        scrollEnabled={contentW > viewW}
        contentContainerStyle={{ flexGrow: 1, padding: INSET }}>
        {ready ? (
          <Animated.View
            pointerEvents="none"
            style={{
              position: 'absolute',
              top: INSET,
              bottom: INSET,
              left: 0,
              width: anim.interpolate({ inputRange: input, outputRange: pick((b) => b.width) }),
              transform: [{ translateX: anim.interpolate({ inputRange: input, outputRange: pick((b) => b.x) }) }],
            }}>
            {/* The surface lives on a plain View: NativeWind drops classNames on
                Animated.View on web, which left the thumb invisible in the preview. */}
            <View className="bg-card h-full w-full rounded-md shadow-sm shadow-black/10" />
          </Animated.View>
        ) : null}
        {segments.map((seg, i) => {
          const isActive = seg.value === value;
          return (
            <Pressable
              key={seg.value}
              onLayout={onSegmentLayout(i)}
              accessibilityRole="button"
              accessibilityLabel={seg.label}
              accessibilityState={{ selected: isActive }}
              // aria-pressed is web-only (react-native-web drops accessibilityState, and a button may not carry aria-selected).
              aria-pressed={isActive}
              onPress={() => {
                if (isActive) return;
                haptic('selection');
                onChange(seg.value);
              }}
              className="h-9 grow items-center justify-center px-3">
              {/* The invisible bold copy holds the active weight's width, so choosing a segment never nudges the others. */}
              <View>
                <Text aria-hidden importantForAccessibility="no" className="text-sm font-semibold opacity-0">
                  {seg.label}
                </Text>
                <Text numberOfLines={1} className={cn('absolute inset-0 text-center text-sm', isActive ? 'font-semibold' : 'text-muted-foreground')}>
                  {seg.label}
                </Text>
              </View>
            </Pressable>
          );
        })}
      </ScrollView>
    </View>
  );
}
