import { Icon } from '@/components/ui/icon';
import { Text } from '@/components/ui/text';
import { cn } from '@/lib/utils';
import { FileTextIcon, ImageIcon, XIcon } from 'lucide-react-native';
import { Pressable, View } from 'react-native';

export type Attachment = { name: string; size: number; type?: string };

/** 1234 → "1.2 KB". */
export function formatBytes(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  const units = ['KB', 'MB', 'GB'];
  let value = bytes / 1024;
  let unit = 0;
  while (value >= 1024 && unit < units.length - 1) {
    value /= 1024;
    unit++;
  }
  return `${value < 10 ? value.toFixed(1) : Math.round(value)} ${units[unit]}`;
}

type Props = {
  file: Attachment;
  /** Shows a remove button (in the composer, before sending). Omit in a sent message. */
  onRemove?: () => void;
  className?: string;
};

/** A file in a conversation: an icon by type, the name and the size. Removable while composing. */
export function AttachmentChip({ file, onRemove, className }: Props) {
  return (
    <View className={cn('border-border bg-card max-w-64 flex-row items-center gap-2 rounded-lg border py-1.5 pl-2.5', onRemove ? 'pr-0' : 'pr-2.5', className)}>
      <Icon as={file.type?.startsWith('image/') ? ImageIcon : FileTextIcon} size={16} className="text-muted-foreground shrink-0" />
      <Text numberOfLines={1} className="min-w-0 flex-shrink text-sm font-medium">
        {file.name}
      </Text>
      <Text className="text-muted-foreground shrink-0 text-xs tabular-nums">{formatBytes(file.size)}</Text>
      {onRemove ? (
        <Pressable onPress={onRemove} hitSlop={8} accessibilityRole="button" accessibilityLabel={`Remove ${file.name}`} className="active:bg-accent -my-1.5 size-9 items-center justify-center rounded-md">
          <Icon as={XIcon} size={14} className="text-muted-foreground" />
        </Pressable>
      ) : null}
    </View>
  );
}
