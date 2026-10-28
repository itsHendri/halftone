import { Spinner } from '@/components/kit/spinner';
import { Spot } from '@/components/kit/spot';
import { Text } from '@/components/ui/text';
import { cn } from '@/lib/utils';
import { CheckIcon } from 'lucide-react-native';
import * as React from 'react';
import { View } from 'react-native';

type Props = {
  title: string;
  body?: string;
  /** Big primary-coloured amount between title and body. */
  amount?: string;
  amountSubtitle?: string;
  /** Spinner instead of the check; hides text — for in-flight operations. */
  loading?: boolean;
  /** Extra content under the body (SummaryCard, buttons…). */
  children?: React.ReactNode;
  className?: string;
};

/**
 * The one success template: check, title, optional amount, body, left-aligned in a column centred on the screen (on a
 * phone the column is the screen's width). Actions go in a StickyBottomBar.
 */
export function SuccessScreen({ title, body, amount, amountSubtitle, loading, children, className }: Props) {
  return (
    <View className={cn('flex-1 justify-center px-5', className)}>
      <View className="w-full max-w-sm items-start self-center">
        {loading ? (
          <View className="bg-muted mb-6 size-24 items-center justify-center rounded-full">
            <Spinner size="large" />
          </View>
        ) : (
          <Spot icon={CheckIcon} size="xl" tone="success" className="mb-6" />
        )}
        {!loading ? (
          <View className="w-full gap-2">
            <Text variant="h3">{title}</Text>
            {amount ? <Text className="text-primary text-4xl font-bold">{amount}</Text> : null}
            {amountSubtitle ? <Text className="text-muted-foreground">{amountSubtitle}</Text> : null}
            {body ? <Text className="text-muted-foreground">{body}</Text> : null}
            {children ? <View className="mt-4 w-full">{children}</View> : null}
          </View>
        ) : null}
      </View>
    </View>
  );
}
