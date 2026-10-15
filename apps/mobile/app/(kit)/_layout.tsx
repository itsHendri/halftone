import { ThemeToggle } from '@/components/devkit/ThemeToggle';
import { TabBar, tabIcon } from '@/components/kit/tab-bar';
import { EMBED } from '@/lib/embed';
import { Tabs } from 'expo-router';
import { BlocksIcon, HouseIcon, SettingsIcon, SwatchBookIcon } from 'lucide-react-native';

/**
 * The kit shell. A real prototype replaces these tabs with its own navigation;
 * until then this is the designer-facing browser for everything the kit ships.
 * Embedded in the docs (?embed=1) it drops its own chrome: no tab bar, no header.
 */
export default function KitLayout() {
  return (
    <Tabs
      tabBar={(props) => (EMBED.embedded ? null : <TabBar {...props} />)}
      screenOptions={{ headerShown: !EMBED.embedded, headerRight: () => <ThemeToggle /> }}>
      <Tabs.Screen name="index" options={{ title: 'Kit', tabBarIcon: tabIcon(HouseIcon) }} />
      <Tabs.Screen name="foundations" options={{ title: 'Foundations', tabBarIcon: tabIcon(SwatchBookIcon) }} />
      <Tabs.Screen name="components" options={{ title: 'Components', tabBarIcon: tabIcon(BlocksIcon) }} />
      <Tabs.Screen name="settings" options={{ title: 'Settings', tabBarIcon: tabIcon(SettingsIcon) }} />
    </Tabs>
  );
}
