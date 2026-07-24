/**
 * Shared helpers for the SDK source state file (`.current.json`) that the
 * dev-only vite plugin (`sdkSwitcherPlugin`) reads/writes and that
 * `vite.config.ts` consults at startup to decide which copy of
 * `tuikit-atomicx-vue3` to resolve.
 *
 * The state file lives at:
 *   vendor/tuikit-atomicx-online/.current.json
 *
 * Layout:
 *   { "source": "workspace" }
 *   { "source": "online", "version": "6.2.5" }
 *
 * Why a file (not a long-lived in-memory variable) is the source of truth:
 *   - Vite's `resolve.alias` is decided at config-load time, so flipping
 *     the source requires a server restart. The restart triggers
 *     `vite.config.ts` to re-execute and read the file again.
 *   - Browsers / pages do not need to remember anything: after a server
 *     restart, the websocket reconnect fires a full reload and the new
 *     bundle reflects the requested source automatically.
 *   - A file also survives `Ctrl-C` then `pnpm dev` again, so the operator
 *     keeps whichever source they last picked.
 *
 * Both this file and `install-online-sdk.mjs` deliberately use only
 * Node built-ins so they can be loaded by both the vite config (ESM,
 * synchronous) and by the dev plugin (ESM, async or sync).
 */
import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';

const PACKAGE_NAME = 'tuikit-atomicx-vue3';

/**
 * Packages that MUST remain singletons across the demo and the SDK,
 * regardless of which copy of `tuikit-atomicx-vue3` is currently
 * selected. Vue's reactivity is the obvious example: if the demo's
 * `import { ref } from 'vue'` and the SDK's internal `import { ref }
 * from 'vue'` resolve to two different module instances, the demo's
 * components can't observe the SDK's refs. Same logic applies to
 * `vue-router` (shared route tree) and the UIKit base component
 * package (which exposes a global theme provider singleton).
 *
 * These packages exist in BOTH the demo's `node_modules` (via the
 * monorepo workspace) and the vendor `node_modules` (because the SDK
 * lists them as peers). The vite resolver below routes every import
 * of these names back to the demo copy — even when the importer is
 * inside the vendor tree.
 *
 * If you add a new dep that turns out to need singleton semantics (a
 * common sign: `console.warn` about "two app instances" or "duplicate
 * store"), append it here.
 */
const SINGLETON_PACKAGES = new Set([
  'vue',
  'vue-router',
  '@tencentcloud/uikit-base-component-vue3',
]);

/**
 * Path layout helper. `demoRoot` is the api-example-vue3 root directory
 * (the one containing `vite.config.ts`).
 */
function paths(demoRoot) {
  const vendorRoot = resolve(demoRoot, 'vendor', 'tuikit-atomicx-online');
  return {
    vendorRoot,
    currentStatePath: resolve(vendorRoot, '.current.json'),
    installedPkgPath: resolve(vendorRoot, 'node_modules', PACKAGE_NAME, 'package.json'),
    // History of every version that has been installed (latest first), so
    // the UI can show "previously installed" as quick-pick choices even
    // when only one version is currently materialised under node_modules.
    historyPath: resolve(vendorRoot, '.versions.json'),
    // Authored by `install-online-sdk.mjs` after each install — lists the
    // peer dependencies the just-installed SDK version declared and the
    // resolved version that ended up on disk. Used by the picker tooltip
    // and (read-only) by `/__sdk/state`.
    depsManifestPath: resolve(vendorRoot, '.deps.json'),
    nodeModulesRoot: resolve(vendorRoot, 'node_modules'),
  };
}

/**
 * Read the active SDK selection. Returns `{ source: 'workspace' }` when
 * the file is missing / malformed — that is also the implicit default for
 * a fresh checkout.
 */
function readCurrentState(demoRoot) {
  const { currentStatePath } = paths(demoRoot);
  if (!existsSync(currentStatePath)) {
    return { source: 'workspace' };
  }
  try {
    const raw = JSON.parse(readFileSync(currentStatePath, 'utf-8'));
    if (raw && raw.source === 'online' && typeof raw.version === 'string' && raw.version) {
      return { source: 'online', version: raw.version };
    }
    return { source: 'workspace' };
  } catch {
    return { source: 'workspace' };
  }
}

