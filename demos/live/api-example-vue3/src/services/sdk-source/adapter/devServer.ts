/**
 * Dev-server adapter — talks to the local `/__sdk/*` endpoints
 * exposed by `scripts/sdkSwitcherPlugin.mjs`. Only intended for use
 * inside `vite` (i.e. `import.meta.env.DEV`). Production bundles
 * never load this file thanks to the factory in `./select.ts`
 * gating it behind `import.meta.env.PROD` (the unreached branch
 * gets tree-shaken).
 *
 * Endpoint contract (kept verbatim from the existing plugin):
 *   GET  /__sdk/state               → { current, installed, deps }
 *   GET  /__sdk/registry            → { ok, versions, distTags, time, error? }
 *   POST /__sdk/install   { version, registry? }   → { ok, resolved, installed, deps, error? }
 *   POST /__sdk/switch    { source, version? }     → { ok, error? }
 */
import type {
  AdapterCapabilities,
  DepsManifest,
  InstallResult,
  InstalledEntry,
  RegistryInfo,
  SdkSource,
  SdkSourceAdapter,
  SdkState,
  SwitchTarget,
} from './index';

interface StateResponse {
  current: { source: SdkSource; version?: string };
  installed: InstalledEntry[];
  deps: DepsManifest | null;
}

interface RegistryResponse {
  ok: boolean;
  error?: string;
  versions?: string[];
  distTags?: Record<string, string>;
  time?: Record<string, string>;
}

interface InstallResponse {
  ok: boolean;
  error?: string;
  resolved?: string;
  installed?: InstalledEntry[];
  deps?: DepsManifest | null;
}

interface SwitchResponse {
  ok: boolean;
  error?: string;
}

const CAPABILITIES: AdapterCapabilities = Object.freeze({
  canChooseWorkspace: true,
  canInstall: true,
  canShowPeers: true,
  canShowCompatibility: true,
  workspaceLabel: 'workspace',
});

export class DevServerAdapter implements SdkSourceAdapter {
  readonly capabilities = CAPABILITIES;

  async getState(): Promise<SdkState> {
    const res = await fetch('/__sdk/state', { cache: 'no-store' });
    if (!res.ok) {
      throw new Error(`GET /__sdk/state failed: HTTP ${res.status}`);
    }
    const data = (await res.json()) as StateResponse;
    return {
      current: data.current,
      installed: data.installed || [],
      deps: data.deps || null,
    };
  }

  // `force` is meaningful here because the dev plugin caches the
  // `npm view` result for 5 minutes; pass-through so the UI's
  // refresh button bypasses that cache when needed.
  async listRegistry(options: { force?: boolean } = {}): Promise<RegistryInfo> {
    const qs = options.force ? '?force=1' : '';
    const res = await fetch(`/__sdk/registry${qs}`, { cache: 'no-store' });
    if (!res.ok) {
      throw new Error(`GET /__sdk/registry failed: HTTP ${res.status}`);
    }
    const data = (await res.json()) as RegistryResponse;
    if (!data.ok) {
      // Soft failure — surface the message but return whatever
      // (typically empty) data the plugin provided so the UI can
      // degrade to "local history only".
      throw new Error(data.error || 'Registry lookup failed');
    }
    return {
      versions: data.versions || [],
      distTags: data.distTags || {},
      time: data.time || {},
    };
  }

  async install(version: string): Promise<InstallResult> {
    const res = await fetch('/__sdk/install', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ version }),
    });
    const data = (await res.json()) as InstallResponse;
    if (!res.ok || !data.ok) {
      throw new Error(data.error || `POST /__sdk/install failed: HTTP ${res.status}`);
    }
    return {
      resolved: data.resolved || version,
      installed: data.installed,
      deps: data.deps,
    };
  }

  async switchTo(target: SwitchTarget): Promise<void> {
    const res = await fetch('/__sdk/switch', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ source: target.source, version: target.version }),
    });
    const data = (await res.json()) as SwitchResponse;
    if (!res.ok || !data.ok) {
      throw new Error(data.error || `POST /__sdk/switch failed: HTTP ${res.status}`);
    }
    // The dev plugin restarts vite out-of-band. The caller relies
    // on the WS `sdk-switcher:will-restart` event to drive UI
    // feedback; nothing else to do here.
  }
}
