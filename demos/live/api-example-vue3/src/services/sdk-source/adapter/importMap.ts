/**
 * Production adapter — backend-less. The bundle is statically
 * hosted on COS (no `/__sdk/*` endpoints). Everything is driven
 * by:
 *
 *   1. `localStorage` — the user's current selection. Picker reads /
 *      writes `atomicx.selectedVersion`; on change we `reload()` so
 *      `main.ts` dynamic-imports the new version's bundle from
 *      esm.sh on the next page load.
 *   2. `registry.npmjs.org` — public, CORS-friendly read-only JSON.
 *      We pull the version list + dist-tags + publish times
 *      straight from there.
 *
 * Anything that requires running `npm install` or restarting a
 * server is NOT available in this adapter (`capabilities.canInstall`
 * is false; the picker hides the install input).
 *
 * Constants here MUST be kept in lockstep with the same values in
 * `src/main.ts` (which actually composes the esm.sh URL). If the
 * SDK is ever renamed, both files need updating.
 */
import type {
  AdapterCapabilities,
  InstallResult,
  RegistryInfo,
  SdkSourceAdapter,
  SdkState,
  SwitchTarget,
} from './index';

const SDK_PACKAGE = 'tuikit-atomicx-vue3';
const DEFAULT_VERSION = 'latest';
const LOCAL_STORAGE_KEY = 'atomicx.selectedVersion';

const CAPABILITIES: AdapterCapabilities = Object.freeze({
  canChooseWorkspace: false, // no workspace source in a static deploy
  canInstall: false, // no backend to run `npm install`
  canShowPeers: false, // we no longer bake the peer list into the bundle
  canShowCompatibility: false, // can't scan demo source in the browser
  workspaceLabel: 'workspace',
});

function getSelectedVersion(): string {
  try {
    return window.localStorage.getItem(LOCAL_STORAGE_KEY) || DEFAULT_VERSION;
  } catch {
    return DEFAULT_VERSION;
  }
}

function setSelectedVersion(version: string): void {
  try {
    window.localStorage.setItem(LOCAL_STORAGE_KEY, version);
  } catch {
    // Storage might be denied (privacy mode / quota). The fallback
    // behaviour is "selection is forgotten on reload"; the user is
    // free to re-pick. Better than failing the switch entirely.
  }
}

export class ImportMapAdapter implements SdkSourceAdapter {
  readonly capabilities = CAPABILITIES;

  /** In-memory cache: registry meta is stable enough that one fetch per session is fine. */
  private cachedRegistry: RegistryInfo | null = null;

  async getState(): Promise<SdkState> {
    const version = getSelectedVersion();
    return {
      current: { source: 'online', version },
      // Static deploys have no "history" concept; we report a single
      // synthetic entry so the picker still shows "current" with a
      // check-mark beside the chosen version.
      installed: [{ version, installed: true }],
      // No peer info available on the browser side — we no longer
      // ship a build-time-baked peer list, since the SDK package is
      // loaded dynamically from esm.sh and esm.sh internally handles
      // every transitive dep without us caring about its identity.
      deps: {
        sdk: { name: SDK_PACKAGE, version },
        peers: {},
        compatibility: { ok: true },
        installedAt: '',
      },
    };
  }

  /**
   * Fetch all published versions directly from the npm registry.
   *
   * `registry.npmjs.org/<pkg>` returns a full packument: the
   * `versions` map (keyed by version → manifest), the `dist-tags`
   * object, and a `time` map for publish timestamps. We only need
   * the keys / tags, so we throw away the bulk of each manifest to
   * keep memory low — even so the response is a few hundred KB and
   * one-per-session caching is appropriate.
   */
  async listRegistry(options: { force?: boolean } = {}): Promise<RegistryInfo> {
    if (this.cachedRegistry && !options.force) {
      return this.cachedRegistry;
    }
    const url = `https://registry.npmjs.org/${encodeURIComponent(SDK_PACKAGE)}`;
    const res = await fetch(url, { cache: 'no-store' });
    if (!res.ok) {
      throw new Error(`Registry lookup failed: HTTP ${res.status}`);
    }
    const data = (await res.json()) as {
      versions?: Record<string, unknown>;
      'dist-tags'?: Record<string, string>;
      time?: Record<string, string>;
    };
    const versions = data.versions ? Object.keys(data.versions) : [];
    const distTags = data['dist-tags'] && typeof data['dist-tags'] === 'object'
      ? data['dist-tags']
      : {};
    const time = data.time && typeof data.time === 'object' ? data.time : {};
    this.cachedRegistry = { versions, distTags, time };
    return this.cachedRegistry;
  }

  install(version: string): Promise<InstallResult> {
    // Surface the limitation honestly rather than silently doing
    // nothing — calling code should already be guarding on
    // `capabilities.canInstall` before invoking this.
    return Promise.reject(
      new Error(
        `Install is not available in the static-deploy build (requested version: ${version}). `
          + 'Pick any registry version directly — it will be loaded from esm.sh on next reload.',
      ),
    );
  }

  async switchTo(target: SwitchTarget): Promise<void> {
    if (target.source === 'workspace') {
      throw new Error(
        'workspace source is not available in the static-deploy build — '
          + 'the source package only exists inside the monorepo dev environment.',
      );
    }
    if (!target.version) {
      throw new Error('switchTo({source:"online"}) requires a version');
    }
    setSelectedVersion(target.version);
    // Defer the reload by a microtask so the caller can flush any
    // pending state (overlay rendering, picker close animation)
    // before the page tears down.
    queueMicrotask(() => {
      window.location.reload();
    });
  }
}
