/**
 * Which files the halftone/* rules cover in this kit's real eslint.config.js: `npm run lint:rules`.
 * Virtual paths through ESLint#lintText, so no probe files sit in app/ for the normal lint to find.
 */
import assert from 'node:assert/strict';
import { join } from 'node:path';
import { test } from 'node:test';
import { fileURLToPath } from 'node:url';
import { ESLint } from 'eslint';

const root = fileURLToPath(new URL('..', import.meta.url));
const eslint = new ESLint({ cwd: root });
/** The halftone/ rules that fire on `code` placed at `path`. */
async function halftone(path, code) {
  const [result] = await eslint.lintText(code, { filePath: join(root, path) });
  return [...new Set(result.messages.map((m) => m.ruleId).filter((id) => id?.startsWith('halftone/')))].sort();
}

const SCREEN = `import { Text } from 'react-native';
import { Nope } from '@/components/ui/nope';
export const A = () => <Text className="bg-red-500">{Nope}</Text>;
`;

test('a screen gets every rule', async () => {
  assert.deepEqual(await halftone('app/acme/index.tsx', SCREEN), ['halftone/no-raw-colour', 'halftone/no-raw-primitives', 'halftone/registry-imports']);
});

test('a sample component gets every rule', async () => {
  assert.deepEqual(await halftone('components/acme/card.tsx', SCREEN), ['halftone/no-raw-colour', 'halftone/no-raw-primitives', 'halftone/registry-imports']);
});

test('the registry sources are left to themselves', async () => {
  assert.deepEqual(await halftone('components/ui/thing.tsx', SCREEN), []);
  assert.deepEqual(await halftone('components/kit/thing.tsx', SCREEN), []);
});

test('the kit shell and the Components page may use primitives, not raw colours', async () => {
  assert.deepEqual(await halftone('app/(kit)/thing.tsx', SCREEN), ['halftone/no-raw-colour', 'halftone/registry-imports']);
  assert.deepEqual(await halftone('components/devkit/thing.tsx', SCREEN), ['halftone/no-raw-colour', 'halftone/registry-imports']);
});

test('a reasoned disable silences one rule; a bare one is reported', async () => {
  const reasoned = `// eslint-disable-next-line halftone/no-raw-primitives -- the whole card is the tap target
import { Pressable } from 'react-native';
export const A = () => <Pressable />;
`;
  assert.deepEqual(await halftone('app/acme/index.tsx', reasoned), []);
  const bare = reasoned.replace(' -- the whole card is the tap target', '');
  assert.deepEqual(await halftone('app/acme/index.tsx', bare), ['halftone/disable-needs-reason']);
});

test('other icon libraries are rejected', async () => {
  assert.deepEqual(await halftone('app/acme/index.tsx', `import { Ionicons } from '@expo/vector-icons';\nexport const I = Ionicons;\n`), ['halftone/no-foreign-ui']);
});
