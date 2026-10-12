#!/usr/bin/env node
/**
 * scripts/eject-samples.mjs — remove the shop, habits and Northwind sample apps.
 *
 *   npm run eject-samples
 *
 * The samples exist to show what the kit can build. On a real project they are the
 * first thing to go, and deleting them by hand means six steps across four places —
 * easy to half-do and ship a client a prototype with a habit tracker in the tab bar.
 *
 * This removes the routes, the mock stores, the root Stack entries and the kit-home
 * links, then tells you what to run. It is deliberately not reversible: use git.
 */
import { existsSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const rel = (p) => join(root, p);

const DIRS = ['app/shop', 'app/habits', 'app/northwind', 'components/shop', 'components/habits', 'components/northwind'];

const removed = [];
for (const dir of DIRS) {
  if (existsSync(rel(dir))) {
    rmSync(rel(dir), { recursive: true, force: true });
    removed.push(dir);
  }
}

if (!removed.length) {
  console.log('eject-samples → nothing to do, the samples are already gone.');
  process.exit(0);
}

/** Drop matching lines from a file, failing loudly if the shape has drifted. */
function dropLines(file, predicate, expected) {
  const path = rel(file);
  const before = readFileSync(path, 'utf8').split('\n');
  const after = before.filter((line) => !predicate(line));
  const cut = before.length - after.length;
  if (cut !== expected) {
    throw new Error(
      `eject-samples: expected to remove ${expected} line(s) from ${file}, removed ${cut}.\n` +
        'The file has changed shape — remove the sample references by hand.'
    );
  }
  writeFileSync(path, after.join('\n'));
  return cut;
}

// 1. Root Stack no longer declares the sample groups.
dropLines('app/_layout.tsx', (l) => /<Stack\.Screen name="(shop|habits|northwind)" \/>/.test(l), 3);

// 2. The kit home loses the whole "Sample apps" group, and the icons only it used.
const homePath = rel('app/(kit)/index.tsx');
let home = readFileSync(homePath, 'utf8');
const group = home.match(/\n {6}<ListGroup title="Sample apps"[\s\S]*?<\/ListGroup>\n/);
if (!group) {
  throw new Error('eject-samples: could not find the "Sample apps" group in app/(kit)/index.tsx — remove it by hand.');
}
home = home.replace(group[0], '\n');
home = home.replace(
  "import { BlocksIcon, ReceiptTextIcon, ShoppingBagIcon, SwatchBookIcon, TargetIcon } from 'lucide-react-native';",
  "import { BlocksIcon, SwatchBookIcon } from 'lucide-react-native';"
);
writeFileSync(homePath, home);

console.log(
  [
    'eject-samples → removed:',
    ...removed.map((d) => `  ${d}`),
    '  app/_layout.tsx        (3 Stack.Screen entries)',
    '  app/(kit)/index.tsx    ("Sample apps" group)',
    '',
    'Next:',
    '  npm run typecheck && npm run lint -- --max-warnings 0',
    '',
    'KitChip stays — it is how a prototype gets back to the kit. Delete it too',
    'once your prototype is the product, along with the app/(kit) shell.',
  ].join('\n')
);
