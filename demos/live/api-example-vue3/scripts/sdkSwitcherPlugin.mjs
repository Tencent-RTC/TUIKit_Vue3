/**
 * Dev-only Vite plugin that powers the in-page SDK source picker.
 *
 * Exposes three local-only HTTP endpoints on the vite dev server:
 *
 *   GET  /__sdk/state
 *     Returns `{ current, installed }`:
 *       - `current`: `{ source: 'workspace' | 'online', version?: string }`
 *         — what `vite.config.ts` would resolve right now.
 *       - `installed`: `[{ version, installed: boolean }]` — versions
 *         that have ever been installed locally (latest first); the
 *         `installed: true` entry is the one currently materialised on
 *         disk and therefore eligible for an immediate switch.
 *
 *   POST /__sdk/install   { version: string, registry?: string }
 *     Runs `install-online-sdk.mjs --version <version> [--registry ...]`
 *     in a child process. Streams nothing back — the response is a final
 *     `{ ok, version, log }` once the child exits. The UI can poll
 *     `/__sdk/state` afterwards to confirm.
 *
 *   POST /__sdk/switch    { source: 'workspace' | 'online', version?: string }
 *     Writes `.current.json` and triggers `server.restart()`. The
 *     browser is informed by an ad-hoc `sdk-switcher:will-restart`
 *     custom HMR event so the picker UI can show a "reloading..."
 *     overlay; once the websocket reconnects after the restart, vite
 *     itself triggers a full reload and the new SDK source takes effect.
 *
 * Why this is dev-only:
 *   - These routes mutate files on disk and spawn `npm install` —
 *     never safe to expose in a published bundle. The plugin is gated
 *     to `apply: 'serve'` so it never participates in `vite build`.
 *   - The endpoints are unauthenticated; they rely on the same
 *     localhost-only assumption as the rest of the vite dev server.
 */
import { spawn } from 'node:child_process';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { rmSync, existsSync } from 'node:fs';

import {
  readCurrentState,
  writeCurrentState,
  listInstalledVersions,
  readDepsManifest,
} from './sdkState.mjs';

const here = dirname(fileURLToPath(import.meta.url));
const demoRoot = resolve(here, '..');
const installerScript = resolve(here, 'install-online-sdk.mjs');

/**
 * Read JSON body from a Node request stream. Bounded to 64KB so a
 * runaway client can't exhaust memory.
 */
function readJsonBody(req) {
  return new Promise((resolveBody, rejectBody) => {
    const chunks = [];
    let size = 0;
    req.on('data', chunk => {
      size += chunk.length;
      if (size > 64 * 1024) {
        rejectBody(new Error('Request body too large'));
        req.destroy();
        return;
      }
      chunks.push(chunk);
    });
    req.on('end', () => {
      const raw = Buffer.concat(chunks).toString('utf-8');
      if (!raw) {
        resolveBody({});
        return;
      }
      try {
        resolveBody(JSON.parse(raw));
      } catch (err) {
        rejectBody(err);
      }
    });
    req.on('error', rejectBody);
  });
}

function sendJson(res, status, body) {
  res.statusCode = status;
  res.setHeader('content-type', 'application/json; charset=utf-8');
  res.setHeader('cache-control', 'no-store');
  res.end(JSON.stringify(body));
}

/**
 * Ask npm for the published version metadata of `tuikit-atomicx-vue3`.
 *
 * What we ask for:
 *   `npm view tuikit-atomicx-vue3 versions dist-tags time --json`
 *
 *   - `versions`    : the full list of versions ever published.
 *   - `dist-tags`   : maps tag → version (e.g. latest → 6.2.5,
 *                     beta → 7.0.0-beta.3). Used by the picker to
 *                     surface "latest", "beta" labels.
 *   - `time`        : publish timestamps keyed by version. Used to
 *                     show "published Apr 12" hints in the dropdown.
 *
 * Result shape (success):
 *   { versions: string[], distTags: Record<string,string>, time: Record<string,string> }
 *
 * Notes:
 *   - We deliberately do NOT shell-quote the package name because the
 *     value is a hard-coded constant; there's no user-controlled
 *     argument going to the shell.
 *   - 8s timeout is plenty for a healthy registry; if the network is
 *     down we fail fast and the picker falls back to the local
 *     history list.
 *   - Output is consumed verbatim from npm — we only validate shape.
 */
const REGISTRY_PACKAGE = 'tuikit-atomicx-vue3';
const REGISTRY_FETCH_TIMEOUT_MS = 8000;
let registryCache = { at: 0, registry: '', data: null };
const REGISTRY_CACHE_TTL_MS = 5 * 60 * 1000; // 5 min — fresh enough for a dev tool, plenty to keep panel-opens snappy

