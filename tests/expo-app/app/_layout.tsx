import '../global.css';

import { PortalHost } from '@rn-primitives/portal';
import { useFonts } from 'expo-font';
import { Stack } from 'expo-router';
import { FONT_ASSETS } from '@/lib/fonts';
import { KitThemeProvider } from '@/lib/theme-context';

/** As install.md path C says: KitThemeProvider at the root, and the theme's fonts loaded before the first screen. */
export default function RootLayout() {
  const [loaded, error] = useFonts(FONT_ASSETS);
  if (!loaded && !error) return null;
  return (
    <KitThemeProvider>
      <Stack screenOptions={{ headerShown: false }} />
      <PortalHost />
    </KitThemeProvider>
  );
}
