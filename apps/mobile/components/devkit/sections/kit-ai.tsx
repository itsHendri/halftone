import { ApprovalCard } from '@/components/kit/approval-card';
import { AttachmentChip, type Attachment } from '@/components/kit/attachment-chip';
import { ChatComposer } from '@/components/kit/chat-composer';
import { ChatMessage } from '@/components/kit/chat-message';
import { ChatThreadList } from '@/components/kit/chat-thread-list';
import { FollowUpSuggestions } from '@/components/kit/follow-up-suggestions';
import { CitedText, SourceList, type Source } from '@/components/kit/sources';
import { StreamingText } from '@/components/kit/streaming-text';
import { ThinkingIndicator } from '@/components/kit/thinking-indicator';
import { useToast } from '@/components/kit/toast';
import { ToolCallCard } from '@/components/kit/tool-call-card';
import { Button } from '@/components/ui/button';
import { Text } from '@/components/ui/text';
import * as React from 'react';
import type { ComponentType } from 'react';
import { View } from 'react-native';

const SOURCES: Source[] = [
  { title: 'INV-1044 · Lumen Labs', meta: 'Invoice · 28 May', snippet: 'Total due £2,310.00. Payment terms: 14 days.' },
  { title: 'Payment terms', meta: 'help.northwind.co', snippet: 'A reminder goes out 3 days after the due date, then weekly.', href: 'https://example.com' },
];

const ANSWER = 'Lumen Labs owes £2,310 on INV-1044, which was due on 11 June [1]. A reminder went out on 14 June and the next one is due on Friday [2].';

function MessageDemo() {
  return (
    <View className="w-full gap-5">
      <ChatMessage role="user" initials="AM">
        Who still owes us money this month?
      </ChatMessage>
      <ChatMessage role="assistant">Two clients: Lumen Labs (£2,310, 9 days late) and Acme Studio (£860, due Friday).</ChatMessage>
    </View>
  );
}

const MOCK_FILES: Attachment[] = [
  { name: 'Q2-statement.pdf', size: 248_000, type: 'application/pdf' },
  { name: 'receipt.jpg', size: 1_420_000, type: 'image/jpeg' },
];

function ComposerDemo() {
  const toast = useToast();
  const [busy, setBusy] = React.useState(false);
  const [n, setN] = React.useState(0);
  return (
    <View className="w-full gap-3">
      <ChatComposer
        busy={busy}
        onStop={() => setBusy(false)}
        onSend={(text, files) => {
          toast.info(files.length ? `Sent with ${files.length} file${files.length > 1 ? 's' : ''}` : `Sent: ${text}`);
          setBusy(true);
          setTimeout(() => setBusy(false), 2000);
        }}
        onAttach={() => {
          const file = MOCK_FILES[n % MOCK_FILES.length];
          setN((x) => x + 1);
          return [file];
        }}
      />
      <Text className="text-muted-foreground text-xs">The paperclip attaches a sample file; sending shows Stop for 2 seconds.</Text>
    </View>
  );
}

function AttachmentDemo() {
  const [files, setFiles] = React.useState(MOCK_FILES);
  return (
    <View className="w-full gap-2">
      <AttachmentChip file={MOCK_FILES[0]} />
      <View className="flex-row flex-wrap gap-2">
        {files.map((f) => (
          <AttachmentChip key={f.name} file={f} onRemove={() => setFiles((fs) => fs.filter((x) => x.name !== f.name))} />
        ))}
      </View>
    </View>
  );
}

function ThreadsDemo() {
  const toast = useToast();
  const [active, setActive] = React.useState('1');
  return (
    <ChatThreadList
      className="w-full"
      activeId={active}
      onSelect={setActive}
      onNew={() => toast.info('Would start a new chat')}
      threads={[
        { id: '1', title: 'Overdue invoices', preview: 'Two clients still owe you…', group: 'Today' },
        { id: '2', title: 'VAT return for Q2', preview: 'Your Q2 return is ready to file.', group: 'Today' },
        { id: '3', title: 'Rate for a new client', preview: 'Based on your last 12 projects…', group: 'Previous 7 days' },
      ]}
    />
  );
}

function SourcesDemo() {
  return (
    <View className="w-full gap-3">
      <CitedText text={ANSWER} sources={SOURCES} />
      <SourceList sources={SOURCES} />
    </View>
  );
}

function StreamingDemo() {
  const [run, setRun] = React.useState(0);
  return (
    <View className="w-full gap-3">
      <StreamingText key={run} text="Your Q2 VAT return is ready. You owe £3,412, due on 7 August. I've drafted it from 46 invoices and 112 expenses." />
      <Button size="sm" variant="outline" className="self-start" onPress={() => setRun((r) => r + 1)}>
        <Text>Replay</Text>
      </Button>
    </View>
  );
}

function ApprovalDemo() {
  const [run, setRun] = React.useState(0);
  return (
    <View className="w-full gap-3">
      <ApprovalCard
        key={run}
        title="Refund £48.00 to Alex Morgan"
        description="The money goes back to their card in 3–5 days. This can’t be undone."
        details={[
          { label: 'Order', value: '#4821' },
          { label: 'Reason', value: 'Arrived damaged' },
        ]}
        onApprove={() => {}}
        onDeny={() => {}}
      />
      <Button size="sm" variant="ghost" className="self-start" onPress={() => setRun((r) => r + 1)}>
        <Text>Reset</Text>
      </Button>
    </View>
  );
}

export const KIT_AI_DEMOS: Record<string, ComponentType> = {
  'chat-message': MessageDemo,
  'chat-composer': ComposerDemo,
  'attachment-chip': AttachmentDemo,
  'chat-thread-list': ThreadsDemo,
  sources: SourcesDemo,
  'follow-up-suggestions': function FollowUpDemo() {
    const toast = useToast();
    return <FollowUpSuggestions suggestions={['Send Lumen a reminder', 'Show last month', 'Who pays late most often?']} onSelect={(s) => toast.info(s)} />;
  },
  'streaming-text': StreamingDemo,
  'thinking-indicator': () => (
    <View className="gap-3">
      <ThinkingIndicator />
      <ThinkingIndicator label="Reading 46 invoices" />
    </View>
  ),
  'tool-call-card': () => (
    <View className="w-full gap-2">
      <ToolCallCard title="Searched invoices" status="done" input={'{ "status": "overdue" }'} output={'2 invoices · £3,170.00'} />
      <ToolCallCard title="Drafting a reminder" status="running" />
      <ToolCallCard title="Sent reminder" status="error" output="Lumen Labs has no billing email." />
      <ToolCallCard title="Exported to Xero" status="stopped" />
    </View>
  ),
  'approval-card': ApprovalDemo,
};
