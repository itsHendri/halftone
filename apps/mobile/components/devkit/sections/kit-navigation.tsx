import { Badge } from '@/components/ui/badge';
import { ScreenHeader } from '@/components/kit/screen-header';
import { HorizontalPager } from '@/components/kit/horizontal-pager';
import { SectionHeader } from '@/components/kit/section-header';
import { Stepper } from '@/components/kit/stepper';
import { TabBarItem, tabIcon } from '@/components/kit/tab-bar';
import { usePalette } from '@/lib/palette-context';
import { Text } from '@/components/ui/text';
import type { ComponentType } from 'react';
import { HouseIcon, ListIcon, SettingsIcon } from 'lucide-react-native';
import * as React from 'react';
import { useWindowDimensions, View } from 'react-native';

function TabBarDemo() {
  const c = usePalette();
  const [active, setActive] = React.useState(0);
  const tabs = [
    { label: "Home", icon: HouseIcon },
    { label: "Activity", icon: ListIcon },
    { label: "Settings", icon: SettingsIcon },
  ];
  return (
    <View role="tablist" aria-label="Sections" className="bg-background border-border w-full flex-row overflow-hidden rounded-lg border">
      {tabs.map((t, i) => {
        const focused = i === active;
        const color = focused ? c.primary : c.mutedForeground;
        return <TabBarItem key={t.label} label={t.label} focused={focused} color={color} icon={tabIcon(t.icon)({ focused, color, size: 24 })} onPress={() => setActive(i)} />;
      })}
    </View>
  );
}

function StepperDemo() {
  return (
    <View className="w-full gap-6">
      <Stepper current={2} total={4} labels={['Details', 'Verify', 'Review', 'Done']} />
      <Stepper current={3} total={5} variant="compact" />
    </View>
  );
}

function SectionHeaderDemo() {
  return (
    <View className="w-full gap-4">
      <SectionHeader title="Recent activity" action="See all" onAction={() => {}} />
      <SectionHeader title="Without action" />
    </View>
  );
}

function PagerDotsDemo() {
  const { width } = useWindowDimensions();
  const slides = ['Welcome', 'Set up your profile', 'Invite your team', 'You are ready'];
  return (
    <View className="-mx-5 self-stretch">
      <HorizontalPager itemWidth={width - 52} gap={12}>
        {slides.map((t, i) => (
          <View key={t} className="bg-card border-border h-40 items-center justify-center rounded-xl border px-6">
            <Text className="text-lg font-semibold">{t}</Text>
            <Text className="text-muted-foreground text-sm">Swipe · slide {i + 1} of {slides.length}</Text>
          </View>
        ))}
      </HorizontalPager>
    </View>
  );
}

function HorizontalPagerDemo() {
  return (
    <View className="-mx-5 self-stretch">
      <HorizontalPager itemWidth={280} showDots={false}>
        {['Getting started', 'Tips and tricks', 'What is new'].map((t, i) => (
          <View key={t} className="bg-card border-border h-36 justify-end rounded-xl border p-4">
            <Text className="text-muted-foreground text-xs">Card {i + 1}</Text>
            <Text className="text-lg font-semibold">{t}</Text>
          </View>
        ))}
      </HorizontalPager>
    </View>
  );
}


function ScreenHeaderDemo() {
  return (
    <View className="w-full gap-6">
      <ScreenHeader
        title="Quick access"
        subtitle="If you have left the app for more than 15 minutes you will need to sign in again. Make it easy with a quick access option."
      />
      <ScreenHeader title="Accounts" size="large" action={<Badge variant="secondary"><Text>4 open</Text></Badge>} />
    </View>
  );
}

/** Kitchen Sink demos, keyed by the component id in registry/components.ts. */
export const KIT_NAVIGATION_DEMOS: Record<string, ComponentType> = {
  'tab-bar': TabBarDemo,
  'stepper': StepperDemo,
  'section-header': SectionHeaderDemo,
  'pager-dots': PagerDotsDemo,
  'horizontal-pager': HorizontalPagerDemo,
  'screen-header': ScreenHeaderDemo,
};
