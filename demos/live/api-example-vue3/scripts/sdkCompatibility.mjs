/**
 * Compatibility check between the demo source and a vendor-installed
 * `tuikit-atomicx-vue3` build.
 *
 * Goal: catch "the active SDK build is missing an export this demo
 * source uses" BEFORE the operator switches to it. Without this
 * check, the page just goes blank with a single console line
 * (`SyntaxError: ... does not provide an export named X`); the
 * SDK fatal overlay catches that at runtime, but pre-flighting the
 * check on the dev server means the operator can't even pick a
 * known-incompatible version by mistake.
 *
 * What it does:
 *   1. Walk `src/` and `tests/` looking for `import { ... } from
 *      'tuikit-atomicx-vue3'` (+ sub-entries). Collect every named
 *      import we find, keyed by entry (`'.'` or `'./live'` etc.).
 *      We deliberately ignore type-only imports (`import type` /
 *      individual `type X` specifiers) — those don't survive to
 *      runtime so they can't cause SyntaxError at link time.
 *
 *   2. Read the entry file the vendor SDK actually serves for each
 *      sub-entry, and extract the names it exports. We rely on a
 *      simple grep of `export { ... }` clusters in the dist build;
 *      the published SDK is rolled up with Rollup-style tree-shake-
 *      friendly output, which always emits exports through a single
 *      trailing `export { ... }` block per file. This is good enough
 *      for catch-the-typo-class of failures; for deeper checks (re-
 *      exports of re-exports, conditional `exports` map branches)
 *      a real bundler-resolved check would be needed.
 *
 *   3. Diff demo-used names against SDK-exported names. Anything in
 *      demo-used and NOT in SDK-exported is `missing`.
 *
 * Returns `{ ok: true }` on success, `{ ok: false, missing: [...] }`
 * with per-entry missing names on failure.
 */
import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs';
import { resolve, join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const DEFAULT_DEMO_ROOT = resolve(here, '..');

/* ------------------------------ scanner ------------------------------ */

/**
 * Walk a directory tree, yielding files with one of the supported
 * extensions. Skips `node_modules`, `dist`, and `.*` dirs.
 */
function* walk(dir, exts) {
  let entries;
  try {
    entries = readdirSync(dir);
  } catch {
    return;
  }
  for (const name of entries) {
    if (name.startsWith('.')) continue;
    if (name === 'node_modules' || name === 'dist') continue;
    const full = join(dir, name);
    let st;
    try {
      st = statSync(full);
    } catch {
      continue;
    }
    if (st.isDirectory()) {
      yield* walk(full, exts);
    } else if (exts.some(e => name.endsWith(e))) {
      yield full;
    }
  }
}

/**
 * Match every `import ... from '<pkg>[/subpath]'` statement in a
 * source file and extract the entry path + named specifiers.
 *
 * We support:
 *   import { A, B as C } from 'tuikit-atomicx-vue3';
 *   import { A as B, type T } from 'tuikit-atomicx-vue3/live';
 *   import D, { E } from 'tuikit-atomicx-vue3';   (default ignored —
 *                                                  it's not what
 *                                                  causes "does not
 *                                                  provide an export
 *                                                  named X" failures)
 *
 * We DELIBERATELY ignore:
 *   - `import type { ... }` blocks (type-only)
 *   - individual `type X` specifiers inside otherwise-runtime imports
 *   - `import * as ns from ...` (namespace imports — they don't pin
 *     specific names, so they never trigger the missing-export error)
 *
 * The regex is intentionally simple — Vue SFC `<script setup>` runs
 * through this just as well as a `.ts` file because we operate on
 * raw text.
 */
const IMPORT_RE =
  /import\s+(?:type\s+)?(?:(?:[\w$]+\s*,\s*)?\{([^}]+)\}|[\w$*]+|\*\s+as\s+[\w$]+)?\s*from\s+['"]([^'"]+)['"]/g;

