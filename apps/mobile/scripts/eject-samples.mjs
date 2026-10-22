#!/usr/bin/env node
/**
 * scripts/eject-samples.mjs — remove the shop, habits and Northwind sample apps, all or some.
 *
 *   npm run eject-samples                     # every sample
 *   npm run eject-samples -- shop northwind   # just these
 *   npm run eject-samples -- --status         # what is still here, and what each one takes with it
 *
 * The samples exist to show what the kit can build. On a real project they are the
 * first thing to go, and deleting them by hand means six steps across four places —
 * easy to half-do and ship a client a prototype with a habit tracker in the tab bar.
 *
 * This removes the routes, the mock stores, the root Stack entries and the kit-home
 * links, then tells you what to run. Every edit is checked before anything is written or
 * deleted, so a file that has drifted stops the script with nothing touched. A sample another
 * kept sample links to is refused. It is deliberately not reversible: use git.
 */
import { existsSync, readdirSync, readFileSync, rmSync, statSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const rel = (p) => join(root, p);

const SAMPLES = {
  shop: { title: 'Shop and orders', dirs: ['app/shop', 'components/shop'] },
  habits: { title: 'Habit tracker', dirs: ['app/habits', 'components/habits'] },
  northwind: { title: 'Northwind invoicing', dirs: ['app/northwind', 'components/northwind'] },
};
const NAMES = Object.keys(SAMPLES);
const LAYOUT = 'app/_layout.tsx';
const HOME = 'app/(kit)/index.tsx';

const stackLine = (name) => new RegExp(`^ *<Stack\\.Screen name="${name}" \\/>\\n`, 'm');
const homeLink = (name) => new RegExp(`^ *<Link href="/${name}/\\(tabs\\)" asChild>\\n[\\s\\S]*?<\\/Link>\\n`, 'm');
const GROUP = /\n {6}<ListGroup title="Sample apps"[\s\S]*?<\/ListGroup>\n/;

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

/** Drop names from a lucide import that the rest of the file no longer uses. */
function pruneIcons(src) {
  return src.replace(/import \{([^}]*)\} from 'lucide-react-native';/, (whole, list) => {
    const body = src.replace(whole, '');
    const keep = list
      .split(',')
      .map((s) => s.trim())
      .filter((s) => s && new RegExp(`\\b${s.replace(/^type /, '')}\\b`).test(body));
    return `import { ${keep.join(', ')} } from 'lucide-react-native';`;
  });
}

/** Stop with a message and nothing touched. */
function fail(message) {
  console.error(`eject-samples: ${message}`);
  process.exit(1);
}

const layout = readFileSync(rel(LAYOUT), 'utf8');
const home = readFileSync(rel(HOME), 'utf8');

/** What is left of one sample: its folders (with file counts) and its two references. */
function pieces(name) {
  const dirs = SAMPLES[name].dirs.filter((d) => existsSync(rel(d)));
  return {
    dirs,
    files: filesIn(dirs).length,
    stack: stackLine(name).test(layout),
    link: homeLink(name).test(home),
  };
}

const args = process.argv.slice(2);
const flags = args.filter((a) => a.startsWith('-'));
const unknown = [...flags.filter((f) => f !== '--status'), ...args.filter((a) => !a.startsWith('-') && !NAMES.includes(a))];
if (unknown.length) {
  console.error(
    `eject-samples: unknown ${unknown.join(', ')}.\n` +
      `  npm run eject-samples                remove every sample\n` +
      `  npm run eject-samples -- <name> …    remove the ones named (${NAMES.join(', ')})\n` +
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
    const refs = [p.stack && `${LAYOUT} Stack.Screen`, p.link && 'kit home link'].filter(Boolean);
    const state = !p.dirs.length && !refs.length ? 'ejected' : p.dirs.length === SAMPLES[name].dirs.length && refs.length === 2 ? 'present' : 'partial';
    const parts = state === 'ejected' ? [] : [p.dirs.length ? `${p.dirs.join(', ')} (${p.files} files)` : 'folders gone', ...refs];
    const by = state === 'ejected' ? [] : linkedFrom(name, present.filter((n) => n !== name));
    if (by.length) parts.push(`linked from ${by.join(', ')}`);
    console.log(`  ${name.padEnd(10)} ${state.padEnd(8)} ${parts.join(' · ')}`.trimEnd());
  }
  process.exit(0);
}

const asked = args.length ? NAMES.filter((n) => args.includes(n)) : NAMES;
const targets = asked.filter((n) => {
  const p = pieces(n);
  return p.dirs.length || p.stack || p.link;
});
if (!targets.length) {
  const gone = args.length ? asked.join(', ') : 'the samples';
  console.log(`eject-samples → nothing to do, ${gone} ${asked.length === 1 ? 'is' : 'are'} already gone.`);
  process.exit(0);
}

// A sample that stays must not route into one that goes.
const kept = NAMES.filter((n) => !targets.includes(n) && existsSync(rel(SAMPLES[n].dirs[0])));
for (const name of targets) {
  const by = linkedFrom(name, kept);
  if (by.length) {
    fail(`${by.join(', ')} links to ${name}. Eject them together: npm run eject-samples -- ${NAMES.filter((n) => targets.includes(n) || by.includes(n)).join(' ')}`);
  }
}

// Plan every edit in memory first, so a file that has drifted stops the script with nothing touched.
let nextLayout = layout;
let nextHome = home;
for (const name of targets) {
  const app = existsSync(rel(SAMPLES[name].dirs[0]));
  for (const [file, pattern, what] of [
    [LAYOUT, stackLine(name), `<Stack.Screen name="${name}" />`],
    [HOME, homeLink(name), `the <Link href="/${name}/(tabs)"> row`],
  ]) {
    const src = file === LAYOUT ? nextLayout : nextHome;
    if (!pattern.test(src)) {
      if (!app) continue; // half-ejected already: just finish the job
      fail(`could not find ${what} in ${file}. The file has changed shape — remove the ${name} references by hand.`);
    }
    if (file === LAYOUT) nextLayout = src.replace(pattern, '');
    else nextHome = src.replace(pattern, '');
  }
}
// The whole "Sample apps" group goes with its last row.
const group = nextHome.match(GROUP);
if (group && !/<Link href=/.test(group[0])) nextHome = nextHome.replace(group[0], '\n');
nextHome = pruneIcons(nextHome);

const removed = targets.flatMap((n) => SAMPLES[n].dirs.filter((d) => existsSync(rel(d))));
for (const dir of removed) rmSync(rel(dir), { recursive: true, force: true });
writeFileSync(rel(LAYOUT), nextLayout);
writeFileSync(rel(HOME), nextHome);

const left = NAMES.filter((n) => !targets.includes(n) && existsSync(rel(SAMPLES[n].dirs[0])));
console.log(
  [
    `eject-samples → removed ${targets.join(', ')}:`,
    ...removed.map((d) => `  ${d}`),
    `  ${LAYOUT.padEnd(22)} (${targets.length} Stack.Screen ${targets.length === 1 ? 'entry' : 'entries'})`,
    `  ${HOME.padEnd(22)} (${left.length ? `${targets.length === 1 ? 'its row' : 'their rows'} in "Sample apps"` : '"Sample apps" group'})`,
    ...(left.length ? ['', `Still here: ${left.join(', ')} (npm run eject-samples -- --status).`] : []),
    '',
    'Next:',
    '  npm run typecheck && npm run lint -- --max-warnings 0',
    '',
    'KitChip stays — it is how a prototype gets back to the kit. Delete it too',
    'once your prototype is the product, along with the app/(kit) shell.',
  ].join('\n')
);
