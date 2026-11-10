import { Icon } from '@/components/ui/icon';
import { Text } from '@/components/ui/text';
import { haptic } from '@/lib/haptics';
import { MOTION } from '@/lib/theme';
import { cn } from '@/lib/utils';
import { useMotion } from '@/lib/reduced-motion';
import { CircleAlertIcon, CircleCheckIcon, InfoIcon, TriangleAlertIcon } from 'lucide-react-native';
import * as React from 'react';
import { Animated, Easing, Pressable, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export type ToastTone = 'success' | 'error' | 'info' | 'warning';
export type ToastOptions = { tone?: ToastTone; /** ms; 0 = sticky */ duration?: number };
type ToastState = { id: number; message: string; tone: ToastTone; duration: number };

type ToastApi = {
  show: (message: string, options?: ToastOptions) => void;
  success: (message: string, options?: Omit<ToastOptions, 'tone'>) => void;
  error: (message: string, options?: Omit<ToastOptions, 'tone'>) => void;
  info: (message: string, options?: Omit<ToastOptions, 'tone'>) => void;
  warning: (message: string, options?: Omit<ToastOptions, 'tone'>) => void;
};

const ToastContext = React.createContext<ToastApi | null>(null);

/**
 * Imperative toasts: `const toast = useToast(); toast.success('Saved')`.
 * Bottom-anchored, newest last, auto-dismiss 2.4s, tap to dismiss.
 */
export function useToast(): ToastApi {
  const ctx = React.useContext(ToastContext);
  if (!ctx) throw new Error('useToast must be used inside <ToastProvider>');
  return ctx;
}

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = React.useState<ToastState[]>([]);
  const idRef = React.useRef(0);

  const dismiss = React.useCallback((id: number) => setToasts((prev) => prev.filter((t) => t.id !== id)), []);

  const show = React.useCallback(
    (message: string, options: ToastOptions = {}) => {
      const id = ++idRef.current;
      const t: ToastState = { id, message, tone: options.tone ?? 'info', duration: options.duration ?? 2400 };
      haptic(t.tone === 'success' ? 'success' : t.tone === 'error' ? 'error' : t.tone === 'warning' ? 'warning' : 'light');
      setToasts((prev) => [...prev.slice(-2), t]);
      if (t.duration > 0) setTimeout(() => dismiss(id), t.duration);
    },
    [dismiss]
  );

  const api = React.useMemo<ToastApi>(
    () => ({
      show,
      success: (m, o) => show(m, { ...o, tone: 'success' }),
      error: (m, o) => show(m, { ...o, tone: 'error' }),
      info: (m, o) => show(m, { ...o, tone: 'info' }),
      warning: (m, o) => show(m, { ...o, tone: 'warning' }),
    }),
    [show]
  );

  return (
    <ToastContext.Provider value={api}>
      {children}
      <ToastViewport toasts={toasts} onDismiss={dismiss} />
    </ToastContext.Provider>
  );
}

/**
 * One shape for every tone: a dark surface with light text, tinted by the tone's icon.
 * A toast is transient and overlays content — inverting it is what separates it from the
 * page, and it keeps all four reading as the same object.
 */
const TONE = {
  success: { bg: 'bg-success', fg: 'text-success-foreground', icon: CircleCheckIcon },
  error: { bg: 'bg-destructive', fg: 'text-destructive-foreground', icon: CircleAlertIcon },
  warning: { bg: 'bg-warning', fg: 'text-warning-foreground', icon: TriangleAlertIcon },
  info: { bg: 'bg-foreground', fg: 'text-background', icon: InfoIcon },
} as const;

function ToastViewport({ toasts, onDismiss }: { toasts: ToastState[]; onDismiss: (id: number) => void }) {
  const insets = useSafeAreaInsets();
  if (toasts.length === 0) return null;
  return (
    <View
      pointerEvents="box-none"
      accessibilityLiveRegion="polite"
      className="absolute left-0 right-0 items-center gap-2"
      style={{ bottom: insets.bottom + 24 }}>
      {toasts.map((t) => (
        <ToastItem key={t.id} toast={t} onDismiss={() => onDismiss(t.id)} />
      ))}
    </View>
  );
}

function ToastItem({ toast, onDismiss }: { toast: ToastState; onDismiss: () => void }) {
  const [translateY] = React.useState(() => new Animated.Value(12));
  const spec = TONE[toast.tone];
  const motion = useMotion();
  React.useEffect(() => {
    Animated.timing(translateY, { toValue: 0, duration: motion(MOTION.duration.base), easing: Easing.bezier(...MOTION.easing.emphasized), useNativeDriver: true }).start();
  }, [translateY, motion]);
  return (
    <Animated.View style={{ transform: [{ translateY }] }} className="max-w-[90%]">
      <Pressable onPress={onDismiss} accessibilityRole="alert" className={cn('flex-row items-center gap-2 rounded-full px-4 py-2.5 shadow-lg shadow-black/20', spec.bg)}>
        <Icon as={spec.icon} size={18} className={spec.fg} />
        <Text className={cn('font-semibold', spec.fg)} numberOfLines={2}>
          {toast.message}
        </Text>
      </Pressable>
    </Animated.View>
  );
}
