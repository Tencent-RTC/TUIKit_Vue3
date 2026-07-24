#!/usr/bin/env node
/**
 * Install a real published `tuikit-atomicx-vue3` — together with its full
 * peer-dependency graph — into `vendor/tuikit-atomicx-online/node_modules`,
 * isolated from this monorepo's workspace symlink.
 *
 * Why a sibling root instead of installing into the demo itself:
 *   The demo's own `package.json` already pins `tuikit-atomicx-vue3` to
 *   `workspace:*`, which pnpm resolves to the in-repo source package. We
 *   need both sources reachable on disk simultaneously so the user can
 *   toggle between them at runtime via the SDK picker without re-
 *   installing the demo. Keeping the "online" copy in a sibling root
 *   with its own `package.json` and its own `node_modules` is the
 *   simplest way to avoid pnpm trying to merge / dedupe them.
 *
 * Why we install peers explicitly (not just `tuikit-atomicx-vue3`):
 *   npm does NOT auto-install peerDependencies. The published SDK
 *   declares heavyweight peers (`@tencentcloud/lite-chat`,
 *   `@tencentcloud/chat-uikit-engine-lite`,
 *   `@tencentcloud/tui-core-lite`, `@tencentcloud/tuiroom-engine-js`,
 *   `@tencentcloud/uikit-base-component-vue3`, `vue`) which the SDK's
 *   own dist files `import` at runtime. Vite resolves these from the
 *   nearest `node_modules` walking up from the importer, so once we
 *   alias the SDK to `vendor/...`, all those peer imports need to be
 *   resolvable inside vendor too — otherwise esbuild fails with
 *   "Could not resolve" at pre-bundle time. Installing the peers
 *   directly into the vendor root puts them on the right resolution
 *   path AND pins them to the exact ranges the published SDK declared,
 *   which is the whole point of "switch SDK ↔ switch its dep graph as
 *   a unit".
 *
 * Usage:
 *   node scripts/install-online-sdk.mjs                 # installs `latest`
 *   node scripts/install-online-sdk.mjs --version 6.2.5
 *   node scripts/install-online-sdk.mjs --version next
 *   node scripts/install-online-sdk.mjs --version 6.2.5 --registry https://...
 *
 * The script performs two installs in sequence:
 *   1) Pin `tuikit-atomicx-vue3@<version>` in vendor/package.json and
 *      run `npm install` to materialise its tarball. This step alone
 *      already pulls the SDK's `dependencies` (tiptap, axios, reka-ui,
 *      ...), just not its `peerDependencies`.
 *   2) Read the just-installed SDK's `peerDependencies`, write each one
 *      into vendor/package.json with the declared range, and run
 *      `npm install` again. After this pass every package the SDK can
 *      possibly `import` is reachable from `vendor/node_modules`.
 *
 * Finally we write three metadata files for downstream consumers:
 *   - `.installed.json`  — current SDK version + timestamp
 *   - `.versions.json`   — rolling history (latest first) for the picker
 *   - `.deps.json`       — actual resolved versions of every peer
 *                          (mostly informational; surfaced by the picker
 *                          so reviewers know exactly which dep graph is
 *                          live).
 */
import { execSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';
import { existsSync, readFileSync, writeFileSync } from 'node:fs';

import { recordInstalledVersion } from './sdkState.mjs';
import { checkCompatibility } from './sdkCompatibility.mjs';

const here = dirname(fileURLToPath(import.meta.url));
const demoRoot = resolve(here, '..');
const vendorRoot = resolve(demoRoot, 'vendor', 'tuikit-atomicx-online');
const vendorPkgPath = resolve(vendorRoot, 'package.json');
const installedPkgPath = resolve(vendorRoot, 'node_modules', 'tuikit-atomicx-vue3', 'package.json');
const markerPath = resolve(vendorRoot, '.installed.json');
const depsManifestPath = resolve(vendorRoot, '.deps.json');

function parseArgs(argv) {
  const args = { version: 'latest', registry: undefined };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === '--version' || a === '-v') {
      args.version = argv[++i];
    } else if (a.startsWith('--version=')) {
      args.version = a.slice('--version='.length);
    } else if (a === '--registry') {
      args.registry = argv[++i];
    } else if (a.startsWith('--registry=')) {
      args.registry = a.slice('--registry='.length);
    } else if (a === '--help' || a === '-h') {
      console.log('Usage: install-online-sdk.mjs [--version <x.y.z|latest|next>] [--registry <url>]');
      process.exit(0);
    }
  }
  if (!args.version) {
    throw new Error('Missing --version');
  }
  return args;
}

