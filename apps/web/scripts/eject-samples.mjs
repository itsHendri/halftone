#!/usr/bin/env node
/**
 * scripts/eject-samples.mjs — remove the dashboard, landing, assistant, shop and habits samples, all or some.
 *
 *   npm run eject-samples                     # every sample
 *   npm run eject-samples -- shop habits      # just these
 *   npm run eject-samples -- northwind        # dashboard, landing and assistant: Northwind, three ways
 *   npm run eject-samples -- --status         # what is still here, and what each one takes with it
 *
 * The samples show what the kit can build. On a real project they are the first thing to go, and
 * deleting them by hand is easy to half-do. This removes their routes and mock data and their cards in
 * the kit home's "Sample apps" section (the whole section, between the samples:start / samples:end
 * markers, goes with the last one), then says what to run. Every edit is checked before anything is
 * written or deleted, so a home page that has drifted stops the script with nothing touched. A sample
 * another kept sample links to is refused (the landing page's buttons go to the dashboard).
 * It is deliberately not reversible: use git.
 */
import { existsSync, readdirSync, readFileSync, rmSync, statSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const rel = (p) => join(root, p);

const SAMPLES = {
  dashboard: { title: 'Dashboard', dirs: ['app/dashboard', 'components/dashboard'] },
  landing: { title: 'Landing page', dirs: ['app/landing', 'components/landing'] },
  assistant: { title: 'Assistant', dirs: ['app/assistant', 'components/assistant'] },
  shop: { title: 'Shop', dirs: ['app/shop', 'components/shop'] },
  habits: { title: 'Habits', dirs: ['app/habits', 'components/habits'] },
};
const NAMES = Object.keys(SAMPLES);
/** Names for several samples at once. `northwind` matches the native kit's sample of the same name. */
const GROUPS = { northwind: ['dashboard', 'landing', 'assistant'] };
const HOME = 'app/(kit)/page.tsx';

const card = (name) => new RegExp(`^ *\\{ href: '/${name}', [^\\n]*\\},\\n`, 'm');
const BLOCKS = [/\/\/ samples:start[^\n]*\n[\s\S]*?\/\/ samples:end\n\n?/, /\n? *\{\/\* samples:start \*\/\}[\s\S]*?\{\/\* samples:end \*\/\}\n/];

/** Every file under the given folders, relative to the app. */
function filesIn(dirs) {
  const out = [];
  const walk = (dir) => {
    for (const f of readdirSync(rel(dir))) {
      const p = `${dir}/${f}`;
      if (statSync(rel(p)).isDirectory()) walk(p);
      else out.push(p);
    }
  };
  for (const d of dirs) if (existsSync(rel(d))) walk(d);
  return out;
}

/** The kept samples whose files route to, or import from, `name`. */
function linkedFrom(name, kept) {
  const ref = new RegExp(`['"\`]/${name}(?=[/?'"\`])|@/components/${name}/`);
  return kept.filter((k) => filesIn(SAMPLES[k].dirs).some((f) => ref.test(readFileSync(rel(f), 'utf8'))));
}

/** Drop names from the lucide import that the rest of the file no longer uses. */
function pruneIcons(src) {
  return src.replace(/import \{([^}]*)\} from 'lucide-react';/, (whole, list) => {
    const body = src.replace(whole, '');
    const keep = list
      .split(',')
      .map((s) => s.trim())
      .filter((s) => s && new RegExp(`\\b${s.replace(/^type /, '')}\\b`).test(body));
    return `import { ${keep.join(', ')} } from 'lucide-react';`;
  });
}

/** Stop with a message and nothing touched. */
function fail(message) {
  console.error(`eject-samples: ${message}`);
  process.exit(1);
}

const home = readFileSync(rel(HOME), 'utf8');

/** What is left of one sample: its folders (with file counts) and its card on the kit home. */
function pieces(name) {
  const dirs = SAMPLES[name].dirs.filter((d) => existsSync(rel(d)));
  return { dirs, files: filesIn(dirs).length, card: card(name).test(home) };
}