/**
 * Persist the new SDK selection. Online mode requires a non-empty
 * version string — callers must validate availability themselves.
 */
function writeCurrentState(demoRoot, state) {
  const { currentStatePath } = paths(demoRoot);
  if (state.source !== 'workspace' && state.source !== 'online') {
    throw new Error(`Invalid source: ${state.source}`);
  }
  if (state.source === 'online' && (!state.version || typeof state.version !== 'string')) {
    throw new Error('online source requires a non-empty version string');
  }
  const payload = state.source === 'online'
    ? { source: 'online', version: state.version, updatedAt: new Date().toISOString() }
    : { source: 'workspace', updatedAt: new Date().toISOString() };
  writeFileSync(currentStatePath, `${JSON.stringify(payload, null, 2)}\n`);
}

/**
 * Discover the versions actually materialised on disk. We use the
 * vendor's node_modules — that's what the alias would resolve to if the
 * operator switched right now. The history list (`.versions.json`) is
 * merged in so previously installed-then-overwritten versions still
 * appear as quick picks, but anything not currently materialised is
 * tagged `installed: false`.
 */
function listInstalledVersions(demoRoot) {
  const { installedPkgPath, historyPath } = paths(demoRoot);
  let materialised = null;
  if (existsSync(installedPkgPath)) {
    try {
      const pkg = JSON.parse(readFileSync(installedPkgPath, 'utf-8'));
      if (pkg && typeof pkg.version === 'string') {
        materialised = pkg.version;
      }
    } catch {
      /* ignore */
    }
  }
  let history = [];
  if (existsSync(historyPath)) {
    try {
      const raw = JSON.parse(readFileSync(historyPath, 'utf-8'));
      if (Array.isArray(raw?.versions)) {
        history = raw.versions.filter(v => typeof v === 'string');
      }
    } catch {
      /* ignore */
    }
  }
  const seen = new Set();
  const out = [];
  if (materialised) {
    out.push({ version: materialised, installed: true });
    seen.add(materialised);
  }
  for (const v of history) {
    if (seen.has(v)) continue;
    seen.add(v);
    out.push({ version: v, installed: false });
  }
  return out;
}

/**
 * Append a freshly installed version to the history file. Idempotent:
 * the version is deduplicated and lifted to the top of the list so the
 * UI's "recent first" ordering remains intuitive.
 */
function recordInstalledVersion(demoRoot, version) {
  const { historyPath } = paths(demoRoot);
  let history = [];
  if (existsSync(historyPath)) {
    try {
      const raw = JSON.parse(readFileSync(historyPath, 'utf-8'));
      if (Array.isArray(raw?.versions)) {
        history = raw.versions.filter(v => typeof v === 'string' && v !== version);
      }
    } catch {
      /* ignore */
    }
  }
  history.unshift(version);
  writeFileSync(
    historyPath,
    `${JSON.stringify({ versions: history, updatedAt: new Date().toISOString() }, null, 2)}\n`,
  );
}

/**
 * Resolve the literal directory the alias should point at when the
 * online source is selected. Returns null if not present on disk.
 */
function resolveOnlinePackageRoot(demoRoot) {
  const { vendorRoot } = paths(demoRoot);
  const pkgRoot = resolve(vendorRoot, 'node_modules', PACKAGE_NAME);
  return existsSync(pkgRoot) ? pkgRoot : null;
}

/**
 * Lightweight existence probe that doesn't read package.json — used by
 * `vite.config.ts` to fail-fast at startup with a friendly message when
 * the operator selected online mode but never installed anything.
 */
function ensureOnlineInstalled(demoRoot) {
  const root = resolveOnlinePackageRoot(demoRoot);
  if (!root) {
    const { vendorRoot } = paths(demoRoot);
    // Include a hint for CI environments (Bluesky / Landun etc.): the most
    // common trigger for this error in CI is a pipeline that shells out to
    // `pnpm build:online` (or exports `VITE_ATOMICX_SOURCE=online`) without
    // the required `pnpm vendor:install` prestep. Point the operator at
    // both fixes so they don't have to grep the README.
    throw new Error(
      [
        '[sdk-switcher] online source is selected but the vendor copy is missing at',
        resolve(vendorRoot, 'node_modules', PACKAGE_NAME) + '.',
        'Fix options:',
        '  (dev)  Install one from the topbar SDK picker, or run',
        '         `pnpm vendor:install --version <x.y.z>` manually.',
        '  (CI)   If you only need a production build of the demo, switch',
        '         the pipeline command from `pnpm build:online` to `pnpm build`',
        '         (workspace mode, no vendor prestep needed). If you truly',
        '         want to validate the published SDK, prepend',
        '         `pnpm vendor:install --version <x.y.z>` before the build.',
      ].join(' '),
    );
  }
  return root;
}

