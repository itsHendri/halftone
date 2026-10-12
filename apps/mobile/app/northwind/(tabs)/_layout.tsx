import { TabBar, tabIcon } from '@/components/kit/tab-bar';
import { Tabs } from 'expo-router';
import { FileTextIcon, LayoutDashboardIcon, SettingsIcon } from 'lucide-react-native';

export default function NorthwindTabs() {
  return (
    <Tabs tabBar={(props) => <TabBar {...props} />}>
      <Tabs.Screen name="index" options={{ title: 'Overview', tabBarIcon: tabIcon(LayoutDashboardIcon) }} />
      <Tabs.Screen name="invoices" options={{ title: 'Invoices', tabBarIcon: tabIcon(FileTextIcon) }} />
      <Tabs.Screen name="settings" options={{ title: 'Settings', tabBarIcon: tabIcon(SettingsIcon) }} />
    </Tabs>
  );
}
