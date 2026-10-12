import { PricingCard } from '@/components/kit/pricing-card';
import { useToast } from '@/components/kit/toast';
import { Button } from '@/components/ui/button';
import { Text } from '@/components/ui/text';
import type { ComponentType } from 'react';
import { View } from 'react-native';

function PricingDemo() {
  const toast = useToast();
  return (
    <View className="w-full gap-6 pt-3">
      <PricingCard
        name="Team"
        price="£24"
        period="per month"
        description="For studios sending invoices every week."
        features={['Unlimited invoices', 'Automatic reminders', 'Five team members']}
        highlighted
        action={
          <Button onPress={() => toast.success('Trial started')}>
            <Text>Start free trial</Text>
          </Button>
        }
      />
      <PricingCard
        name="Starter"
        price="£0"
        description="For trying it out."
        features={['5 invoices a month', 'One member']}
        action={
          <Button variant="outline" onPress={() => toast.info('You’re on Starter')}>
            <Text>Continue free</Text>
          </Button>
        }
      />
    </View>
  );
}

export const KIT_MARKETING_DEMOS: Record<string, ComponentType> = {
  'pricing-card': PricingDemo,
};
