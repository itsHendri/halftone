import { Logo } from '@/components/kit/logo';
import { TabBar, tabIcon } from '@/components/kit/tab-bar';
import { Tabs } from 'expo-router';
import { PackageIcon, ShoppingBagIcon, ShoppingCartIcon, UserIcon } from 'lucide-react-native';

export default function ShopTabs() {
  return (
    <Tabs tabBar={(props) => <TabBar {...props} />}>
      <Tabs.Screen name="index" options={{ title: 'Shop', headerTitle: () => <Logo name="Shop" size={22} />, tabBarIcon: tabIcon(ShoppingBagIcon) }} />
      <Tabs.Screen name="cart" options={{ title: 'Cart', tabBarIcon: tabIcon(ShoppingCartIcon) }} />
      <Tabs.Screen name="orders" options={{ title: 'Orders', tabBarIcon: tabIcon(PackageIcon) }} />
      <Tabs.Screen name="account" options={{ title: 'Account', tabBarIcon: tabIcon(UserIcon) }} />
    </Tabs>
  );
}
