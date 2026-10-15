import { isRunningInExpoGo } from 'expo';
import * as Device from 'expo-device';
import * as ImagePicker from 'expo-image-picker';
import * as LocalAuthentication from 'expo-local-authentication';
import { Platform } from 'react-native';

/**
 * Device capabilities and their fallbacks.
 *
 * Every capability component in the kit resolves through here so they all behave the same way:
 * when the real thing is unavailable — web, a simulator, Expo Go, a denied permission — the
 * component draws a simulated version instead of an error. A prototype must never dead-end.
 *
 * Nothing in this file throws. Failures become a CapabilityState, never a rejection.
 */

export type CapabilityId = 'camera' | 'photos' | 'biometrics' | 'notify' | 'share';

/** `unsupported` is terminal for the session; `prompt` means the OS has not been asked yet. */
export type CapabilityState = 'ready' | 'prompt' | 'denied' | 'unsupported';

/** Why the kit is drawing the simulated experience. Surfaced on the Components page, never in a prototype. */
export type SimulateReason = 'web' | 'no-hardware' | 'expo-go' | 'denied' | 'forced';

export type Capability = {
  id: CapabilityId;
  state: CapabilityState;
  /** The one flag a component branches on. */
  simulated: boolean;
  reason?: SimulateReason;
  /** One short sentence for the dev badge or toast, e.g. "No camera on the simulator". */
  note?: string;
};

/** Where this bundle is running. Static facts, computed once. */
export const ENV = {
  web: Platform.OS === 'web',
  expoGo: isRunningInExpoGo(),
  /** false on the iOS Simulator and Android emulators. */
  device: Device.isDevice,
} as const;

const NOTES: Record<SimulateReason, string> = {
  web: 'Simulated on the web preview',
  'no-hardware': 'No hardware on the simulator',
  'expo-go': 'Needs the dev client — npm run dev:client',
  denied: 'Permission is off, using a sample',
  forced: 'Simulated device features is on',
};

/**
 * Why this capability cannot run for real here, or `null` when it can.
 * Pure — no permission state, no I/O. Safe to call during render.
 */
export function blockedReason(id: CapabilityId): SimulateReason | null {
  switch (id) {
    case 'photos':
      // The web file picker is a real picker returning a real image, so web is not blocked.
      return null;
    case 'share':
      // Falls back to a clipboard copy on web, which is still a real interaction.
      return null;
    case 'camera':
      if (ENV.web) return 'web';
      if (!ENV.device) return 'no-hardware';
      return null;
    case 'biometrics':
      if (ENV.web) return 'web';
      // Expo Go's Info.plist has no NSFaceIDUsageDescription, so Face ID fails opaquely there.
      if (ENV.expoGo) return 'expo-go';
      return null;
    case 'notify':
      // The web notification scheduler is a stub that throws on use.
      if (ENV.web) return 'web';
      return null;
  }
}

/** What this runtime could do at best, before any permission is asked. */
export function supports(id: CapabilityId): boolean {
  return blockedReason(id) === null;
}

/** Build the resolved capability from a blocked reason and, optionally, a live permission state. */
export function resolve(id: CapabilityId, state: CapabilityState, reason: SimulateReason | null): Capability {
  const simulated = reason !== null || state === 'denied' || state === 'unsupported';
  const why = reason ?? (simulated ? 'denied' : undefined);
  return { id, state, simulated, reason: why, note: why ? NOTES[why] : undefined };
}

const granted = (status: string) => (status === 'granted' ? 'ready' : 'denied');

/**
 * Ask the OS. Resolves to the new state, never throws, never returns `prompt`.
 * Call it from a user gesture — iOS reports `undetermined` until the first prompt,
 * so probing on mount tells you nothing.
 */
export async function requestPermission(id: CapabilityId): Promise<CapabilityState> {
  if (blockedReason(id) !== null) return 'unsupported';
  try {
    switch (id) {
      case 'camera': {
        const { status } = await ImagePicker.requestCameraPermissionsAsync();
        return granted(status);
      }
      case 'photos': {
        if (ENV.web) return 'ready';
        const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
        return granted(status);
      }
      case 'biometrics': {
        const [hasHardware, enrolled] = await Promise.all([
          LocalAuthentication.hasHardwareAsync(),
          LocalAuthentication.isEnrolledAsync(),
        ]);
        return hasHardware && enrolled ? 'ready' : 'unsupported';
      }
      case 'notify': {
        // Lazily required: importing expo-notifications warns and registers a push-token
        // side effect under Expo Go, which would fire in every prototype session.
        // eslint-disable-next-line @typescript-eslint/no-require-imports
        const Notifications = require('expo-notifications') as typeof import('expo-notifications');
        const { status } = await Notifications.requestPermissionsAsync();
        return granted(status);
      }
      case 'share':
        return 'ready';
    }
  } catch {
    return 'denied';
  }
}

/** Which biometric the device offers, for lock-screen copy and iconography. */
export async function biometricKind(): Promise<'face' | 'fingerprint' | 'none'> {
  if (blockedReason('biometrics') !== null) return 'none';
  try {
    const types = await LocalAuthentication.supportedAuthenticationTypesAsync();
    if (types.includes(LocalAuthentication.AuthenticationType.FACIAL_RECOGNITION)) return 'face';
    if (types.includes(LocalAuthentication.AuthenticationType.FINGERPRINT)) return 'fingerprint';
    return 'none';
  } catch {
    return 'none';
  }
}
