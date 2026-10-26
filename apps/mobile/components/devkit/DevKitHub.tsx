import { SearchField } from '@/components/kit/search-field';
import { Badge } from '@/components/ui/badge';
import { Icon } from '@/components/ui/icon';
import { Text } from '@/components/ui/text';
import { haptic } from '@/lib/haptics';
import { cn } from '@/lib/utils';
import { DevKitSection } from './DevKitSection';
import { matchesQuery } from './registry';
import type { CategoryDef, Section } from './types';
import { ChevronDownIcon } from 'lucide-react-native';
import * as React from 'react';
import { type LayoutChangeEvent, Pressable, ScrollView, View } from 'react-native';

type Props<Id extends string> = {
  categories: CategoryDef<Id>[];
  sections: Section<Id>[];
  searchPlaceholder: string;
  /** Category to open and scroll to on mount (deep links). Everything else starts collapsed. */
  focus?: Id;
  /** Section to scroll to and tint on mount (?section=<id>); opens its category. */
  focusSection?: string;
};

/** How long a deep-linked section stays tinted. */
const HIGHLIGHT_MS = 2000;

/**
 * One scrollable page: search on top, one disclosure per category, only one open at a time.
 * Typing collapses everything into a flat result list. No nested screens, no layout animations
 * (long previews inside animated accordions made scrolling unreliable on device).
 */
export function DevKitHub<Id extends string>({ categories, sections, searchPlaceholder, focus, focusSection }: Props<Id>) {
  const target = focusSection ? sections.find((s) => s.id === focusSection) : undefined;
  const initial = target?.category ?? focus ?? null;
  const [query, setQuery] = React.useState('');
  const [open, setOpen] = React.useState<Id | null>(initial);
  const scrollRef = React.useRef<ScrollView>(null);
  const offsets = React.useRef<Record<string, number>>({});
  const [pending, setPending] = React.useState<Id | null>(target ? null : initial);
  const [pendingSection, setPendingSection] = React.useState<string | null>(target?.id ?? null);
  const sectionOffsets = React.useRef<Record<string, number>>({});
  const [highlight, setHighlight] = React.useState<string | null>(target?.id ?? null);
  const scrollY = React.useRef(0);
  const trimmed = query.trim();

  const results = React.useMemo(() => (trimmed ? sections.filter((s) => matchesQuery(s, trimmed)) : []), [sections, trimmed]);
  const byCategory = React.useMemo(() => {
    const map = new Map<Id, Section<Id>[]>();
    for (const s of sections) map.set(s.category, [...(map.get(s.category) ?? []), s]);
    return map;
  }, [sections]);

  React.useEffect(() => {
    if (!highlight) return;
    const timer = setTimeout(() => setHighlight(null), HIGHLIGHT_MS);
    return () => clearTimeout(timer);
  }, [highlight]);

  /** A section's y inside the page = its category's y + its own y inside the category. */
  const scrollToPendingSection = (category: Id) => {
    if (!pendingSection || target?.category !== category) return;
    const catY = offsets.current[category];
    const secY = sectionOffsets.current[pendingSection];
    if (catY === undefined || secY === undefined) return;
    scrollRef.current?.scrollTo({ y: Math.max(0, catY + secY - 8), animated: false });
    setPendingSection(null);
  };

  const toggle = (id: Id) => {
    haptic('selection');
    setOpen((cur) => (cur === id ? null : id));
    // Scroll once the new layout is in, not on a timer: closing the previously open
    // category moves everything below it, so any offset read now is already stale.
    if (open !== id) setPending(id);
  };

  return (
    <ScrollView
      ref={scrollRef}
      scrollEventThrottle={16}
      onScroll={(e) => (scrollY.current = e.nativeEvent.contentOffset.y)}
      className="bg-background flex-1"
      contentContainerClassName="pb-16"
      keyboardShouldPersistTaps="handled"
      keyboardDismissMode="on-drag"
      contentInsetAdjustmentBehavior="automatic">
      <View className="px-5 pb-3 pt-3">
        <SearchField value={query} onChangeText={setQuery} placeholder={searchPlaceholder} />
      </View>

      {trimmed ? (
        results.length ? (
          results.map((s) => <DevKitSection key={`${s.category}-${s.id}`} section={s} />)
        ) : (
          <Text className="text-muted-foreground p-5">No matches. Search covers titles and aliases.</Text>
        )
      ) : (
        categories.map((cat) => {
          const items = byCategory.get(cat.id) ?? [];
          const isOpen = open === cat.id;
          return (
            <View
              key={cat.id}
              onLayout={(e: LayoutChangeEvent) => {
                const y = e.nativeEvent.layout.y;
                offsets.current[cat.id] = y;
                if (pending === cat.id) {
                  const target = Math.max(0, y - 8);
                  // Already there (within a row's height)? Leave the scroll alone.
                  if (Math.abs(scrollY.current - target) > 24) {
                    scrollRef.current?.scrollTo({ y: target, animated: true });
                  }
                  setPending(null);
                }
                scrollToPendingSection(cat.id);
              }}
              className="border-border border-b">
              <Pressable
                accessibilityRole="button"
                aria-expanded={isOpen}
                onPress={() => toggle(cat.id)}
                className={cn('min-h-16 flex-row items-center gap-3 px-5 py-3 active:bg-accent', isOpen && 'bg-muted-subtle')}>
                <View className="bg-muted size-10 items-center justify-center rounded-lg">
                  <Icon as={cat.icon} size={20} />
                </View>
                <View className="flex-1">
                  <Text className="text-base font-semibold">{cat.label}</Text>
                  <Text className="text-muted-foreground text-sm">{cat.blurb}</Text>
                </View>
                <Badge variant="secondary">
                  <Text>{items.length}</Text>
                </Badge>
                <View style={{ transform: [{ rotate: isOpen ? '180deg' : '0deg' }] }}>
                  <Icon as={ChevronDownIcon} size={18} className="text-muted-foreground" />
                </View>
              </Pressable>
              {isOpen
                ? items.map((s) => (
                    <DevKitSection
                      key={s.id}
                      section={s}
                      highlighted={highlight === s.id}
                      onLayout={(e) => {
                        sectionOffsets.current[s.id] = e.nativeEvent.layout.y;
                        scrollToPendingSection(cat.id);
                      }}
                    />
                  ))
                : null}
            </View>
          );
        })
      )}
    </ScrollView>
  );
}
