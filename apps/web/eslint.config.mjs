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
// The registry's own sources: components/ui, components/kit and components/controls define the kit, so they may use
// what pages can't.
const SOURCES = ['components/ui/**', 'components/kit/**', 'components/controls/**'];

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
      // The registry sources too: a see-through colour is wrong in a component as much as in a screen.
      'halftone/no-alpha-colour': 'error',
    },
  },
  // Kit components work in any React app: they link through @/lib/link, which the app points at its router once
  // (KitLinkProvider). A next/link import here would break every app that isn't Next.js.
  {
    files: ['components/kit/**', 'components/controls/**', 'lib/controls/**'],
    rules: {
      'no-restricted-imports': [
        'error',
        {
          paths: [
            { name: 'next/link', message: 'Kit components link with KitLink from @/lib/link, so they work in any React app.' },
            { name: 'next/navigation', message: 'Kit components read the path with usePathname from @/lib/link, so they work in any React app.' },
          ],
          patterns: [{ group: ['next/*', '!next/link', '!next/navigation'], message: 'Kit components must work in any React app: no Next.js imports.' }],
        },
      ],
    },
  },
  // The controls are new and ours from the first line: tokens only, as a page's code is.
  // (Tests are data: a hex there is a value under test.)
  { files: ['components/controls/**', 'lib/controls/**'], ignores: ['**/*.test.ts'], rules: { 'halftone/no-raw-colour': 'error' } },
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
