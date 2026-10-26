'use client';
import { PlusIcon } from 'lucide-react';
import { cn } from 'cn';
import { Button } from '@/components/ui/button';

export type ChatThread = {
  id: string;
  title: string;
  /** The last line of the conversation, one line. */
  preview?: string;
  /** A heading the thread sits under: "Today", "Previous 7 days". Threads in a group must be adjacent. */
  group?: string;
};

type Props = {
  threads: ChatThread[];
  activeId?: string;
  onSelect: (id: string) => void;
  /** Shows a "New chat" button above the list. */
  onNew?: () => void;
  className?: string;
};

/**
 * Past conversations in an AI product: the sidebar beside a chat, or the content of a Sheet on small
 * screens. Newest first, grouped by when. The open conversation is marked with aria-current.
 */
export function ChatThreadList({ threads, activeId, onSelect, onNew, className }: Props) {
  const groups: { label?: string; threads: ChatThread[] }[] = [];
  for (const t of threads) {
    const last = groups.at(-1);
    if (last && last.label === t.group) last.threads.push(t);
    else groups.push({ label: t.group, threads: [t] });
  }

  return (
    <nav aria-label="Conversations" className={cn('flex flex-col gap-4', className)}>
      {onNew ? (
        <Button variant="outline" className="justify-start" onClick={onNew}>
          <PlusIcon aria-hidden />
          New chat
        </Button>
      ) : null}
      {threads.length === 0 ? <p className="text-muted-foreground px-2 text-sm">No conversations yet.</p> : null}
      {groups.map((g, i) => (
        <div key={`${g.label ?? ''}-${i}`} className="flex flex-col gap-1">
          {g.label ? <h3 className="text-muted-foreground px-2 pb-1 text-xs font-medium">{g.label}</h3> : null}
          <ul className="flex flex-col gap-0.5">
            {g.threads.map((t) => {
              const active = t.id === activeId;
              return (
                <li key={t.id}>
                  <button
                    type="button"
                    onClick={() => onSelect(t.id)}
                    aria-current={active ? 'true' : undefined}
                    className={cn(
                      'focus-visible:ring-ring flex w-full flex-col gap-0.5 rounded-md px-2 py-1.5 text-left transition-colors focus-visible:ring-2 focus-visible:outline-none',
                      active ? 'bg-accent text-accent-foreground' : 'hover:bg-accent'
                    )}>
                    <span className="truncate text-sm font-medium">{t.title}</span>
                    {t.preview ? <span className="text-muted-foreground truncate text-xs">{t.preview}</span> : null}
                  </button>
                </li>
              );
            })}
          </ul>
        </div>
      ))}
    </nav>
  );
}
