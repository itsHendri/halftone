import { Icon } from '@/components/ui/icon';
import { Text } from '@/components/ui/text';
import { haptic } from '@/lib/haptics';
import { cn } from '@/lib/utils';
import { useReducedMotion } from '@/lib/reduced-motion';
import { ArrowRightIcon, CheckIcon } from 'lucide-react-native';
import * as React from 'react';
import { Animated, Easing, type LayoutChangeEvent, View } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';

type Props = {
  label: string;
  onConfirm: () => void;
  confirmLabel?: string;
  tone?: 'primary' | 'destructive';
  disabled?: boolean;
  className?: string;
};

const THUMB = 56;
const TRACK_H = 64;
const INSET = (TRACK_H - THUMB) / 2;
const COMMIT_RATIO = 0.85;

/**
 * Drag-to-confirm for high-stakes actions, on a native pan gesture so the drag is not stolen
 * by swipe-back or a parent ScrollView. Past 85% commits (success haptic), otherwise springs
 * back. Does not reset itself: change its `key` to reset.
 */
export function SwipeToConfirm({ label, onConfirm, confirmLabel = 'Confirmed', tone = 'primary', disabled, className }: Props) {
  const [trackW, setTrackW] = React.useState(0);
  const [completed, setCompleted] = React.useState(false);
  const [translateX] = React.useState(() => new Animated.Value(0));
  const maxX = Math.max(0, trackW - THUMB - INSET * 2);

  // The drag itself is the finger, which Reduce Motion does not govern — but the
  // snap-back and the commit slide are animations, so they jump instead.
  const reduced = useReducedMotion();

  const latest = React.useRef({ maxX, completed, onConfirm, reduced });
  React.useEffect(() => {
    latest.current = { maxX, completed, onConfirm, reduced };
  });

  const springBack = React.useCallback(
    (instant: boolean) => {
      if (instant) {
        translateX.setValue(0);
        return;
      }
      Animated.spring(translateX, { toValue: 0, friction: 7, tension: 60, useNativeDriver: false }).start();
    },
    [translateX]
  );

  // Gesture callbacks run at event time; the ref reads inside are safe.
  /* eslint-disable react-hooks/refs */
  const pan = React.useMemo(
    () =>
      Gesture.Pan()
        .enabled(!disabled)
        .runOnJS(true)
        .activeOffsetX([-6, 6])
        .failOffsetY([-14, 14])
        .onUpdate((e) => {
          if (latest.current.completed) return;
          translateX.setValue(Math.max(0, Math.min(e.translationX, latest.current.maxX)));
        })
        .onEnd((e) => {
          const { maxX, completed, onConfirm, reduced } = latest.current;
          if (completed) return;
          const clamped = Math.max(0, Math.min(e.translationX, maxX));
          if (maxX > 0 && clamped / maxX >= COMMIT_RATIO) {
            haptic('success');
            setCompleted(true);
            Animated.timing(translateX, { toValue: maxX, duration: reduced ? 0 : 120, easing: Easing.out(Easing.cubic), useNativeDriver: false }).start(() => onConfirm());
          } else {
            springBack(reduced);
          }
        })
        .onFinalize((_e, success) => {
          if (!success && !latest.current.completed) springBack(latest.current.reduced);
        }),
    [disabled, translateX, springBack]
  );  /* eslint-enable react-hooks/refs */


  const promptOpacity = maxX > 0 ? translateX.interpolate({ inputRange: [0, maxX * 0.5], outputRange: [1, 0], extrapolate: 'clamp' }) : 1;
  const fillWidth = Animated.add(translateX, new Animated.Value(THUMB + INSET * 2));
  const bg = tone === 'destructive' ? 'bg-destructive' : 'bg-primary';
  const fg = tone === 'destructive' ? 'text-destructive-foreground' : 'text-primary-foreground';

  return (
    <View
      onLayout={(e: LayoutChangeEvent) => setTrackW(e.nativeEvent.layout.width)}
      className={cn('bg-muted w-full justify-center overflow-hidden rounded-control', disabled && 'opacity-50', className)}
      style={{ height: TRACK_H }}
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityHint="Swipe right to confirm">
      <Animated.View pointerEvents="none" style={{ position: 'absolute', top: 0, bottom: 0, left: 0, width: fillWidth }}>
        <View className={cn('h-full w-full rounded-control', tone === 'destructive' ? 'bg-destructive-subtle' : 'bg-primary-subtle')} />
      </Animated.View>
      <Animated.View
        pointerEvents="none"
        style={{ position: 'absolute', left: 0, right: 0, alignItems: 'center', opacity: completed ? 0 : promptOpacity }}>
        <Text className="text-muted-foreground font-semibold">{label}</Text>
      </Animated.View>
      {completed ? (
        <View pointerEvents="none" className="absolute left-0 right-0 items-center">
          <Text className={cn('font-semibold', tone === 'destructive' ? 'text-destructive' : 'text-primary')}>{confirmLabel}</Text>
        </View>
      ) : null}
      <GestureDetector gesture={pan}>
        <Animated.View style={{ width: THUMB, height: THUMB, marginLeft: INSET, transform: [{ translateX }] }}>
          <View className={cn('h-full w-full items-center justify-center rounded-control', bg)}>
            <Icon as={completed ? CheckIcon : ArrowRightIcon} size={24} className={fg} />
          </View>
        </Animated.View>
      </GestureDetector>
    </View>
  );
}
