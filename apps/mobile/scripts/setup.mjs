#!/usr/bin/env node
/**
 * scripts/setup.mjs — first-run project setup: name the app, write .env.local, link EAS, remove the
 * samples and apply a theme.
 *
 *   npm run setup                                    # asks, prints the plan, writes on yes
 *   npm run setup -- --dry-run                       # asks, prints the plan, writes nothing
 *   npm run setup -- --yes --name "Acme Field" --eject all --theme calm   # no questions (CI)
 *
 * Each question has a flag, so CI (or an agent) can answer up front; `--yes` takes the default for the
 * rest and skips the confirmation. Every change is planned and checked before anything is written: the
 * names are validated, the theme is dry-run, the samples are checked against `eject-samples --status`.
 * Then, in order: the samples go (npm run eject-samples), the theme is applied (halftone-tokens theme
 * apply), app.json, package.json and .env.local are written, and `eas init` runs last. A value already
 * in .env.local is only replaced when you say so (or pass --overwrite).
 *
 * `eas init` writes the owner and project id into app.json (app.config.ts spreads it), which is committed,
 * so a project's account would end up in the repo. This runs it with --json, puts both into .env.local
 * (app.config.ts reads them from there) and takes them back out of app.json. Without the eas CLI, or
 * logged out, that step is skipped with a note; it never blocks the rest.
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

  --name <text>        the app's display name (app.json name)
  --slug <slug>        app.json slug, and package.json name outside the monorepo (default: from the name)
  --scheme <scheme>    URL scheme for deep links (default: the slug, letters and digits only)
  --app-id <id>        APP_ID in .env.local: bundle identifier and Android package (default: com.<scheme>.app)
  --owner <account>    EAS_OWNER: the Expo account or org, and the one eas init creates the project under
  --project-id <id>    EAS_PROJECT_ID, when the EAS project already exists
  --web-base-url <p>   KIT_WEB_BASE_URL: a sub-path for a web export hosted below the root, e.g. /m
  --eas-init           run eas init (create or link the EAS project); --no-eas-init to skip
  --eject <samples>    all, none, or names: shop,habits,northwind
  --theme <theme>      a preset, a theme code or a .halftone.json; none to keep the current one
  --overwrite          replace values already in .env.local, and a theme's hand edits, without asking
  --yes, -y            take the default for every question a flag does not answer, and do not ask to confirm
  --dry-run            print the plan and stop`;

/** Stop with a message and nothing touched. */
function fail(message) {
  console.error(`setup: ${message}`);
  process.exit(1);
}

// --- flags --------------------------------------------------------------------------------------

const VALUE_FLAGS = ['name', 'slug', 'scheme', 'app-id', 'owner', 'project-id', 'web-base-url', 'eject', 'theme'];
const BOOL_FLAGS = ['eas-init', 'no-eas-init', 'overwrite', 'yes', 'dry-run', 'help'];
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
if (flags['eas-init'] && flags['no-eas-init']) fail('--eas-init and --no-eas-init together: pick one.');
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

/** A flag that has no question of its own: checked, or ''. */
function given(flag, check) {
  const v = flags[flag] ?? '';
  const problem = v && check(v);
  if (problem) fail(`--${flag} ${v}: ${problem}`);
  return v;
}

/** Yes or no; --yes takes the default. */
async function confirm(question, fallback) {
  if (yes) return fallback;
  const answer = (await prompt(`${question} ${fallback ? '(Y/n)' : '(y/N)'} `)).toLowerCase();
  return answer ? answer.startsWith('y') : fallback;
}

const checks = {
  name: (v) => (v.trim() ? null : 'give the app a name.'),
  slug: (v) => (/^[a-z0-9][a-z0-9_-]*$/.test(v) ? null : 'lowercase letters, digits, - and _ only.'),
  scheme: (v) => (/^[a-z][a-z0-9+.-]*$/.test(v) ? null : 'a lowercase letter, then letters, digits, + . or -.'),
  appId: (v) =>
    /^[a-zA-Z][a-zA-Z0-9_]*(\.[a-zA-Z][a-zA-Z0-9_]*)+$/.test(v)
      ? null
      : 'two or more dot-separated parts, each a letter then letters, digits or _ (it is the Android package too), e.g. com.acme.field.',
  owner: (v) => (!v || /^[A-Za-z0-9_-]+$/.test(v) ? null : 'an Expo account or org name: letters, digits, - and _.'),
  projectId: (v) => (!v || /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(v) ? null : 'an EAS project id is a UUID.'),
  webBaseUrl: (v) => (!v || /^\/\S*$/.test(v) ? null : 'a path that starts with /, e.g. /m.'),
};

