import { KitChip } from '@/components/kit/kit-chip';
import { Stack } from 'expo-router';

/** Northwind, the invoicing sample (the web kit's dashboard, on a phone). Delete app/northwind and components/northwind when starting a real project. */
export default function NorthwindLayout() {
  return (
    <>
      <Stack screenOptions={{ headerShown: false, headerBackButtonDisplayMode: 'minimal' }}>
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="invoice/[id]" options={{ headerShown: true, title: 'Invoice' }} />
        <Stack.Screen name="new" options={{ presentation: 'modal', headerShown: true, title: 'New invoice' }} />
      </Stack>
      <KitChip />
    </>
  );
}
