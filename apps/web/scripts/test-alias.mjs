/**
 * `node --test` for the kit's headless code (lib/controls): resolves the app's `@/` alias to this folder and finds the
 * `.ts` file behind an import without an extension, as the bundler does. Node strips the types itself.
 *
 *   node --import ./scripts/test-alias.mjs --test lib/controls/*.test.ts   (npm test)
 */
import { existsSync } from 'node:fs';
import { registerHooks } from 'node:module';

const root = new URL('../', import.meta.url);

registerHooks({
  resolve(specifier, context, next) {
    if (specifier.startsWith('@/')) {
      for (const ext of ['.ts', '.tsx', '']) {
        const url = new URL(specifier.slice(2) + ext, root);
        if (existsSync(url)) return { url: url.href, shortCircuit: true };
      }
    }
    return next(specifier, context);
  },
});