/**
 * Rewrite vendor/package.json so `dependencies` contains only the
 * requested SDK version (plus, on the second pass, all of its peers).
 * Using the dependencies field — rather than installing positionally
 * via `npm install <pkg>@<ver>` — ensures the install is fully
 * declarative: re-running `npm install` in vendor/ always reproduces
 * the same dep graph.
 */
function writeVendorPackageJson(deps) {
  const pkg = JSON.parse(readFileSync(vendorPkgPath, 'utf-8'));
  pkg.dependencies = { ...deps };
  // We intentionally do NOT keep stale entries from a previous install
  // — overwriting the dependencies map prevents an old peer version
  // from shadowing a newer one when the operator upgrades the SDK.
  writeFileSync(vendorPkgPath, `${JSON.stringify(pkg, null, 2)}\n`);
}

function runNpmInstall(registry, stageLabel) {
  // `--no-save` keeps vendor/package.json (which we already authored)
  // exactly as-is; `--no-package-lock` keeps the lockfile out of git;
  // `--legacy-peer-deps` makes npm tolerate peers that don't perfectly
  // satisfy each other (we manage peer selection ourselves).
  const flags = ['--no-save', '--no-package-lock', '--legacy-peer-deps'];
  if (registry) {
    flags.push(`--registry=${registry}`);
  }
  const cmd = `npm install ${flags.join(' ')}`;
  // eslint-disable-next-line no-console
  console.log(`[install-online-sdk] (${stageLabel}) cwd=${vendorRoot}`);
  // eslint-disable-next-line no-console
  console.log(`[install-online-sdk] (${stageLabel}) ${cmd}`);
  execSync(cmd, { cwd: vendorRoot, stdio: 'inherit' });
}

/**
 * Read peerDependencies from the just-installed SDK. Returns an object
 * mapping peer-name → declared range (e.g. `'@tencentcloud/lite-chat'`
 * → `'^1.6.15'`). Skips peers explicitly marked `optional: true` in
 * `peerDependenciesMeta`.
 */
function readSdkPeers() {
  if (!existsSync(installedPkgPath)) {
    throw new Error(
      `Installed tuikit-atomicx-vue3 not found at ${installedPkgPath}. Did the first npm install fail?`,
    );
  }
  const pkg = JSON.parse(readFileSync(installedPkgPath, 'utf-8'));
  const peers = pkg.peerDependencies || {};
  const meta = pkg.peerDependenciesMeta || {};
  const out = {};
  for (const [name, range] of Object.entries(peers)) {
    if (meta[name]?.optional) continue;
    out[name] = range;
  }
  return out;
}

/**
 * After the second install pass, look up the actual version that
 * `npm install` resolved each peer to. This is the source of truth
 * for what's currently materialised on disk and what the dev plugin
 * surfaces in `/__sdk/state`.
 */
function resolveActualVersion(pkgName) {
  // npm hoists @scope/x to vendor/node_modules/@scope/x/package.json.
  const segments = pkgName.split('/');
  const pkgJsonPath = resolve(vendorRoot, 'node_modules', ...segments, 'package.json');
  if (!existsSync(pkgJsonPath)) {
    return null;
  }
  try {
    const pkg = JSON.parse(readFileSync(pkgJsonPath, 'utf-8'));
    return typeof pkg.version === 'string' ? pkg.version : null;
  } catch {
    return null;
  }
}

function writeMarker() {
  const pkg = JSON.parse(readFileSync(installedPkgPath, 'utf-8'));
  const payload = {
    version: pkg.version,
    installedAt: new Date().toISOString(),
  };
  writeFileSync(markerPath, `${JSON.stringify(payload, null, 2)}\n`);
  try {
    recordInstalledVersion(demoRoot, pkg.version);
  } catch (err) {
    // History is best-effort metadata — failure to record it should
    // never block the install. Surface it but don't throw.
    // eslint-disable-next-line no-console
    console.warn(`[install-online-sdk] could not record history: ${err?.message || err}`);
  }
  return pkg.version;
}

