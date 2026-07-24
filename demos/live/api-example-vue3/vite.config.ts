import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';
import { resolve } from 'node:path';
import { existsSync, readFileSync, rmSync, writeFileSync } from 'node:fs';

// `.mjs` Node-only utilities — they read the on-disk SDK selection
// (`vendor/tuikit-atomicx-online/.current.json`) and the dev plugin that
// exposes `/__sdk/*` endpoints to the in-page picker. The same helpers
// are reused by `install-online-sdk.mjs` so the picker, the CLI, and
// vite all see the same state.
//
// `@ts-expect-error` is unfortunately needed because this `.ts` config
// imports `.mjs` modules without separate `.d.ts` declarations; the
// helpers are small and well-documented, and shipping bespoke
// declarations would add maintenance overhead with no runtime benefit.
// @ts-expect-error - JS module without types.
import {
  SINGLETON_PACKAGES,
  ensureOnlineInstalled,
  listAliasTargets,
  readCurrentState,
  resolveOnlinePackageRoot,
} from './scripts/sdkState.mjs';
// @ts-expect-error - JS module without types.
import { sdkSwitcherPlugin } from './scripts/sdkSwitcherPlugin.mjs';
// @ts-expect-error - JS module without types.
import {
  sdkMissingShimPlugin,
  VIRTUAL_MAIN_ALIAS,
  VIRTUAL_LIVE_ALIAS,
} from './scripts/sdkMissingShimPlugin.mjs';
// @ts-expect-error - JS module without types.
import { checkCompatibility } from './scripts/sdkCompatibility.mjs';
// @ts-expect-error - JS module without types.
import {
  injectImportMapBootstrapPlugin,
  SHARED_SINGLETONS_CSV,
} from './scripts/injectImportMapBootstrapPlugin.mjs';
// @ts-expect-error - JS module without types.
import {
  scanFacadeContract,
  formatMissingValues,
  formatMissingTypes,
} from './scripts/scanFacadeContract.mjs';

/**
 * SDK source selection.
 *
 * `tuikit-atomicx-vue3` ships with the API Example site in two modes:
 *
 *   - `workspace` (default): resolve through pnpm's workspace symlink to
 *     the in-repo source package (`ui-component/packages/uikit-component-vue3`).
 *     This is what every other demo does and what contributors expect when
 *     they `pnpm dev` after changing SDK source.
 *
 *   - `online`: resolve to a real published version of `tuikit-atomicx-vue3`
 *     plus its FULL declared peer-dependency graph, all materialised under
 *     `vendor/tuikit-atomicx-online/node_modules`. Switching to a different
 *     online version swaps the entire dep graph as a unit, so the demo
 *     exercises the exact bundle a downstream consumer would see after
 *     `npm install tuikit-atomicx-vue3@x.y.z`.
 *
 * Selection precedence (highest first):
 *   1. `vendor/tuikit-atomicx-online/.current.json` — written by the
 *      in-page SDK picker; the file is the source of truth across
 *      restarts so the operator keeps their last choice without env
 *      gymnastics.
 *   2. `process.env.VITE_ATOMICX_SOURCE` (+ implicit version from the
 *      installed marker) — fallback for headless / CI runs that prefer
 *      env vars over a state file.
 *   3. Default: `workspace`.
 *
 * Switching at runtime: the in-page picker POSTs to `/__sdk/switch`,
 * which rewrites the state file and calls `server.restart()`. The
 * restart re-executes this config function with the new value, so the
 * alias table below is rebuilt; the browser auto-reloads on websocket
 * reconnect.
 *
 * ---
 *
 * Why we alias every vendor-installed package, not just the SDK entry:
 *   The published SDK's dist files `import` peers directly:
 *     `import { TUILogin } from '@tencentcloud/tui-core-lite'`.
 *   Without an alias, vite resolves that import by walking up from the
 *   importer's location to the nearest `node_modules` — which is the
 *   DEMO's node_modules, where those peers are not installed (or are
 *   installed at workspace versions, not the versions the published
 *   SDK was actually tested against). Aliasing every package present
 *   under the vendor's node_modules forces every "SDK ecosystem"
 *   import to resolve to the version `install-online-sdk.mjs` pinned.
 *
 *   Exception: a small set of packages MUST stay singleton across the
 *   demo and the SDK (Vue, vue-router, the UIKit base provider — see
 *   `SINGLETON_PACKAGES`). For those we explicitly DO NOT add an alias,
 *   so they keep resolving through the demo's node_modules and the
 *   demo + the SDK share one module instance.
 */
