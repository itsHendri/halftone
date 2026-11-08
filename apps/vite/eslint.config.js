import { readdirSync } from 'node:fs';
import { join, relative } from 'node:path';
import { defineConfig, globalIgnores } from 'eslint/config';
import reactHooks from 'eslint-plugin-react-hooks';
import globals from 'globals';
import tseslint from 'typescript-eslint';
// The design system's guardrails (eslint/halftone.mjs): errors an agent hits while it writes.
import halftone from './eslint/halftone.mjs';

const SRC = join(import.meta.dirname, 'src');
/** The kit files `shadcn add` put in src/components/ui and kit: the only components pages may import from there. */
const installed = (dir) =>
  readdirSync(join(SRC, dir), { recursive: true, withFileTypes: true })
    .filter((e) => e.isFile())
    .map((e) => relative(SRC, join(e.parentPath, e.name)));
const REGISTERED = [...installed('components/ui'), ...installed('components/kit')];
const CODE = ['src/**/*.{ts,tsx}'];
// The kit's own files: they define the kit, so they may use what pages can't.
const KIT = ['src/components/ui/**', 'src/components/kit/**', 'src/hooks/**', 'src/lib/link.tsx'];

export default defineConfig([
  globalIgnores(['dist/**', '.wrangler/**', 'src/lib/theme.ts']),
  ...tseslint.configs.recommended,
  { files: CODE, ...reactHooks.configs.flat.recommended, languageOptions: { globals: globals.browser } },
  { files: ['worker/**/*.ts', 'shared/**/*.ts'], languageOptions: { globals: globals.serviceworker } },
  { files: ['*.{js,ts}', 'eslint/**'], languageOptions: { globals: globals.node } },
  // Registered everywhere, so `npx eslint --rule '{"halftone/no-raw-colour":"error"}' <file>` works on any file.
  { plugins: { halftone }, linterOptions: { reportUnusedDisableDirectives: 'error' } },
  {
    files: CODE,
    rules: {
      'halftone/no-foreign-ui': [
        'error',
        { packages: ['@mui', '@material-ui', '@chakra-ui', '@mantine', 'antd', '@ant-design', 'react-bootstrap', 'react-icons', '@heroicons', '@fortawesome'] },
      ],
      'halftone/disable-needs-reason': 'error',
      'halftone/no-alpha-colour': 'error',
    },
  },
  {
    files: CODE,
    ignores: KIT,
    rules: {
      'halftone/no-raw-colour': 'error',
      // Another kit component: `npx shadcn@latest add @halftone-web/<name>` (the list: halftonedesignsystem.com/llms.txt).
      'halftone/registry-imports': ['error', { root: SRC, files: REGISTERED }],
      // Charts go through the kit's ChartContainer, which gives series their var(--chart-N) colours.
      'halftone/no-raw-primitives': [
        'error',
        {
          imports: [
            {
              source: 'recharts',
              unlessFileImports: { source: '@/components/ui/chart', name: 'ChartContainer' },
              message: 'charts go through ChartContainer from @/components/ui/chart (series colours from var(--chart-N)).',
            },
          ],
        },
      ],
    },
  },
]);
