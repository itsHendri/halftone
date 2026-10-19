'use client';
import { Logo } from '@/components/kit/logo';
import { HistoryIcon, SquarePenIcon } from 'lucide-react';
import Link from 'next/link';
import * as React from 'react';
import { ChatThreadList } from '@/components/kit/chat-thread-list';
import { KitChip } from '@/components/site/kit-chip';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { Conversation, type Turn } from './conversation';
import { PAST_THREADS, type Thread } from './threads';

const NEW_TITLE = 'New chat';
let seq = 0;
const newThread = (): Thread => ({ id: `chat-${++seq}`, title: NEW_TITLE, group: 'Today', turns: [] });

/**
 * The assistant sample's page: the conversation, with past threads in a sidebar on desktop and in a
 * Sheet on small screens. A new thread is titled by its first message.
 */
export function AssistantView() {
  const [threads, setThreads] = React.useState<Thread[]>(() => [newThread(), ...PAST_THREADS]);
  const [activeId, setActiveId] = React.useState(threads[0].id);
  const [historyOpen, setHistoryOpen] = React.useState(false);
  const active = threads.find((t) => t.id === activeId) ?? threads[0];

  const setTurns = React.useCallback<React.Dispatch<React.SetStateAction<Turn[]>>>(
    (update) =>
      setThreads((ts) =>
        ts.map((t) => {
          if (t.id !== activeId) return t;
          const turns = typeof update === 'function' ? update(t.turns) : update;
          const parts = turns[0]?.parts ?? [];
          const text = parts.find((p) => p.kind === 'text');
          const files = parts.find((p) => p.kind === 'files');
          const named = text?.kind === 'text' ? text.text : files?.kind === 'files' ? `Read ${files.files[0].name}` : null;
          const title = t.title === NEW_TITLE && named ? named.slice(0, 48) : t.title;
          return { ...t, turns, title };
        })
      ),
    [activeId]
  );

  const select = (id: string) => {
    setActiveId(id);
    setHistoryOpen(false);
  };
  const startNew = () => {
    // Reuse an untouched new chat instead of stacking empty ones.
    const blank = threads.find((t) => t.turns.length === 0);
    if (blank) return select(blank.id);
    const t = newThread();
    setThreads((ts) => [t, ...ts]);
    select(t.id);
  };

  const list = <ChatThreadList threads={threads} activeId={activeId} onSelect={select} onNew={startNew} />;

  return (
    <div className="flex h-dvh flex-col">
      <header className="border-border flex h-14 shrink-0 items-center gap-3 border-b px-4 sm:px-6">
        <Link href="/assistant" className="flex items-center gap-2 font-semibold">
          <Logo name="Northwind" /> <span className="text-muted-foreground hidden font-normal sm:inline">Assistant</span>
        </Link>
        <div className="ml-auto flex items-center gap-1">
          <KitChip />
          <Sheet open={historyOpen} onOpenChange={setHistoryOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="sm" className="lg:hidden">
                <HistoryIcon aria-hidden />
                <span className="sr-only sm:not-sr-only">History</span>
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-72 p-4">
              <SheetHeader className="px-0">
                <SheetTitle>Conversations</SheetTitle>
              </SheetHeader>
              {list}
            </SheetContent>
          </Sheet>
          <Button variant="ghost" size="sm" className="lg:hidden" onClick={startNew}>
            <SquarePenIcon aria-hidden />
            <span className="sr-only sm:not-sr-only">New chat</span>
          </Button>
        </div>
      </header>
      <div className="flex min-h-0 flex-1">
        <aside className="bg-sidebar border-sidebar-border hidden w-64 shrink-0 overflow-y-auto border-r p-3 lg:block">{list}</aside>
        <Conversation key={active.id} turns={active.turns} setTurns={setTurns} />
      </div>
    </div>
  );
}
