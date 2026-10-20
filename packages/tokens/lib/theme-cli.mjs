/**
 * `halftone-tokens theme …` — commit a theme from the docs picker into tokens.json.
 *
 *   theme apply <theme> [--dry-run] [--force]
 *        write the theme into tokens.json (only the paths a theme owns) and rebuild; a system document is
 *        recorded in tokens.json's $extensions (without its brand images)
 *   theme show [--check]   the applied theme, its code and any hand edits since (drift)
 *                          --check: exit 1 if the recorded theme no longer reproduces (CI)
 *   theme presets          list the presets and their codes
 *   theme encode <theme>   print the Halftone code for a theme
 *   theme decode <code> [--json]   what a code holds (a Halftone code, or a shadcn preset and what it maps to)
 *   theme resolve [--json] the code for tokens.json as it is; exit 1 if none is recorded or it was edited
 *   theme shadcn <theme> [--out file] [--fonts-url url]
 *                          the theme as a shadcn registry:theme item (stdout, or a file), for `npx shadcn add`
 *
 * <theme> is a Halftone code (ht1-…, ht2-…, ht3-…), a preset name, a recipe .json, a system document
 * (name.halftone.json, from the Studio), or a shadcn/ui preset code (ui.shadcn.com/create, e.g. b5owWMfJ8l),
 * which becomes the nearest Halftone recipe: what it approximates or drops is listed on stderr.
 */
import { spawnSync } from 'node:child_process';
import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

import { cvdWarnings, describeCvdWarnings, MIN_DELTA_E } from './cvd.mjs';
import { FONTS, fontByFamily } from './theme/fonts.mjs';
import { isSystem, normalizeSystem, SystemError, systemOverrides } from './system/schema.mjs';
import { systemCode } from './system/generate.mjs';

import {
  applyRecipe,
  applySystem,
  decodeRecipe,
  encodeRecipe,
  fontById,
  isThemeCode,
  normalizeRecipe,
  presetById,
  PRESETS,
  decodeShadcnPreset,
  isShadcnPresetCode,
  recipeFromShadcn,
  SHADCN_FONTS_URL,
  shadcnTheme,
  THEME_EXTENSION,
  themeStatus,
} from './theme/index.mjs';

const fail = (message, code = 1) => {
  console.error(`halftone-tokens theme: ${message}`);
  process.exit(code);
};

/** A shadcn code's mapping notes, on stderr so stdout stays a code or JSON. */
function printNotes(code, notes) {
  if (!notes.length) return;
  console.error(`From shadcn preset ${code}, approximated or not carried:\n${notes.map((n) => `  - ${n}`).join('\n')}`);
}

/** { recipe, system? }: a system document when <theme> is one (name.halftone.json), else a recipe. */
function readTheme(arg, root) {
  const file = arg ? join(root, arg) : '';
  if (arg?.endsWith('.json') && existsSync(file)) {
    let json;
    try {
      json = JSON.parse(readFileSync(file, 'utf8'));
    } catch (error) {
      fail(`${arg} is not valid JSON: ${error.message}`);
    }
    if (isSystem(json)) {
      try {
        const system = normalizeSystem(json);
        return { recipe: system.recipe, system };
      } catch (error) {
        if (error instanceof SystemError) fail(`${arg}: ${error.message}`);
        throw error;
      }
    }
  }
  return { recipe: readRecipe(arg, root) };
}

/** Why a system has no code: its overrides, briefly. */
function noCode(system) {
  const overrides = systemOverrides(system);
  const shown = overrides.slice(0, 6).join(', ') + (overrides.length > 6 ? `, and ${overrides.length - 6} more` : '');
  return `"${system.name}" has ${overrides.length} override(s) a theme code can't carry (${shown}). Share its .halftone.json instead.`;
}

/** A system's overrides, grouped by section, for `show` and `apply`. */
function describeOverrides(system) {
  const bySection = {};
  for (const path of systemOverrides(system)) {
    const [section, ...rest] = path.split('.');
    (bySection[section] ??= []).push(rest.join('.'));
  }
  return Object.entries(bySection).map(([section, list]) => `${section}: ${list.join(', ')}`);
}

