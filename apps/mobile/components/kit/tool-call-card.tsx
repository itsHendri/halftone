import { Spinner } from '@/components/kit/spinner';
import { Icon } from '@/components/ui/icon';
import { Text } from '@/components/ui/text';
import { cn } from '@/lib/utils';
import { CheckCircle2Icon, ChevronDownIcon, CircleAlertIcon, CircleSlashIcon, WrenchIcon } from 'lucide-react-native';
import * as React from 'react';
import { Pressable, ScrollView, View } from 'react-native';

type Props = {
  /** What the tool does, in words: "Searched orders", not "search_orders". */
  title: string;
  /** `stopped`: the person cancelled it before it finished. Neutral, not an error. */
  status: 'running' | 'done' | 'error' | 'stopped';
  /** The call's inputs and result, for people who want to check. Collapsed by default. */
  input?: string;
  output?: string;
  className?: string;
};

const STATUS = {
  running: { icon: null, label: 'Running', tone: 'text-muted-foreground' },
  done: { icon: CheckCircle2Icon, label: 'Done', tone: 'text-success' },
  error: { icon: CircleAlertIcon, label: 'Failed', tone: 'text-destructive' },
  stopped: { icon: CircleSlashIcon, label: 'Stopped', tone: 'text-muted-foreground' },
} as const;

function Code({ children }: { children: string }) {
  return (
    <ScrollView horizontal className="bg-muted rounded-md" contentContainerClassName="p-2">
      <Text className="font-mono text-xs">{children}</Text>
    </ScrollView>
  );
}

/** One action the assistant took, shown in the conversation so people can see what it did. */
export function ToolCallCard({ title, status, input, output, className }: Props) {
  const [open, setOpen] = React.useState(false);
  const s = STATUS[status];
  const details = !!(input || output);
  return (
    <View className={cn('border-border bg-card overflow-hidden rounded-xl border', className)}>
      <Pressable
        disabled={!details}
        onPress={() => setOpen((o) => !o)}
        accessibilityRole="button"
        accessibilityLabel={`${title}, ${s.label}`}
        accessibilityState={details ? { expanded: open } : undefined}
        className="min-h-11 flex-row items-center gap-3 px-3 py-2.5 active:opacity-80">
        <Icon as={WrenchIcon} size={16} className="text-muted-foreground" />
        <Text numberOfLines={1} className="flex-1 text-sm font-medium">
          {title}
        </Text>
        <View className="flex-row items-center gap-1">
          {s.icon ? <Icon as={s.icon} size={16} className={s.tone} /> : <Spinner tone="muted" accessibilityLabel="Running" />}
          <Text className={cn('text-sm', s.tone)}>{s.label}</Text>
        </View>
        {details ? <Icon as={ChevronDownIcon} size={16} className={cn('text-muted-foreground', open && 'rotate-180')} /> : null}
      </Pressable>
      {details && open ? (
        <View className="border-border gap-2 border-t px-3 py-2.5">
          {input ? <Code>{input}</Code> : null}
          {output ? <Code>{output}</Code> : null}
        </View>
      ) : null}
    </View>
  );
}
