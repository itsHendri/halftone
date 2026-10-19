import { Logo } from '@/components/kit/logo';
import { TabBar, tabIcon } from '@/components/kit/tab-bar';
import { Tabs } from 'expo-router';
import { CalendarIcon, ChartBarIcon, SettingsIcon, TargetIcon } from 'lucide-react-native';

export default function HabitsTabs() {
  return (
    <Tabs tabBar={(props) => <TabBar {...props} />}>
      <Tabs.Screen name="index" options={{ title: 'Today', headerTitle: () => <Logo name="Habits" size={22} />, tabBarIcon: tabIcon(TargetIcon) }} />
      <Tabs.Screen name="insights" options={{ title: 'Insights', tabBarIcon: tabIcon(ChartBarIcon) }} />
      <Tabs.Screen name="calendar" options={{ title: 'Calendar', tabBarIcon: tabIcon(CalendarIcon) }} />
      <Tabs.Screen name="settings" options={{ title: 'Settings', tabBarIcon: tabIcon(SettingsIcon) }} />
    </Tabs>
  );
}
