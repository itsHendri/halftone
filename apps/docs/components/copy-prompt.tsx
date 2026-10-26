'use client';
import { CheckIcon, CopyIcon } from 'lucide-react';
import * as React from 'react';

/** The one-line prompt a person pastes into Claude Code, Cursor or any coding agent. */
export function installPrompt(origin: string) {
  return `Read ${origin}/install.md and follow it to set up the kit for this project. Then read AGENTS.md and DESIGN_SYSTEM.md, and build only from the components they list.`;
}

export function CopyPrompt({ className }: { className?: string }) {
  const [origin, setOrigin] = React.useState('');
  const [copied, setCopied] = React.useState(false);
  React.useEffect(() => setOrigin(window.location.origin), []);
  React.useEffect(() => {
    if (!copied) return;
    const t = setTimeout(() => setCopied(false), 2000);
    return () => clearTimeout(t);
  }, [copied]);

  const prompt = installPrompt(origin || 'https://<this site>');
  return (
    // The theme bar slides away on phones while this is in its way (components/theme/theme-pill.tsx).
    <div data-theme-bar-avoid className={`border-border bg-card rounded-xl border ${className ?? ''}`}>
      <p className="text-fd-foreground p-4 font-mono text-sm leading-6">{prompt}</p>
      <div data-theme-bar-avoid className="border-border flex items-center justify-between gap-3 border-t px-4 py-2">
        <span className="text-muted-foreground text-xs">Paste into Claude Code, Cursor or any coding agent</span>
        <button
          type="button"
          onClick={() => navigator.clipboard.writeText(prompt).then(() => setCopied(true))}
          className="bg-primary text-primary-foreground focus-visible:ring-ring inline-flex h-9 shrink-0 items-center gap-2 whitespace-nowrap rounded-full px-4 text-sm font-medium hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2">
          {copied ? <CheckIcon className="size-4" aria-hidden /> : <CopyIcon className="size-4" aria-hidden />}
          <span aria-live="polite">{copied ? 'Copied' : 'Copy prompt'}</span>
        </button>
      </div>
    </div>
  );
}
