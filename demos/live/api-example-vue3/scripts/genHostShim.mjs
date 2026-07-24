/**
 * Build-time generator for the production-mode "host-shim" assets.
 *
 * Big picture (see doc/tech-design/icebergfeng/api-example-vue3-prod-sdk-switching.md §3.3):
 *
 *   In prod the demo bundle ships its own copies of `vue`, `vue-router`,
 *   and `@tencentcloud/uikit-base-component-vue3`. The SDK (loaded
 *   dynamically from esm.sh at runtime) leaves these three names as
 *   bare specifiers in its emitted bundle — esm.sh keeps them external
 *   because we ask it to via `?external=`. The browser resolves the
 *   bare specifiers using a static importmap in `index.html`:
 *
 *       "vue":         "/host-shim/vue.js"
 *       "vue-router":  "/host-shim/vue-router.js"
 *       "@tencentcloud/uikit-base-component-vue3":  "/host-shim/uikit-base.js"
 *
 *   The host-shim file's job is to "re-export the bundle's loaded
 *   instance" back to the SDK so demo + SDK share a single instance.
 *   At runtime `main.ts` sets `window.__ATOMICX_HOST__ = { vue, vueRouter,
 *   uikitBase }` before any SDK import resolves, and each shim reads
 *   from there:
 *
 *       const __m = window.__ATOMICX_HOST__.vue;
 *       export const ref = __m.ref;
 *       export const reactive = __m.reactive;
 *       ...
 *       export default __m.default !== undefined ? __m.default : __m;
 *
 *   This module produces those three files at build time. The list of
 *   re-exported names is read from the actual on-disk package entry,
 *   so any name vue / vue-router / uikit-base exposes through its
 *   public surface ends up on the shim — independent of which subset
 *   the SDK happens to use today or tomorrow.
 *
 * Why a hand-rolled regex parser instead of `es-module-lexer`:
 *   - The demo project intentionally does not list `es-module-lexer`
 *     as a direct dependency (keeping `package.json` lean). The package
 *     is only a transitive dep of vite/rollup and not always installable
 *     via a plain `require`.
 *   - The packages we parse here all ship ESM-bundler entries with a
 *     conventional `export { a, b as c, ... }` epilogue plus a few
 *     `export <decl>` statements. A short regex extractor handles them
 *     reliably; we don't need full ES module parsing.
 *   - If/when a target package starts emitting an export form the
 *     regex misses, the test in `verifyShim()` below catches it: we
 *     assert that a hand-picked sentinel name (e.g. `unref` for vue,
 *     `IconMsgRevoke` for uikit-base) appears in the extracted set.
 */
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);

/**
 * Resolve a package's ESM entry file path. We prefer the explicit
 * `exports['.']['import']` over `module` over `main`. Some packages
 * (notably `@tencentcloud/uikit-base-component-vue3`) declare their
 * ESM entry only via `exports`, so the older `module`-field-only path
 * is not enough.
 */
function resolvePackageEsmEntry(pkgName, fromDir) {
  const localRequire = createRequire(resolve(fromDir, 'x.js'));
  const pkgJsonPath = localRequire.resolve(`${pkgName}/package.json`);
  const pkgDir = dirname(pkgJsonPath);
  const pkgJson = JSON.parse(readFileSync(pkgJsonPath, 'utf-8'));

  let entry;
  if (pkgJson.exports && pkgJson.exports['.']) {
    entry = pickFromExportsValue(pkgJson.exports['.']);
  }
  if (!entry) entry = pkgJson.module;
  if (!entry) entry = pkgJson.main;
  if (!entry) entry = 'index.js';

  return resolve(pkgDir, entry);
}

