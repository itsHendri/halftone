#!/usr/bin/env node
/**
 * halftone-tokens — turns tokens/tokens.json into everything an app reads.
 *
 *   halftone-tokens init     set up tokens in an existing app, web or Expo (see lib/init.mjs)
 *   halftone-tokens doctor   check an app's setup for kit components and say how to fix it (see lib/doctor.mjs)
 *   halftone-tokens build    resolve, check contrast, write every target in tokens.config.json
 *   halftone-tokens check    same, but write nothing; exit 1 if any generated file is stale (CI)
 *   halftone-tokens figma    mirror the tokens into Figma Variables (see push-figma.mjs)
 *   halftone-tokens theme    apply, show or list themes (see lib/theme-cli.mjs)
 *   halftone-tokens --version
 *   halftone-tokens --help   (USAGE below)
 *
 *   --root <dir>        app root (default: cwd); every path in the config is relative to it
 *   --config <file>     default: tokens/tokens.config.json
 *   --strict            fail (exit 1) on contrast instead of warning; also HALFTONE_STRICT=1 in the environment.
 *                       Every pairing below WCAG AA, and every tone's text on a tint the palette can't carry, is
 *                       named either way; Halftone's own kits build strict, so they never ship below AA.
 *
 * tokens.config.json: { "source": "tokens/tokens.json", "targets": { "<target>": { …options } } }
 * Targets live in ./targets/<name>.mjs and return [{ path, contents }]. All outputs are GENERATED —
 * never hand-edit them.
 */