function parseSpecifiers(specifierBlock) {
  // specifierBlock is the content between `{` and `}`. Split on
  // commas, normalise whitespace + type prefix, then take the
  // imported (LHS) name — that's what has to exist in the SDK's
  // export table. The local-rename RHS doesn't matter to us.
  const names = [];
  for (const raw of specifierBlock.split(',')) {
    let s = raw.trim();
    if (!s) continue;
    // Drop a leading `type ` on individual specifiers.
    if (/^type\s+/.test(s)) continue;
    // `Foo as Bar` -> we want `Foo`. With no `as`, we want the whole.
    const m = s.match(/^([\w$]+)(?:\s+as\s+[\w$]+)?$/);
    if (m) {
      names.push(m[1]);
    }
  }
  return names;
}

/**
 * Scan `demoRoot/src` (+ optional dirs) for imports of the given
 * package and return a map `entry -> Set<name>`:
 *
 *   'tuikit-atomicx-vue3'      -> new Set(['useLiveListState', ...])
 *   'tuikit-atomicx-vue3/live' -> new Set(['LiveSeatEvent', ...])
 *
 * Only entries that the demo actually uses appear in the map.
 */
function collectDemoImports(demoRoot, packageName) {
  const roots = [resolve(demoRoot, 'src'), resolve(demoRoot, 'tests')];
  const exts = ['.ts', '.tsx', '.js', '.vue', '.mts'];
  const byEntry = new Map();

  for (const root of roots) {
    if (!existsSync(root)) continue;
    for (const file of walk(root, exts)) {
      let content;
      try {
        content = readFileSync(file, 'utf-8');
      } catch {
        continue;
      }
      // Fast reject — most files don't import the SDK at all.
      if (!content.includes(packageName)) continue;
      // Skip pure `import type` lines explicitly. We still want
      // mixed-import lines (`import { runtime, type T }`) to be
      // scanned and have `runtime` collected — that's handled in
      // parseSpecifiers via per-specifier `type` filtering.
      for (const match of content.matchAll(IMPORT_RE)) {
        const specifierBlock = match[1];
        const fromPath = match[2];
        if (fromPath !== packageName && !fromPath.startsWith(`${packageName}/`)) continue;
        // `import type { ... }` — the whole declaration is type-only.
        // We detect it by looking for `import type` at the matched
        // statement's start.
        const stmtStart = match.index ?? 0;
        const preceding = content.slice(Math.max(0, stmtStart), stmtStart + match[0].length);
        if (/^\s*import\s+type\b/.test(preceding)) {
          continue;
        }
        if (!specifierBlock) continue; // default-only or namespace import — skip
        const names = parseSpecifiers(specifierBlock);
        if (!names.length) continue;
        let set = byEntry.get(fromPath);
        if (!set) {
          set = new Set();
          byEntry.set(fromPath, set);
        }
        for (const n of names) set.add(n);
      }
    }
  }
  return byEntry;
}

/* --------------------------- exports reader --------------------------- */

/**
 * Read the vendor SDK's `package.json` exports map and resolve each
 * entry name (`'.'`, `'./live'`, ...) to the dist file vite would
 * actually load. We deliberately pick the `import` / `default`
 * conditions in that order — those mirror the conditions vite uses
 * in browser mode.
 */
function resolveEntryFile(sdkRoot, entry) {
  let pkg;
  try {
    pkg = JSON.parse(readFileSync(resolve(sdkRoot, 'package.json'), 'utf-8'));
  } catch {
    return null;
  }
  const exportsField = pkg.exports;
  if (!exportsField) {
    // No exports map — fall back to `main` / `module`.
    if (entry !== '.') return null;
    const fallback = pkg.module || pkg.main;
    return fallback ? resolve(sdkRoot, fallback) : null;
  }
  const cond = exportsField[entry];
  if (!cond) return null;
  if (typeof cond === 'string') {
    return resolve(sdkRoot, cond);
  }
  // Conditional object. Pick browser-shaped keys first.
  for (const key of ['import', 'module', 'default', 'browser']) {
    if (typeof cond[key] === 'string') {
      return resolve(sdkRoot, cond[key]);
    }
  }
  return null;
}