/**
 * Extract the set of named exports from a JS source string by simple
 * regex. We are deliberately permissive: the goal is to catch every
 * name a downstream `import { ... } from '<pkg>'` might use. False
 * positives (collecting a name that isn't actually exported) are
 * effectively impossible because the patterns are anchored to the
 * `export` keyword in source-file context.
 *
 * Patterns handled:
 *   1. `export { a, b as c, default as d }`                     - block re-export
 *   2. `export { a } from './sub'`                              - block re-export from
 *   3. `export const X = ...` / `export let X` / `export var X` - declarations
 *   4. `export function X(...)` / `export async function X(...)` - functions
 *   5. `export class X { ... }`                                 - classes
 *
 * `export *` (without binding) is NOT handled directly; instead we
 * resolve the target source and recurse. This matters for index files
 * that aggregate sub-modules with `export * from './sub'`.
 */
function extractExports(sourceText) {
  const names = new Set();
  let hasDefault = false;

  // Strip line/block comments to avoid matching commented-out exports.
  const src = sourceText
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .replace(/(^|[^:])\/\/.*$/gm, '$1');

  // Pattern 1+2: export { ... }
  const blockRe = /export\s*\{([^}]+)\}/g;
  let m;
  while ((m = blockRe.exec(src))) {
    for (const part of m[1].split(',')) {
      const trimmed = part.trim();
      if (!trimmed) continue;
      // "foo as bar" → keep "bar"; "foo" → keep "foo"
      const asMatch = trimmed.match(/^([A-Za-z_$][A-Za-z0-9_$]*)\s+as\s+([A-Za-z_$][A-Za-z0-9_$]*|default)$/);
      const plainMatch = trimmed.match(/^([A-Za-z_$][A-Za-z0-9_$]*|default)$/);
      const name = asMatch ? asMatch[2] : (plainMatch ? plainMatch[1] : null);
      if (!name) continue;
      if (name === 'default') {
        hasDefault = true;
      } else {
        names.add(name);
      }
    }
  }

  // Pattern 3-5: export const/let/var/function/class X
  const declRe =
    /export\s+(?:async\s+)?(?:const|let|var|function\s*\*?|class)\s+([A-Za-z_$][A-Za-z0-9_$]*)/g;
  while ((m = declRe.exec(src))) {
    names.add(m[1]);
  }

  // `export default …`
  if (/\bexport\s+default\b/.test(src)) {
    hasDefault = true;
  }

  return { names, hasDefault };
}

/**
 * `export * from './sub'` paths in the source. We resolve them
 * relative to the source file's directory so a recursive walker
 * can pick up further named exports.
 *
 * Aggregated `export * as ns from '...'` would create a single
 * namespace name `ns` — that case is already covered by the block-
 * re-export regex above when `as` is present.
 */
function extractStarReExports(sourceText) {
  const out = [];
  // Cleaned src is fine for this too, but to keep things simple we
  // use the raw text — `export *` cannot legally appear in a comment
  // and survive minification anyway.
  const re = /export\s*\*\s*from\s*['"]([^'"]+)['"]/g;
  let m;
  while ((m = re.exec(sourceText))) {
    out.push(m[1]);
  }
  return out;
}

/**
 * Recursively collect the public export surface starting at `entry`.
 * Follows `export *` re-exports so an index file's full transitive
 * surface is captured. Handles both relative re-exports
 * (`export * from './sub'`) and package-name re-exports
 * (`export * from '@vue/runtime-dom'`) — the latter is critical for
 * vue, whose root entry forwards almost everything to
 * `@vue/runtime-dom`.
 */
