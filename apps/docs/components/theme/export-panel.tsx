'use client';
import { applyRecipe, type Theme } from '@halftone/tokens/theme';
import { CheckIcon, CopyIcon, DownloadIcon } from 'lucide-react';
import * as React from 'react';
import kitJson from '../../../../kit.json';
import { base } from '@/lib/theme/store';

/** How a theme picked here reaches a project: a code, a command, a prompt, a link or the file itself. */
export function themeCommands(code: string, origin: string) {
  return {
    monorepo: `npm run theme:apply -- ${code}`,
    app: `npx kit-tokens theme apply ${code}`,
    prompt:
      `Apply the ${kitJson.name} theme ${code} to this project. Use the apply-theme skill: it runs ` +
      `\`npx kit-tokens theme apply ${code}\` (or \`npm run theme:apply -- ${code}\` at the root of the ${kitJson.name} monorepo), ` +
      'then the qc-pass skill. Tell me which colours it adjusted for contrast and show me the Foundations screen.',
    // The trailing slash matches the static export, so the link needs no redirect that could drop ?t=.
    url: `${origin}/themes/?t=${code}`,
  };
}

function CopyRow({ label, value, mono = true }: { label: string; value: string; mono?: boolean }) {
  const [copied, setCopied] = React.useState(false);
  React.useEffect(() => {
    if (!copied) return;
    const t = setTimeout(() => setCopied(false), 1600);
    return () => clearTimeout(t);
  }, [copied]);
  return (
    <div className="flex flex-col gap-1.5">
      <span className="text-muted-foreground text-xs font-medium">{label}</span>
      <div className="border-border bg-muted/40 flex items-start gap-2 rounded-lg border p-2 pl-3">
        <span className={`text-foreground min-w-0 flex-1 break-words py-1 text-[13px] leading-5 ${mono ? 'font-mono' : ''}`}>{value}</span>
        <button
          type="button"
          onClick={() => navigator.clipboard.writeText(value).then(() => setCopied(true))}
          className="text-muted-foreground hover:bg-accent hover:text-foreground focus-visible:ring-ring inline-flex size-7 shrink-0 items-center justify-center rounded-md focus-visible:outline-none focus-visible:ring-2"
          aria-label={copied ? `${label}: copied` : `Copy ${label.toLowerCase()}`}>
          {copied ? <CheckIcon className="size-4" aria-hidden /> : <CopyIcon className="size-4" aria-hidden />}
        </button>
      </div>
    </div>
  );
}

export function ExportPanel({ theme }: { theme: Theme }) {
  const [origin, setOrigin] = React.useState('');
  React.useEffect(() => setOrigin(window.location.origin), []);
  const c = themeCommands(theme.code, origin || kitJson.siteUrl || 'https://<this site>');

  const download = () => {
    const { tokens } = applyRecipe(base, theme.recipe);
    const url = URL.createObjectURL(new Blob([JSON.stringify(tokens, null, 2) + '\n'], { type: 'application/json' }));
    const a = Object.assign(document.createElement('a'), { href: url, download: 'tokens.json' });
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="flex flex-col gap-4">
      <CopyRow label="Theme code" value={theme.code} />
      <CopyRow label="Ask your coding agent" value={c.prompt} mono={false} />
      <CopyRow label="In the Halftone repo" value={c.monorepo} />
      <CopyRow label="In a kit you copied out" value={c.app} />
      <CopyRow label="Share link" value={c.url} />
      <button
        type="button"
        onClick={download}
        className="border-border hover:bg-accent focus-visible:ring-ring inline-flex h-9 items-center justify-center gap-2 rounded-full border px-4 text-sm font-medium focus-visible:outline-none focus-visible:ring-2">
        <DownloadIcon className="size-4" aria-hidden />
        Download tokens.json
      </button>
    </div>
  );
}
