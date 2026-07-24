/**
 * Dev-only Vite plugin that papers over missing SDK exports.
 *
 * Why this exists:
 *   Switching to an older online SDK version often surfaces a
 *   `SyntaxError: ... does not provide an export named X` thrown at
 *   ES-module link time, the moment a demo source file tries to
 *   `import { X } from 'tuikit-atomicx-vue3'`. That single failure
 *   used to bring the whole page down — the SDK picker, every other
 *   working example card, the recovery overlay — leaving the
 *   operator with no UI affordance to escape.
 *
 * What it does:
 *   1. Scan the demo's `src/` (via `checkCompatibility`) and the
 *      vendor SDK's exports the moment vite boots. Cache the
 *      "demo-used names not actually exported" diff.
 *   2. Intercept resolution of `tuikit-atomicx-vue3` (and its
 *      sub-entries) when ANY name is missing. Redirect the import
 *      to a synthetic shim module.
 *   3. The shim re-exports everything from the real SDK and ADDS
 *      `export const <Missing> = $missing('<Missing>')` lines for
 *      each known-missing name. `$missing` returns a callable Proxy
 *      that throws ONLY when actually used (called, instantiated,
 *      or property-accessed) — so import-time evaluation succeeds
 *      and the rest of the app loads.
 *   4. Demo cards that touch the missing names fail at run() time
 *      with a clear "SDK is missing export X" message; cards that
 *      don't touch them keep working. The picker UI separately
 *      reads the missing-name list from `/__sdk/state` and disables
 *      the affected cards visually.
 *
 * Why a Vite virtual module (not a real on-disk file):
 *   Generating a file under `vendor/` works but is overwritten by
 *   the next `npm install`. A virtual module is regenerated on
 *   every server restart, picks up the right missing names for the
 *   currently-resolved SDK version, and never touches disk.
 */
import { resolve, normalize } from 'node:path';

// `\0` prefix tells Rollup/Vite "this id is owned by a plugin",
// keeping it out of other resolvers and the file-watch graph.
//
// We expose two variants — the unprefixed `virtual:` form is what
// `vite.config.ts`'s `resolve.alias` can redirect to (alias values
// can't start with `\0` because they're processed before plugin
// resolveId hooks see them), and the `\0`-prefixed form is what we
// internally normalise to so other plugins / the file-watch graph
// leave us alone.
const VIRTUAL_MAIN_ALIAS = 'virtual:atomicx-shim/main';
const VIRTUAL_LIVE_ALIAS = 'virtual:atomicx-shim/live';
const VIRTUAL_SHIM_ID = `\0${VIRTUAL_MAIN_ALIAS}`;
const VIRTUAL_LIVE_SHIM_ID = `\0${VIRTUAL_LIVE_ALIAS}`;

const PACKAGE_NAME = 'tuikit-atomicx-vue3';
const LIVE_SUBPATH = `${PACKAGE_NAME}/live`;

/**
 * Sentinel query the shim appends to its `export *` target so we
 * can recognise "this import is the shim re-exporting the REAL
 * SDK, do not re-shim it" inside our own `resolveId` fallback.
 *
 * Without this, the fallback branch (which matches by absolute
 * path under sdkRoot) would catch the shim's own re-export and
 * loop the module back to itself.
 */
const PASSTHROUGH_QUERY = 'atomicx-shim-passthrough';

/**
 * Strip vite-style `?v=hash` and `?import` query suffixes from an id
 * so we can compare it to an on-disk absolute path. We do NOT use
 * `URL` parsing here because the id can also be a plain path (no
 * protocol) — splitting on the first `?` is correct for both cases
 * and avoids constructing throwaway URL objects on the hot path.
 */
function stripQuery(id) {
  if (typeof id !== 'string') return '';
  const q = id.indexOf('?');
  return q === -1 ? id : id.slice(0, q);
}

/**
 * Build the shim source for one entry.
 *
 * Layout:
 *
 *   export * from '<real-entry>';
 *   // For each name the demo imports but the SDK doesn't export:
 *   export const SeatLayoutTemplate = $missing('SeatLayoutTemplate', 'tuikit-atomicx-vue3');
 *
 * Explicit `export const` shadows `export *` for the same binding
 * name (ESM spec). Conveniently, `export *` SKIPS bindings that
 * are also explicitly exported, so there's no name conflict.
 *
 * `$missing` returns a Proxy that doubles as both a callable and a
 * namespace object. Any access (call, property read, instantiation)
 * throws a descriptive error so a card that uses the missing API
 * fails loudly and locally — never silently producing `undefined`.
 *
 * For the very common "enum-like" usage `Foo.MEMBER`, the Proxy's
 * `get` trap throws too. The card-level guard (see
 * `sdk-source/missingClient.ts`) is the polite path; this is the fallback
 * for any callsite that bypasses the guard.
 */
