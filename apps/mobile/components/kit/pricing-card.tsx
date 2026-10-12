import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { Icon } from '@/components/ui/icon';
import { Text } from '@/components/ui/text';
import { cn } from '@/lib/utils';
import { CheckIcon } from 'lucide-react-native';
import type * as React from 'react';
import { View } from 'react-native';

type Props = {
  name: string;
  price: string;
  /** "per month", "per seat / month", "one-off". */
  period?: string;
  description?: string;
  features: string[];
  /** The plan's Button. */
  action: React.ReactNode;
  /** The recommended plan: a border and a badge. One per screen. */
  highlighted?: boolean;
  badge?: string;
  className?: string;
};

/** One plan. Stack 2–3 on a paywall; highlight one. */
export function PricingCard({ name, price, period, description, features, action, highlighted, badge = 'Most popular', className }: Props) {
  return (
    <Card className={cn('relative gap-5 p-5', highlighted && 'border-primary border-2', className)}>
      {highlighted ? (
        <Badge className="absolute -top-3 left-5">
          <Text>{badge}</Text>
        </Badge>
      ) : null}
      <View className="gap-1">
        <Text role="heading" className="font-semibold">
          {name}
        </Text>
        {description ? <Text className="text-muted-foreground text-sm">{description}</Text> : null}
      </View>
      <View className="flex-row items-baseline gap-1">
        <Text className="text-4xl font-semibold tracking-tight">{price}</Text>
        {period ? <Text className="text-muted-foreground text-sm">{period}</Text> : null}
      </View>
      <View className="gap-2">
        {features.map((f) => (
          <View key={f} className="flex-row gap-2">
            <Icon as={CheckIcon} size={16} className="text-success mt-0.5" />
            <Text className="flex-1 text-sm">{f}</Text>
          </View>
        ))}
      </View>
      <View>{action}</View>
    </Card>
  );
}
