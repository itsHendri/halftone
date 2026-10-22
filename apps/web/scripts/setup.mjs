#!/usr/bin/env node
/**
 * scripts/setup.mjs — first-run project setup: name the project, remove the samples, apply a theme.
 *
 *   npm run setup                                    # asks, prints the plan, writes on yes
 *   npm run setup -- --dry-run                       # asks, prints the plan, writes nothing
 *   npm run setup -- --yes --name "Acme Portal" --eject all --theme calm   # no questions (CI)
 *
 * Each question has a flag, so CI (or an agent) can answer up front; `--yes` takes the default for the
 * rest and skips the confirmation. Every change is planned and checked before anything is written: the
 * names are validated, the theme is dry-run, the samples are checked against `eject-samples --status`.
 * Then, in order: the samples go (npm run eject-samples), the theme is applied (halftone-tokens theme
 * apply), and package.json and the page title in app/layout.tsx are written.
 */
import { spawnSync } from 'node:child_process';
import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { createInterface } from 'node:readline/promises';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const rel = (p) => join(root, p);
const win = process.platform === 'win32';

const HELP = `npm run setup -- [flags]

  --name <text>        the project's name: the page title in app/layout.tsx
  --package <name>     package.json name (default: from the name; kept inside the monorepo)
  --eject <samples>    all, none, or names: dashboard,landing,assistant,shop,habits (northwind = the first three)
  --theme <theme>      a preset, a theme code or a .halftone.json; none to keep the current one
  --overwrite          replace a theme's hand edits in tokens.json without asking
  --yes, -y            take the default for every question a flag does not answer, and do not ask to confirm
  --dry-run            print the plan and stop`;

/** Stop with a message and nothing touched. */
function fail(message) {
  console.error(`setup: ${message}`);
  process.exit(1);
}

// --- flags --------------------------------------------------------------------------------------

const VALUE_FLAGS = ['name', 'package', 'eject', 'theme'];
const BOOL_FLAGS = ['overwrite', 'yes', 'dry-run', 'help'];
const flags = {};
{
  const argv = process.argv.slice(2);
  for (let i = 0; i < argv.length; i++) {
    let arg = argv[i];
    if (arg === '-y') arg = '--yes';
    if (arg === '-h') arg = '--help';
    const m = arg.match(/^--([a-z-]+)(?:=(.*))?$/);
    if (!m || (!VALUE_FLAGS.includes(m[1]) && !BOOL_FLAGS.includes(m[1]))) fail(`unknown argument ${arg}. See npm run setup -- --help.`);
    if (BOOL_FLAGS.includes(m[1])) flags[m[1]] = true;
    else if (m[2] !== undefined) flags[m[1]] = m[2];
    else if (i + 1 < argv.length) flags[m[1]] = argv[++i];
    else fail(`--${m[1]} needs a value.`);
  }
}
if (flags.help) {
  console.log(HELP);
  process.exit(0);
}
const yes = Boolean(flags.yes);
if (!yes && !process.stdin.isTTY) fail('stdin is not a terminal: pass --yes and answer with flags (npm run setup -- --help).');

// --- questions ----------------------------------------------------------------------------------

let rl;
const prompt = async (q) => {
  rl ??= createInterface({ input: process.stdin, output: process.stdout });
  return (await rl.question(q)).trim();
};

/** A flag's value (checked), the default under --yes, or the person's answer (asked until it checks). */
async function ask(question, flag, fallback, check = () => null) {
  if (flags[flag] !== undefined) {
    const problem = check(flags[flag]);
    if (problem) fail(`--${flag} ${flags[flag]}: ${problem}`);
    return flags[flag];
  }
  if (yes) return fallback;
  for (;;) {
    const answer = (await prompt(`${question}${fallback ? ` (${fallback})` : ''}: `)) || fallback;
    const problem = check(answer);
    if (!problem) return answer;
    console.log(`  ${problem}`);
  }
}

/** Yes or no; --yes takes the default. */
async function confirm(question, fallback) {
  if (yes) return fallback;
  const answer = (await prompt(`${question} ${fallback ? '(Y/n)' : '(y/N)'} `)).toLowerCase();
  return answer ? answer.startsWith('y') : fallback;
}

const checks = {
  name: (v) => (v.trim() ? null : 'give the project a name.'),
  package: (v) =>
    /^(@[a-z0-9-~][a-z0-9-._~]*\/)?[a-z0-9-~][a-z0-9-._~]*$/.test(v) && v.length <= 214
      ? null
      : 'an npm package name: lowercase letters, digits, - . _ and ~, optionally @scope/.',
};