const slugify = (s) =>
  s
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '') || 'app';
/** Letters and digits only, starting with a letter: fits a URL scheme and a bundle id segment. */
const compact = (s) => {
  const c = s.toLowerCase().replace(/[^a-z0-9]/g, '');
  return /^[a-z]/.test(c) ? c : `app${c}`;
};

// --- .env files ---------------------------------------------------------------------------------

/** KEY=value lines (and commented `# KEY=` placeholders) of an env file. */
function readEnv(src) {
  const out = {};
  for (const line of src.split('\n')) {
    const m = line.match(/^(#\s*)?([A-Z][A-Z0-9_]*)=(.*)$/);
    if (m && !(m[2] in out && m[1])) out[m[2]] = { value: m[3].trim(), commented: Boolean(m[1]) };
  }
  return out;
}

/** Set KEY=value in env source: in place, uncommenting a placeholder, or appended. */
function setEnv(src, key, value) {
  const live = new RegExp(`^${key}=.*$`, 'm');
  const placeholder = new RegExp(`^#\\s*${key}=.*$`, 'm');
  if (live.test(src)) return src.replace(live, `${key}=${value}`);
  if (placeholder.test(src)) return src.replace(placeholder, `${key}=${value}`);
  return `${src.replace(/\n*$/, '\n')}${key}=${value}\n`;
}

// --- current state ------------------------------------------------------------------------------

const appJson = JSON.parse(readFileSync(rel('app.json'), 'utf8'));
const pkg = JSON.parse(readFileSync(rel('package.json'), 'utf8'));
const hasEnvLocal = existsSync(rel('.env.local'));
const envSource = hasEnvLocal ? readFileSync(rel('.env.local'), 'utf8') : existsSync(rel('.env.example')) ? readFileSync(rel('.env.example'), 'utf8') : '';
const env = readEnv(envSource);
/** A value someone set in .env.local: replacing it needs a yes. Values from .env.example are only placeholders. */
const envValue = (key) => (env[key] && !env[key].commented ? env[key].value : '');
const current = { name: appJson.expo.name, slug: appJson.expo.slug, scheme: appJson.expo.scheme };

/** Run a script of this app (node or npm), capturing its output. */
const run = (cmd, args, opts = {}) => spawnSync(cmd, args, { cwd: root, encoding: 'utf8', shell: win && cmd !== process.execPath, ...opts });

// Inside the Halftone monorepo a theme is applied at the root, so both kits stay one brand, and package.json
// keeps its workspace name (npm stops on two workspaces with one name).
const inMonorepo = existsSync(rel('../../scripts/theme-apply.mjs')) && existsSync(rel('../../kit.json'));

console.log(
  'Halftone setup: names the app, writes .env.local, and can link EAS, remove the samples and apply a theme.\n' +
    `${flags['dry-run'] ? '--dry-run: nothing is written.' : 'Nothing is written until you confirm.'}${yes ? '' : ' Enter takes the value in parentheses.'}\n`
);

// --- plan ---------------------------------------------------------------------------------------

const name = (await ask('App name', 'name', current.name, checks.name)).trim();
const slug = await ask('Slug (URLs, EAS project)', 'slug', name === current.name ? current.slug : slugify(name), checks.slug);
const scheme = await ask('URL scheme (deep links)', 'scheme', slug === current.slug ? current.scheme : compact(slug), checks.scheme);
const appIdDefault = slug === current.slug ? envValue('APP_ID') || env.APP_ID?.value || `com.${compact(slug)}.app` : `com.${compact(slug)}.app`;
const appId = await ask('Bundle id, APP_ID (iOS and Android)', 'app-id', appIdDefault, checks.appId);
const webBaseUrl = given('web-base-url', checks.webBaseUrl);
const projectIdFlag = given('project-id', checks.projectId);
given('owner', checks.owner);
const notes = [];

// Samples: what --status says is still here.
const SAMPLES = ['shop', 'habits', 'northwind'];
const status = existsSync(rel('scripts/eject-samples.mjs')) ? run(process.execPath, ['scripts/eject-samples.mjs', '--status']) : null;
const present = {};
for (const line of status?.stdout?.split('\n') ?? []) {
  const m = line.match(/^ {2}(\S+)\s+(present|partial)\b(?:.*linked from (.*))?/);
  if (m) present[m[1]] = m[3] ? m[3].split(', ') : [];
}
let eject = [];
if (Object.keys(present).length) {
  const names = Object.keys(present);
  const checkEject = (v) => {
    if (['all', 'none', ''].includes(v)) return null;
    const asked = v.split(/[\s,]+/).filter(Boolean);
    const unknown = asked.filter((n) => !SAMPLES.includes(n));
    if (unknown.length) return `unknown ${unknown.join(', ')}: all, none, or names from ${names.join(', ')}.`;
    for (const n of asked.filter((a) => present[a])) {
      const by = present[n].filter((k) => !asked.includes(k));
      if (by.length) return `${by.join(', ')} links to ${n}: remove them together (${[...asked, ...by].join(',')}).`;
    }
    return null;
  };
  const answer = await ask(`Remove sample apps? all, none, or names (${names.join(', ')})`, 'eject', 'none', checkEject);
  const asked = answer === 'all' ? names : answer === 'none' ? [] : answer.split(/[\s,]+/).filter(Boolean);
  eject = asked.filter((n) => present[n]);
  if (asked.length > eject.length) notes.push(`Already gone: ${asked.filter((n) => !present[n]).join(', ')}.`);
} else if (flags.eject && flags.eject !== 'none') {
  const unknown = flags.eject === 'all' ? [] : flags.eject.split(/[\s,]+/).filter((n) => n && !SAMPLES.includes(n));
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

// EAS: offered when the eas CLI is here, logged in, and the app is not linked yet.
const linkedId = projectIdFlag || envValue('EAS_PROJECT_ID');
let eas = null;
if (flags['no-eas-init']) {
  // asked not to
} else if (linkedId) {
  if (flags['eas-init']) notes.push(`eas init skipped: already linked to EAS project ${linkedId}.`);
} else if (flags['eas-init'] || !yes) {
  const who = run('eas', ['whoami']);
  if (who.error?.code === 'ENOENT') notes.push('eas init skipped: the eas CLI is not installed (npm install -g eas-cli).');
  else if (who.status !== 0) notes.push('eas init skipped: eas is not logged in (eas login), or could not reach Expo.');
  else {
    const user = who.stdout.trim().split('\n')[0].trim();
    const accounts = [...who.stdout.matchAll(/^•\s*(\S+)/gm)].map((m) => m[1]);
    if (await confirm('Create or link the EAS project now (eas init)?', Boolean(flags['eas-init']))) {
      const owner = await ask(
        `EAS account${accounts.length > 1 ? ` (yours: ${accounts.join(', ')})` : ''}`,
        'owner',
        envValue('EAS_OWNER') || user,
        (v) => checks.owner(v) ?? (v ? null : 'an account is needed.')
      );
      eas = { owner };
    }
  }
}

// .env.local: the values to set, and which existing ones may be replaced.
const wanted = {
  APP_ID: appId,
  ...(flags.owner && !eas ? { EAS_OWNER: flags.owner } : {}),
  ...(projectIdFlag ? { EAS_PROJECT_ID: projectIdFlag } : {}),
  ...(webBaseUrl ? { KIT_WEB_BASE_URL: webBaseUrl } : {}),
};
let nextEnv = envSource;
const envChanges = [];
for (const [key, value] of Object.entries(wanted)) {
  const was = envValue(key);
  if (hasEnvLocal ? was === value : env[key]?.value === value && !env[key].commented) continue;
  if (hasEnvLocal && was && was !== value) {
    const replace = flags.overwrite || (await confirm(`.env.local has ${key}=${was}. Replace it with ${value}?`, false));
    if (!replace) {
      notes.push(`.env.local keeps ${key}=${was} (pass --overwrite to replace it).`);
      continue;
    }
  }
  nextEnv = setEnv(nextEnv, key, value);
  envChanges.push(`${key}=${value}`);
}
const envChanged = !hasEnvLocal || nextEnv !== envSource;

const appChanges = ['name', 'slug', 'scheme']
  .filter((k) => ({ name, slug, scheme })[k] !== current[k])
  .map((k) => `${k} ${current[k]} → ${{ name, slug, scheme }[k]}`);
const pkgChange = !inMonorepo && slug !== current.slug && pkg.name !== slug ? `name ${pkg.name} → ${slug}` : '';
// llms.txt, DESIGN_SYSTEM.md and registry.json carry the app name and the theme.
const registry = Boolean(pkg.scripts?.['registry:build']) && (Boolean(theme) || name !== current.name);

const plan = [
  eject.length && ['samples', `remove ${eject.join(', ')} (npm run eject-samples)`],
  theme && ['theme', `apply ${theme.arg}: ${theme.label}${theme.force ? ' (replacing hand edits)' : ''}`],
  appChanges.length && ['app.json', appChanges.join(' · ')],
  pkgChange && ['package.json', pkgChange],
  envChanged && ['.env.local', `${hasEnvLocal ? 'update' : 'create from .env.example'}${envChanges.length ? `: ${envChanges.join(', ')}` : ''}`],
  registry && ['registry', 'rebuild what it generates (npm run registry:build)'],
  eas && ['eas init', `create or link @${eas.owner}/${slug}, then EAS_OWNER and EAS_PROJECT_ID into .env.local`],
].filter(Boolean);

if (!yes) console.log('');
for (const n of notes) console.log(n);
if (!plan.length) {
  console.log('setup → nothing to change.');
  process.exit(0);
}
console.log(['Plan:', ...plan.map(([what, how]) => `  ${what.padEnd(13)} ${how}`)].join('\n'));
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

/** Re-read, so what the steps above added (a theme's font packages) stays. */
const edit = (file, change) => {
  const json = JSON.parse(readFileSync(rel(file), 'utf8'));
  change(json);
  writeFileSync(rel(file), JSON.stringify(json, null, 2) + '\n');
};
if (appChanges.length) edit('app.json', (j) => Object.assign(j.expo, { name, slug, scheme }));
if (pkgChange) edit('package.json', (j) => (j.name = slug));
if (envChanged) writeFileSync(rel('.env.local'), nextEnv);
const wrote = [appChanges.length && 'app.json', pkgChange && 'package.json', envChanged && '.env.local'].filter(Boolean);
if (wrote.length) console.log(`\n→ wrote ${wrote.join(', ')}`);
if (registry) step('npm run registry:build', 'npm', ['run', '-s', 'registry:build']);

// eas init last: it reads the new slug and APP_ID through app.config.ts, and its failure costs nothing above.
let easDone = false;
if (eas) {
  console.log(`\n→ eas init --account ${eas.owner}`);
  const before = JSON.parse(readFileSync(rel('app.json'), 'utf8')).expo;
  const r = run('eas', ['init', '--json', '--non-interactive', '--force', '--account', eas.owner], { stdio: ['inherit', 'pipe', 'inherit'] });
  // What eas init wrote into app.json goes back to what it was: the account lives in .env.local, not the repo.
  const after = JSON.parse(readFileSync(rel('app.json'), 'utf8'));
  const same = (a, b) => JSON.stringify(a) === JSON.stringify(b);
  if (!same(after.expo.owner, before.owner) || !same(after.expo.extra?.eas, before.extra?.eas)) {
    if (before.owner === undefined) delete after.expo.owner;
    else after.expo.owner = before.owner;
    if (before.extra?.eas === undefined) delete after.expo.extra?.eas;
    else after.expo.extra = { ...after.expo.extra, eas: before.extra.eas };
    writeFileSync(rel('app.json'), JSON.stringify(after, null, 2) + '\n');
    console.log('  took the owner and project id eas init wrote back out of app.json.');
  }
  let out = null;
  try {
    const stdout = r.stdout ?? '';
    out = JSON.parse(stdout.slice(stdout.indexOf('{')));
  } catch {
    // reported below
  }
  if (r.status === 0 && out?.projectId) {
    let src = readFileSync(rel('.env.local'), 'utf8');
    src = setEnv(setEnv(src, 'EAS_OWNER', out.owner ?? eas.owner), 'EAS_PROJECT_ID', out.projectId);
    writeFileSync(rel('.env.local'), src);
    console.log(`  linked @${out.owner ?? eas.owner}/${out.slug ?? slug} (${out.projectId}); EAS_OWNER and EAS_PROJECT_ID are in .env.local.`);
    easDone = true;
  } else {
    console.log(
      `  eas init did not finish (exit ${r.status ?? r.signal}). Everything else is written. Try again when ready:\n` +
        '    npm run setup -- --eas-init'
    );
  }
}

const rebuilt = appChanges.some((c) => c.startsWith('scheme')) || envChanges.some((c) => c.startsWith('APP_ID'));
console.log(
  [
    '\nsetup → done.',
    '',
    'Next:',
    ...(eject.length || theme ? ['  npm run typecheck && npm run lint -- --max-warnings 0'] : []),
    '  npm run dev',
    ...(rebuilt ? ['  A development build already installed keeps the old scheme and bundle id: rebuild it (npx expo run:ios).'] : []),
    ...(easDone || linkedId ? ['  Set the same names as EAS environment variables for cloud builds and updates (eas env:create).'] : []),
    ...(!eas && !linkedId ? ['  Link EAS when you need builds or updates: npm run setup -- --eas-init'] : []),
  ].join('\n')
);
