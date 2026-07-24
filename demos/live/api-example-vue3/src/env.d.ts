/// <reference types="vite/client" />

declare module '*.vue' {
  import type { DefineComponent } from 'vue';
  const component: DefineComponent<Record<string, unknown>, Record<string, unknown>, unknown>;
  export default component;
}

interface ImportMetaEnv {
  readonly VITE_SDKAPPID?: string;
  readonly VITE_USERSIG_ENDPOINT?: string;
  /**
   * SDK source resolved at vite startup.
   *   `'workspace'` — in-repo `tuikit-atomicx-vue3` source (default).
   *   `'online'`    — published package fetched into `vendor/tuikit-atomicx-online`.
   * Injected by `vite.config.ts` via `define`.
   */
  readonly VITE_ATOMICX_SOURCE?: 'workspace' | 'online';
  /**
   * Concrete version string for the loaded SDK. Equals `'workspace'` when
   * source is workspace; otherwise the real semver pulled from the vendor
   * marker (e.g. `'6.2.5'`).
   */
  readonly VITE_ATOMICX_VERSION?: string;
  /**
   * Comma-separated bare specifiers that prod-mode `main.ts` passes to
   * esm.sh's `?external=` query. Sourced from
   * `scripts/injectImportMapBootstrapPlugin.mjs#SHARED_SINGLETONS_CSV`
   * so the import-map entries, host-shim files, and esm.sh request
   * all share one authoritative list.
   */
  readonly VITE_ATOMICX_SHARED_SINGLETONS_CSV?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
