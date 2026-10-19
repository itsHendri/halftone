import { Spinner } from '@/components/kit/spinner';
import { Spot } from '@/components/kit/spot';
import { Button } from '@/components/ui/button';
import { Text } from '@/components/ui/text';
import { haptic } from '@/lib/haptics';
import { useCapability } from '@/lib/native-context';
import { cn } from '@/lib/utils';
import * as LocalAuthentication from 'expo-local-authentication';
import { LockIcon, ScanFaceIcon } from 'lucide-react-native';
import * as React from 'react';
import { Pressable, View } from 'react-native';

/** Long enough to read as real in a demo recording. */
const SIMULATED_DELAY = 900;

/**
 * Imperative Face ID / Touch ID for a single action — confirming a payment, revealing a secret.
 *
 * Resolves true when the prototype should proceed, including on the simulated path.
 */
export function useBiometricAuth(simulate?: boolean) {
  const { cap, request } = useCapability('biometrics', simulate);

  const authenticate = React.useCallback(
    async (prompt = 'Confirm it is you'): Promise<boolean> => {
      if (cap.simulated) {
        await new Promise((r) => setTimeout(r, SIMULATED_DELAY));
        haptic('success');
        return true;
      }
      const settled = await request();
      if (settled.simulated) {
        await new Promise((r) => setTimeout(r, SIMULATED_DELAY));
        haptic('success');
        return true;
      }
      try {
        const result = await LocalAuthentication.authenticateAsync({ promptMessage: prompt });
        haptic(result.success ? 'success' : 'error');
        return result.success;
      } catch {
        return false;
      }
    },
    [cap.simulated, request]
  );

  return { authenticate, simulated: cap.simulated };
}

type Props = {
  /** Revealed once unlocked. */
  children: React.ReactNode;
  title?: string;
  subtitle?: string;
  /** Reason string shown inside the OS dialog. */
  prompt?: string;
  /** Start locked. Default true. Re-lock by changing `key`. */
  locked?: boolean;
  onUnlock?: () => void;
  /** Escape hatch. Always shown — a prototype must never trap the viewer. */
  fallbackLabel?: string;
  simulate?: boolean;
  className?: string;
};

/**
 * Hides its children behind Face ID / Touch ID.
 *
 * Simulated anywhere the real thing cannot run — the web preview, Expo Go — with a
 * short pause so the unlock still reads as real.
 */
export function BiometricGate({
  children,
  title = 'Locked',
  subtitle = 'Unlock to see this section.',
  prompt = 'Unlock',
  locked = true,
  onUnlock,
  fallbackLabel = 'Use a passcode instead',
  simulate,
  className,
}: Props) {
  const [unlocked, setUnlocked] = React.useState(!locked);
  const [busy, setBusy] = React.useState(false);
  const { authenticate, simulated } = useBiometricAuth(simulate);

  if (unlocked) return <>{children}</>;

  const unlock = async () => {
    setBusy(true);
    const ok = await authenticate(prompt);
    setBusy(false);
    if (!ok) return;
    setUnlocked(true);
    onUnlock?.();
  };

  const skip = () => {
    haptic('selection');
    setUnlocked(true);
    onUnlock?.();
  };

  return (
    <View className={cn('items-center justify-center gap-2 px-6 py-12', className)}>
      <Spot icon={simulated ? LockIcon : ScanFaceIcon} size="lg" className="mb-4" />
      <Text variant="h4" className="text-center">
        {title}
      </Text>
      <Text className="text-muted-foreground max-w-xs text-center">{subtitle}</Text>
      <Button onPress={unlock} disabled={busy} className="mt-4 w-full max-w-xs">
        {busy ? <Spinner tone="button-foreground" /> : <Text>Unlock</Text>}
      </Button>
      <Pressable onPress={skip} accessibilityRole="button" className="mt-1 min-h-11 justify-center">
        <Text className="text-muted-foreground text-sm font-semibold">{fallbackLabel}</Text>
      </Pressable>
    </View>
  );
}
