import { PagerDots } from '@/components/kit/pager-dots';
import * as React from 'react';
import { ScrollView, View } from 'react-native';

type Props = {
  children: React.ReactNode;
  /** Width of each page — required for snapping. */
  itemWidth: number;
  gap?: number;
  sidePadding?: number;
  showDots?: boolean;
  onIndexChange?: (index: number) => void;
};

/** Horizontal snap pager with dots. Marketing banners, account cards, onboarding slides. */
export function HorizontalPager({ children, itemWidth, gap = 12, sidePadding = 20, showDots = true, onIndexChange }: Props) {
  const items = React.Children.toArray(children);
  const [active, setActive] = React.useState(0);
  const stride = itemWidth + gap;
  return (
    <View className="self-stretch">
      <ScrollView
        className="flex-grow-0"
        // Reachable by keyboard on the web (arrow keys scroll it), named for screen readers.
        focusable
        role="region"
        aria-label="Pages"
        horizontal
        snapToInterval={stride}
        decelerationRate="fast"
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ paddingHorizontal: sidePadding }}
        scrollEventThrottle={16}
        onScroll={(e) => {
          const i = Math.round(e.nativeEvent.contentOffset.x / stride);
          if (i !== active && i >= 0 && i < items.length) {
            setActive(i);
            onIndexChange?.(i);
          }
        }}>
        {items.map((child, i) => (
          <View key={i} style={{ width: itemWidth, marginRight: i === items.length - 1 ? 0 : gap }}>
            {child}
          </View>
        ))}
      </ScrollView>
      {showDots && items.length > 1 ? <PagerDots count={items.length} activeIndex={active} className="mt-3" /> : null}
    </View>
  );
}
