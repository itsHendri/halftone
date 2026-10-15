import { ActionGrid } from '@/components/kit/action-grid';
import { FloatingButton } from '@/components/kit/floating-button';
import { IconBadge } from '@/components/kit/icon-badge';
import { SwipeToConfirm } from '@/components/kit/swipe-to-confirm';
import { Button } from '@/components/ui/button';
import { Text } from '@/components/ui/text';
import { ArrowUpRightIcon, BellIcon, EllipsisIcon, FileTextIcon, MailIcon, PlusIcon, ShoppingCartIcon } from 'lucide-react-native';
import type { ComponentType } from 'react';
import * as React from 'react';
import { View } from 'react-native';

function FloatingButtonDemo() {
  return (
    <View className="flex-row items-center gap-3">
      <FloatingButton icon={PlusIcon} accessibilityLabel="Add" />
      <FloatingButton icon={PlusIcon} label="Primary" />
      <FloatingButton icon={PlusIcon} label="Secondary" variant="secondary" />
    </View>
  );
}

function IconBadgeDemo() {
  return (
    <View className="flex-row items-center gap-2">
      <IconBadge icon={BellIcon} count={3} accessibilityLabel="Notifications" />
      <IconBadge icon={MailIcon} count={120} accessibilityLabel="Inbox" />
      <IconBadge icon={ShoppingCartIcon} dot accessibilityLabel="Cart" />
      <IconBadge icon={BellIcon} accessibilityLabel="Notifications, none" />
    </View>
  );
}

function SwipeToConfirmDemo() {
  const [key, setKey] = React.useState(0);
  return (
    <View className="w-full gap-3">
      <SwipeToConfirm key={key} label="Slide to proceed" onConfirm={() => {}} />
      <SwipeToConfirm key={key + 1000} label="Slide to delete" confirmLabel="Deleted" tone="destructive" onConfirm={() => {}} />
      <Button variant="outline" onPress={() => setKey((k) => k + 1)}>
        <Text>Reset</Text>
      </Button>
    </View>
  );
}


function ActionGridDemo() {
  const [last, setLast] = React.useState('nothing yet');
  return (
    <View className="w-full gap-3">
      <ActionGrid
        items={[
          { icon: PlusIcon, label: 'Add funds', onPress: () => setLast('Add funds') },
          { icon: FileTextIcon, label: 'Pay a bill', onPress: () => setLast('Pay a bill') },
          { icon: ArrowUpRightIcon, label: 'Send', onPress: () => setLast('Send') },
          { icon: EllipsisIcon, label: 'More', badge: true, onPress: () => setLast('More') },
        ]}
      />
      <Text className="text-muted-foreground text-sm">Tapped: {last}</Text>
    </View>
  );
}

/** Components page demos, keyed by the component id in registry/components.ts. */
export const KIT_ACTIONS_DEMOS: Record<string, ComponentType> = {
  'floating-button': FloatingButtonDemo,
  'icon-badge': IconBadgeDemo,
  'swipe-to-confirm': SwipeToConfirmDemo,
  'action-grid': ActionGridDemo,
};