/**
 * Read the dep manifest written by `install-online-sdk.mjs`. Returns
 * `null` when no install has happened yet (or the install crashed
 * before writing the manifest).
 */
function readDepsManifest(demoRoot) {
  const { depsManifestPath } = paths(demoRoot);
  if (!existsSync(depsManifestPath)) {
    return null;
  }
  try {
    const raw = JSON.parse(readFileSync(depsManifestPath, 'utf-8'));
    if (raw && typeof raw === 'object') {
      return raw;
    }
  } catch {
    /* ignore */
  }
  return null;
}

/**
 * Resolve `name` to its actual directory inside the vendor's
 * `node_modules`. Returns null when the package is absent.
 *
 * We deliberately go through `package.json` instead of a bare
 * `existsSync(<dir>)` so callers know the package is truly installed,
 * not just a dangling directory (e.g. a partially-cleaned mid-install).
 */
function resolveVendorPackagePath(demoRoot, name) {
  const { nodeModulesRoot } = paths(demoRoot);
  const segments = name.split('/');
  const dir = resolve(nodeModulesRoot, ...segments);
  const pkgJson = resolve(dir, 'package.json');
  if (existsSync(pkgJson)) {
    return dir;
  }
  return null;
}

/**
 * Build the alias whitelist for online mode.
 *
 * Key insight: SDK `dependencies` are already bundled into its `dist/`
 * by its publish pipeline, so they DON'T appear as bare-specifier
 * imports at runtime. Only `peerDependencies` (which the consumer is
 * expected to install) need aliasing — those are what the SDK's dist
 * files still `import` by name. By scoping the alias list to peers
 * we keep vite's resolver focused on real runtime imports and avoid
 * accidentally aliasing `@types/*` / config-only / nested chunk-only
 * packages, which leads to esbuild "Could not optimize dependency"
 * or "Could not resolve" errors at pre-bundle time.
 *
 * The SDK itself + its sub-entries (`tuikit-atomicx-vue3` and e.g.
 * `tuikit-atomicx-vue3/live`) are handled separately by the caller —
 * those need slightly different alias shapes (sub-entry path mapping).
 *
 * Returns an array of `{ name, path }` for each peer that BOTH:
 *   - is declared in the SDK's `peerDependencies` AND
 *   - is actually materialised under `vendor/node_modules` AND
 *   - is NOT in `SINGLETON_PACKAGES` (those must stay shared with the
 *     demo to keep Vue / vue-router / UIKitProvider as singletons).
 *
 * If a declared peer is missing from disk, we silently skip it; the
 * install script's own validation already failed loudly in that case.
 */
function listAliasTargets(demoRoot) {
  const { installedPkgPath } = paths(demoRoot);
  if (!existsSync(installedPkgPath)) {
    return [];
  }
  let sdkPkg;
  try {
    sdkPkg = JSON.parse(readFileSync(installedPkgPath, 'utf-8'));
  } catch {
    return [];
  }
  const peers = sdkPkg?.peerDependencies || {};
  const out = [];
  for (const name of Object.keys(peers)) {
    if (SINGLETON_PACKAGES.has(name)) continue;
    const path = resolveVendorPackagePath(demoRoot, name);
    if (path) {
      out.push({ name, path });
    }
  }
  return out;
}

export {
  PACKAGE_NAME,
  SINGLETON_PACKAGES,
  paths,
  readCurrentState,
  writeCurrentState,
  listInstalledVersions,
  recordInstalledVersion,
  resolveOnlinePackageRoot,
  ensureOnlineInstalled,
  readDepsManifest,
  listAliasTargets,
};
