import { Sheet } from '@/components/kit/sheet';
import { Icon } from '@/components/ui/icon';
import { Text } from '@/components/ui/text';
import { cn } from '@/lib/utils';
import { ExternalLinkIcon, FileTextIcon } from 'lucide-react-native';
import * as React from 'react';
import { Linking, Pressable, View } from 'react-native';

export type Source = {
  title: string;
  /** Where it lives: "Invoice · 28 May", "help.northwind.co". */
  meta?: string;
  /** The passage the answer used, one or two sentences. */
  snippet?: string;
  href?: string;
};

/** The nth source's preview in a bottom sheet (a phone has no room for a popover). */
function PreviewSheet({ n, source, onClose }: { n: number; source?: Source; onClose: () => void }) {
  return (
    <Sheet open={!!source} onClose={onClose} title={source ? `Source ${n}` : undefined}>
      {source ? (
        <View className="gap-3 px-5 pb-2">
          <Text className="font-semibold">{source.title}</Text>
          {source.meta ? <Text className="text-muted-foreground text-xs">{source.meta}</Text> : null}
          {source.snippet ? (
            <View className="border-border border-l-2 pl-3">
              <Text className="text-muted-foreground leading-6">{source.snippet}</Text>
            </View>
          ) : null}
          {source.href ? (
            <Pressable onPress={() => Linking.openURL(source.href!)} accessibilityRole="link" className="min-h-11 flex-row items-center gap-1 self-start">
              <Text className="text-sm font-medium underline">Open source</Text>
              <Icon as={ExternalLinkIcon} size={12} />
            </Pressable>
          ) : null}
        </View>
      ) : null}
    </Sheet>
  );
}

function usePreview(sources: Source[]) {
  const [open, setOpen] = React.useState<number | null>(null);
  const sheet = <PreviewSheet n={(open ?? 0) + 1} source={open === null ? undefined : sources[open]} onClose={() => setOpen(null)} />;
  return { show: setOpen, sheet };
}

/** The sources under an answer: numbered chips, each opening a preview of what was used. */
export function SourceList({ sources, label = 'Sources', className }: { sources: Source[]; label?: string; className?: string }) {
  const { show, sheet } = usePreview(sources);
  if (!sources.length) return null;
  return (
    <View className={cn('gap-2', className)}>
      <Text className="text-muted-foreground text-xs font-medium">{label}</Text>
      <View accessibilityLabel={label} className="flex-row flex-wrap gap-2">
        {sources.map((s, i) => (
          <Pressable
            key={`${s.title}-${i}`}
            onPress={() => show(i)}
            accessibilityRole="button"
            accessibilityLabel={`Source ${i + 1}: ${s.title}`}
            className="border-border bg-card active:bg-accent min-h-9 max-w-60 flex-row items-center gap-2 rounded-lg border px-2 py-1">
            <View className="bg-muted size-4 items-center justify-center rounded">
              <Text className="text-[10px] font-medium leading-3">{i + 1}</Text>
            </View>
            <Icon as={FileTextIcon} size={14} className="text-muted-foreground" />
            <Text numberOfLines={1} className="flex-shrink text-xs">
              {s.title}
            </Text>
          </Pressable>
        ))}
      </View>
      {sheet}
    </View>
  );
}

/**
 * An answer with inline citations: every `[n]` in `text` becomes a small numbered marker that opens the
 * nth source's preview. While an answer streams, show it with `stripCitations` instead.
 */
export function CitedText({ text, sources, className }: { text: string; sources: Source[]; className?: string }) {
  const { show, sheet } = usePreview(sources);
  const parts = text.split(/(\[\d+\])/g);
  return (
    <>
      <Text className={className ?? 'leading-6'}>
        {parts.map((part, i) => {
          const n = /^\[(\d+)\]$/.exec(part)?.[1];
          const source = n ? sources[Number(n) - 1] : undefined;
          if (!n || !source) return part;
          return (
            <Text key={i} onPress={() => show(Number(n) - 1)} accessibilityRole="button" accessibilityLabel={`Source ${n}: ${source.title}`} className="bg-muted text-xs font-medium">
              {` ${n} `}
            </Text>
          );
        })}
      </Text>
      {sheet}
    </>
  );
}

/** The answer without its `[n]` markers, for StreamingText. */
export const stripCitations = (text: string) => text.replace(/\s?\[\d+\]/g, '');
