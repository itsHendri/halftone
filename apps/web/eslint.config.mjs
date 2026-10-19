import { readFileSync } from 'node:fs';
import { defineConfig, globalIgnores } from 'eslint/config';
import nextVitals from 'eslint-config-next/core-web-vitals';
import nextTs from 'eslint-config-next/typescript';
// The design system's guardrails (eslint/halftone.mjs): errors an agent hits while it writes.
import halftone from './eslint/halftone.mjs';

const REGISTERED = JSON.parse(readFileSync(new URL('./registry/generated/index.json', import.meta.url), 'utf8')).components.flatMap(
  (c) => c.files
);
const CODE = ['app/**/*.{ts,tsx}', 'components/**/*.{ts,tsx}'];
// The registry's own sources: components/ui and components/kit define the kit, so they may use what pages can't.
const SOURCES = ['components/ui/**', 'components/kit/**'];

export default defineConfig([
  ...nextVitals,
  ...nextTs,
  globalIgnores(['.next/**', 'out/**', 'next-env.d.ts', 'dist/**']),
  // Registered everywhere, so `npx eslint --rule '{"halftone/no-raw-colour":"error"}' <file>` works on any file.
  { plugins: { halftone }, linterOptions: { reportUnusedDisableDirectives: 'error' } },
  {
    files: CODE,
    rules: {
      'halftone/no-foreign-ui': [
        'error',
        {
          packages: [
            '@mui',
            '@material-ui',
            '@chakra-ui',
            '@mantine',
            'antd',
            '@ant-design',
            'react-bootstrap',
            'react-icons',
            '@heroicons',
            '@fortawesome',
          ],
        },
      ],
      'halftone/disable-needs-reason': 'error',
    },
  },
  {
    files: CODE,
    ignores: SOURCES,
    rules: {
      'halftone/no-raw-colour': 'error',
      'halftone/registry-imports': ['error', { root: import.meta.dirname, files: REGISTERED }],
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
