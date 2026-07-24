/**
 * Shared "facade contract" scanner.
 *
 * The prod build (`vite build`) aliases `tuikit-atomicx-vue3` to the demo's
 * facade module (`src/services/sdk-source/facade.ts`). Rollup then does a
 * strict, static check that every `import { X } from 'tuikit-atomicx-vue3'`
 * finds a matching `export` inside the facade. A missing forwarder produces:
 *
 *   "<X>" is not exported by "src/services/sdk-source/facade.ts"
 *
 * which fails the build with a diagnostic that's hard to trace back to
 * "someone added a new state hook but forgot to append a facade forwarder"
 * unless you already know the setup.
 *
 * This module implements the scan once, so both:
 *   - the dev-time regression test (`tests/coverage.spec.ts`), and
 *   - the build-time pre-flight guard plugin (used by `vite.config.ts`)
 * consume the same code path and report the same diagnostic. That way a
 * CI pipeline that only runs `pnpm build` (skipping `test:coverage`) still
 * gets a friendly failure message instead of the raw rollup error.
 *
 * Node-only (fs / regex), no vite or vitest imports; safe to load from
 * both contexts.
 */
import { readdirSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';

/**
 * Extract every specifier imported from `tuikit-atomicx-vue3` in a source
 * file. Supports both single-line and multi-line named import forms:
 *
 *   import { A, B, type C } from 'tuikit-atomicx-vue3';
 *   import {
 *     A,
 *     B,
 *     type C,
 *   } from 'tuikit-atomicx-vue3';
 *
 * `type` prefix and `X as Y` aliases are normalised: the returned list
 * contains the **imported** name (the one facade needs to export).
 *
 * Returned entries are tagged with `isType` so callers can decide the
 * severity of a missing forwarder — hook forwarders are build-fatal,
 * type re-exports are not.
 *
 * @param {string} src - File contents.
 * @returns {Array<{ name: string, isType: boolean }>}
 */
export function extractSdkImports(src) {
  const out = [];
  const re = /import\s*(type\s+)?\{([^}]+)\}\s*from\s*['"]tuikit-atomicx-vue3['"]/g;
  let m;
  while ((m = re.exec(src)) !== null) {
    // `import type { ... }` — the whole block is types.
    const blockIsType = Boolean(m[1]);
    const inside = m[2];
    for (const raw of inside.split(',')) {
      const trimmed = raw.trim();
      if (!trimmed) continue;
      // Per-specifier `type X` — only that one is a type.
      const itemIsType = /^type\s+/.test(trimmed);
      const withoutType = trimmed.replace(/^type\s+/, '');
      const [name] = withoutType.split(/\s+as\s+/);
      const clean = name.trim();
      if (clean && /^[A-Za-z_]\w*$/.test(clean)) {
        out.push({ name: clean, isType: blockIsType || itemIsType });
      }
    }
  }
  return out;
}

/**
 * Extract everything the facade exports at the top level.
 *
 * We separate value exports (`export const X = ...` — includes hook
 * forwarders, enum lazy proxies, and the LiveView wrapper) from type-only
 * exports (`export type { A, B }`). Value exports are what rollup checks
 * at build time; type exports only affect tsc.
 *
 * @param {string} src - facade.ts contents.
 * @returns {{ values: Set<string>, types: Set<string> }}
 */
export function extractFacadeExports(src) {
  const values = new Set();
  const types = new Set();

  const constRe = /^\s*export\s+const\s+([A-Za-z_]\w*)/gm;
  let m;
  while ((m = constRe.exec(src)) !== null) {
    values.add(m[1]);
  }

  const typeBlockRe = /export\s+type\s*\{([^}]+)\}/g;
  while ((m = typeBlockRe.exec(src)) !== null) {
    for (const raw of m[1].split(',')) {
      const name = raw.trim().split(/\s+as\s+/)[0].trim();
      if (name) types.add(name);
    }
  }
  return { values, types };
}

/**
 * Scan `examplesDir` and compare against the exports of `facadePath`.
 *
 * The result is bucketed by severity:
 *   - `missingValues`: hook forwarders / enum proxies the facade is missing.
 *     Rollup will refuse the build if any of these are referenced by
 *     example code — these must be treated as hard failures.
 *   - `missingTypes`: type-only re-exports the facade is missing. These
 *     don't break `vite build` (tsc / esbuild strip types before rollup
 *     sees them), but they degrade IDE / editor experience and hint at
 *     intent drift — reported as a warning.
 *
 * @param {object} opts
 * @param {string} opts.examplesDir - Absolute path to `src/examples`.
 * @param {string} opts.facadePath  - Absolute path to `facade.ts`.
 * @returns {{
 *   missingValues: Record<string, string[]>,
 *   missingTypes:  Record<string, string[]>,
 * }}
 */
export function scanFacadeContract({ examplesDir, facadePath }) {
  const facadeSrc = readFileSync(facadePath, 'utf-8');
  const { values, types } = extractFacadeExports(facadeSrc);

  const missingValues = {};
  const missingTypes = {};

  const files = readdirSync(examplesDir).filter(f => f.endsWith('.ts'));
  for (const file of files) {
    const src = readFileSync(resolve(examplesDir, file), 'utf-8');
    const imports = extractSdkImports(src);
    const missValues = [];
    const missTypes = [];
    for (const { name, isType } of imports) {
      // Only classify as "missing hook forwarder" when the facade does
      // not export it as a **value**. A pure type usage that happens to
      // also have a value export is still fine.
      if (isType) {
        if (!types.has(name) && !values.has(name)) {
          missTypes.push(name);
        }
      } else {
        if (!values.has(name)) {
          missValues.push(name);
        }
      }
    }
    if (missValues.length > 0) missingValues[file] = missValues;
    if (missTypes.length > 0) missingTypes[file] = missTypes;
  }

  return { missingValues, missingTypes };
}

/**
 * Human-readable summary for the "hard failures" bucket, matching the
 * diagnostic style used elsewhere in this project (see `sdkState.mjs`
 * `ensureOnlineInstalled` error message).
 */
export function formatMissingValues(missingValues) {
  const entries = Object.entries(missingValues);
  if (entries.length === 0) return '';
  const lines = entries.map(([file, names]) => `  ${file}: ${names.join(', ')}`);
  return [
    '',
    '以下 examples 导入了 tuikit-atomicx-vue3 里的符号，但 src/services/sdk-source/facade.ts 没有对应 forwarder。',
    'vite build 时会因 rollup 静态检查失败 (dev 模式下 facade 是 dead code，所以本地跑不出错)。',
    '请为每个符号补一个 export const <name> = (...args) => readSdk().<name>(...args)：',
    ...lines,
    '',
  ].join('\n');
}

/**
 * Human-readable summary for the "warnings" bucket. Type re-exports don't
 * fail rollup, but keeping them consistent with the value exports helps
 * IDE users see the same shape they'd get from the real SDK.
 */
export function formatMissingTypes(missingTypes) {
  const entries = Object.entries(missingTypes);
  if (entries.length === 0) return '';
  const lines = entries.map(([file, names]) => `  ${file}: ${names.join(', ')}`);
  return [
    '',
    '以下 examples 使用了 tuikit-atomicx-vue3 的 type-only 导入，facade.ts 里没有对应 `export type` 声明。',
    'rollup 不会报错（type 层由 tsc 剥离），但 IDE / editor 会失去补全 —— 建议在 facade 底部 export type 块里补上：',
    ...lines,
    '',
  ].join('\n');
}
