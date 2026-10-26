import { Footnote } from '@/components/kit/footnote';
import { PromoCard } from '@/components/kit/promo-card';
import { Prose } from '@/components/kit/prose';
import { Button } from '@/components/ui/button';
import { Text } from '@/components/ui/text';
import * as React from 'react';
import { StickyBottomBar } from '@/components/kit/sticky-bottom-bar';
import type { ComponentType } from 'react';
import { View } from 'react-native';

function StickyBottomBarDemo() {
  return (
    <View className="border-border w-full gap-3 overflow-hidden rounded-lg border">
      <View className="bg-muted-subtle h-16 items-center justify-center">
        <Text className="text-muted-foreground text-sm">scrolling content</Text>
      </View>
      <StickyBottomBar className="pb-3">
        <Button variant="outline">
          <Text>Sell</Text>
        </Button>
        <Button>
          <Text>Buy</Text>
        </Button>
      </StickyBottomBar>
    </View>
  );
}


function PromoCardDemo() {
  const [dismissed, setDismissed] = React.useState(false);
  return (
    <View className="w-full gap-3">
      {dismissed ? (
        <Button size="sm" variant="outline" onPress={() => setDismissed(false)}>
          <Text>Bring it back</Text>
        </Button>
      ) : (
        <PromoCard
          title="Earn more on your everyday balance"
          body="Set up a direct deposit and unlock a higher rate. Terms apply."
          action={{ label: 'Learn about the higher rate', onPress: () => {} }}
          onDismiss={() => setDismissed(true)}
          seed="promo-rate"
        />
      )}
      <PromoCard title="Your statement is ready" body="March 2026 is available to download." tone="muted" seed="promo-statement" />
    </View>
  );
}

function FootnoteDemo() {
  return (
    <Footnote action={{ label: 'Learn more', onPress: () => {} }}>
      Rates shown are indicative and may change. This is a prototype — nothing here is a real financial product.
    </Footnote>
  );
}

function ProseDemo() {
  return (
    <Prose>
      <Text variant="h3">Building the habit</Text>
      <Text variant="p">
        Most streaks break on the third day, not the first. Pick one small thing you can do even on a bad day, and
        attach it to something you already do.
      </Text>
      <Text variant="blockquote">“Two minutes counts. Showing up is the habit; the rest follows.”</Text>
      <Text variant="h4">When you miss a day</Text>
      <Text variant="p">
        Never miss twice. Log the miss, keep the streak history, and set tomorrow’s reminder with{' '}
        <Text variant="code">Remind me at 8:00</Text>.
      </Text>
    </Prose>
  );
}

/** Components page demos, keyed by the component id in registry/components.ts. */
export const KIT_LAYOUT_DEMOS: Record<string, ComponentType> = {
  'sticky-bottom-bar': StickyBottomBarDemo,
  'promo-card': PromoCardDemo,
  'footnote': FootnoteDemo,
  prose: ProseDemo,
};