const PACKAGE_NAME = 'tuikit-atomicx-vue3';

type AliasEntry = { find: string | RegExp; replacement: string };
type AliasTarget = { name: string; path: string };

type ResolvedSdkSelection = {
  entries: AliasEntry[];
  /** Packages whose vendor copy was deliberately aliased. */
  aliasedPackages: string[];
  /** Singleton packages that stayed routed to the demo's node_modules. */
  singletonPackages: string[];
  source: 'workspace' | 'online';
  version: string;
};

/**
 * Build the alias array for online mode.
 *
 * Each peer becomes a single string alias `{ find: '<pkg>',
 * replacement: '<vendor-package-root>' }`. Vite's string alias does
 * prefix replacement, so:
 *   import 'pkg'         → '<vendor>/pkg'      (resolver reads
 *                                              package.json → main)
 *   import 'pkg/sub'     → '<vendor>/pkg/sub'  (resolver appends
 *                                              `.js`/`.mjs`/index.js
 *                                              like usual)
 * As long as the package laid out its subpath files at the same
 * relative location (which is the overwhelming convention), this
 * single-string-alias form handles both shapes correctly.
 *
 * Note: SINGLETON_PACKAGES are filtered out by `listAliasTargets`
 * itself so they don't appear in `targets`; we keep the explicit
 * guard here as defence in depth.
 */
function buildAliasEntriesFromTargets(targets: AliasTarget[]): AliasEntry[] {
  const entries: AliasEntry[] = [];
  for (const t of targets) {
    if (SINGLETON_PACKAGES.has(t.name)) {
      continue;
    }
    entries.push({ find: t.name, replacement: t.path });
  }
  return entries;
}

function resolveAtomicxAlias(rootDir: string): ResolvedSdkSelection {
  // State file wins over env var so the picker's last write is the
  // authoritative choice across restarts.
  const fromFile = readCurrentState(rootDir) as
    | { source: 'workspace' }
    | { source: 'online'; version: string };
  const fromEnv = (process.env.VITE_ATOMICX_SOURCE || '').toLowerCase();

  let source: 'workspace' | 'online';
  let version: string | undefined;
  if (fromFile.source === 'online') {
    source = 'online';
    version = fromFile.version;
  } else if (fromEnv === 'online') {
    source = 'online';
    version = undefined;
  } else {
    source = 'workspace';
  }

  if (source !== 'online') {
    return {
      entries: [],
      aliasedPackages: [],
      singletonPackages: [],
      source: 'workspace',
      version: 'workspace',
    };
  }

  // Fail loud if the operator asked for online but never installed
  // anything — silent fallback to workspace would defeat the point of
  // the picker.
  ensureOnlineInstalled(rootDir);

  // If the state file didn't pin a version (i.e. we got here via env
  // var), read whatever is currently materialised under node_modules.
  if (!version) {
    const installed = resolveOnlinePackageRoot(rootDir) as string | null;
    if (installed) {
      const pkgJsonPath = `${installed}/package.json`;
      if (existsSync(pkgJsonPath)) {
        try {
          const pkg = JSON.parse(readFileSync(pkgJsonPath, 'utf-8')) as { version?: string };
          if (pkg?.version) {
            version = String(pkg.version);
          }
        } catch {
          /* fall through */
        }
      }
    }
  }

  // Enumerate the SDK's *peer* packages that need redirecting to
  // vendor. `listAliasTargets` filters out singletons internally so
  // the result is exactly the set we want to alias.
  //
  // We do NOT iterate vendor/node_modules wholesale (which is what
  // the original implementation tried): vendor is npm's flat install
  // surface, so it also contains tons of nested helper packages
  // (`@types/*`, `@babel/runtime`, `videojs-font`, …) that we have
  // no reason to alias and that, when included, trigger esbuild
  // dep-scan failures because some of them aren't real runtime
  // modules.
  const targets = listAliasTargets(rootDir) as AliasTarget[];
  const aliasEntries = buildAliasEntriesFromTargets(targets);

  const onlinePkgRoot = resolveOnlinePackageRoot(rootDir) as string | null;
  if (onlinePkgRoot) {
    // Sub-entry alias for `tuikit-atomicx-vue3/live` etc. We bypass
    // the package's `exports` map deliberately here: vite would
    // otherwise try the demo workspace SDK's `exports` (because the
    // demo's own `node_modules/tuikit-atomicx-vue3` is the workspace
    // symlink), defeating the redirect. Mapping straight to the
    // sub-entry file path keeps the resolution deterministic, and is
    // safe because the published SDK's sub-entry layout is stable
    // (`dist/subEntry/<name>/index.js` mirrors its `exports` map).
    //
    // Put subpath BEFORE the bare-specifier alias so vite tries the
    // more specific pattern first.
    aliasEntries.unshift({
      find: /^tuikit-atomicx-vue3\/(.+)$/,
      replacement: `${onlinePkgRoot}/dist/subEntry/$1/index.js`,
    });
    // SDK main entry — string alias, lets vite read the vendor
    // copy's package.json normally and honour its `exports.'.'`.
    aliasEntries.push({ find: 'tuikit-atomicx-vue3', replacement: onlinePkgRoot });
  }

  // For logging only — what got aliased vs. what stayed singleton.
  const aliasedPackages = targets.map((t: AliasTarget) => t.name).sort();
  const singletonPackages = Array.from(SINGLETON_PACKAGES as Set<string>).sort();

  return {
    entries: aliasEntries,
    aliasedPackages,
    singletonPackages,
    source: 'online',
    version: version || 'unknown',
  };
}

