import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Icon } from '@/components/ui/icon';
import { Separator } from '@/components/ui/separator';
import { Text } from '@/components/ui/text';
import { cn } from '@/lib/utils';
import type { ComponentType } from 'react';
import { BadgeCheckIcon } from 'lucide-react-native';
import * as React from 'react';
import { View } from 'react-native';

function AvatarDemo() {
  // `Avatar` rounds the frame but AvatarFallback/AvatarImage round themselves too,
  // so a square avatar has to square both — hence `square` on each pair below.
  const square = 'rounded-lg';
  const rows = [
    { shape: 'Round', radius: '' },
    { shape: 'Square', radius: square },
  ];
  return (
    <View className="w-full gap-5">
      {rows.map((row) => (
        <View key={row.shape} className="gap-2">
          <Text className="text-muted-foreground text-xs font-semibold uppercase tracking-wide">{row.shape}</Text>
          <View className="flex-row flex-wrap items-end gap-5">
            <View className="items-center gap-1.5">
              <Avatar alt="Expo" className={row.radius}>
                <AvatarImage source={{ uri: 'https://github.com/expo.png' }} className={row.radius} />
                <AvatarFallback className={row.radius}>
                  <Text>EX</Text>
                </AvatarFallback>
              </Avatar>
              <Text className="text-muted-foreground text-xs">Image</Text>
            </View>
            <View className="items-center gap-1.5">
              <Avatar alt="Jane Doe" className={row.radius}>
                <AvatarFallback className={row.radius}>
                  <Text>JD</Text>
                </AvatarFallback>
              </Avatar>
              <Text className="text-muted-foreground text-xs">Initials</Text>
            </View>
            <View className="items-center gap-1.5">
              <Avatar alt="Sam" className={cn('size-8', row.radius)}>
                <AvatarFallback className={row.radius}>
                  <Text className="text-xs">SO</Text>
                </AvatarFallback>
              </Avatar>
              <Text className="text-muted-foreground text-xs">Small 32</Text>
            </View>
            <View className="items-center gap-1.5">
              <Avatar alt="Mei" className={cn('size-16', row.radius)}>
                <AvatarFallback className={row.radius}>
                  <Text className="text-lg">MT</Text>
                </AvatarFallback>
              </Avatar>
              <Text className="text-muted-foreground text-xs">Large 64</Text>
            </View>
          </View>
        </View>
      ))}
    </View>
  );
}

function BadgeDemo() {
  return (
    <View className="gap-2">
      <View className="flex-row flex-wrap gap-2">
        <Badge>
          <Text>Default</Text>
        </Badge>
        <Badge variant="secondary">
          <Text>Secondary</Text>
        </Badge>
        <Badge variant="destructive">
          <Text>Destructive</Text>
        </Badge>
        <Badge variant="outline">
          <Text>Outline</Text>
        </Badge>
      </View>
      <View className="flex-row flex-wrap gap-2">
        <Badge className="bg-success">
          <Icon as={BadgeCheckIcon} className="text-success-foreground" />
          <Text className="text-success-foreground">Verified</Text>
        </Badge>
        <Badge className="min-w-5 rounded-full px-1">
          <Text>8</Text>
        </Badge>
        <Badge className="min-w-5 rounded-full px-1" variant="destructive">
          <Text>99+</Text>
        </Badge>
      </View>
      <View className="flex-row flex-wrap items-center gap-2">
        <Badge size="sm" variant="secondary">
          <Text>Small</Text>
        </Badge>
        <Badge variant="secondary">
          <Text>Medium</Text>
        </Badge>
      </View>
    </View>
  );
}

function SeparatorDemo() {
  return (
    <View className="w-full">
      <View className="gap-1">
        <Text className="text-sm font-medium leading-none">Section title</Text>
        <Text className="text-muted-foreground text-sm">Supporting description.</Text>
      </View>
      <Separator className="my-4" />
      <View className="h-5 flex-row items-center gap-4">
        <Text className="text-sm">Blog</Text>
        <Separator orientation="vertical" />
        <Text className="text-sm">Docs</Text>
        <Separator orientation="vertical" />
        <Text className="text-sm">Source</Text>
      </View>
    </View>
  );
}

/** Components page demos, keyed by the component id in registry/components.ts. */
export const DATA_DEMOS: Record<string, ComponentType> = {
  'avatar': AvatarDemo,
  'badge': BadgeDemo,
  'separator': SeparatorDemo,
};