function buildShimSource(realEntryAbsPath, missingNames) {
  // Append the passthrough sentinel so our own resolveId fallback
  // can let this specific import through unchanged.
  const realImportPath = JSON.stringify(`${realEntryAbsPath}?${PASSTHROUGH_QUERY}`);
  const escapedNames = missingNames.map(n => JSON.stringify(n));
  // Build the missing-name exports first, then the catch-all
  // re-export — order doesn't matter functionally (the explicit
  // bindings shadow re-exports per ESM rules), but keeping the
  // re-export last reads more naturally top-to-bottom.
  const missingExports = missingNames
    .map(
      n => `export const ${n} = $missing(${JSON.stringify(n)});`,
    )
    .join('\n');
  return `// Generated by sdkMissingShimPlugin — DO NOT EDIT.
// Re-exports the real SDK + adds stub bindings for names the active
// SDK build does not provide so import-time linking succeeds.

function $missing(name) {
  const message =
    \`[SDK shim] tuikit-atomicx-vue3 export "\${name}" is not provided by the currently \` +
    'selected SDK version. The using example card has been disabled; pick a different ' +
    'SDK version from the topbar picker, or stay on workspace.';
  function throwIt() { throw new Error(message); }
  // Mark the sentinel so card-level code can detect it without
  // actually invoking it (see sdk-source/missingClient.ts).
  const sentinel = new Proxy(throwIt, {
    get(_t, key) {
      if (key === '__atomicxMissingExport') return name;
      if (key === Symbol.toPrimitive) return () => \`[missing \${name}]\`;
      // Common JS internals — let them through silently so console
      // logging / spread / etc. don't blow up just by glancing at
      // the value.
      if (key === Symbol.toStringTag) return \`Missing(\${name})\`;
      if (key === 'toString' || key === 'valueOf') {
        return () => \`[missing \${name}]\`;
      }
      // Any real access (e.g. \`Foo.MEMBER\`) throws.
      throw new Error(message + \` (accessed .\${String(key)})\`);
    },
    apply() { throwIt(); },
    construct() { throwIt(); },
  });
  return sentinel;
}

// The list of names this SDK build doesn't provide. Exposed for the
// runtime helper (see sdk-source/missingClient.ts) so the UI can disable
// affected cards without trying to import each name to find out.
export const __atomicxMissingExports = Object.freeze([${escapedNames.join(', ')}]);

${missingExports}

export * from ${realImportPath};
`;
}

/**
 * @param {object} options
 * @param {() => { source: 'workspace'|'online', sdkRoot: string|null }} options.getActiveSource
 *   Lazy getter so we re-read on every `configResolved`. The plugin
 *   itself doesn't need to know about `.current.json`; it just asks
 *   the host config for the currently-resolved SDK root.
 * @param {(demoRoot: string, sdkRoot: string) => { ok: boolean, missing?: {entry:string,name:string}[] }} options.runCompat
 *   Injected so this plugin doesn't import `sdkCompatibility.mjs`
 *   directly (keeps the module graph one-directional).
 * @param {string} options.demoRoot
 */
