/**
 * Runtime helper that exposes the list of SDK exports the currently-
 * selected `tuikit-atomicx-vue3` build does NOT provide. Read by:
 *
 *   - `manifest.ts` to mark example groups whose factory throws a
 *     `__atomicxMissingExport`-tagged error during construction.
 *   - `ExampleCard.vue` to render a "this API is not available in
 *     the active SDK version" placeholder instead of trying to run
 *     a card whose code references a missing symbol.
 *   - `SdkSourcePicker.vue` to badge versions / cards that have
 *     compatibility issues.
 *
 * Data source: `/__sdk/state` returns `.deps.compatibility.missing`
 * which is populated by `install-online-sdk.mjs` after each install.
 * We fetch once at app boot, then again whenever the picker triggers
 * a switch (via the `sdk-switcher:will-restart` HMR event); the
 * post-restart reload will refresh us naturally.
 */
import { ref, computed, type Ref, type ComputedRef } from 'vue';
import type { MissingExport, SdkSource } from './adapter/index';
import { createSdkSourceAdapter } from './adapter/select';

const adapter = createSdkSourceAdapter();

const missingExports = ref<MissingExport[]>([]);
const currentSource = ref<SdkSource>('workspace');
const fetchedOnce = ref(false);

/**
 * Set of just the export NAMES — handy for fast `has(...)` checks
 * when we don't care which entry the name came from.
 */
const missingNames = computed<Set<string>>(() => {
  const set = new Set<string>();
  for (const m of missingExports.value) {
    set.add(m.name);
  }
  return set;
});

async function refresh(): Promise<void> {
  try {
    const data = await adapter.getState();
    currentSource.value = data.current.source;
    // We only surface "missing" entries when online: workspace mode
    // is by definition fully compatible (it IS the source the demo
    // is written against). The prod adapter always reports
    // `compatibility.ok = true` because we can't scan demo source
    // in the browser — runtime errors surface through the fatal
    // overlay instead.
    if (data.current.source === 'online' && data.deps?.compatibility?.missing) {
      missingExports.value = data.deps.compatibility.missing;
    } else {
      missingExports.value = [];
    }
    fetchedOnce.value = true;
  } catch {
    // Fail quiet — degrade to "nothing missing" which is the more
    // permissive default. The fatal overlay would have already
    // surfaced the underlying connectivity issue if there is one.
  }
}

/** Check whether an export name is missing in the active SDK. */
function isMissing(name: string): boolean {
  return missingNames.value.has(name);
}

/** Vue composable: reactive view of the missing list + helpers. */
function useSdkMissingExports(): {
  missing: Ref<MissingExport[]>;
  missingNames: ComputedRef<Set<string>>;
  source: Ref<SdkSource>;
  ready: Ref<boolean>;
  isMissing: (name: string) => boolean;
  refresh: () => Promise<void>;
} {
  return {
    missing: missingExports,
    missingNames,
    source: currentSource,
    ready: fetchedOnce,
    isMissing,
    refresh,
  };
}

/**
 * Detect whether `value` is the `$missing` sentinel produced by the
 * vite shim plugin. Cards can call this to gracefully skip features
 * that depend on a missing SDK export, instead of waiting for the
 * sentinel to throw on access.
 */
function isMissingSentinel(value: unknown): value is { __atomicxMissingExport: string } {
  if (value == null) return false;
  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return Boolean((value as any).__atomicxMissingExport);
  } catch {
    // The sentinel proxy throws on most property reads; if a wrapper
    // got past our marker access, treat it as "not the sentinel".
    return false;
  }
}

export {
  useSdkMissingExports,
  isMissing,
  isMissingSentinel,
  refresh as refreshSdkMissingState,
  type MissingExport,
};
