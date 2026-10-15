import { ImageTile } from '@/components/kit/image-tile';
import { AspectRatio } from '@/components/ui/aspect-ratio';
import { Icon } from '@/components/ui/icon';
import { Text } from '@/components/ui/text';
import type { ComponentType } from 'react';
import {
  BellIcon,
  CalendarIcon,
  CameraIcon,
  HeartIcon,
  LockIcon,
  MailIcon,
  MapPinIcon,
  SearchIcon,
  SettingsIcon,
  StarIcon,
  UserIcon,
  WalletIcon,
} from 'lucide-react-native';
import { View } from 'react-native';

const SAMPLE_ICONS = [
  ['Bell', BellIcon],
  ['Calendar', CalendarIcon],
  ['Camera', CameraIcon],
  ['Heart', HeartIcon],
  ['Lock', LockIcon],
  ['Mail', MailIcon],
  ['MapPin', MapPinIcon],
  ['Search', SearchIcon],
  ['Settings', SettingsIcon],
  ['Star', StarIcon],
  ['User', UserIcon],
  ['Wallet', WalletIcon],
] as const;

function IconDemo() {
  return (
    <View className="w-full flex-row flex-wrap">
      {SAMPLE_ICONS.map(([name, as]) => (
        <View key={name} className="w-1/4 items-center gap-1 py-3">
          <Icon as={as} size={24} />
          <Text className="text-muted-foreground text-xs">{name}</Text>
        </View>
      ))}
    </View>
  );
}

function ImageTileDemo() {
  return (
    <View className="w-full flex-row gap-3">
      <ImageTile className="flex-1" source={{ uri: 'https://picsum.photos/seed/kit1/400/300' }} caption="From a URL" />
      <ImageTile className="flex-1" caption="Placeholder" />
    </View>
  );
}

function AspectRatioDemo() {
  return (
    <AspectRatio ratio={16 / 9} className="bg-muted w-full items-center justify-center overflow-hidden rounded-md">
      <Text className="text-muted-foreground text-sm">16 : 9</Text>
    </AspectRatio>
  );
}

/** Components page demos, keyed by the component id in registry/components.ts. */
export const MEDIA_DEMOS: Record<string, ComponentType> = {
  'icon': IconDemo,
  'image-tile': ImageTileDemo,
  'aspect-ratio': AspectRatioDemo,
};
