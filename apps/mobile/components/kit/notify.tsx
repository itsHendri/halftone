import { useToast } from '@/components/kit/toast';
import { Icon } from '@/components/ui/icon';
import { Text } from '@/components/ui/text';
import { haptic } from '@/lib/haptics';
import { useCapability } from '@/lib/native-context';
import { cn } from '@/lib/utils';
import { useMotion } from '@/lib/reduced-motion';
import { MOTION } from '@/lib/theme';
import { BellIcon, type LucideIcon } from 'lucide-react-native';
import * as React from 'react';
import { Animated, Easing, Pressable, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export type NotifyOptions = {
  title: string;
  body?: string;
  /** Seconds from now. 0 (default) shows the in-app banner immediately. */
  delay?: number;
  icon?: LucideIcon;
};

type BannerState = { id: number; title: string; body?: string; icon: LucideIcon };

type NotifyApi = {
  notify: (options: NotifyOptions) => Promise<void>;
  cancelAll: () => Promise<void>;
  /** True when no OS notification will actually fire. */
  simulated: boolean;
};

const NotifyContext = React.createContext<NotifyApi | null>(null);

/**
 * Local notifications: an in-app banner now, a real OS notification when scheduled.
 *
 * `delay: 0` always draws the banner — identical on web, iOS and Android, and what a
 * demo actually needs (iOS suppresses foreground local notifications anyway).
 * `delay > 0` also schedules the real thing wherever that works.
 */
export function useNotify(): NotifyApi {
  const ctx = React.useContext(NotifyContext);
  if (!ctx) throw new Error('useNotify must be used inside <NotifyProvider>');
  return ctx;
}

export function NotifyProvider({ children }: { children: React.ReactNode }) {
  const [banner, setBanner] = React.useState<BannerState | null>(null);
  const idRef = React.useRef(0);
  const timers = React.useRef<ReturnType<typeof setTimeout>[]>([]);
  const { cap, request } = useCapability('notify');
  const toast = useToast();

  const dismiss = React.useCallback(() => setBanner(null), []);

  const showBanner = React.useCallback((options: NotifyOptions) => {
    haptic('light');
    setBanner({
      id: ++idRef.current,
      title: options.title,
      body: options.body,
      icon: options.icon ?? BellIcon,
    });
  }, []);

  /** true when the OS accepted it. false means the caller must fall back. */
  const schedule = React.useCallback(
    async (options: NotifyOptions): Promise<boolean> => {
      const settled = cap.state === 'ready' ? cap : await request();
      if (settled.simulated || settled.state !== 'ready') return false;
      try {
        // Lazily required: importing expo-notifications warns and registers a push-token
        // side effect under Expo Go, which would fire in every prototype session.
        // eslint-disable-next-line @typescript-eslint/no-require-imports
        const Notifications = require('expo-notifications') as typeof import('expo-notifications');
        Notifications.setNotificationHandler({
          handleNotification: async () => ({
            shouldShowBanner: true,
            shouldShowList: true,
            shouldPlaySound: false,
            shouldSetBadge: false,
          }),
        });
        await Notifications.scheduleNotificationAsync({
          content: { title: options.title, body: options.body },
          trigger: { type: 'timeInterval', seconds: Math.max(1, options.delay ?? 1), repeats: false } as never,
        });
        return true;
      } catch {
        return false;
      }
    },
    [cap, request]
  );

  const notify = React.useCallback(
    async (options: NotifyOptions) => {
      const delay = options.delay ?? 0;
      if (delay === 0) {
        showBanner(options);
        return;
      }
      if (await schedule(options)) return;
      // The OS will not deliver it — alerts are off, or this runtime cannot schedule.
      // Fall back to the in-app banner after the same delay so the flow still lands.
      toast.info(`Alerts are off — showing it in the app in ${delay}s`);
      timers.current.push(setTimeout(() => showBanner(options), delay * 1000));
    },
    [schedule, showBanner, toast]
  );

  const cancelAll = React.useCallback(async () => {
    setBanner(null);
    timers.current.forEach(clearTimeout);
    timers.current = [];
    if (cap.simulated) return;
    try {
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const Notifications = require('expo-notifications') as typeof import('expo-notifications');
      await Notifications.cancelAllScheduledNotificationsAsync();
    } catch {
      /* nothing scheduled */
    }
  }, [cap.simulated]);

  const api = React.useMemo<NotifyApi>(
    () => ({ notify, cancelAll, simulated: cap.simulated }),
    [notify, cancelAll, cap.simulated]
  );

  return (
    <NotifyContext.Provider value={api}>
      {children}
      <NotificationBanner banner={banner} onDismiss={dismiss} />
    </NotifyContext.Provider>
  );
}

/** The iOS-style notification card. Slides in under the safe area, auto-dismisses, tap to close. */
function NotificationBanner({ banner, onDismiss }: { banner: BannerState | null; onDismiss: () => void }) {
  const insets = useSafeAreaInsets();
  const [slide] = React.useState(() => new Animated.Value(0));
  const motion = useMotion();

  React.useEffect(() => {
    if (!banner) return;
    Animated.timing(slide, { toValue: 1, duration: motion(MOTION.duration.slow), easing: Easing.bezier(...MOTION.easing.emphasized), useNativeDriver: true }).start();
    const timer = setTimeout(() => {
      Animated.timing(slide, { toValue: 0, duration: motion(MOTION.duration.base), easing: Easing.bezier(...MOTION.easing.exit), useNativeDriver: true }).start(
        ({ finished }) => {
          if (finished) onDismiss();
        }
      );
    }, 4000);
    return () => clearTimeout(timer);
  }, [banner, slide, onDismiss, motion]);

  if (!banner) return null;

  return (
    <View
      pointerEvents="box-none"
      accessibilityLiveRegion="polite"
      className="absolute left-0 right-0"
      style={{ top: Math.max(insets.top, 12) }}>
      <Animated.View
        style={{
          opacity: slide,
          transform: [{ translateY: slide.interpolate({ inputRange: [0, 1], outputRange: [-24, 0] }) }],
        }}
        className="px-4">
        <Pressable
          onPress={onDismiss}
          accessibilityRole="button"
          accessibilityLabel={`Notification: ${banner.title}. Tap to dismiss.`}
          className={cn('bg-card border-border flex-row items-center gap-3 rounded-2xl border p-3 shadow-lg shadow-black/20 active:opacity-90')}>
          <View className="bg-muted size-9 items-center justify-center rounded-lg">
            <Icon as={banner.icon} size={18} className="text-foreground" />
          </View>
          <View className="flex-1 gap-0.5">
            <View className="flex-row items-start justify-between gap-2">
              <Text className="flex-1 text-sm font-semibold" numberOfLines={1}>
                {banner.title}
              </Text>
              <Text className="text-muted-foreground text-xs">now</Text>
            </View>
            {banner.body ? (
              <Text className="text-muted-foreground text-sm leading-5" numberOfLines={2}>
                {banner.body}
              </Text>
            ) : null}
          </View>
        </Pressable>
      </Animated.View>
    </View>
  );
}
