import '@/global.css';

import { NotifyProvider } from '@/components/kit/notify';
import { ToastProvider } from '@/components/kit/toast';
import { NativeModeProvider } from '@/lib/native-context';
import { PaletteProvider, useNavTheme } from '@/lib/palette-context';
import { KitThemeProvider, useKitTheme } from '@/lib/theme-context';
import { FONT_ASSETS } from '@/lib/fonts';
import { PortalHost } from '@rn-primitives/portal';
import { useFonts } from 'expo-font';
import { Stack } from 'expo-router';
import { ThemeProvider as NavThemeProvider } from 'expo-router/react-navigation';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import * as React from 'react';
import { GestureHandlerRootView } from 'react-native-gesture-handler';

export {
  // Catch any errors thrown by the Layout component.
  ErrorBoundary,
} from 'expo-router';

/**
 * The kit shell is home. Without this the sample groups also match "/" and one of
 * them wins, so scanning the QR drops you into a sample instead of the kit.
 */
export const unstable_settings = { initialRouteName: '(kit)' };

// Hold the splash until the theme's fonts are in (lib/fonts.ts; nothing to wait for with the system font).
SplashScreen.preventAutoHideAsync().catch(() => {});

export default function RootLayout() {
  const [fontsLoaded, fontError] = useFonts(FONT_ASSETS);
  const ready = fontsLoaded || !!fontError;
  React.useEffect(() => {
    if (ready) SplashScreen.hideAsync().catch(() => {});
  }, [ready]);
  if (!ready) return null;

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <KitThemeProvider>
        <PaletteProvider>
          <NativeModeProvider>
            <AppShell />
          </NativeModeProvider>
        </PaletteProvider>
      </KitThemeProvider>
    </GestureHandlerRootView>
  );
}

function AppShell() {
  const { scheme } = useKitTheme();
  const navTheme = useNavTheme();

  return (
    <NavThemeProvider value={navTheme}>
      <StatusBar style={scheme === 'dark' ? 'light' : 'dark'} />
      <ToastProvider>
        <NotifyProvider>
          <Stack screenOptions={{ headerShown: false }}>
            <Stack.Screen name="(kit)" />
            <Stack.Screen name="shop" />
            <Stack.Screen name="habits" />
            <Stack.Screen name="northwind" />
          </Stack>
          <PortalHost />
        </NotifyProvider>
      </ToastProvider>
    </NavThemeProvider>
  );
}
