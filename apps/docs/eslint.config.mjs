import { defineConfig, globalIgnores } from 'eslint/config';
import nextPlugin from '@next/eslint-plugin-next';
import tseslint from 'typescript-eslint';
// The kits' guardrails (apps/mobile/eslint/halftone.mjs). The docs site is never copied out of the monorepo, so it
// reads the mobile kit's source rather than keeping a copy (AGENTS.md: the one app allowed to).
import halftone from '../mobile/eslint/halftone.mjs';

const CODE = ['app/**/*.{ts,tsx}', 'components/**/*.{ts,tsx}', 'lib/**/*.{ts,tsx}'];

// Only the colour rules and their disable rule: the site isn't a kit, so it has no registry to import from
// and builds on Fumadocs. Next's own lint stays out until the site is ready for it, but for no-img-element.
export default defineConfig([
  globalIgnores(['.next/**', 'out/**', '.source/**', 'next-env.d.ts', 'public/**']),
  { files: CODE, languageOptions: { parser: tseslint.parser, parserOptions: { ecmaFeatures: { jsx: true } } } },
  { plugins: { halftone, '@next/next': nextPlugin }, linterOptions: { reportUnusedDisableDirectives: 'error' } },
  {
    files: CODE,
    rules: {
      'halftone/no-raw-colour': 'error',
      'halftone/no-alpha-colour': 'error',
      'halftone/disable-needs-reason': 'error',
      // The one Next rule the site's code already answers to (a reasoned disable in components/brand).
      '@next/next/no-img-element': 'error',
    },
  },
]);