function sdkMissingShimPlugin({ getActiveSource, runCompat, demoRoot }) {
  /** @type {{ main: Set<string>, live: Set<string> } | null} */
  let missingByEntry = null;
  let sdkRoot = null;

  function recompute() {
    const active = getActiveSource();
    sdkRoot = active.sdkRoot;
    missingByEntry = { main: new Set(), live: new Set() };
    if (active.source !== 'online' || !sdkRoot) {
      // eslint-disable-next-line no-console
      console.log(`[sdk-missing-shim] inactive (source=${active.source}, sdkRoot=${sdkRoot})`);
      return;
    }
    let compat;
    try {
      compat = runCompat(demoRoot, sdkRoot);
    } catch (err) {
      // eslint-disable-next-line no-console
      console.warn(`[sdk-missing-shim] compat check threw: ${err?.message || err}`);
      return;
    }
    if (!compat) {
      // eslint-disable-next-line no-console
      console.log('[sdk-missing-shim] compat returned nothing');
      return;
    }
    if (compat.ok) {
      // eslint-disable-next-line no-console
      console.log('[sdk-missing-shim] SDK is compatible — passing through');
      return;
    }
    if (!Array.isArray(compat.missing)) {
      // eslint-disable-next-line no-console
      console.warn('[sdk-missing-shim] compat returned !ok but missing is not an array');
      return;
    }
    for (const m of compat.missing) {
      if (m.entry === PACKAGE_NAME) missingByEntry.main.add(m.name);
      else if (m.entry === LIVE_SUBPATH) missingByEntry.live.add(m.name);
    }
  }

  function shouldShim(entry) {
    if (!missingByEntry) return false;
    if (entry === 'main') return missingByEntry.main.size > 0;
    if (entry === 'live') return missingByEntry.live.size > 0;
    return false;
  }

  return {
    name: 'api-example-sdk-missing-shim',
    // Active in both `serve` (dev) and `build` modes — this is a
    // demo site that's only ever built to exercise the bundle path
    // locally; it's never deployed to production. Running in build
    // mode lets us do an `npm run build` smoke-test even with an
    // intentionally-incompatible SDK pinned, instead of failing at
    // the rollup static-analysis stage.
    // `pre` so we resolve before the alias plugin gets a chance.
    enforce: 'pre',

    configResolved() {
      recompute();
      // One-line summary so the operator can see, from the dev
      // server log alone, whether the shim is armed and for which
      // entries. Quiet when there's nothing to do.
      if (missingByEntry && (missingByEntry.main.size || missingByEntry.live.size)) {
        const parts = [];
        if (missingByEntry.main.size) {
          parts.push(`main: ${[...missingByEntry.main].join(', ')}`);
        }
        if (missingByEntry.live.size) {
          parts.push(`live: ${[...missingByEntry.live].join(', ')}`);
        }
        // eslint-disable-next-line no-console
        console.log(`[sdk-missing-shim] intercepting tuikit-atomicx-vue3 imports for missing names — ${parts.join(' | ')}`);
      }
    },

    resolveId(source) {
      if (!missingByEntry || !sdkRoot) return null;
      // The shim re-exports the REAL SDK using a `?<PASSTHROUGH_QUERY>`
      // marker; if we see that marker we MUST let it through unchanged
      // so the import resolves to the actual dist file. Without this
      // guard the fallback branch below would catch our own re-export
      // and the module would import itself in a loop.
      if (typeof source === 'string' && source.includes(`?${PASSTHROUGH_QUERY}`)) {
        return null;
      }

      // (1) Vite alias has rewritten the bare specifier to our
      // virtual id (the recommended path: `vite.config.ts` puts an
      // alias `tuikit-atomicx-vue3 → virtual:atomicx-shim/main` when
      // the SDK has missing exports). We own this prefix; convert
      // to the `\0`-prefixed internal id so other plugins and the
      // file-watch graph leave it alone.
      if (source === VIRTUAL_MAIN_ALIAS) return VIRTUAL_SHIM_ID;
      if (source === VIRTUAL_LIVE_ALIAS) return VIRTUAL_LIVE_SHIM_ID;

      // (2) Bare-specifier match — secondary path for the case where
      // the alias-based redirect isn't installed (e.g. someone calls
      // this plugin without the matching vite.config wiring).
      if (source === PACKAGE_NAME && shouldShim('main')) {
        return VIRTUAL_SHIM_ID;
      }
      if (source === LIVE_SUBPATH && shouldShim('live')) {
        return VIRTUAL_LIVE_SHIM_ID;
      }

      // (3) Last-resort fallback: vite's internal alias plugin has
      // already rewritten the bare specifier to the resolved
      // absolute path under `vendor/.../tuikit-atomicx-vue3`. This
      // path exists for robustness — the canonical fix is branch (1).
      // Match by *normalised path equality* (not substring) so an
      // unrelated package under the vendor tree can't accidentally
      // get shimmed.
      const cleanSource = stripQuery(source);
      if (!cleanSource || !cleanSource.startsWith(sdkRoot)) return null;
      const sdkMainEntry = normalize(resolve(sdkRoot, 'dist/index.js'));
      const sdkLiveEntry = normalize(resolve(sdkRoot, 'dist/subEntry/live/index.js'));
      const normalised = normalize(cleanSource);
      if (normalised === sdkMainEntry && shouldShim('main')) {
        return VIRTUAL_SHIM_ID;
      }
      if (normalised === sdkLiveEntry && shouldShim('live')) {
        return VIRTUAL_LIVE_SHIM_ID;
      }
      return null;
    },

    load(id) {
      if (!sdkRoot || !missingByEntry) return null;
      if (id === VIRTUAL_SHIM_ID) {
        const realEntry = resolve(sdkRoot, 'dist/index.js');
        return buildShimSource(realEntry, [...missingByEntry.main]);
      }
      if (id === VIRTUAL_LIVE_SHIM_ID) {
        const realEntry = resolve(sdkRoot, 'dist/subEntry/live/index.js');
        return buildShimSource(realEntry, [...missingByEntry.live]);
      }
      return null;
    },
  };
}

export {
  sdkMissingShimPlugin,
  // Surface the unprefixed virtual ids so `vite.config.ts` can
  // wire them into `resolve.alias` without hardcoding the same
  // strings in two places.
  VIRTUAL_MAIN_ALIAS,
  VIRTUAL_LIVE_ALIAS,
};
