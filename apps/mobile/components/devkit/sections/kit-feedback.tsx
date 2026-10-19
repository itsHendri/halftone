import { EmptyState } from '@/components/kit/empty-state';
import { Spinner } from '@/components/kit/spinner';
import { SuccessScreen } from '@/components/kit/success-screen';
import { useToast } from '@/components/kit/toast';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Text } from '@/components/ui/text';
import type { ComponentType } from 'react';
import { InboxIcon, SearchXIcon } from 'lucide-react-native';
import { View } from 'react-native';

function ToastDemo() {
  const toast = useToast();
  return (
    <View className="flex-row flex-wrap gap-2">
      <Button size="sm" variant="outline" onPress={() => toast.success('Saved')}>
        <Text>Success</Text>
      </Button>
      <Button size="sm" variant="outline" onPress={() => toast.error('Something went wrong')}>
        <Text>Error</Text>
      </Button>
      <Button size="sm" variant="outline" onPress={() => toast.warning('Check your details')}>
        <Text>Warning</Text>
      </Button>
      <Button size="sm" variant="outline" onPress={() => toast.info('Copied to clipboard')}>
        <Text>Info</Text>
      </Button>
    </View>
  );
}

function SpinnerDemo() {
  return (
    <View className="flex-row items-center gap-6">
      <Spinner />
      <Spinner size="large" />
      <Spinner tone="muted" />
      {/* Busy, not disabled: full colour, spinner in the label's colour. */}
      <Button>
        <Spinner tone="button-foreground" />
        <Text>Loading</Text>
      </Button>
    </View>
  );
}

function EmptyStateDemo() {
  return (
    <View className="w-full gap-4">
      <Card className="w-full py-0">
        <EmptyState icon={InboxIcon} title="Nothing here yet" subtitle="Items you add will show up in this list." action={{ label: 'Add an item', onPress: () => {} }} />
      </Card>
      <Card className="w-full py-0">
        <EmptyState variant="compact" icon={SearchXIcon} title="No results" subtitle="Try a different search." action={{ label: 'Clear filters', onPress: () => {} }} />
      </Card>
    </View>
  );
}

function SuccessScreenDemo() {
  return (
    <Card className="w-full py-2">
      <SuccessScreen title="You are all set" body="Your changes are saved and everything is ready to go." className="py-6" />
    </Card>
  );
}

/** Components page demos, keyed by the component id in registry/components.ts. */
export const KIT_FEEDBACK_DEMOS: Record<string, ComponentType> = {
  'toast': ToastDemo,
  'spinner': SpinnerDemo,
  'empty-state': EmptyStateDemo,
  'success-screen': SuccessScreenDemo,
};
