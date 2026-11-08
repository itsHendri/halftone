import { BellIcon } from 'lucide-react-native';
import { ScrollView, View } from 'react-native';
import { IconCircle } from '@/components/kit/icon-circle';
import { ListRow } from '@/components/kit/list-row';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Text } from '@/components/ui/text';

export default function Home() {
  return (
    <ScrollView className="bg-background flex-1" contentContainerClassName="gap-6 p-4">
      <Text variant="h1">Halftone</Text>
      <Text variant="muted">Kit components in a plain Expo app.</Text>
      <View className="gap-3">
        <Button testID="primary">
          <Text>Primary</Text>
        </Button>
        <Button variant="outline">
          <Text>Outline</Text>
        </Button>
      </View>
      <Card className="w-full gap-0 px-4 py-0">
        <ListRow leading={<IconCircle as={BellIcon} />} title="Notifications" subtitle="Push and email" value="On" />
        <ListRow
          wrap
          title="Send the revised quote to the client before Friday's review"
          subtitle="They asked for the delivery dates to be split by phase."
          last
        />
      </Card>
    </ScrollView>
  );
}
