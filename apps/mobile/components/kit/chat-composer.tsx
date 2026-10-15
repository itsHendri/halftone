import { AttachmentChip, type Attachment } from '@/components/kit/attachment-chip';
import { Icon } from '@/components/ui/icon';
import { useFontStyle } from '@/components/ui/text';
import { haptic } from '@/lib/haptics';
import { cn } from '@/lib/utils';
import { ArrowUpIcon, PaperclipIcon, SquareIcon } from 'lucide-react-native';
import * as React from 'react';
import { Platform, Pressable, TextInput, View } from 'react-native';

type Props = {
  /** The message, and any files attached to it (an empty array when attachments are off or none). */
  onSend: (text: string, files: Attachment[]) => void;
  /** While the assistant answers: the send button becomes Stop. */
  busy?: boolean;
  onStop?: () => void;
  placeholder?: string;
  /**
   * Turns on attachments: a paperclip button whose press returns the files to attach (from a picker, or
   * mock files in a prototype). They show as chips to review and remove before sending.
   */
  onAttach?: () => Attachment[] | undefined | Promise<Attachment[] | undefined>;
  /** At most this many files per message (default 5). */
  maxFiles?: number;
  className?: string;
};

/** Where the user writes. The arrow sends (Enter on a hardware keyboard on web; Shift+Enter breaks a line). */
export function ChatComposer({ onSend, busy, onStop, placeholder = 'Ask anything', onAttach, maxFiles = 5, className }: Props) {
  const [value, setValue] = React.useState('');
  const [files, setFiles] = React.useState<Attachment[]>([]);
  const font = useFontStyle('text-base');

  const attach = async () => {
    const picked = await onAttach?.();
    if (picked?.length) setFiles((fs) => [...fs, ...picked].slice(0, maxFiles));
  };

  const canSend = !!value.trim() || files.length > 0;
  const send = () => {
    if (!canSend || busy) return;
    haptic('light');
    onSend(value.trim(), files);
    setValue('');
    setFiles([]);
  };

  return (
    <View className={cn('border-input bg-card gap-2 rounded-2xl border p-2', className)}>
      {files.length ? (
        <View accessibilityLabel="Attachments" className="flex-row flex-wrap gap-2 px-1 pt-1">
          {files.map((f, i) => (
            <AttachmentChip key={`${f.name}-${i}`} file={f} onRemove={() => setFiles((fs) => fs.filter((_, j) => j !== i))} />
          ))}
        </View>
      ) : null}
      <View className="flex-row items-end gap-1">
        {onAttach ? (
          <Pressable
            onPress={attach}
            disabled={files.length >= maxFiles}
            accessibilityRole="button"
            accessibilityLabel="Attach files"
            className={cn('active:bg-accent size-10 items-center justify-center rounded-full', files.length >= maxFiles && 'opacity-50')}>
            <Icon as={PaperclipIcon} size={18} className="text-muted-foreground" />
          </Pressable>
        ) : null}
        <TextInput
          value={value}
          onChangeText={setValue}
          placeholder={placeholder}
          placeholderClassName="text-muted-foreground"
          accessibilityLabel="Message"
          multiline
          // One line to start on web (rows), growing with the text; native grows on its own.
          numberOfLines={Platform.OS === 'web' ? 1 : undefined}
          submitBehavior="newline"
          onKeyPress={(e) => {
            // Web only: Enter sends, Shift+Enter adds a line. A phone keyboard's return key always breaks a line.
            const ev = e.nativeEvent as { key: string; shiftKey?: boolean };
            if (Platform.OS === 'web' && ev.key === 'Enter' && !ev.shiftKey) {
              e.preventDefault();
              send();
            }
          }}
          className={cn('text-foreground max-h-40 min-h-10 flex-1 px-2 py-2.5 text-base', Platform.select({
            // placeholder-shown: the CSS reset colours an empty field gray-400 (2.5:1); match the placeholder (see Input).
            web: 'placeholder:text-muted-foreground placeholder-shown:text-muted-foreground field-sizing-content resize-none outline-none',
          }))}
          style={font}
        />
        {busy ? (
          <Pressable onPress={onStop} accessibilityRole="button" accessibilityLabel="Stop answering" className="bg-secondary active:bg-secondary/80 size-10 items-center justify-center rounded-full">
            <Icon as={SquareIcon} size={14} className="text-secondary-foreground" />
          </Pressable>
        ) : (
          <Pressable
            onPress={send}
            disabled={!canSend}
            accessibilityRole="button"
            accessibilityLabel="Send"
            accessibilityState={{ disabled: !canSend }}
            className={cn('bg-primary active:bg-primary/90 size-10 items-center justify-center rounded-full', !canSend && 'opacity-50')}>
            <Icon as={ArrowUpIcon} size={18} className="text-primary-foreground" />
          </Pressable>
        )}
      </View>
    </View>
  );
}
