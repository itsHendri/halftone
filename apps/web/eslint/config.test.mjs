/**
 * Which files the halftone/* rules cover in this kit's real eslint.config.mjs: `npm run lint:rules`.
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

const PAGE = `import { BarChart } from 'recharts';
import { Nope } from '@/components/ui/nope';
export const A = () => <div className="text-white">{Nope}{BarChart}</div>;
`;

test('a page gets every rule', async () => {
  assert.deepEqual(await halftone('app/acme/page.tsx', PAGE), ['halftone/no-raw-colour', 'halftone/no-raw-primitives', 'halftone/registry-imports']);
});

test('a sample component gets every rule', async () => {
  assert.deepEqual(await halftone('components/acme/view.tsx', PAGE), ['halftone/no-raw-colour', 'halftone/no-raw-primitives', 'halftone/registry-imports']);
});

test('the registry sources are left to themselves', async () => {
  assert.deepEqual(await halftone('components/ui/thing.tsx', PAGE), []);
  assert.deepEqual(await halftone('components/kit/thing.tsx', PAGE), []);
});

test('recharts is fine next to ChartContainer', async () => {
  const chart = `import { Bar, BarChart } from 'recharts';
import { ChartContainer } from '@/components/ui/chart';
export const C = () => <ChartContainer config={{}}><BarChart><Bar dataKey="a" fill="var(--color-a)" /></BarChart></ChartContainer>;
`;
  assert.deepEqual(await halftone('app/acme/page.tsx', chart), []);
});

test('a reasoned disable silences one rule; a bare one is reported', async () => {
  const reasoned = `// eslint-disable-next-line halftone/no-raw-colour -- the client's logo is white on every theme
export const A = () => <div className="text-white" />;
`;
  assert.deepEqual(await halftone('app/acme/page.tsx', reasoned), []);
  const bare = reasoned.replace(" -- the client's logo is white on every theme", '');
  assert.deepEqual(await halftone('app/acme/page.tsx', bare), ['halftone/disable-needs-reason']);
});

test('other UI libraries are rejected', async () => {
  assert.deepEqual(await halftone('app/acme/page.tsx', `import Button from '@mui/material/Button';\nexport const B = Button;\n`), ['halftone/no-foreign-ui']);
});