function collectExports(entryFile) {
  const allNames = new Set();
  let hasDefault = false;
  const visited = new Set();

  function walk(file) {
    if (visited.has(file)) return;
    visited.add(file);
    if (!existsSync(file)) {
      // A package may declare an entry it doesn't ship in some build
      // outputs (e.g. a `.d.ts`-only branch). Silently skip.
      return;
    }
    let src;
    try {
      src = readFileSync(file, 'utf-8');
    } catch {
      return;
    }
    const { names, hasDefault: hd } = extractExports(src);
    for (const n of names) allNames.add(n);
    if (hd) hasDefault = true;

    const starTargets = extractStarReExports(src);
    const baseDir = dirname(file);
    const fileRequire = createRequire(resolve(baseDir, 'x.js'));
    for (const target of starTargets) {
      if (target.startsWith('.')) {
        // Relative re-export — try explicit extensions and
        // `/index.*` fallbacks.
        const candidates = [
          resolve(baseDir, target),
          resolve(baseDir, `${target}.js`),
          resolve(baseDir, `${target}.mjs`),
          resolve(baseDir, target, 'index.js'),
          resolve(baseDir, target, 'index.mjs'),
        ];
        const hit = candidates.find(c => existsSync(c));
        if (hit) walk(hit);
      } else {
        // Bare-specifier re-export (e.g. `export * from
        // '@vue/runtime-dom'`). Resolve through Node's standard
        // package lookup so we transparently follow the re-export
        // chain. We aim for the ESM entry of the target package;
        // require.resolve's default lookup will give us the CJS
        // entry, so we re-route through pickFromExports on the
        // target's own package.json.
        try {
          const targetPkgJsonPath = fileRequire.resolve(`${target}/package.json`);
          const targetPkgDir = dirname(targetPkgJsonPath);
          const targetPkgJson = JSON.parse(readFileSync(targetPkgJsonPath, 'utf-8'));
          let nextEntry;
          if (targetPkgJson.exports && targetPkgJson.exports['.']) {
            nextEntry = pickFromExportsValue(targetPkgJson.exports['.']);
          }
          if (!nextEntry) nextEntry = targetPkgJson.module;
          if (!nextEntry) nextEntry = targetPkgJson.main;
          if (nextEntry) {
            walk(resolve(targetPkgDir, nextEntry));
          }
        } catch {
          // Best-effort: if the target isn't installed under this
          // package's tree, skip silently. The downstream sanity
          // check (`REQUIRED_NAMES`) will catch missing names.
        }
      }
    }
  }

  walk(entryFile);
  return { names: [...allNames].sort(), hasDefault };
}

/**
 * Hoisted version of the exports-picker (extracted from
 * `resolvePackageEsmEntry` so collectExports() can use it too).
 */
function pickFromExportsValue(entry) {
  if (typeof entry === 'string') return entry;
  if (!entry || typeof entry !== 'object') return undefined;
  const order = ['import', 'module', 'default', 'browser', 'node'];
  for (const key of order) {
    if (entry[key] !== undefined) {
      const next = pickFromExportsValue(entry[key]);
      if (next) return next;
    }
  }
  for (const v of Object.values(entry)) {
    const next = pickFromExportsValue(v);
    if (next) return next;
  }
  return undefined;
}

/**
 * Build the JS source for one host-shim file.
 *
 * Notes on what we emit:
 *   - `var __m = ...` is unfurled inside an IIFE-ish prelude so the
 *     shim throws a useful error when `window.__ATOMICX_HOST__` is
 *     missing — by far the most common deployment failure mode (page
 *     opened too early, host-shim served from a stale dist, etc.).
 *   - Each named export is a `export const X = __m.X;` line. We do not
 *     use `export { X }` destructuring because that requires `X` to be
 *     a binding name at parse time, which destructuring through a
 *     property access does not provide.
 *   - `export default` is emitted unconditionally. Even if the source
 *     package doesn't have a default export, `__m.default` is
 *     `undefined`, and downstream `import X from '<pkg>'` resolves to
 *     undefined — same behaviour as if the bundler resolved it
 *     against the real package.
 */
function renderShim(hostKey, displayName, names) {
  const guard = `
if (typeof window === 'undefined' || !window.__ATOMICX_HOST__ || !window.__ATOMICX_HOST__.${hostKey}) {
  throw new Error('[host-shim/${displayName}] window.__ATOMICX_HOST__.${hostKey} is not set — main.ts must finish bootstrapping before any SDK import resolves.');
}`;
  const lines = [
    '/* AUTO-GENERATED by scripts/genHostShim.mjs — DO NOT EDIT BY HAND. */',
    `/* Source package: ${displayName} */`,
    guard,
    `var __m = window.__ATOMICX_HOST__.${hostKey};`,
    '',
    ...names.map(n => `export var ${n} = __m[${JSON.stringify(n)}];`),
    '',
    'export default (__m && __m.default !== undefined) ? __m.default : __m;',
    '',
  ];
  return lines.join('\n');
}

