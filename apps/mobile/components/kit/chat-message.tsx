import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Icon } from '@/components/ui/icon';
import { Text } from '@/components/ui/text';
import { cn } from '@/lib/utils';
import { BotIcon } from 'lucide-react-native';
import * as React from 'react';
import { View } from 'react-native';

type Props = {
  role: 'user' | 'assistant';
  /** A string, StreamingText, a ToolCallCard, an ApprovalCard: anything the turn contains. */
  children: React.ReactNode;
  /** Shown for the user's avatar. */
  initials?: string;
  className?: string;
};

/**
 * One turn in a conversation. The user's turn is a bubble on the right; the assistant's is plain text on
 * the left, so long answers read like a document, not a chat bubble.
 */
export function ChatMessage({ role, children, initials = 'You', className }: Props) {
  const user = role === 'user';
  return (
    <View className={cn('flex-row gap-3', user && 'flex-row-reverse', className)}>
      <Avatar alt={user ? initials : 'Assistant'} className="size-8 shrink-0">
        <AvatarFallback className={cn(!user && 'bg-primary')}>
          {user ? <Text className="text-xs">{initials.slice(0, 2)}</Text> : <Icon as={BotIcon} size={16} className="text-primary-foreground" />}
        </AvatarFallback>
      </Avatar>
      <View className={cn('min-w-0 gap-3', user ? 'bg-muted max-w-[80%] rounded-2xl rounded-tr-sm px-4 py-2.5' : 'flex-1 pt-1')}>
        {React.Children.map(children, (child) => (typeof child === 'string' ? <Text className="leading-6">{child}</Text> : child))}
      </View>
    </View>
  );
}
