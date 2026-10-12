#!/usr/bin/env node
/**
 * scripts/eject-samples.mjs — remove the dashboard, landing, assistant, shop and habits samples.
 *
 *   npm run eject-samples
 *
 * The samples show what the kit can build. On a real project they are the first thing to go, and
 * deleting them by hand is easy to half-do. This removes their routes and mock data and the kit home's
 * "Sample apps" section (between the samples:start / samples:end markers), then says what to run.
 * It is deliberately not reversible: use git.
 */
import { existsSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const rel = (p) => join(root, p);

const DIRS = ['app/dashboard', 'app/landing', 'app/assistant', 'app/shop', 'app/habits', 'components/dashboard', 'components/landing', 'components/assistant', 'components/shop', 'components/habits'];

const removed = DIRS.filter((d) => existsSync(rel(d)));
if (!removed.length) {
  console.log('eject-samples → nothing to do, the samples are already gone.');
  process.exit(0);
}

// Edit the kit home before deleting anything, so a home page that has drifted stops the script cleanly.
const homePath = rel('app/(kit)/page.tsx');
let home = readFileSync(homePath, 'utf8');
const blocks = [
  /\/\/ samples:start[^\n]*\n[\s\S]*?\/\/ samples:end\n\n?/,
  /\n? *\{\/\* samples:start \*\/\}[\s\S]*?\{\/\* samples:end \*\/\}\n/,
];
for (const block of blocks) {
  if (!block.test(home)) {
    throw new Error('eject-samples: the samples:start / samples:end markers in app/(kit)/page.tsx have moved. Remove the samples by hand.');
  }
  home = home.replace(block, '');
}
const ICONS = "import { ArrowRightIcon, BlocksIcon, BotIcon, LayoutDashboardIcon, MegaphoneIcon, PaletteIcon, ShoppingBagIcon, TargetIcon, type LucideIcon } from 'lucide-react';";
if (!home.includes(ICONS)) throw new Error('eject-samples: the lucide import in app/(kit)/page.tsx has changed. Remove the samples by hand.');
home = home.replace(ICONS, "import { ArrowRightIcon, BlocksIcon, PaletteIcon, type LucideIcon } from 'lucide-react';");

for (const dir of removed) rmSync(rel(dir), { recursive: true, force: true });
writeFileSync(homePath, home);

console.log(
  [
    'eject-samples → removed:',
    ...removed.map((d) => `  ${d}`),
    '  app/(kit)/page.tsx     ("Sample apps" section)',
    '',
    'Next:',
    '  npm run typecheck && npm run lint',
    '',
    'KitChip (components/site/kit-chip.tsx) stays: it is how a prototype gets back to the kit. Delete it',
    'too once your prototype is the product, along with app/(kit).',
  ].join('\n')
);
