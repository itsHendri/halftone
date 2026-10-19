import { FloatingButton } from '@/components/kit/floating-button';
import { ListRow } from '@/components/kit/list-row';
import { ProgressRing } from '@/components/kit/progress-ring';
import { SectionHeader } from '@/components/kit/section-header';
import { StatTile } from '@/components/kit/stat-tile';
import { habits, isDone, useHabits } from '@/components/habits/store';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Text } from '@/components/ui/text';
import { useRouter } from 'expo-router';
import { Icon } from '@/components/ui/icon';
import { ChevronRightIcon, PlusIcon } from 'lucide-react-native';
import { ScrollView, View } from 'react-native';

export default function Today() {
  const router = useRouter();
  const list = useHabits();
  const done = list.filter(isDone).length;
  const pct = list.length ? Math.round((done / list.length) * 100) : 0;
  const best = Math.max(0, ...list.map((h) => h.streak));

  return (
    <View className="bg-background flex-1">
      <ScrollView contentContainerClassName="gap-5 p-5 pb-32">
        <Card className="w-full flex-row items-center gap-5 px-5 py-5">
          <ProgressRing value={pct} size={88} strokeWidth={8} accessibilityLabel="Today's habits">
            <Text className="text-xl font-bold">{pct}%</Text>
          </ProgressRing>
          <View className="flex-1 gap-1">
            <Text variant="h4">
              {done} of {list.length} done
            </Text>
            <Text className="text-muted-foreground">{done === list.length ? 'All habits complete. Nice.' : `${list.length - done} to go today.`}</Text>
          </View>
        </Card>
        <View className="flex-row gap-3">
          <StatTile label="Best streak" value={`${best} days`} />
          <StatTile label="This week" value="26 / 35" delta={8} />
        </View>
        <View className="gap-3">
          <SectionHeader title="Habits" />
          <Card className="w-full gap-0 px-4 py-0">
            {list.map((h, i) => (
              <ListRow
                key={h.id}
                leading={<Checkbox checked={isDone(h)} onCheckedChange={() => habits.toggleDone(h.id)} accessibilityLabel={`Mark ${h.name} done`} />}
                title={h.name}
                subtitle={h.goal > 1 ? `${h.today} / ${h.goal} ${h.unit}` : h.streak ? `${h.streak}-day streak` : 'Start your streak'}
                trailing={
                  <Button variant="ghost" size="icon" className="rounded-full" accessibilityLabel={`Open ${h.name}`} onPress={() => router.push({ pathname: '/habits/habit/[id]', params: { id: h.id } })}>
                    <Icon as={ChevronRightIcon} size={18} className="text-muted-foreground" />
                  </Button>
                }
                last={i === list.length - 1}
              />
            ))}
          </Card>
        </View>
      </ScrollView>
      <FloatingButton icon={PlusIcon} accessibilityLabel="Add habit" position="bottom-right" onPress={() => router.push('/habits/new')} />
    </View>
  );
}