function printWarnings(warnings) {
  if (!warnings?.length) return;
  console.log(`\nBelow WCAG AA because of colours chosen by hand (warnings; the fixer leaves hand-picked colours alone):`);
  for (const w of warnings) console.log(`  ${w.mode.padEnd(5)} ${w.label.padEnd(40)} ${w.ratio}:1 (needs ${w.threshold})${w.locked.length ? `  · chosen: ${w.locked.join(', ')}` : ''}`);
}

function readRecipe(arg, root) {
  if (!arg) fail('say which theme: a code (ht1-…, ht2-… or ht3-…), a preset name, a recipe .json, a system .halftone.json or a shadcn preset code', 2);
  if (isThemeCode(arg)) {
    try {
      return decodeRecipe(arg);
    } catch (error) {
      fail(error.message);
    }
  }
  const preset = presetById(arg.toLowerCase());
  if (preset) return normalizeRecipe({ ...preset.recipe, preset: preset.id });
  const file = join(root, arg);
  if (arg.endsWith('.json') && existsSync(file)) return normalizeRecipe(JSON.parse(readFileSync(file, 'utf8')));
  // Last, so a preset name that happens to look like one (bold, brutalist) stays Halftone's preset.
  const shadcn = isShadcnPresetCode(arg) ? decodeShadcnPreset(arg) : null;
  if (shadcn) {
    const { recipe, notes } = recipeFromShadcn(shadcn);
    printNotes(arg, notes);
    return recipe;
  }
  fail(`"${arg}" is not a theme code, a preset (${PRESETS.map((p) => p.id).join(', ')}), a recipe file or a shadcn preset code`, 2);
}

const describe = (input) => {
  // A recipe recorded by an older halftone-tokens has no typeset or styles: it gets the defaults.
  const recipe = normalizeRecipe(input);
  const font = (id) => {
    const f = fontById(id);
    return f?.system ? (f.category === 'mono' ? 'system mono' : 'system') : (f?.family ?? id);
  };
  return [
    `brand ${recipe.brand} · neutral ${recipe.neutral} · radius ${recipe.radius} · controls ${recipe.controls}`,
    `type ${font(recipe.font.heading)} / ${font(recipe.font.body)} · stroke ${recipe.stroke} · depth ${recipe.depth} · density ${recipe.density} · border ${recipe.border}`,
    `typeset ${recipe.size}px · leading ${recipe.leading} · flow ${recipe.flow} · measure ${recipe.measure}ch · mono ${font(recipe.font.mono)}`,
    `styles: ${recipe.button} buttons · ${recipe.field} fields`,
  ].join('\n  ');
};

/** positional: [subcommand, arg]; flags: { force, 'dry-run', check, … } */
/**
 * An Expo app needs the theme's @expo-google-fonts packages installed (the fonts target imports them).
 * Installs the missing ones with `npx expo install`; lists any the theme no longer uses.
 */
function installFonts(root, config, theme, flags) {
  if (config.targets?.fonts?.platform !== 'expo') return;
  const pkg = JSON.parse(readFileSync(join(root, 'package.json'), 'utf8'));
  const have = new Set(Object.keys({ ...pkg.dependencies, ...pkg.devDependencies }).filter((d) => d.startsWith('@expo-google-fonts/')));
  // The theme's families: curated ones, or any Google Fonts family a system names.
  const ids = Object.values(theme.fonts).filter(Boolean).map(fontByFamily).filter((f) => !f.system).map((f) => f.id);
  const need = [...new Set(ids)].map((id) => `@expo-google-fonts/${id}`);
  const missing = need.filter((p) => !have.has(p));
  const unused = [...have].filter((p) => !need.includes(p) && FONTS.some((f) => `@expo-google-fonts/${f.id}` === p));
  if (missing.length) {
    if (flags['no-install']) {
      console.log(`\nInstall the theme's fonts: npx expo install ${missing.join(' ')}`);
    } else {
      console.log(`\nInstalling ${missing.join(', ')}…`);
      const r = spawnSync('npx', ['expo', 'install', ...missing], { cwd: root, stdio: 'inherit' });
      if (r.status !== 0) fail(`could not install ${missing.join(' ')}; run \`npx expo install ${missing.join(' ')}\` yourself, then \`npm run tokens:build\`.`);
    }
  }
  if (unused.length) console.log(`\nNo longer used by the theme (remove when you like): npm uninstall ${unused.join(' ')}`);
}