/**
 * Sanity test: every shim must export at least these well-known
 * names. If a name is missing, the upstream package shape changed
 * (e.g. vue dropped a public API) or our regex extractor regressed
 * — either way the build should fail loud rather than silently
 * shipping a broken shim.
 *
 * Keyed by `hostKey` (the key under `window.__ATOMICX_HOST__`) so
 * we don't need to thread a target↔required mapping through the
 * caller. Adding a new shared singleton: append both a
 * `SHARED_SINGLETONS` entry in `injectImportMapBootstrapPlugin.mjs`
 * AND a sentinel entry here. The shim generator throws a clear
 * error when a freshly-added hostKey has no sentinels (so the omission
 * is impossible to miss).
 */
const REQUIRED_NAMES = {
  vue: ['ref', 'reactive', 'computed', 'watch', 'defineComponent', 'createApp', 'unref', 'toRaw'],
  vueRouter: ['createRouter', 'useRouter', 'useRoute'],
  uikitBase: ['UIKitProvider'],
};

/**
 * Public entry — invoked by `injectImportMapBootstrapPlugin.mjs` in
 * its `closeBundle` hook.
 *
 * @param {object} options
 * @param {string} options.demoRoot
 * @param {string} options.outDir   Filesystem directory to receive the
 *                                  shim files (typically `<dist>/host-shim/`).
 * @param {Array<{pkg: string, hostKey: string, file: string}>} options.targets
 *   Shared-singleton descriptors. Sourced from
 *   `injectImportMapBootstrapPlugin.mjs#HOST_SHIM_TARGETS` so the
 *   plugin and the generator never disagree about which packages
 *   to shim.
 */
export function generateHostShims({ demoRoot, outDir, targets }) {
  if (!demoRoot) throw new Error('generateHostShims: demoRoot is required');
  if (!outDir) throw new Error('generateHostShims: outDir is required');
  if (!Array.isArray(targets) || targets.length === 0) {
    throw new Error('generateHostShims: targets must be a non-empty array');
  }

  if (!existsSync(outDir)) {
    mkdirSync(outDir, { recursive: true });
  }

  const summary = [];
  for (const t of targets) {
    if (!t.pkg || !t.hostKey || !t.file) {
      throw new Error(
        `[genHostShim] target entry is missing one of {pkg, hostKey, file}: ${JSON.stringify(t)}`,
      );
    }
    const required = REQUIRED_NAMES[t.hostKey];
    if (!required) {
      throw new Error(
        `[genHostShim] no REQUIRED_NAMES sentinels for hostKey "${t.hostKey}". `
          + 'Add an entry to REQUIRED_NAMES in scripts/genHostShim.mjs so '
          + 'upstream API drift fails the build instead of shipping a broken shim.',
      );
    }
    const entry = resolvePackageEsmEntry(t.pkg, demoRoot);
    const { names } = collectExports(entry);
    if (names.length === 0) {
      throw new Error(
        `[genHostShim] no named exports extracted from ${t.pkg} (entry: ${entry}). `
          + 'The package layout may have changed; update scripts/genHostShim.mjs.',
      );
    }
    for (const req of required) {
      if (!names.includes(req)) {
        throw new Error(
          `[genHostShim] required export "${req}" not found in ${t.pkg} surface. `
            + `Extracted ${names.length} names from ${entry}. `
            + 'Either the package dropped the API, or the regex extractor missed it.',
        );
      }
    }
    const shimSrc = renderShim(t.hostKey, t.pkg, names);
    const outFile = resolve(outDir, t.file);
    writeFileSync(outFile, shimSrc);
    summary.push({ pkg: t.pkg, count: names.length, outFile });
  }

  return summary;
}