const args = process.argv.slice(2);
const flags = args.filter((a) => a.startsWith('-'));
const unknown = [...flags.filter((f) => f !== '--status'), ...args.filter((a) => !a.startsWith('-') && !NAMES.includes(a) && !GROUPS[a])];
if (unknown.length) {
  console.error(
    `eject-samples: unknown ${unknown.join(', ')}.\n` +
      `  npm run eject-samples                remove every sample\n` +
      `  npm run eject-samples -- <name> …    remove the ones named (${NAMES.join(', ')}, or northwind for the first three)\n` +
      '  npm run eject-samples -- --status    remove nothing, list what is still here'
  );
  process.exit(1);
}

// --status: one line per sample, then stop.
if (flags.includes('--status')) {
  const present = NAMES.filter((n) => existsSync(rel(SAMPLES[n].dirs[0])));
  console.log('eject-samples --status');
  for (const name of NAMES) {
    const p = pieces(name);
    const state = !p.dirs.length && !p.card ? 'ejected' : p.dirs.length === SAMPLES[name].dirs.length && p.card ? 'present' : 'partial';
    const parts = state === 'ejected' ? [] : [p.dirs.length ? `${p.dirs.join(', ')} (${p.files} files)` : 'folders gone', ...(p.card ? ['kit home card'] : [])];
    const by = state === 'ejected' ? [] : linkedFrom(name, present.filter((n) => n !== name));
    if (by.length) parts.push(`linked from ${by.join(', ')}`);
    console.log(`  ${name.padEnd(10)} ${state.padEnd(8)} ${parts.join(' · ')}`.trimEnd());
  }
  process.exit(0);
}

const named = args.flatMap((a) => GROUPS[a] ?? [a]);
const asked = args.length ? NAMES.filter((n) => named.includes(n)) : NAMES;
const targets = asked.filter((n) => {
  const p = pieces(n);
  return p.dirs.length || p.card;
});
if (!targets.length) {
  const gone = args.length ? args.join(', ') : 'the samples';
  console.log(`eject-samples → nothing to do, ${gone} ${(args.length || asked.length) === 1 ? 'is' : 'are'} already gone.`);
  process.exit(0);
}

// A sample that stays must not route into one that goes.
const kept = NAMES.filter((n) => !targets.includes(n) && existsSync(rel(SAMPLES[n].dirs[0])));
for (const name of targets) {
  const by = linkedFrom(name, kept);
  if (by.length) fail(`${by.join(', ')} links to ${name}. Eject them together: npm run eject-samples -- ${NAMES.filter((n) => targets.includes(n) || by.includes(n)).join(' ')}`);
}

// Edit the kit home in memory before deleting anything, so a home page that has drifted stops the script cleanly.
let next = home;
for (const name of targets) {
  if (card(name).test(next)) next = next.replace(card(name), '');
  else if (existsSync(rel(SAMPLES[name].dirs[0]))) fail(`could not find the { href: '/${name}', … } card in ${HOME}. Remove the ${name} sample by hand.`);
}
// The whole "Sample apps" section goes with its last card.
if (!/^ *\{ href: '\/[^\n]*\},$/m.test(next.match(BLOCKS[0])?.[0] ?? '')) {
  for (const block of BLOCKS) {
    if (!block.test(next)) fail(`the samples:start / samples:end markers in ${HOME} have moved. Remove the samples by hand.`);
    next = next.replace(block, '');
  }
}
next = pruneIcons(next);

const removed = targets.flatMap((n) => SAMPLES[n].dirs.filter((d) => existsSync(rel(d))));
for (const dir of removed) rmSync(rel(dir), { recursive: true, force: true });
writeFileSync(rel(HOME), next);

const left = NAMES.filter((n) => !targets.includes(n) && existsSync(rel(SAMPLES[n].dirs[0])));
console.log(
  [
    `eject-samples → removed ${targets.join(', ')}:`,
    ...removed.map((d) => `  ${d}`),
    `  ${HOME.padEnd(22)} (${left.length ? `${targets.length === 1 ? 'its card' : 'their cards'} in "Sample apps"` : '"Sample apps" section'})`,
    ...(left.length ? ['', `Still here: ${left.join(', ')} (npm run eject-samples -- --status).`] : []),
    '',
    'Next:',
    '  npm run typecheck && npm run lint',
    '',
    'KitChip (components/site/kit-chip.tsx) stays: it is how a prototype gets back to the kit. Delete it',
    'too once your prototype is the product, along with app/(kit).',
  ].join('\n')
);