/**
 * Extract every public export name from a built file. We support
 * three shapes that the published SDK uses today:
 *
 *   export { A, B as C, D };
 *   export const E = ...;
 *   export function F() { ... }
 *   export class G { ... }
 *   export default ... (irrelevant for named-import checks; skipped)
 *
 * Returns a Set of public names (i.e. the RHS of `as`, or the bare
 * identifier when no rename is involved).
 *
 * This is intentionally a regex pass, not a real ESM parse — the
 * Rollup output is regular enough that this trades 5% recall for
 * 95% less complexity. Recall gaps only cause FALSE POSITIVES in the
 * compat check (we'd refuse a switch that would have worked), so
 * the worst case is a manual "force-switch" — never a silent break.
 */
function collectFileExports(filePath) {
  if (!existsSync(filePath)) return new Set();
  let src;
  try {
    src = readFileSync(filePath, 'utf-8');
  } catch {
    return new Set();
  }
  const names = new Set();

  // Block-style: `export { ... }` (may span lines).
  // We capture the {…} content non-greedily, then split.
  const blockRe = /export\s*\{([^}]+)\}\s*(?:from\s*['"][^'"]+['"])?\s*;?/g;
  for (const match of src.matchAll(blockRe)) {
    for (const raw of match[1].split(',')) {
      const s = raw.trim().replace(/\s+/g, ' ');
      if (!s) continue;
      // `X as Y` -> public name is Y. Plain `X` -> X.
      const m = s.match(/^[\w$]+(?:\s+as\s+([\w$]+))?$/);
      if (!m) continue;
      names.add(m[1] || s.split(' ')[0]);
    }
  }

  // Inline declarations.
  const inlineRe = /export\s+(?:const|let|var|function|class|enum|interface|type)\s+([\w$]+)/g;
  for (const match of src.matchAll(inlineRe)) {
    names.add(match[1]);
  }

  return names;
}

/* ------------------------------- public ------------------------------ */

const PACKAGE_NAME = 'tuikit-atomicx-vue3';

function checkCompatibility(demoRoot, sdkRoot) {
  const demoUsage = collectDemoImports(demoRoot, PACKAGE_NAME);
  /** @type {{entry: string, name: string}[]} */
  const missing = [];

  for (const [entry, usedNames] of demoUsage) {
    // Translate `tuikit-atomicx-vue3[/sub]` to the exports-map key
    // (`'.'` or `'./sub'`).
    let exportKey;
    if (entry === PACKAGE_NAME) {
      exportKey = '.';
    } else if (entry.startsWith(`${PACKAGE_NAME}/`)) {
      exportKey = `./${entry.slice(PACKAGE_NAME.length + 1)}`;
    } else {
      continue;
    }
    const entryFile = resolveEntryFile(sdkRoot, exportKey);
    if (!entryFile) {
      // SDK doesn't even declare this sub-entry — every name the
      // demo imports from here is effectively missing.
      for (const name of usedNames) missing.push({ entry, name });
      continue;
    }
    const sdkExports = collectFileExports(entryFile);
    for (const name of usedNames) {
      if (!sdkExports.has(name)) {
        missing.push({ entry, name });
      }
    }
  }

  if (missing.length === 0) {
    return { ok: true, checked: Array.from(demoUsage.keys()) };
  }
  return {
    ok: false,
    missing,
    checked: Array.from(demoUsage.keys()),
  };
}

export {
  PACKAGE_NAME,
  DEFAULT_DEMO_ROOT,
  checkCompatibility,
  collectDemoImports,
  resolveEntryFile,
  collectFileExports,
};
