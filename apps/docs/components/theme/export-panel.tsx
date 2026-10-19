'use client';
import { applyRecipe, presetById, PRESETS, sameRecipe, shadcnTheme, type Theme } from '@halftone-ds/tokens/theme';
import { CheckIcon, CopyIcon, DownloadIcon } from 'lucide-react';
import * as React from 'react';
import kitJson from '../../../../kit.json';
import { kitBrand, useBrand } from '@/lib/theme/brand';
import { base } from '@/lib/theme/store';

/** How a theme picked here reaches a project: a code, a command, a prompt, a link or the file itself. */
export function themeCommands(code: string, origin: string) {
  return {
    monorepo: `npm run theme:apply -- ${code}`,
    app: `npx halftone-tokens theme apply ${code}`,
    prompt:
      `Apply the ${kitJson.name} theme ${code} to this project. Use the apply-theme skill: it runs ` +
      `\`npx halftone-tokens theme apply ${code}\` (or \`npm run theme:apply -- ${code}\` at the root of the ${kitJson.name} monorepo), ` +
      'then the qc-pass skill. Tell me which colours it adjusted for contrast and show me the Foundations screen.',
    // The trailing slash matches the static export, so the link needs no redirect that could drop ?t=.
    url: `${origin}/themes/?t=${code}`,
  };
}

/** The shadcn file name for a theme that isn't an unchanged preset (the studio downloads it). */
export const SHADCN_FILE = 'halftone-theme.json';

/**
 * How a theme reaches a shadcn project: an unchanged preset installs from the site (`/r/theme/<preset>.json`,
 * built by scripts/build-docs.mjs); any other theme from the file the studio downloads.
 */
export function shadcnCommand(theme: Theme) {
  // A shared code carries no preset name, so a recipe that is exactly a preset counts as that preset.
  const preset = (theme.recipe.preset ? presetById(theme.recipe.preset) : undefined) ?? PRESETS.find((p) => sameRecipe(theme.recipe, p.recipe));
  const site = (kitJson.siteUrl ?? 'https://halftonedesignsystem.com').replace(/\/$/, '');
  if (preset && sameRecipe(theme.recipe, preset.recipe)) return { preset: preset.id, command: `npx shadcn@latest add ${site}/r/theme/${preset.id}.json` };
  return { preset: null, command: `npx shadcn@latest add ./${SHADCN_FILE}` };
}

export function CopyRow({ label, value, mono = true }: { label: string; value: string; mono?: boolean }) {
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
      <BrandExport theme={theme} />
      <ShadcnExport theme={theme} />
    </div>
  );
}

/** The theme for any shadcn project: colours (light and dark), radius, shadows and fonts. Web only. */
function ShadcnExport({ theme }: { theme: Theme }) {
  const { preset, command } = shadcnCommand(theme);
  const download = () => {
    const item = shadcnTheme(theme);
    const url = URL.createObjectURL(new Blob([JSON.stringify(item, null, 2) + '\n'], { type: 'application/json' }));
    Object.assign(document.createElement('a'), { href: url, download: SHADCN_FILE }).click();
    URL.revokeObjectURL(url);
  };
  return (
    <section aria-labelledby="export-shadcn" className="border-border flex flex-col gap-3 border-t pt-4">
      <div className="flex flex-col gap-1">
        <h3 id="export-shadcn" className="text-sm font-medium">
          For any shadcn project
        </h3>
        <p className="text-muted-foreground text-xs leading-5">
          Colours for light and dark, radius, shadows and fonts, as a shadcn theme. Web only: phone apps take the theme code.
        </p>
      </div>
      {preset ? null : (
        <button
          type="button"
          onClick={download}
          className="border-border hover:bg-accent focus-visible:ring-ring inline-flex h-9 items-center justify-center gap-2 rounded-full border px-4 text-sm font-medium focus-visible:outline-none focus-visible:ring-2">
          <DownloadIcon className="size-4" aria-hidden />
          Download {SHADCN_FILE}
        </button>
      )}
      <CopyRow label={preset ? 'Install it' : 'Then, in the project'} value={command} />
    </section>
  );
}

const BRAND_ZIPS = [
  { target: 'mobile', label: 'Mobile kit', file: 'brand-mobile.zip' },
  { target: 'web', label: 'Web kit', file: 'brand-web.zip' },
  { target: 'repo', label: 'Halftone repo', file: 'brand.zip' },
] as const;

/** The prompt for the brand download (unzipped already, or about to be). */
export function brandPrompt(file: string) {
  return (
    `Unzip ${file} at the root of this project (it adds lib/brand.ts and the icon, splash and favicon images; ` +
    'app.json stays as it is). Then follow the apply-theme skill\'s "Brand assets" steps and run the qc-pass ' +
    'skill: show me the logo in light and dark, and the app icon.'
  );
}

/** The logo, app icon, splash and favicons as files laid out like each kit (lib/brand/zip.ts). */
function BrandExport({ theme }: { theme: Theme }) {
  const state = useBrand();
  const brand = kitBrand(state);
  const [busy, setBusy] = React.useState<string | null>(null);
  const [error, setError] = React.useState<string | null>(null);
  const download = async (target: (typeof BRAND_ZIPS)[number]['target'], file: string) => {
    if (!brand) return;
    setBusy(file);
    setError(null);
    try {
      // fflate and the canvas drawing load only when someone downloads.
      const { brandZip } = await import('@/lib/brand/zip');
      const bytes = await brandZip(target, brand, theme, state.iconBackground);
      const url = URL.createObjectURL(new Blob([bytes as BlobPart], { type: 'application/zip' }));
      Object.assign(document.createElement('a'), { href: url, download: file }).click();
      setTimeout(() => URL.revokeObjectURL(url), 1000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'The download could not be made.');
    } finally {
      setBusy(null);
    }
  };
  return (
    <section aria-labelledby="export-brand" className="border-border flex flex-col gap-3 border-t pt-4">
      <div className="flex flex-col gap-1">
        <h3 id="export-brand" className="text-sm font-medium">
          Brand assets
        </h3>
        <p className="text-muted-foreground text-xs leading-5">
          {brand
            ? 'Your logo for <Logo>, the app icon, splash screens and favicons, laid out like the kit. Unzip it at the kit’s root.'
            : 'Add a logo in the studio (Logo, at the top) to download it with an app icon, splash screens and favicons.'}
        </p>
      </div>
      {brand ? (
        <>
          <div className="flex flex-wrap gap-2">
            {BRAND_ZIPS.map((z) => (
              <button
                key={z.target}
                type="button"
                disabled={busy !== null}
                onClick={() => void download(z.target, z.file)}
                className="border-border hover:bg-accent focus-visible:ring-ring inline-flex h-9 items-center justify-center gap-2 rounded-full border px-4 text-sm font-medium focus-visible:outline-none focus-visible:ring-2 disabled:opacity-60">
                <DownloadIcon className="size-4" aria-hidden />
                {busy === z.file ? 'Drawing…' : z.label}
              </button>
            ))}
          </div>
          {error ? (
            <p role="alert" className="text-destructive text-xs leading-5">
              {error}
            </p>
          ) : null}
          <CopyRow label="Then ask your coding agent" value={brandPrompt('the brand zip')} mono={false} />
        </>
      ) : null}
    </section>
  );
}