export async function themeCommand({ positional, flags, root, sourcePath, config, build }) {
  const [sub = 'show', arg] = positional;
  const tokens = () => JSON.parse(readFileSync(sourcePath, 'utf8'));

  if (sub === 'presets') {
    for (const p of PRESETS) console.log(`${p.id.padEnd(12)} ${encodeRecipe(p.recipe)}  ${p.description}`);
    return;
  }

  if (sub === 'encode') {
    const { recipe, system } = readTheme(arg, root);
    if (system && !systemCode(system)) fail(noCode(system));
    console.log(encodeRecipe(recipe));
    return;
  }

  if (sub === 'decode') {
    if (!arg) fail('say which code to decode: ht1-…, ht2-…, ht3-… or a shadcn preset code', 2);
    // A preset name first, as for apply: `bold` is Halftone's preset, not a shadcn code.
    const preset = presetById(arg.toLowerCase());
    if (preset) {
      const recipe = normalizeRecipe({ ...preset.recipe, preset: preset.id });
      if (flags.json) console.log(JSON.stringify({ kind: 'halftone', preset: preset.id, code: encodeRecipe(recipe), recipe }, null, 2));
      else console.log(`Halftone preset ${preset.name}: ${encodeRecipe(recipe)}\n  ${describe(recipe)}`);
      return;
    }
    if (isThemeCode(arg)) {
      let recipe;
      try {
        recipe = decodeRecipe(arg);
      } catch (error) {
        fail(error.message);
      }
      if (flags.json) console.log(JSON.stringify({ kind: 'halftone', code: encodeRecipe(recipe), recipe }, null, 2));
      else console.log(`Halftone theme ${encodeRecipe(recipe)}\n  ${describe(recipe)}`);
      return;
    }
    const shadcn = isShadcnPresetCode(arg) ? decodeShadcnPreset(arg) : null;
    if (!shadcn) fail(`"${arg}" is not a Halftone theme code or a shadcn preset code`, 2);
    const { recipe, notes } = recipeFromShadcn(shadcn);
    const code = encodeRecipe(recipe);
    if (flags.json) {
      console.log(JSON.stringify({ kind: 'shadcn', shadcn, code, recipe, notes }, null, 2));
      return;
    }
    const fields = Object.entries(shadcn).map(([k, v]) => `${k} ${v}`).join(' · ');
    console.log(`shadcn preset ${arg}\n  ${fields}\n\nAs a Halftone theme: ${code}\n  ${describe(recipe)}`);
    if (notes.length) console.log(`\nApproximated or not carried:\n${notes.map((n) => `  - ${n}`).join('\n')}`);
    return;
  }

  if (sub === 'resolve') {
    const status = themeStatus(tokens());
    if (!status.applied) fail('no theme recorded in tokens.json, so there is no code for it. Apply one with `halftone-tokens theme apply <theme>`.');
    if (!status.code) fail(`the applied system ${noCode(status.system)} Its document is recorded in tokens.json ($extensions).`);
    if (status.drift.length) fail(`tokens.json was edited by hand since ${status.code} was applied (${status.drift.length} token(s)); no code reproduces it. \`theme show\` lists them.`);
    if (flags.json) console.log(JSON.stringify({ code: status.code, recipe: status.recipe }, null, 2));
    else console.log(status.code);
    return;
  }

  if (sub === 'shadcn') {
    const { recipe, system } = readTheme(arg, root);
    const { theme } = system ? applySystem(tokens(), system) : applyRecipe(tokens(), recipe);
    const item = shadcnTheme(theme, {
      ...(recipe.preset ? { name: `halftone-${recipe.preset}`, title: `Halftone ${presetById(recipe.preset)?.name} theme` } : {}),
      fontsUrl: typeof flags['fonts-url'] === 'string' ? flags['fonts-url'] : SHADCN_FONTS_URL,
    });
    const json = JSON.stringify(item, null, 2) + '\n';
    if (typeof flags.out === 'string') {
      writeFileSync(join(root, flags.out), json);
      console.error(`Wrote ${flags.out}: install it in a shadcn project with \`npx shadcn@latest add ./${flags.out.split('/').pop()}\`.`);
    } else process.stdout.write(json);
    return;
  }

  if (sub === 'show') {
    const status = themeStatus(tokens());
    if (!status.applied) {
      console.log('No theme recorded in tokens.json. Apply one with `halftone-tokens theme apply <code|preset>`.');
      if (flags.check) process.exit(0);
      return;
    }
    if (status.system) {
      const { system } = status;
      const overrides = describeOverrides(system);
      console.log(`System "${system.name}"${status.code ? ` ${status.code}` : ' (no theme code: it has overrides)'}\n  ${describe(status.recipe)}`);
      if (overrides.length) console.log(`\nOverrides:\n${overrides.map((o) => `  ${o}`).join('\n')}`);
      printWarnings(tokens().$extensions?.[THEME_EXTENSION]?.warnings);
    } else {
      const name = status.recipe.preset ? ` (${presetById(status.recipe.preset)?.name ?? status.recipe.preset})` : '';
      console.log(`Theme ${status.code}${name}\n  ${describe(status.recipe)}`);
    }
    if (status.drift.length) {
      console.log(`\nEdited by hand since it was applied (${status.drift.length}):\n${status.drift.map((p) => `  ${p}`).join('\n')}`);
      if (flags.check) fail('tokens.json no longer matches its recorded theme. Re-apply it, or apply with --force to record the edits away.');
    }
    return;
  }

  if (sub === 'apply') {
    const { recipe, system } = readTheme(arg, root);
    const current = tokens();
    const status = themeStatus(current);
    const blocked = !status.applied
      ? 'tokens.json has no theme recorded, so applying one would overwrite its brand and neutral ramps, semantic colours and radius ' +
        'without knowing whether they were customised. Re-run with --force to go ahead.'
      : status.drift.length
        ? `these theme tokens were edited by hand since ${status.code} was applied:\n${status.drift.map((p) => `  ${p}`).join('\n')}\nRe-run with --force to overwrite them.`
        : null;
    if (blocked && !flags.force && !flags['dry-run']) fail(blocked);
    const { tokens: next, theme } = system ? applySystem(current, system) : applyRecipe(current, recipe);
    if (system) {
      const code = systemCode(system);
      const overrides = describeOverrides(system);
      console.log(`System "${system.name}"${code ? ` ${code}` : ''}\n  ${describe(theme.recipe)}`);
      if (overrides.length) console.log(`\nOverrides (no theme code carries these; tokens.json records the document):\n${overrides.map((o) => `  ${o}`).join('\n')}`);
    } else console.log(`Theme ${theme.code}${recipe.preset ? ` (${presetById(recipe.preset)?.name})` : ''}\n  ${describe(theme.recipe)}`);
    if (theme.adjustments.length) {
      console.log(`\nAdjusted for contrast (WCAG AA), hue kept:`);
      for (const a of theme.adjustments) console.log(`  ${a.mode.padEnd(5)} ${a.token.padEnd(28)} ${a.from} → ${a.to}`);
    }
    printWarnings(theme.warnings);
    const cvd = cvdWarnings(theme.resolved);
    if (cvd.length) {
      console.log(`\nColour vision: ${cvd.length} pair(s) of tones closer than ΔE ${MIN_DELTA_E} (a warning; give them an icon or a label as well):`);
      console.log(describeCvdWarnings(cvd).join('\n'));
    }
    if (flags['dry-run']) {
      console.log(`\n--dry-run: nothing written.${blocked && !flags.force ? `\nNote: ${blocked}` : ''}`);
      return;
    }
    writeFileSync(sourcePath, JSON.stringify(next, null, 2) + '\n');
    console.log(`\nWrote ${sourcePath.slice(root.length + 1)}.`);
    installFonts(root, config, theme, flags);
    await build();
    return;
  }

  fail(`unknown command "theme ${sub}". Use apply, show, presets, encode, decode, resolve or shadcn.`, 2);
}
