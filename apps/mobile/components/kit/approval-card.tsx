import { KeyValueList } from '@/components/kit/key-value-list';
import { Button } from '@/components/ui/button';
import { Icon } from '@/components/ui/icon';
import { Text } from '@/components/ui/text';
import { haptic } from '@/lib/haptics';
import { cn } from '@/lib/utils';
import { ShieldAlertIcon } from 'lucide-react-native';
import * as React from 'react';
import { View } from 'react-native';

type Props = {
  /** The action, as a sentence the person can say yes to: "Refund £48.00 to Alex Morgan". */
  title: string;
  /** The consequence: what changes, and whether it can be undone. */
  description?: string;
  /** Read-only details that matter for the decision. */
  details?: { label: string; value: string }[];
  onApprove: () => void;
  onDeny: () => void;
  approveLabel?: string;
  denyLabel?: string;
  className?: string;
};

/**
 * Consent before consequence: the assistant asks before it does something irreversible or costly. Once
 * answered it shows the decision instead of the buttons.
 */
export function ApprovalCard({ title, description, details, onApprove, onDeny, approveLabel = 'Approve', denyLabel = 'Not now', className }: Props) {
  const [decision, setDecision] = React.useState<'approved' | 'denied' | null>(null);
  return (
    <View className={cn('border-warning-border bg-warning-subtle gap-3 rounded-xl border p-4', className)}>
      <View className="flex-row gap-3">
        <Icon as={ShieldAlertIcon} size={20} className="text-warning mt-0.5" />
        <View className="flex-1 gap-1">
          <Text className="font-semibold">{title}</Text>
          {description ? <Text className="text-muted-foreground text-sm">{description}</Text> : null}
        </View>
      </View>
      {details?.length ? <KeyValueList rows={details} className="bg-card rounded-lg p-3" /> : null}
      {decision ? (
        <Text accessibilityLiveRegion="polite" className="text-sm font-medium">
          {decision === 'approved' ? 'Approved. The assistant will go ahead.' : 'Declined. Nothing was changed.'}
        </Text>
      ) : (
        <View className="flex-row flex-wrap gap-2">
          <Button
            size="sm"
            onPress={() => {
              haptic('success');
              setDecision('approved');
              onApprove();
            }}>
            <Text>{approveLabel}</Text>
          </Button>
          <Button
            size="sm"
            variant="outline"
            onPress={() => {
              setDecision('denied');
              onDeny();
            }}>
            <Text>{denyLabel}</Text>
          </Button>
        </View>
      )}
    </View>
  );
}