const slugify = (s) =>
  s
    .normalize('NFKD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '') || 'app';

// --- current state ------------------------------------------------------------------------------

const pkg = JSON.parse(readFileSync(rel('package.json'), 'utf8'));
const LAYOUT = 'app/layout.tsx';
const TITLE = /title: \{ default: '((?:[^'\\]|\\.)*)', template: '%s · ((?:[^'\\]|\\.)*)' \}/;
const layout = existsSync(rel(LAYOUT)) ? readFileSync(rel(LAYOUT), 'utf8') : '';
const title = layout.match(TITLE);
const unquote = (s) => s.replace(/\\(.)/g, '$1');
const quote = (s) => s.replace(/\\/g, '\\\\').replace(/'/g, "\\'");
const current = { name: title ? unquote(title[2]) : 'Halftone', package: pkg.name };

/** Run a script of this app (node or npm), capturing its output. */
const run = (cmd, args, opts = {}) => spawnSync(cmd, args, { cwd: root, encoding: 'utf8', shell: win && cmd !== process.execPath, ...opts });

// Inside the Halftone monorepo a theme is applied at the root, so both kits stay one brand, and package.json
// keeps its workspace name (npm stops on two workspaces with one name).
const inMonorepo = existsSync(rel('../../scripts/theme-apply.mjs')) && existsSync(rel('../../kit.json'));

console.log(
  'Halftone setup: names the project, and can remove the samples and apply a theme.\n' +
    `${flags['dry-run'] ? '--dry-run: nothing is written.' : 'Nothing is written until you confirm.'}${yes ? '' : ' Enter takes the value in parentheses.'}\n`
);

// --- plan ---------------------------------------------------------------------------------------

const notes = [];
const name = (await ask('Project name (the page title)', 'name', current.name, checks.name)).trim();
if (inMonorepo && flags.package) fail('inside the Halftone monorepo, package.json keeps its workspace name.');
const pkgName = inMonorepo ? current.package : await ask('package.json name', 'package', name === current.name ? current.package : slugify(name), checks.package);

// Samples: what --status says is still here. `northwind` names the dashboard, landing page and assistant.
const SAMPLES = ['dashboard', 'landing', 'assistant', 'shop', 'habits'];
const GROUPS = { northwind: ['dashboard', 'landing', 'assistant'] };
const status = existsSync(rel('scripts/eject-samples.mjs')) ? run(process.execPath, ['scripts/eject-samples.mjs', '--status']) : null;
const present = {};
for (const line of status?.stdout?.split('\n') ?? []) {
  const m = line.match(/^ {2}(\S+)\s+(present|partial)\b(?:.*linked from (.*))?/);
  if (m) present[m[1]] = m[3] ? m[3].split(', ') : [];
}
const expand = (v) => v.split(/[\s,]+/).filter(Boolean).flatMap((n) => GROUPS[n] ?? [n]);
let eject = [];
if (Object.keys(present).length) {
  const names = Object.keys(present);
  const checkEject = (v) => {
    if (['all', 'none', ''].includes(v)) return null;
    const asked = expand(v);
    const unknown = asked.filter((n) => !SAMPLES.includes(n));
    if (unknown.length) return `unknown ${unknown.join(', ')}: all, none, or names from ${names.join(', ')} (northwind = dashboard, landing, assistant).`;
    for (const n of asked.filter((a) => present[a])) {
      const by = present[n].filter((k) => !asked.includes(k));
      if (by.length) return `${by.join(', ')} links to ${n}: remove them together (${[...asked, ...by].join(',')}).`;
    }
    return null;
  };
  const answer = await ask(`Remove sample apps? all, none, or names (${names.join(', ')}; northwind = the first three)`, 'eject', 'none', checkEject);
  const asked = answer === 'all' ? names : answer === 'none' ? [] : [...new Set(expand(answer))];
  eject = asked.filter((n) => present[n]);
  if (asked.length > eject.length) notes.push(`Already gone: ${asked.filter((n) => !present[n]).join(', ')}.`);
} else if (flags.eject && flags.eject !== 'none') {
  const unknown = flags.eject === 'all' ? [] : expand(flags.eject).filter((n) => !SAMPLES.includes(n));
  if (unknown.length) fail(`--eject ${flags.eject}: unknown ${unknown.join(', ')}.`);
  notes.push('Already gone: the samples.');
}

// Theme: dry-run it now, so a bad code stops here with nothing written.
let theme = null;
if (inMonorepo) {
  const hint = 'inside the Halftone monorepo, apply a theme at the root so both kits stay one brand: npm run theme:apply -- <code>.';
  if (flags.theme && flags.theme !== 'none') fail(hint);
  if (!yes) notes.push(`Theme skipped: ${hint}`);
} else {
  const presets = (run('npm', ['run', '-s', 'theme', '--', 'presets']).stdout ?? '').match(/^\S+/gm) ?? [];
  let themeNote = '';
  const checkTheme = (v) => {
    if (!v || v === 'none') return null;
    const r = run('npm', ['run', '-s', 'theme', '--', 'apply', v, '--dry-run']);
    if (r.status !== 0) return (r.stderr || r.stdout).trim().split('\n').pop().replace(/^halftone-tokens theme: /, '');
    themeNote = r.stdout.match(/^Note: (.*)$/m)?.[1] ?? '';
    theme = { arg: v, label: r.stdout.split('\n').find((l) => l.trim()) ?? v, force: false };
    return null;
  };
  const answer = await ask(
    `Theme: a preset${presets.length ? ` (${presets.join(', ')})` : ''}, a code or a .halftone.json; none keeps the current one`,
    'theme',
    'none',
    checkTheme
  );
  if (!answer || answer === 'none') theme = null;
  if (theme && themeNote) {
    console.log(`  ${themeNote}`);
    theme.force = Boolean(flags.overwrite) || (await confirm('  Overwrite them with the theme?', false));
    if (!theme.force) {
      if (yes) fail(`--theme ${theme.arg}: ${themeNote} Pass --overwrite to replace them.`);
      notes.push(`Theme ${theme.arg} not applied: tokens.json keeps its hand edits.`);
      theme = null;
    }
  }
}

const titleChange = name !== current.name;
if (titleChange && !title) notes.push(`${LAYOUT}: no title in the shape setup knows; set it to "${name}" by hand.`);
const pkgChange = pkgName !== pkg.name ? `name ${pkg.name} → ${pkgName}` : '';
// llms.txt, DESIGN_SYSTEM.md and registry.json carry the theme.
const registry = Boolean(pkg.scripts?.['registry:build']) && Boolean(theme);

const plan = [
  eject.length && ['samples', `remove ${eject.join(', ')} (npm run eject-samples)`],
  theme && ['theme', `apply ${theme.arg}: ${theme.label}${theme.force ? ' (replacing hand edits)' : ''}`],
  pkgChange && ['package.json', pkgChange],
  titleChange && title && [LAYOUT, `title ${current.name} → ${name}`],
  registry && ['registry', 'rebuild what it generates (npm run registry:build)'],
].filter(Boolean);

if (!yes) console.log('');
for (const n of notes) console.log(n);
if (!plan.length) {
  console.log('setup → nothing to change.');
  process.exit(0);
}
console.log(['Plan:', ...plan.map(([what, how]) => `  ${what.padEnd(15)} ${how}`)].join('\n'));
if (flags['dry-run']) {
  console.log('\n--dry-run: nothing written.');
  process.exit(0);
}
if (!yes && !(await confirm('\nWrite these changes?', true))) {
  console.log('Nothing written.');
  process.exit(0);
}
// The steps below hand the terminal to other commands.
rl?.close();

// --- write --------------------------------------------------------------------------------------

/** Run a step with its output shown; stop the setup if it fails. */
function step(label, cmd, args) {
  console.log(`\n→ ${label}`);
  const r = run(cmd, args, { stdio: 'inherit' });
  if (r.status !== 0) fail(`${label} failed (exit ${r.status ?? r.signal}); the steps after it did not run.`);
}

// The samples first: eject-samples checks every edit before it touches anything, so a failure here leaves all as it was.
if (eject.length) step(`npm run eject-samples -- ${eject.join(' ')}`, process.execPath, ['scripts/eject-samples.mjs', ...eject]);
if (theme) step(`halftone-tokens theme apply ${theme.arg}`, 'npm', ['run', '-s', 'theme', '--', 'apply', theme.arg, ...(theme.force ? ['--force'] : [])]);

// Re-read, so what the steps above changed stays.
if (pkgChange) {
  const json = JSON.parse(readFileSync(rel('package.json'), 'utf8'));
  json.name = pkgName;
  writeFileSync(rel('package.json'), JSON.stringify(json, null, 2) + '\n');
}
if (titleChange && title) {
  const src = readFileSync(rel(LAYOUT), 'utf8');
  writeFileSync(rel(LAYOUT), src.replace(TITLE, `title: { default: '${quote(name)}', template: '%s · ${quote(name)}' }`));
}
const wrote = [pkgChange && 'package.json', titleChange && title && LAYOUT].filter(Boolean);
if (wrote.length) console.log(`\n→ wrote ${wrote.join(', ')}`);
if (registry) step('npm run registry:build', 'npm', ['run', '-s', 'registry:build']);

console.log(
  [
    '\nsetup → done.',
    '',
    'Next:',
    ...(eject.length || theme ? ['  npm run typecheck && npm run lint'] : []),
    '  npm run dev',
    ...(titleChange && title ? [`  The description in ${LAYOUT} still describes the kit: write your own.`] : []),
  ].join('\n')
);