export default defineConfig(({ command }) => {
  const rootDir = __dirname;
  const isBuild = command === 'build';

  // Build-mode SDK switching is fundamentally different from dev:
  //   - Dev: the SDK is materialised under `vendor/` and vite's
  //     alias table redirects bare imports to a local path. The
  //     `sdkSwitcherPlugin` HTTP endpoints let the picker swap
  //     versions at runtime by rewriting state files and asking
  //     vite to restart.
  //   - Build (v3): the SDK is NOT in the bundle at all. Demo bundle
  //     contains its own copies of vue / vue-router / uikit-base
  //     (regular static imports). An alias in this very config
  //     points `tuikit-atomicx-vue3` to `src/services/sdk-source/facade.ts`,
  //     a lazy facade that reads from `window.__ATOMICX_SDK__`.
  //     `main.ts` populates that global by `dynamic-import`-ing
  //     `https://esm.sh/tuikit-atomicx-vue3@<ver>?external=...` at
  //     boot. esm.sh handles the SDK + every internal dep; only
  //     vue / vue-router / uikit-base stay bare and are routed
  //     through a static 3-entry importmap (see
  //     scripts/injectImportMapBootstrapPlugin.mjs) to host-shim
  //     files that mirror the demo's loaded instances.
  //
  // The two paths share NOTHING below this point: the build-mode
  // branch sets up alias-to-facade + injectImportMapBootstrapPlugin;
  // the dev-mode branch sets up alias-to-vendor + optimizeDeps +
  // the missing-export shim. We deliberately keep them as two
  // visible blocks so a future reader can tell at a glance which
  // knobs apply to which mode.

  const {
    entries: atomicxAlias,
    aliasedPackages,
    singletonPackages,
    source,
    version,
  } = resolveAtomicxAlias(rootDir);

  // Pre-compute the missing-export set once, at config-load time, so
  // we can wire up the alias-based redirect to virtual modules AND
  // adjust `optimizeDeps` accordingly. The shim plugin re-runs the
  // same check at `configResolved`; both calls just do a quick
  // filesystem scan with no shared cache, so the duplication is
  // cheap and keeps responsibilities separated.
  //
  // Why this matters:
  //   `optimizeDeps.include: ['tuikit-atomicx-vue3', …]` makes vite
  //   pre-bundle the SDK with esbuild into `.vite/deps/<pkg>.js`.
  //   Browser imports of `tuikit-atomicx-vue3` then short-circuit to
  //   that prebundled file — vite's plugin `resolveId` hooks never
  //   see the import. The shim plugin can't do its job, so the page
  //   link-errors on a missing name.
  //
  //   When the SDK is missing names, the fix has two parts:
  //     1. Take the affected entry OUT of `optimizeDeps.include`
  //        and put it in `exclude` so the import goes through the
  //        normal resolve pipeline.
  //     2. Install an alias `tuikit-atomicx-vue3 → virtual:atomicx-shim/main`
  //        (and `/live → virtual:atomicx-shim/live`) so vite's
  //        built-in alias plugin — which runs BEFORE every other
  //        resolver — rewrites the specifier directly to a virtual
  //        id owned by the shim plugin. This avoids any reliance
  //        on user-plugin `enforce: 'pre'` ordering.
  let missingMain = false;
  let missingLive = false;
  if (source === 'online') {
    const onlinePkgRoot = resolveOnlinePackageRoot(rootDir) as string | null;
    if (onlinePkgRoot) {
      try {
        const compat = checkCompatibility(rootDir, onlinePkgRoot) as
          | { ok: true }
          | { ok: false; missing: { entry: string; name: string }[] };
        if (!compat.ok && Array.isArray(compat.missing)) {
          for (const m of compat.missing) {
            if (m.entry === 'tuikit-atomicx-vue3') missingMain = true;
            else if (m.entry === 'tuikit-atomicx-vue3/live') missingLive = true;
          }
        }
      } catch {
        // Compat check is best-effort; on failure both flags stay
        // `false` and we get the unmodified online-mode behaviour.
      }
    }
  }
  const atomicxHasMissing = missingMain || missingLive;

  // Cache invalidation based on a stable signature of the SDK
  // selection. Vite's own cache hash looks at config, package.json
  // and the lockfile — none of which reflect the on-disk contents
  // of `vendor/` after a SDK swap. We add our own:
  //
  //   sig = { source, version, missingMain, missingLive }
  //
  // Stored at `node_modules/.vite-sdk-signature.json`. When the
  // recorded signature differs from the current one we wipe
  // `node_modules/.vite` so dep-optimize and the transform cache
  // are rebuilt against the new SDK / new optimizeDeps config.
  //
  // Why a separate file (vs. always-wipe): always-wipe forces a full
  // re-bundle on every `pnpm dev`, which can add tens of seconds on
  // a cold start. A signature compare keeps the steady-state launch
  // fast while still being correct after a real change.
  const currentSig = JSON.stringify({ source, version, missingMain, missingLive });
  const sigFile = resolve(rootDir, 'node_modules/.vite-sdk-signature.json');
  let previousSig = '';
  if (existsSync(sigFile)) {
    try {
      previousSig = readFileSync(sigFile, 'utf-8');
    } catch {
      previousSig = '';
    }
  }
  if (previousSig !== currentSig) {
    const viteCacheDir = resolve(rootDir, 'node_modules/.vite');
    if (existsSync(viteCacheDir)) {
      try {
        rmSync(viteCacheDir, { recursive: true, force: true });
        // eslint-disable-next-line no-console
        console.log('[vite] SDK signature changed — cleared node_modules/.vite');
      } catch (err) {
        // eslint-disable-next-line no-console
        console.warn('[vite] failed to clear .vite cache:', err);
      }
    }
    try {
      writeFileSync(sigFile, currentSig);
    } catch {
      // Non-fatal — at worst the cache gets re-cleared next start.
    }
  }

  /* eslint-disable no-console */
  console.log(
    `[vite] tuikit-atomicx-vue3 source = ${source}${source === 'online' ? ` (v${version})` : ''}`,
  );
  if (source === 'online') {
    console.log(`[vite]   aliased to vendor (${aliasedPackages.length} packages): ${aliasedPackages.slice(0, 8).join(', ')}${aliasedPackages.length > 8 ? ', …' : ''}`);
    if (singletonPackages.length) {
      console.log(`[vite]   singletons kept on demo: ${singletonPackages.join(', ')}`);
    }
    if (atomicxHasMissing) {
      const which = [missingMain && 'main', missingLive && 'live'].filter(Boolean).join(' + ');
      console.log(`[vite]   SDK has missing exports (${which}) — installing shim alias`);
    }
  }
  /* eslint-enable no-console */

  return {
    base: process.env.NODE_ENV === 'production' ? './' : '/',
    envPrefix: ['VITE_'],
    define: {
      // Surface the resolved SDK source + version to runtime so the demo
      // can render a badge and a picker (see `App.vue` /
      // `SdkSourcePicker.vue`).
      'import.meta.env.VITE_ATOMICX_SOURCE': JSON.stringify(source),
      'import.meta.env.VITE_ATOMICX_VERSION': JSON.stringify(version),
      // The shared-singleton CSV that main.ts feeds to esm.sh's
      // `?external=`. Sourced from `injectImportMapBootstrapPlugin.mjs`
      // so the import-map entries, host-shim files, and esm.sh
      // request all come from a single list — no manual sync between
      // three files needed when adding/removing a shared package.
      'import.meta.env.VITE_ATOMICX_SHARED_SINGLETONS_CSV': JSON.stringify(SHARED_SINGLETONS_CSV),
    },
    resolve: {
      // Array form so the online-mode regex aliases sit alongside the
      // demo's own `@` alias. Vite tries entries in order, so we
      // unshift shim aliases up front — they're more specific than
      // the catch-all `tuikit-atomicx-vue3` alias inside
      // `atomicxAlias` and must take precedence.
      //
      // The shim aliases redirect to plugin-owned virtual ids; the
      // built-in `vite:resolve` plugin (which processes aliases
      // before any user resolveId hook fires) rewrites the specifier
      // to e.g. `virtual:atomicx-shim/main`, then the shim plugin's
      // own resolveId converts that to the `\0`-prefixed internal id
      // and load() returns the synthetic shim source.
      //
      // We register ONLY the aliases for entries that actually have
      // missing names. An entry without missing names continues to
      // resolve through the original `atomicxAlias` redirect to the
      // vendor dist file — no behaviour change, no shim overhead.
      //
      // In BUILD mode (v3) we additionally prepend a hard alias from
      // `tuikit-atomicx-vue3` (and any sub-entry) to our demo-side
      // facade at `src/services/sdk-source/facade.ts`. The facade reads from
      // `window.__ATOMICX_SDK__`, which `main.ts` populates by
      // dynamic-importing `https://esm.sh/tuikit-atomicx-vue3@<ver>?...`
      // at boot. This means demo source files keep their static
      // `import { ... } from 'tuikit-atomicx-vue3'` syntax across
      // dev/prod; only the resolution target changes.
      //
      // The build alias is unshifted to the FRONT so it takes
      // precedence over the dev-mode atomicxAlias / virtual shim
      // entries (which would never trigger in build mode anyway, but
      // defending against ordering surprises is cheap).
      alias: [
        ...(isBuild
          ? [
              { find: /^tuikit-atomicx-vue3\/.*$/, replacement: resolve(rootDir, 'src/services/sdk-source/facade.ts') },
              { find: 'tuikit-atomicx-vue3', replacement: resolve(rootDir, 'src/services/sdk-source/facade.ts') },
            ]
          : []),
        ...(missingLive
          ? [{ find: /^tuikit-atomicx-vue3\/live$/, replacement: VIRTUAL_LIVE_ALIAS }]
          : []),
        ...(missingMain
          ? [{ find: 'tuikit-atomicx-vue3', replacement: VIRTUAL_MAIN_ALIAS }]
          : []),
        ...atomicxAlias,
        { find: '@', replacement: resolve(rootDir, 'src') },
      ],
      // Force vite to dedupe the singletons even when the SDK has its
      // own copy under vendor/node_modules. This is the second line of
      // defence after we deliberately omitted those packages from the
      // alias table: dedupe makes sure both halves of any nested
      // resolution path also collapse to a single instance.
      dedupe: [...SINGLETON_PACKAGES],
    },
    optimizeDeps: {
      // In online mode we ALWAYS exclude the SDK + its sub-entries
      // from esbuild's dep pre-bundling. The published builds of
      // `tuikit-atomicx-vue3` use a Rollup-style multi-chunk output
      // (the main entry imports short identifiers like `d6` from
      // shared chunk files, then re-exports them under their public
      // names). On at least one observed combination (SDK 6.2.5,
      // vite 5.4.x, esbuild 0.21.x), esbuild's pre-bundling rewrite
      // produced a main `.vite/deps/tuikit-atomicx-vue3.js` whose
      // `import { d6 } from chunk-…js` ended up referring to a
      // symbol the chunk DOES NOT export, so the re-export
      // `d6 as SeatLayoutTemplate` resolved to undefined at link
      // time and the browser threw:
      //   "does not provide an export named 'SeatLayoutTemplate'"
      //
      // Letting vite serve the vendor dist files directly (no
      // esbuild rewrite) sidesteps the bug entirely: we lose a bit
      // of cold-start speed (a handful of extra small requests),
      // but every public export resolves correctly because no
      // chunking is happening.
      //
      // We still install/respect the missing-export shim plugin
      // (`sdkMissingShimPlugin`) — but its job is now narrower: it
      // covers the case where an OLDER published SDK version
      // genuinely lacks an export the demo uses. That's a different
      // failure mode from the pre-bundle codegen bug we're working
      // around here, and the two safety nets are independent.
      include: [],
      exclude: [
        ...SINGLETON_PACKAGES,
        ...(source === 'online' ? ['tuikit-atomicx-vue3', 'tuikit-atomicx-vue3/live'] : []),
      ],
    },
    build: {
      target: 'esnext',
      // -------------------------------------------------------------
      // Build-mode (v3): nothing is externalised by rollup.
      //
      // The demo bundle now contains vue / vue-router / uikit-base
      // as regular dependencies (regular `import 'vue'` resolved by
      // node_modules). The SDK package is handled via an alias to
      // `src/services/sdk-source/facade.ts` (see `resolve.alias` above), so
      // rollup never sees `tuikit-atomicx-vue3` as an external —
      // it sees the facade file which is just demo source code.
      //
      // The actual SDK loading happens at runtime in `main.ts` via
      // `import("https://esm.sh/tuikit-atomicx-vue3@<ver>?...")`,
      // which is a dynamic import literal that rollup leaves alone.
      // esm.sh handles every internal SDK dependency; only vue /
      // vue-router / uikit-base stay bare and are routed by a
      // static 3-entry importmap (injected by
      // `injectImportMapBootstrapPlugin`) to host-shim files.
      //
      // No special `external` config needed.
      // -------------------------------------------------------------
    },
    plugins: [
      // Build-time preflight: before rollup does its own strict static
      // import check, we scan `src/examples/*.ts` against `facade.ts` and
      // emit a friendly diagnostic if any hook / enum forwarder is
      // missing. Rollup would eventually catch the same problem, but its
      // native error ("<name> is not exported by facade.ts") doesn't
      // explain WHY the facade matters — this preflight puts the
      // "dev mode uses workspace symlink, build mode uses the facade"
      // context front-and-center so CI failures self-explain.
      //
      // Only registered in build mode. In dev, the workspace-symlinked
      // SDK is the resolution target and this check would be noise; the
      // vitest regression test covers dev-time.
      //
      // We also surface the type-only miss list as a `logger.warn`. Those
      // don't break rollup (types are stripped before rollup sees them)
      // but degrade IDE autocomplete, so keeping them visible in build
      // logs helps catch drift early.
      {
        name: 'live-api-example:facade-contract-preflight',
        apply: 'build',
        buildStart() {
          const result = scanFacadeContract({
            examplesDir: resolve(rootDir, 'src/examples'),
            facadePath: resolve(rootDir, 'src/services/sdk-source/facade.ts'),
          });
          if (Object.keys(result.missingTypes).length > 0) {
            this.warn(formatMissingTypes(result.missingTypes));
          }
          if (Object.keys(result.missingValues).length > 0) {
            // `this.error` aborts the build with the message inline —
            // preferable to letting rollup emit its raw "not exported"
            // error 200 lines later. The messages come from the shared
            // scanner so dev-test failures and build-time failures read
            // identically.
            this.error(formatMissingValues(result.missingValues));
          }
        },
      },
      vue(),
      // Missing-export shim MUST run BEFORE the alias resolver:
      // it intercepts `import 'tuikit-atomicx-vue3'` and redirects
      // to a virtual module that augments the real SDK with stub
      // bindings. When the active SDK doesn't have any missing
      // exports (workspace mode, or a fully-compatible online
      // version) the plugin is a no-op.
      sdkMissingShimPlugin({
        demoRoot: rootDir,
        getActiveSource: () => {
          const onlinePkgRoot = resolveOnlinePackageRoot(rootDir) as string | null;
          return source === 'online'
            ? { source: 'online', sdkRoot: onlinePkgRoot }
            : { source: 'workspace', sdkRoot: null };
        },
        runCompat: (demoRootArg: string, sdkRootArg: string) =>
          checkCompatibility(demoRootArg, sdkRootArg),
      }),
      sdkSwitcherPlugin(),
      // Build-only: inject the runtime importmap bootstrap into
      // index.html. The plugin is `apply:'build'`, so it does
      // nothing in dev — vite tree-shake-friendly conditional
      // registration isn't needed at the plugin-array level.
      injectImportMapBootstrapPlugin({
        demoRoot: rootDir,
      }),
    ],
    server: {
      open: true,
      host: true,
    },
  };
});