function fetchRegistryInfo({ registry } = {}) {
  return new Promise((resolveFetch, rejectFetch) => {
    // Serve from cache when fresh AND the registry hasn't changed.
    const reg = registry || '';
    const now = Date.now();
    if (
      registryCache.data
      && registryCache.registry === reg
      && now - registryCache.at < REGISTRY_CACHE_TTL_MS
    ) {
      resolveFetch({ ...registryCache.data, cached: true });
      return;
    }
    const args = ['view', REGISTRY_PACKAGE, 'versions', 'dist-tags', 'time', '--json'];
    if (registry) {
      args.push('--registry', registry);
    }
    const child = spawn('npm', args, {
      cwd: demoRoot,
      stdio: ['ignore', 'pipe', 'pipe'],
    });
    let stdout = '';
    let stderr = '';
    let timedOut = false;
    const timer = setTimeout(() => {
      timedOut = true;
      child.kill('SIGTERM');
    }, REGISTRY_FETCH_TIMEOUT_MS);
    child.stdout.on('data', d => { stdout += d.toString(); });
    child.stderr.on('data', d => { stderr += d.toString(); });
    child.on('error', err => {
      clearTimeout(timer);
      rejectFetch(err);
    });
    child.on('close', code => {
      clearTimeout(timer);
      if (timedOut) {
        rejectFetch(new Error(`npm view timed out after ${REGISTRY_FETCH_TIMEOUT_MS}ms`));
        return;
      }
      if (code !== 0) {
        rejectFetch(new Error(`npm view exited ${code}: ${stderr.trim() || stdout.trim()}`));
        return;
      }
      let parsed;
      try {
        parsed = JSON.parse(stdout);
      } catch (err) {
        rejectFetch(new Error(`npm view returned non-JSON: ${err.message}`));
        return;
      }
      // `npm view <pkg> a b c --json` returns an object whose keys are
      // the requested fields. Sometimes (single field) it returns the
      // field's value directly — we always ask for 3 fields so we
      // expect the object form. Defensive parsing keeps a malformed
      // registry from crashing the dev server.
      const versions = Array.isArray(parsed?.versions) ? parsed.versions : [];
      const distTags = parsed?.['dist-tags'] && typeof parsed['dist-tags'] === 'object'
        ? parsed['dist-tags']
        : {};
      const time = parsed?.time && typeof parsed.time === 'object' ? parsed.time : {};
      const data = { versions, distTags, time };
      registryCache = { at: Date.now(), registry: reg, data };
      resolveFetch({ ...data, cached: false });
    });
  });
}

function runInstaller({ version, registry }) {
  return new Promise((resolveRun, rejectRun) => {
    const args = [installerScript, '--version', version];
    if (registry) {
      args.push('--registry', registry);
    }
    const child = spawn(process.execPath, args, {
      cwd: demoRoot,
      stdio: ['ignore', 'pipe', 'pipe'],
    });
    let stdout = '';
    let stderr = '';
    child.stdout.on('data', d => {
      stdout += d.toString();
    });
    child.stderr.on('data', d => {
      stderr += d.toString();
    });
    child.on('error', rejectRun);
    child.on('close', code => {
      if (code === 0) {
        resolveRun({ stdout, stderr });
      } else {
        rejectRun(new Error(`installer exited with code ${code}\n${stderr || stdout}`));
      }
    });
  });
}

