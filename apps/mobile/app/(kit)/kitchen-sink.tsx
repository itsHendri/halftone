import { CATEGORIES, isCategoryId } from '@/components/devkit/categories';
import { DevKitHub } from '@/components/devkit/DevKitHub';
import { DevKitSection } from '@/components/devkit/DevKitSection';
import { SECTIONS } from '@/components/devkit/registry';
import { Text } from '@/components/ui/text';
import { Icon } from '@/components/ui/icon';
import { EMBED, openInHost, reportEmbedSize } from '@/lib/embed';
import { ArrowUpRightIcon } from 'lucide-react-native';
import { useLocalSearchParams } from 'expo-router';
import { Pressable, ScrollView, View } from 'react-native';

/**
 * The Kitchen Sink: every component the kit ships, grouped by function, searchable.
 * Deep links (or protokit://kitchen-sink?…):
 *   /kitchen-sink?open=inputs          expand a category
 *   /kitchen-sink?section=list-row     expand its category, scroll to it, tint it briefly
 *   /kitchen-sink?section=list-row&embed=1   just that demo, no chrome (the docs' previews)
 *   …&autosize=1                             and report its height (kit:size), for a frame sized to it
 */
export default function KitchenSink() {
  const { open, section, tiles } = useLocalSearchParams<{ open?: string; section?: string; tiles?: string }>();

  // The docs index's live tiles (?tiles=a,b,c): each demo in a cell, its title opens the docs page (kit:open).
  if (EMBED.embedded && tiles) {
    const list = tiles
      .split(',')
      .map((id) => SECTIONS.find((s) => s.id === id))
      .filter((s) => s !== undefined);
    return (
      <ScrollView className="bg-background flex-1">
        <View className="bg-border flex-row flex-wrap gap-px" onLayout={(e) => reportEmbedSize(e.nativeEvent.layout.height)}>
          {list.map((s) => (
            <View key={s.id} className="bg-background min-w-[300px] flex-1 basis-[300px]">
              <Pressable
                onPress={() => openInHost(s.id)}
                accessibilityRole="button"
                accessibilityLabel={`Open ${s.title}`}
                className="flex-row items-center justify-between px-4 pt-3">
                <Text className="text-muted-foreground text-sm font-medium">{s.title}</Text>
                <Icon as={ArrowUpRightIcon} className="text-muted-foreground size-4" />
              </Pressable>
              <View className="max-h-80 min-h-44 overflow-hidden">
                <DevKitSection section={s} bare />
              </View>
            </View>
          ))}
        </View>
      </ScrollView>
    );
  }

  if (EMBED.embedded && section) {
    const match = SECTIONS.find((s) => s.id === section);
    return (
      <ScrollView className="bg-background flex-1">
        {/* Measured for the docs' plain-stage previews (?autosize=1 → kit:size). */}
        <View className="py-3" onLayout={(e) => reportEmbedSize(e.nativeEvent.layout.height)}>
          {match ? (
            <DevKitSection section={match} bare />
          ) : (
            <Text className="text-muted-foreground p-5">No component called “{section}” in this kit.</Text>
          )}
        </View>
      </ScrollView>
    );
  }

  return (
    <DevKitHub
      key={`${open ?? ''}:${section ?? ''}`}
      categories={CATEGORIES}
      sections={SECTIONS}
      searchPlaceholder="Search components"
      focus={isCategoryId(open) ? open : undefined}
      focusSection={section}
    />
  );
}