/**
 * Write `.deps.json` — the manifest the dev plugin's `/__sdk/state`
 * surfaces and the SDK picker shows in its UI tooltip. Carries both
 * the requested range AND the resolved version of every peer (so an
 * operator can tell at a glance whether the on-disk copy diverges
 * from what the SDK declared), AND a compatibility check against
 * the demo source.
 *
 * The compatibility check is the gatekeeper that prevents the
 * operator from switching to a version known to be missing exports
 * the demo uses — see `sdkSwitcherPlugin.mjs`'s `/__sdk/switch`.
 * We record the result on disk so the picker UI can show
 * "incompatible" badges without re-running the check on every
 * `GET /__sdk/state`.
 */
function writeDepsManifest(sdkVersion, requestedPeers) {
  const peersResolved = {};
  const missingPeers = [];
  for (const [name, range] of Object.entries(requestedPeers)) {
    const resolved = resolveActualVersion(name);
    peersResolved[name] = { range, resolved };
    if (!resolved) {
      missingPeers.push(name);
    }
  }
  // Run the demo-source ↔ SDK-exports diff. Done here (not in the
  // plugin) so the result is captured at install time and survives
  // an editor close + restart cycle; the plugin just reads it.
  let compatibility;
  try {
    const sdkRoot = resolve(vendorRoot, 'node_modules', 'tuikit-atomicx-vue3');
    compatibility = checkCompatibility(demoRoot, sdkRoot);
  } catch (err) {
    compatibility = {
      ok: false,
      error: `compat check failed: ${err?.message || err}`,
    };
  }
  writeFileSync(
    depsManifestPath,
    `${JSON.stringify(
      {
        sdk: { name: 'tuikit-atomicx-vue3', version: sdkVersion },
        peers: peersResolved,
        compatibility,
        installedAt: new Date().toISOString(),
      },
      null,
      2,
    )}\n`,
  );
  if (missingPeers.length) {
    // Fail loudly — the second install pass was supposed to fix this.
    // Leaving a half-installed dep graph would cause cryptic
    // "Could not resolve" errors when vite tries to start.
    throw new Error(
      `[install-online-sdk] peer dependencies missing after install: ${missingPeers.join(', ')}. `
        + `Check the npm install log above for resolution errors.`,
    );
  }
  if (compatibility && compatibility.ok === false && Array.isArray(compatibility.missing)) {
    // Print a hint, but DON'T throw — install completes successfully
    // and the operator may still want to inspect this version. The
    // gate happens at switch time.
    const sample = compatibility.missing
      .slice(0, 6)
      .map(m => `${m.entry}::${m.name}`)
      .join(', ');
    const more = compatibility.missing.length > 6
      ? ` (+${compatibility.missing.length - 6} more)`
      : '';
    // eslint-disable-next-line no-console
    console.warn(
      `[install-online-sdk] ⚠️  this SDK version is missing ${compatibility.missing.length} export(s) ` +
        `used by the demo: ${sample}${more}. ` +
        `Switching to it will still work, but example groups that depend on the missing exports ` +
        `will be greyed out (the missing-export shim plugin keeps the rest of the app running).`,
    );
  }
}

/* ---------- main ---------- */
const { version: requestedVersion, registry } = parseArgs(process.argv.slice(2));

// Pass 1: install the SDK alone so we can read its peerDependencies.
writeVendorPackageJson({ 'tuikit-atomicx-vue3': requestedVersion });
runNpmInstall(registry, 'pass 1/2: SDK only');

// Pass 2: install SDK + all declared peers in a single declarative pass.
const peers = readSdkPeers();
// eslint-disable-next-line no-console
console.log(
  `[install-online-sdk] peerDependencies declared by SDK:\n${
    Object.entries(peers).map(([k, v]) => `  - ${k}@${v}`).join('\n')
  }`,
);
writeVendorPackageJson({
  'tuikit-atomicx-vue3': requestedVersion,
  ...peers,
});
runNpmInstall(registry, 'pass 2/2: SDK + peers');

const resolvedSdkVersion = writeMarker();
writeDepsManifest(resolvedSdkVersion, peers);
// eslint-disable-next-line no-console
console.log(`[install-online-sdk] installed tuikit-atomicx-vue3@${resolvedSdkVersion} with full peer graph.`);
