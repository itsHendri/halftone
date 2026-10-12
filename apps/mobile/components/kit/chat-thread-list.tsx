import { Button } from '@/components/ui/button';
import { Icon } from '@/components/ui/icon';
import { Text } from '@/components/ui/text';
import { cn } from '@/lib/utils';
import { PlusIcon } from 'lucide-react-native';
import { Pressable, View } from 'react-native';

export type ChatThread = {
  id: string;
  title: string;
  /** The last line of the conversation, one line. */
  preview?: string;
  /** A heading the thread sits under: "Today", "Previous 7 days". Threads in a group must be adjacent. */
  group?: string;
};

type Props = {
  threads: ChatThread[];
  activeId?: string;
  onSelect: (id: string) => void;
  /** Shows a "New chat" button above the list. */
  onNew?: () => void;
  className?: string;
};

/**
 * Past conversations in an AI product: a screen of its own on phones, or the content of a Sheet. Newest
 * first, grouped by when. The open conversation is marked selected.
 */
export function ChatThreadList({ threads, activeId, onSelect, onNew, className }: Props) {
  const groups: { label?: string; threads: ChatThread[] }[] = [];
  for (const t of threads) {
    const last = groups.at(-1);
    if (last && last.label === t.group) last.threads.push(t);
    else groups.push({ label: t.group, threads: [t] });
  }

  return (
    <View role="navigation" aria-label="Conversations" className={cn('gap-4', className)}>
      {onNew ? (
        <Button variant="outline" className="justify-start" onPress={onNew}>
          <Icon as={PlusIcon} size={16} />
          <Text>New chat</Text>
        </Button>
      ) : null}
      {threads.length === 0 ? <Text className="text-muted-foreground px-3 text-sm">No conversations yet.</Text> : null}
      {groups.map((g, i) => (
        <View key={`${g.label ?? ''}-${i}`} className="gap-1">
          {g.label ? (
            <Text role="heading" className="text-muted-foreground px-3 pb-1 text-xs font-medium">
              {g.label}
            </Text>
          ) : null}
          {g.threads.map((t) => {
            const active = t.id === activeId;
            return (
              <Pressable
                key={t.id}
                onPress={() => onSelect(t.id)}
                accessibilityRole="button"
                accessibilityState={{ selected: active }}
                aria-current={active ? 'page' : undefined}
                className={cn('min-h-11 justify-center gap-0.5 rounded-lg px-3 py-2', active ? 'bg-accent' : 'active:bg-accent/60')}>
                <Text numberOfLines={1} className={cn('text-sm font-medium', active && 'text-accent-foreground')}>
                  {t.title}
                </Text>
                {t.preview ? (
                  <Text numberOfLines={1} className="text-muted-foreground text-xs">
                    {t.preview}
                  </Text>
                ) : null}
              </Pressable>
            );
          })}
        </View>
      ))}
    </View>
  );
}
