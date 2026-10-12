import { IconCircle } from '@/components/kit/icon-circle';
import { ListGroup } from '@/components/kit/list-group';
import { ListRow } from '@/components/kit/list-row';
import { OptionSheet } from '@/components/kit/sheet';
import { useToast } from '@/components/kit/toast';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Switch } from '@/components/ui/switch';
import { Text } from '@/components/ui/text';
import { BellRingIcon, CalendarClockIcon, CreditCardIcon, MailIcon, UsersIcon } from 'lucide-react-native';
import * as React from 'react';
import { ScrollView, View } from 'react-native';

const TERMS = [
  { value: '7', label: '7 days' },
  { value: '14', label: '14 days' },
  { value: '30', label: '30 days' },
] as const;

export default function Settings() {
  const toast = useToast();
  const [reminders, setReminders] = React.useState(true);
  const [receipts, setReceipts] = React.useState(true);
  const [terms, setTerms] = React.useState<'7' | '14' | '30'>('14');
  const [open, setOpen] = React.useState(false);
  return (
    <ScrollView className="bg-background flex-1" contentContainerClassName="gap-6 p-5 pb-32">
      <View className="flex-row items-center gap-4">
        <Avatar alt="Alex Morgan" className="size-14">
          <AvatarFallback>
            <Text>AM</Text>
          </AvatarFallback>
        </Avatar>
        <View>
          <Text variant="large">Alex Morgan</Text>
          <Text className="text-muted-foreground text-sm">Morgan Studio · Studio plan</Text>
        </View>
      </View>
      <ListGroup title="Invoicing" footnote="Reminders go out 3 days after the due date, then weekly, until the invoice is paid.">
        <ListRow leading={<IconCircle as={CalendarClockIcon} />} title="Payment terms" value={TERMS.find((t) => t.value === terms)?.label} chevron onPress={() => setOpen(true)} />
        <ListRow leading={<IconCircle as={BellRingIcon} />} title="Automatic reminders" trailing={<Switch aria-label="Automatic reminders" checked={reminders} onCheckedChange={setReminders} />} />
        <ListRow leading={<IconCircle as={MailIcon} />} title="Email me receipts" trailing={<Switch aria-label="Email me receipts" checked={receipts} onCheckedChange={setReceipts} />} />
      </ListGroup>
      <ListGroup title="Studio">
        <ListRow leading={<IconCircle as={UsersIcon} />} title="Team" subtitle="3 of 5 seats used" chevron onPress={() => toast.info('Not part of the sample')} />
        <ListRow leading={<IconCircle as={CreditCardIcon} />} title="Billing" subtitle="Studio plan · £24 a month" chevron onPress={() => toast.info('Not part of the sample')} />
      </ListGroup>
      <OptionSheet open={open} onClose={() => setOpen(false)} title="Payment terms" options={TERMS} value={terms} onChange={setTerms} />
    </ScrollView>
  );
}
