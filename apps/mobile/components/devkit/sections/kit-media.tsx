import { Logo } from '@/components/kit/logo';
import { Placeholder } from '@/components/kit/placeholder';
import { Spot } from '@/components/kit/spot';
import { Button } from '@/components/ui/button';
import { Text } from '@/components/ui/text';
import { BellIcon, LockIcon, ShieldCheckIcon, UserIcon } from 'lucide-react-native';
import * as React from 'react';
import { View } from 'react-native';
import type { ComponentType } from 'react';

function PlaceholderDemo() {
  const [round, setRound] = React.useState(0);
  const seeds = ['arc lamp', 'headphones', 'tote bag', 'planter'].map((s) => `${s}-${round}`);
  return (
    <View className="w-full gap-3">
      <View className="flex-row gap-3">
        {seeds.slice(0, 3).map((seed) => (
          <View key={seed} className="flex-1">
            <Placeholder seed={seed} />
          </View>
        ))}
      </View>
      <View className="flex-row gap-3">
        <View className="flex-1">
          <Placeholder seed={seeds[3]} ratio={16 / 9} palette="mono" />
        </View>
        <View className="flex-1">
          <Placeholder seed={seeds[0]} ratio={16 / 9} palette="primary" />
        </View>
      </View>
      <View className="flex-row items-center gap-3">
        <Button size="sm" variant="outline" onPress={() => setRound((r) => r + 1)}>
          <Text>New seeds</Text>
        </Button>
        <Text className="text-muted-foreground flex-1 text-sm">The same seed always draws the same art.</Text>
      </View>
    </View>
  );
}

function SpotDemo() {
  return (
    <View className="w-full gap-4">
      <View className="flex-row flex-wrap items-center gap-4">
        <Spot icon={BellIcon} size="md" />
        <Spot icon={LockIcon} size="md" shape="square" />
        <Spot icon={ShieldCheckIcon} size="md" tone="success" />
        <Spot icon={UserIcon} size="md" tone="info" />
      </View>
      <View className="flex-row flex-wrap items-center gap-4">
        <Spot icon={BellIcon} size="lg" tone="warning" />
        <Spot icon={ShieldCheckIcon} size="md" tone="primary" ring />
      </View>
    </View>
  );
}

/** The brand's logo in its places: full, the mark, and on a primary fill. */
function LogoDemo() {
  return (
    <View className="w-full gap-4">
      <Logo size={28} />
      <View className="flex-row items-center gap-4">
        <Logo variant="mark" size={40} />
        <Logo variant="mark" size={24} />
        <Logo name="Northwind" size={20} />
      </View>
      <View className="bg-primary flex-row items-center rounded-xl p-4">
        <Logo size={24} tone="primaryForeground" />
      </View>
    </View>
  );
}

/** Components page demos, keyed by the component id in registry/components.ts. */
export const KIT_MEDIA_DEMOS: Record<string, ComponentType> = {
  'logo': LogoDemo,
  'placeholder': PlaceholderDemo,
  'spot': SpotDemo,
};