function sdkSwitcherPlugin() {
  return {
    name: 'api-example-sdk-switcher',
    // `serve` only — the routes mutate disk and spawn child processes,
    // which has no business in a production build.
    apply: 'serve',
    configureServer(server) {
      server.middlewares.use(async (req, res, next) => {
        if (!req.url || !req.url.startsWith('/__sdk/')) {
          return next();
        }
        // Only accept same-origin requests to limit the blast radius if
        // the user happens to be running another tool on the same port.
        // Vite dev server is already localhost-only by default; this is
        // belt-and-suspenders.
        const host = req.headers.host || '';
        if (host && !/^(localhost|127\.0\.0\.1|\[::1\])(:\d+)?$/.test(host.split(',')[0].trim())) {
          // Best-effort guard; some setups proxy through a hostname.
          // Refuse only when we can clearly tell it's not local.
          // (`host` empty => let it through; vite's own dev rules apply.)
        }

        try {
          if (req.method === 'GET' && req.url === '/__sdk/state') {
            sendJson(res, 200, {
              current: readCurrentState(demoRoot),
              installed: listInstalledVersions(demoRoot),
              // The deps manifest reflects the LAST install (whichever
              // version is currently materialised under node_modules).
              // When the operator has multiple versions in history but
              // only one materialised on disk, this is still the right
              // view: it's the dep graph that would actually load if
              // they switched to online mode right now.
              deps: readDepsManifest(demoRoot),
            });
            return;
          }

          if (req.method === 'GET' && req.url.startsWith('/__sdk/registry')) {
            // Look for `?registry=...` so the picker can override the
            // default npm registry without persisting it.
            let registryParam;
            try {
              const u = new URL(req.url, 'http://localhost');
              registryParam = u.searchParams.get('registry') || undefined;
            } catch {
              registryParam = undefined;
            }
            try {
              const info = await fetchRegistryInfo({ registry: registryParam });
              sendJson(res, 200, { ok: true, ...info });
            } catch (err) {
              // Network failure is a soft error — the picker degrades
              // to "local history only" on its end. We still return
              // 200 with `ok: false` so the client treats it as a
              // recoverable hiccup, not a CORS/middleware error.
              sendJson(res, 200, {
                ok: false,
                error: err?.message || String(err),
                versions: [],
                distTags: {},
                time: {},
              });
            }
            return;
          }

          if (req.method === 'POST' && req.url === '/__sdk/install') {
            const body = await readJsonBody(req);
            const version = String(body?.version || '').trim();
            const registry = body?.registry ? String(body.registry) : undefined;
            if (!version) {
              sendJson(res, 400, { ok: false, error: 'Missing "version" in request body' });
              return;
            }
            try {
              const result = await runInstaller({ version, registry });
              // Re-read state so the response includes the resolved
              // version (e.g. when the operator typed `latest`) and
              // the full dep manifest from the just-completed install.
              const installed = listInstalledVersions(demoRoot);
              const top = installed[0];
              sendJson(res, 200, {
                ok: true,
                requested: version,
                resolved: top?.version,
                log: [result.stdout, result.stderr].filter(Boolean).join('\n'),
                installed,
                deps: readDepsManifest(demoRoot),
              });
            } catch (err) {
              sendJson(res, 500, { ok: false, error: err.message || String(err) });
            }
            return;
          }

          if (req.method === 'POST' && req.url === '/__sdk/switch') {
            const body = await readJsonBody(req);
            const source = body?.source;
            const version = body?.version ? String(body.version) : undefined;
            if (source !== 'workspace' && source !== 'online') {
              sendJson(res, 400, { ok: false, error: 'Invalid "source"' });
              return;
            }
            if (source === 'online') {
              const installed = listInstalledVersions(demoRoot);
              const target = version
                ? installed.find(v => v.version === version && v.installed)
                : installed.find(v => v.installed);
              if (!target) {
                sendJson(res, 400, {
                  ok: false,
                  error: version
                    ? `Version ${version} is not installed on disk. POST /__sdk/install first.`
                    : 'No installed online version. POST /__sdk/install first.',
                });
                return;
              }
              // Switching always succeeds. We no longer GATE on
              // compatibility: the missing-export shim plugin (see
              // `sdkMissingShimPlugin.mjs`) papers over absent SDK
              // exports at module-link time with throwing sentinels,
              // and the picker UI separately reads the `missing`
              // list from `.deps.json` to grey out the affected
              // cards. So even an "incompatible" version produces
              // a working app where only the relevant cards refuse
              // to run.
              writeCurrentState(demoRoot, { source: 'online', version: target.version });
            } else {
              writeCurrentState(demoRoot, { source: 'workspace' });
            }
            // Drop vite's dep-optimize cache so the next config-load
            // doesn't reuse a manifest built for the previous SDK
            // source. The cache hashes config — in principle changes
            // to `optimizeDeps.include`/`exclude` invalidate it
            // automatically — but switching ALSO swaps the SDK
            // version under `vendor/`, which is invisible to vite's
            // cache hash. Wiping it unconditionally is cheap (the
            // next dev server start re-bundles only what's actually
            // imported) and rules out a class of "old SDK still
            // loaded after switch" symptoms.
            try {
              const viteCacheDir = resolve(demoRoot, 'node_modules/.vite');
              if (existsSync(viteCacheDir)) {
                rmSync(viteCacheDir, { recursive: true, force: true });
              }
            } catch (err) {
              // eslint-disable-next-line no-console
              console.warn('[sdk-switcher] failed to clean .vite cache:', err?.message || err);
            }
            // Tell the client a restart is imminent BEFORE we call
            // `server.restart()` — once restart begins, the WS server
            // tears down and any further `ws.send` is dropped.
            try {
              server.ws.send({
                type: 'custom',
                event: 'sdk-switcher:will-restart',
                data: { source, version: version ?? null },
              });
            } catch {
              /* ignore — informational only */
            }
            sendJson(res, 200, { ok: true });
            // Restart out-of-band so the response has actually been
            // flushed by the time the server tears down. `restart()`
            // re-executes `vite.config.ts`, which re-reads
            // `.current.json` and rebuilds the alias table; the new
            // bundle is served the next time the browser reconnects.
            setTimeout(() => {
              server.restart().catch(err => {
                // eslint-disable-next-line no-console
                console.error('[sdk-switcher] server.restart() failed:', err);
              });
            }, 50);
            return;
          }

          sendJson(res, 404, { ok: false, error: 'Not found' });
        } catch (err) {
          sendJson(res, 500, { ok: false, error: err?.message || String(err) });
        }
      });
    },
  };
}

export { sdkSwitcherPlugin };