import { existsSync, mkdirSync, readFileSync, realpathSync, writeFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

import { checkContrast, AA, componentFailures, describeSubtle, describeTintLimits, textOnSubtle, textOnTintLimits } from './lib/contrast.mjs';
import { loadContext, renderTargets } from './lib/generate.mjs';
import { scanTintText } from './lib/scan.mjs';

const here = dirname(fileURLToPath(import.meta.url));

/** What `halftone-tokens --help` prints. Keep it in step with the comment at the top of this file. */
export const USAGE = `halftone-tokens: turns tokens/tokens.json into everything an app reads.

Usage: halftone-tokens <command> [options]

Commands:
  init               set up Halftone's tokens in an existing app (any React app, or Expo with NativeWind)
                     [--theme <code|preset|file.halftone.json>] [--css <stylesheet>] [--platform web|expo] [--force]
  doctor             check the app's setup for kit components (tokens, stylesheet, aliases, stock files that
                     replaced kit ones, dark mode, links) and say how to fix each; exit 1 on a problem
                     [--platform web|expo] [--offline] [--json]
  build              resolve, check contrast, write every target in tokens.config.json (the default)
  check              the same, but write nothing; exit 1 if a generated file is stale (for CI)
  theme              apply, show or list themes: halftone-tokens theme apply <code|preset|file.halftone.json>
  figma              mirror the tokens into Figma Variables
  --version          print the version
  --help             print this

Options:
  --root <dir>       app root (default: the current folder); every path in the config is relative to it
  --config <file>    default: tokens/tokens.config.json
  --strict           fail on contrast below WCAG AA instead of warning (or HALFTONE_STRICT=1)

tokens.config.json: { "source": "tokens/tokens.json", "targets": { "<target>": { ...options } } }
Docs: https://halftonedesignsystem.com/install.md`;

/** Flags that take a value; every other --flag is a boolean. */
const VALUE_FLAGS = new Set(['root', 'config', 'out', 'fonts-url', 'theme', 'css', 'platform']);

function parseArgs(argv) {
  const [command = 'build', ...rest] = argv;
  const flags = {};
  const positional = [];
  for (let i = 0; i < rest.length; i++) {
    if (!rest[i].startsWith('--')) positional.push(rest[i]);
    else if (VALUE_FLAGS.has(rest[i].slice(2))) flags[rest[i].slice(2)] = rest[++i];
    else flags[rest[i].slice(2)] = true;
  }
  return { command, flags, positional };
}

export async function run(argv = process.argv.slice(2)) {
  const { command, flags, positional } = parseArgs(argv);
  if (command === '--version' || command === '-v') {
    console.log(JSON.parse(readFileSync(join(here, 'package.json'), 'utf8')).version);
    return;
  }
  if (command === '--help' || command === '-h' || command === 'help' || flags.help) {
    console.log(USAGE);
    return;
  }
  const root = resolve(flags.root ?? process.cwd());

  if (command === 'figma') {
    process.env.KIT_TOKENS_ROOT = root;
    await import(pathToFileURL(join(here, 'push-figma.mjs')).href);
    return;
  }
  if (command === 'doctor') {
    const { doctorCommand } = await import('./lib/doctor.mjs');
    return doctorCommand({ root, flags });
  }
  if (command === 'init') {
    const { initCommand } = await import('./lib/init.mjs');
    return initCommand({ root, flags, positional, run });
  }
  if (command !== 'build' && command !== 'check' && command !== 'theme') {
    console.error(`halftone-tokens: unknown command "${command}". Use init, doctor, build, check, theme or figma (halftone-tokens --help for more).`);
    process.exit(2);
  }

  const configPath = join(root, flags.config ?? 'tokens/tokens.config.json');
  if (!existsSync(configPath)) {
    console.error(`halftone-tokens: no config at ${configPath}`);
    process.exit(2);
  }
  const config = JSON.parse(readFileSync(configPath, 'utf8'));
  const source = config.source ?? 'tokens/tokens.json';

  if (command === 'theme') {
    const { themeCommand } = await import('./lib/theme-cli.mjs');
    const rebuild = ['build', '--root', root, ...(flags.config ? ['--config', flags.config] : []), ...(flags.strict ? ['--strict'] : [])];
    return themeCommand({ positional, flags, root, sourcePath: join(root, source), config, build: () => run(rebuild) });
  }
  const ctx = await loadContext(root, source);

  // Contrast is checked on every build. By default a problem is a warning (the palette is the designer's
  // call); --strict or HALFTONE_STRICT=1 makes it an error, which is how Halftone's own CI builds the kits.
  const strict = flags.strict === true || /^(1|true)$/i.test(process.env.HALFTONE_STRICT ?? '');
  let warnings = 0;
  const gate = (title, body) => {
    console.error(`\n${title} ${strict ? 'FAILED' : 'WARNING'} — ${body}`);
    if (strict) process.exit(1);
    warnings++;
  };

  // `strict: true` here is the full set of pairings (muted and accent surfaces too), not the CLI flag.
  const base = checkContrast(ctx.colors, { strict: true });
  // The components' own pairings (a Button variant's label on its fill), once per colour pair.
  const seen = new Set(base.map((line) => /^\s+(\w+) .*\((#\w+) on (#\w+)\)$/.exec(line)?.slice(1).join(' ')));
  const failures = [...base, ...componentFailures(ctx.components, ctx.colors, seen)];
  ctx.contrastFailures = failures;
  if (failures.length) {
    gate(
      'tokens:build',
      `${failures.length} colour pairing(s) below WCAG AA (${AA}:1):\n\n${failures.join('\n')}\n\n` +
        'Darken the fill, or flip its -foreground between neutral.0 and neutral.950.\n' +
        'A brightened accent (usually the dark theme) needs dark text, not white.\n' +
        'Or let the theme generator fix it: `halftone-tokens theme apply <code|preset>` keeps the hue and adjusts the lightness.\n'
    );
  }

  // Then the source: a tone's text on its own tint, beyond what this palette allows.
  if (config.scan?.length) {
    const limits = textOnTintLimits(ctx.colors);
    const problems = scanTintText(root, config.scan, limits, textOnSubtle(ctx.colors));
    if (problems.length) {
      gate(
        'halftone-tokens',
        `${problems.length} class string(s) put a tone's text on its own tint below WCAG AA (${AA}:1):\n\n${problems.join('\n')}\n\n` +
          `This palette allows: ${describeTintLimits(limits)} on an alpha tint; tone text on its own -subtle tint: ${describeSubtle(textOnSubtle(ctx.colors))}.\n` +
          'Use text-foreground on the tint (let the tint, an icon or a dot carry the colour).\n' +
          'An element that holds only an icon may keep its tone: add a `halftone-tokens-ignore tint-text` comment.\n'
      );
    }
  }
  const contrast = warnings ? `${warnings} contrast warning(s), run with --strict to fail` : 'contrast AA ✓';

  const files = await renderTargets(ctx, config);

  if (command === 'check') {
    const stale = files.filter((f) => {
      const path = join(root, f.path);
      return !existsSync(path) || readFileSync(path, 'utf8') !== f.contents;
    });
    if (stale.length) {
      console.error(`halftone-tokens check: ${stale.length} generated file(s) out of date — run \`npm run tokens:build\`:\n${stale.map((f) => `  ${f.path}`).join('\n')}`);
      process.exit(1);
    }
    console.log(`halftone-tokens check: ${files.length} files up to date · ${contrast}`);
    return;
  }

  for (const f of files) {
    const path = join(root, f.path);
    mkdirSync(dirname(path), { recursive: true });
    writeFileSync(path, f.contents);
  }
  console.log(`tokens:build → ${files.map((f) => f.path).join(', ')} · ${contrast}`);
}

// npm runs bins through a symlink in node_modules/.bin, so compare real paths.
const isMain = () => {
  try {
    return realpathSync(process.argv[1]) === realpathSync(fileURLToPath(import.meta.url));
  } catch {
    return false;
  }
};
if (process.argv[1] && isMain()) await run();
