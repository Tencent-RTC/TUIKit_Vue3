/**
 * Adapter abstraction for "where does the SDK come from and how do
 * we switch it".
 *
 * Two adapters exist:
 *   - `DevServerAdapter` — talks to the vite dev server plugin's
 *     `/__sdk/*` endpoints. Provides workspace / online switching,
 *     real npm install, compatibility checks. Dev-only.
 *   - `ImportMapAdapter`  — talks to nothing. Reads / writes
 *     `localStorage.atomicx.selectedVersion`, looks up registry
 *     metadata directly against `registry.npmjs.org`, and switches
 *     by writing localStorage + `location.reload()`. Production
 *     (static-hosted COS) only.
 *
 * The picker UI consumes the abstract `SdkSourceAdapter` interface
 * and conditionally renders rows / buttons based on
 * `adapter.capabilities.*`. The adapter chosen at runtime is
 * selected by `createSdkSourceAdapter()` in `./select.ts` — that
 * factory checks `import.meta.env.PROD` so vite tree-shakes the
 * unused implementation out of the bundle.
 *
 * See `doc/tech-design/icebergfeng/api-example-vue3-prod-sdk-switching.md`
 * §3.6 for the full design.
 */

/** Where the active SDK code is coming from. */
export type SdkSource = 'workspace' | 'online';

/**
 * A row in the picker's "installed locally" list. In dev that
 * mirrors `vendor/tuikit-atomicx-online/...` materialisation; in
 * prod we synthesise a single entry for whichever version is
 * currently selected in localStorage.
 */
export interface InstalledEntry {
  version: string;
  /** Currently materialised / active. */
  installed: boolean;
}

/** Registry information returned by `listRegistry`. */
export interface RegistryInfo {
  versions: string[];
  distTags: Record<string, string>;
  /** ISO-8601 publish timestamp keyed by version. */
  time: Record<string, string>;
}

export interface MissingExport {
  entry: string;
  name: string;
}

export interface CompatibilityInfo {
  ok: boolean;
  missing?: MissingExport[];
  /** Free-form server error, populated when the check itself failed. */
  error?: string;
}

export interface PeerRecord {
  range: string;
  resolved: string | null;
}

export interface DepsManifest {
  sdk: { name: string; version: string };
  peers: Record<string, PeerRecord>;
  compatibility?: CompatibilityInfo;
  installedAt: string;
}

/**
 * Result of the dev `/__sdk/state` endpoint. We expose the same
 * shape from `ImportMapAdapter.getState` (with synthesised values)
 * so the picker can read both adapters identically.
 */
export interface SdkState {
  current: { source: SdkSource; version?: string };
  installed: InstalledEntry[];
  deps: DepsManifest | null;
}

export interface SwitchTarget {
  source: SdkSource;
  version?: string;
}

/**
 * Capability flags drive the picker UI's conditional rendering. We
 * keep them as a const-shaped object rather than methods so the UI
 * can use them directly in template `v-if` expressions without
 * extra reactivity gymnastics.
 */
export interface AdapterCapabilities {
  /** May the user pick `workspace`? */
  canChooseWorkspace: boolean;
  /** May the user trigger a fresh `npm install <version>`? */
  canInstall: boolean;
  /** Should we render the peer-dependency details block? */
  canShowPeers: boolean;
  /** Should we render the compat / missing-export details block? */
  canShowCompatibility: boolean;
  /** Label used in the topbar trigger when `workspace`. */
  workspaceLabel: string;
}

export interface InstallResult {
  resolved: string;
  /** Freshly-installed list, mirrors `listInstalled()`. */
  installed?: InstalledEntry[];
  /** Refreshed deps manifest, if available. */
  deps?: DepsManifest | null;
}

/**
 * The contract that any "SDK source backend" must satisfy. Keep
 * this interface narrow: every method here corresponds to one user
 * action in the picker. New picker affordances should add a method
 * here first, then both adapters in parallel.
 */
export interface SdkSourceAdapter {
  readonly capabilities: AdapterCapabilities;

  /** Snapshot of current source + installed list + deps manifest. */
  getState(): Promise<SdkState>;

  /** All versions published to the registry, with dist-tags. */
  listRegistry(options?: { force?: boolean }): Promise<RegistryInfo>;

  /**
   * Install a version (dev only). The promise resolves once the
   * install completes; the caller is responsible for switching to
   * the freshly-installed version (or passing `andSwitch` upstream).
   * Adapters whose `capabilities.canInstall === false` throw a
   * descriptive error.
   */
  install(version: string): Promise<InstallResult>;

  /**
   * Switch to the given source / version. Implementations are
   * permitted (and expected) to schedule a page reload / server
   * restart before this resolves; callers should treat the promise
   * resolution as "request accepted" rather than "switch complete".
   */
  switchTo(target: SwitchTarget): Promise<void>;
}
