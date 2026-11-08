import { CATEGORIES, isCategoryId } from '@/components/devkit/categories';
import { DevKitHub } from '@/components/devkit/DevKitHub';
import { DevKitSection } from '@/components/devkit/DevKitSection';
import { SECTIONS } from '@/components/devkit/registry';
import { Text } from '@/components/ui/text';
import { EMBED, openInHost, reportEmbedSize } from '@/lib/embed';
import { useLocalSearchParams } from 'expo-router';
import { Pressable, ScrollView, View } from 'react-native';

/**
 * The Components page: every component the kit ships, grouped by function, searchable.
 * Deep links (or halftone://components?…):
 *   /components?open=inputs          expand a category
 *   /components?section=list-row     expand its category, scroll to it, outline it briefly
 *   /components?section=list-row&embed=1   just that demo, no chrome (the docs' previews)
 *   …&autosize=1                             and report its height (kit:size), for a frame sized to it
 */
export default function ComponentsScreen() {
  const { open, section, tiles, lines } = useLocalSearchParams<{ open?: string; section?: string; tiles?: string; lines?: string }>();

  // The docs index's cards (?tiles=a,b,c): each demo live on a quiet canvas, then its name (opens the docs page,
  // kit:open) and the line the docs send for it in ?lines= (JSON, id → text). Only the name is the link: the canvas
  // stays live.
  if (EMBED.embedded && tiles) {
    const list = tiles
      .split(',')
      .map((id) => SECTIONS.find((s) => s.id === id))
      .filter((s) => s !== undefined);
    const notes = readLines(lines);
    return (
      <ScrollView className="bg-background flex-1">
        {/* p-px keeps the cards' hairlines inside the frame. */}
        <View className="flex-row flex-wrap gap-x-4 gap-y-6 p-px" onLayout={(e) => reportEmbedSize(e.nativeEvent.layout.height)}>
          {list.map((s) => (
            <View key={s.id} className="min-w-[260px] flex-1 basis-[260px] gap-2">
              <View className="border-border bg-background h-52 justify-center overflow-hidden rounded-2xl border">
                <DevKitSection section={s} bare />
              </View>
              <Pressable onPress={() => openInHost(s.id)} accessibilityRole="button" accessibilityLabel={`Open ${s.title}`} className="self-start">
                <Text className="text-foreground text-sm font-medium">{s.title}</Text>
                {notes[s.id] ? <Text className="text-muted-foreground text-xs">{notes[s.id]}</Text> : null}
              </Pressable>
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

/** ?lines= as a map; anything unreadable is no lines. */
function readLines(raw: string | undefined): Record<string, string> {
  if (!raw) return {};
  try {
    const v: unknown = JSON.parse(raw);
    return v && typeof v === 'object' ? Object.fromEntries(Object.entries(v).filter(([, t]) => typeof t === 'string')) : {};
  } catch {
    return {};
  }
}
