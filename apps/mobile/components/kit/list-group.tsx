import { Card } from '@/components/ui/card';
import { Text } from '@/components/ui/text';
import { cn } from '@/lib/utils';
import * as React from 'react';
import { View } from 'react-native';

type Props = {
  /** Optional title above the group. */
  title?: string;
  /** Small print under the group — what a setting affects, a legal note. */
  footnote?: string;
  /** `card` sits the rows on a surface; `plain` runs them straight on the background. */
  variant?: 'card' | 'plain';
  children: React.ReactNode;
  className?: string;
};

/**
 * A group of `ListRow`s, with the divider bookkeeping handled.
 *
 * It sets `last` on the final row for you, so a mapped list needs no index maths. The prop only reaches direct
 * children: if you wrap ListRow in your own component, forward `last` to it.
 * `plain` is the settings look: hairline dividers on the background, no card.
 */
export function ListGroup({ title, footnote, variant = 'card', children, className }: Props) {
  const items = React.Children.toArray(children).filter(React.isValidElement);
  const rows = items.map((child, i) =>
    i === items.length - 1
      ? React.cloneElement(child as React.ReactElement<{ last?: boolean }>, { last: true })
      : child
  );

  return (
    <View className={cn('gap-3', className)}>
      {title ? <Text variant="large">{title}</Text> : null}
      {variant === 'card' ? (
        <Card className="w-full gap-0 px-4 py-0">{rows}</Card>
      ) : (
        <View className="w-full">{rows}</View>
      )}
      {footnote ? <Text className="text-muted-foreground text-xs leading-5">{footnote}</Text> : null}
    </View>
  );
}
