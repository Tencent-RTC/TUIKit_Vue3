// ---------------------------------------------------------------------------
// SDK fatal overlay — MUST be installed before any SDK import.
//
// The most common failure mode for "online" mode is `SyntaxError: ...
// does not provide an export named X` thrown during ES module link of
// `tuikit-atomicx-vue3`. That happens BEFORE any of our Vue code runs,
// so we can't use a Vue-based error boundary; instead we register
// global error listeners synchronously in the bootstrap module below.
//
// IMPORTANT: ESM specifies that all `import` declarations run before
// any top-level statement of the importing module. Therefore the
// overlay-install *must* be a top-level statement in a separate module
// (`sdkFatalOverlay.bootstrap`), and that module *must* be imported
// before any other module that transitively touches the SDK. Putting
// the install logic directly here as a statement would (incorrectly)
// run AFTER `import 'tuikit-atomicx-vue3'` below.
// ---------------------------------------------------------------------------
import './services/sdk-source/fatal-overlay/sdkFatalOverlay.bootstrap';

import * as VueNS from 'vue';
import * as VueRouterNS from 'vue-router';
import * as UIKitBaseNS from '@tencentcloud/uikit-base-component-vue3';

import './app/global.scss';
import { markAppReady } from './services/sdk-source/fatal-overlay/sdkFatalOverlay';
// Pure (no-SDK) helper — safe to import here without triggering the
// `addI18n` SDK call that lives in `./i18n`.
import { getSavedLocale } from './i18n/localeStorage';

/**
 * Strategy split — dev vs. prod.
 *
 * Dev (`vite` / `vite dev`):
 *   `vite.config.ts` aliases `tuikit-atomicx-vue3` to either the
 *   workspace symlink or the vendor copy of a published version. A
 *   plain static import works and gives us full HMR + source maps.
 *   We do NOT touch `__ATOMICX_HOST__` / `__ATOMICX_SDK__` — they
 *   exist only to mediate the prod-mode esm.sh handoff.
 *
 * Prod (`vite build`):
 *   The static import target `tuikit-atomicx-vue3` is aliased to our
 *   facade module (`src/services/sdk-source/facade.ts`), which reads from
 *   `window.__ATOMICX_SDK__`. Before we can mount the app we must:
 *     1. Publish demo's vue / vue-router / uikit-base instances on
 *        `__ATOMICX_HOST__` so the host-shim files served from
 *        `/host-shim/*.js` can read them. (The SDK loaded from
 *        esm.sh imports those three names as bare specifiers; the
 *        static importmap in `index.html` routes the bare names to
 *        the host-shim files.)
 *     2. Dynamic-import the SDK from esm.sh (URL pinned to the
 *        version stored in localStorage, or 'latest' as default).
 *     3. Publish the loaded SDK namespace on `__ATOMICX_SDK__`.
 *     4. ONLY THEN dynamic-import `./app/App.vue` and friends — the
 *        facade's lazy getters will resolve correctly because the
 *        SDK is now installed.
 *
 *   The dynamic import of App.vue is important: any top-level static
 *   import of App.vue in this file would cause vite to eagerly
 *   evaluate `tuikit-atomicx-vue3` (= the facade) during entry-chunk
 *   evaluation, which happens BEFORE our await chain. The facade's
 *   error guard would fire and we'd crash before the overlay even
 *   has a chance to render the recovery UI.
 */

const SDK_PACKAGE = 'tuikit-atomicx-vue3';
/**
 * Shared-singleton CSV passed to esm.sh's `?external=`. Sourced from
 * vite's `define` (see `vite.config.ts#VITE_ATOMICX_SHARED_SINGLETONS_CSV`)
 * so the list lives in exactly one place
 * (`scripts/injectImportMapBootstrapPlugin.mjs#SHARED_SINGLETONS`)
 * and the importmap entries, host-shim files, and this URL stay in
 * lockstep. The fallback string mirrors the plugin defaults so the
 * runtime degrades gracefully if vite injection somehow doesn't fire.
 */
const SDK_EXTERNAL_NAMES =
  import.meta.env.VITE_ATOMICX_SHARED_SINGLETONS_CSV
  || 'vue,vue-router,@tencentcloud/uikit-base-component-vue3';
const SELECTED_VERSION_KEY = 'atomicx.selectedVersion';
const DEFAULT_VERSION = 'latest';

// ---------------------------------------------------------------------------
// Boot overlay control
// ---------------------------------------------------------------------------
// The overlay markup is embedded directly in `index.html` so it
// becomes visible on the very first paint — long before any JS
// runs. Our job here is to:
//   - update its label as we move through bootstrap stages so the
//     user has informative feedback ("Loading SDK 6.2.6…" vs. just
//     a spinner);
//   - reveal an extra "first-time builds can take a few seconds"
//     hint if the SDK fetch is still pending after a grace period
//     (esm.sh's first build of a never-seen-before version commonly
//     takes 3-15s);
//   - remove the overlay once Vue has mounted, with a brief CSS
//     transition so the swap isn't visually jarring.
//
// All functions are defensive: if for some reason the overlay
// elements don't exist (e.g. someone edited index.html and forgot
// the corresponding nodes), the helpers no-op silently. The boot
// flow itself doesn't depend on overlay presence.

const BOOT_OVERLAY_ID = 'atomicx-boot-overlay';
const BOOT_OVERLAY_LABEL_ID = 'atomicx-boot-overlay-label';
const SLOW_HINT_REVEAL_MS = 3000;

function setBootOverlayLabel(text: string): void {
  const el = document.getElementById(BOOT_OVERLAY_LABEL_ID);
  if (el) el.textContent = text;
}

/**
 * Localize a boot-overlay string by the persisted locale. The i18n system
 * isn't available this early (demo resources load only after the SDK), so we
 * keep a tiny static zh/en pair here. Mirrors the overlay markup that
 * `index.html` localizes on first paint via an inline script.
 */
const BOOT_LOCALE_EN = getSavedLocale() === 'en-US';
function bootStr(enStr: string, zhStr: string): string {
  return BOOT_LOCALE_EN ? enStr : zhStr;
}

/**
 * After this many ms with the overlay still up, add the `.is-slow`
 * class so the extra "esm.sh is building, hang on" hint becomes
 * visible. Returns a timer handle the caller MUST clear if the
 * load completes before the threshold (otherwise the hint flashes
 * up for a frame and disappears immediately, which is worse than
 * never showing it).
 */
function armSlowHintTimer(): number | null {
  const overlay = document.getElementById(BOOT_OVERLAY_ID);
  if (!overlay) return null;
  return window.setTimeout(() => {
    overlay.classList.add('is-slow');
  }, SLOW_HINT_REVEAL_MS);
}

function dismissBootOverlay(): void {
  const overlay = document.getElementById(BOOT_OVERLAY_ID);
  if (!overlay) return;
  overlay.classList.add('is-hidden');
  // Remove the node after the CSS transition completes so it stops
  // intercepting hit-tests / accessibility tree walks. The 280ms
  // matches the 0.24s CSS transition with a small buffer.
  window.setTimeout(() => {
    overlay.parentNode?.removeChild(overlay);
  }, 280);
}

/**
 * Read the user-selected SDK version from localStorage. Falls back
 * silently in storage-denied browsers (private mode) so the demo
 * still works with the default version.
 */
function readSelectedVersion(): string {
  try {
    return window.localStorage.getItem(SELECTED_VERSION_KEY) || DEFAULT_VERSION;
  } catch {
    return DEFAULT_VERSION;
  }
}

/**
 * Compose the esm.sh URL for the SDK's main entry. We URL-encode the
 * external list because some peers (e.g. namespaced packages) include
 * characters esm.sh would otherwise interpret as separators.
 */
function composeSdkUrl(version: string): string {
  const ver = encodeURIComponent(version);
  const ext = encodeURIComponent(SDK_EXTERNAL_NAMES);
  return `https://esm.sh/${SDK_PACKAGE}@${ver}?external=${ext}`;
}

/**
 * Fallback esm.sh URL for the SDK's bundled stylesheet.
 *
 * This is the LAST resort in `resolveSdkCssUrl` below — used only when
 * neither the `x-esm-css` nor the `x-esm-path` response header is
 * available. It hardcodes esm.sh's conventional CSS path for this
 * package. Prefer the header-derived URLs; this exists so a total
 * header-parsing failure still yields *some* stylesheet rather than
 * none.
 */
function composeSdkCssUrlFallback(version: string): string {
  const ver = encodeURIComponent(version);
  return `https://esm.sh/${SDK_PACKAGE}@${ver}/dist/styles/index.css`;
}

/**
 * Resolve the SDK stylesheet URL by asking esm.sh, with graceful
 * degradation. Returns an absolute URL string.
 *
 * ## Why not just hardcode `/dist/styles/index.css`?
 *
 * Hardcoding couples us to two upstream facts that can both change:
 *   1. The SDK's on-disk CSS output path (`dist/styles/index.css`).
 *   2. esm.sh's current behaviour of NOT emitting an `x-esm-css`
 *      header for this package (so we're forced to guess the path).
 * If either drifts, a hardcoded URL silently 404s and the whole demo
 * ships unstyled again — the exact bug we're fixing. So we resolve
 * the URL from authoritative signals first.
 *
 * ## Resolution order (most authoritative first)
 *
 *   1. **`x-esm-css` header** — esm.sh's official stylesheet-handoff
 *      mechanism. When esm.sh detects a package ships CSS, it exposes
 *      the bundled stylesheet URL here. If present, this is canonical:
 *      it already reflects the resolved version and the correct path.
 *      (This package doesn't emit it today, but if a future esm.sh /
 *      SDK combination does, we pick it up for free.)
 *
 *   2. **`x-esm-path` header** — esm.sh always returns this: the
 *      resolved module path, e.g.
 *      `/tuikit-atomicx-vue3@6.2.6/<hash>/es2022/tuikit-atomicx-vue3.mjs`.
 *      Crucially it contains the *resolved* version (a `latest` tag
 *      request comes back as `@6.2.6`), so we derive the CSS URL as
 *      `https://esm.sh/<pkg>@<resolvedVersion>/dist/styles/index.css`.
 *      This eliminates the `latest`-vs-pinned ambiguity and anchors on
 *      esm.sh's own version resolution rather than our guess.
 *
 *   3. **Hardcoded fallback** — `composeSdkCssUrlFallback(version)`.
 *      Only if the fetch itself fails or neither header exists.
 *
 * The fetch reuses the SDK entry URL (already being imported), so it
 * hits the same esm.sh cache entry — no meaningful extra latency.
 *
 * Never throws: on any failure it falls through to the hardcoded URL,
 * because returning *a* URL (even a guessed one) is strictly better
 * than aborting stylesheet injection entirely.
 */
async function resolveSdkCssUrl(sdkEntryUrl: string, version: string): Promise<string> {
  try {
    const res = await fetch(sdkEntryUrl, { method: 'GET' });

    // 1) Official CSS handoff header wins outright.
    const esmCss = res.headers.get('x-esm-css');
    if (esmCss) {
      // Header may be absolute or origin-relative; resolve against
      // the esm.sh origin to be safe.
      return new URL(esmCss, 'https://esm.sh/').toString();
    }

    // 2) Derive from the resolved module path (always present).
    const esmPath = res.headers.get('x-esm-path');
    if (esmPath) {
      // esmPath looks like `/tuikit-atomicx-vue3@6.2.6/<hash>/es2022/....mjs`.
      // Extract the resolved `@version` segment for our package.
      const match = esmPath.match(
        new RegExp(`/${SDK_PACKAGE.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}@([^/]+)/`),
      );
      const resolvedVersion = match ? match[1] : version;
      return `https://esm.sh/${SDK_PACKAGE}@${encodeURIComponent(resolvedVersion)}/dist/styles/index.css`;
    }
  } catch (err) {
    // eslint-disable-next-line no-console
    console.warn(
      '[main] could not read esm.sh headers to resolve SDK CSS URL; '
        + 'falling back to the conventional path.',
      err,
    );
  }

  // 3) Last resort.
  return composeSdkCssUrlFallback(version);
}

/**
 * Inject the SDK stylesheet and resolve once it has loaded (or
 * errored). We await the load so the boot overlay stays up until the
 * styles are actually applied — mounting the app before the CSS lands
 * would flash an unstyled LiveView for a frame.
 *
 * ## Why the SDK CSS must be injected manually in prod
 *
 * The SDK entry (`dist/index.js`) begins with
 * `import './styles/index.css'` — a side-effect import carrying ~340KB
 * of styles for every SDK component (LiveView's `.stream-cover` /
 * `.no-video-container` video-stage classes, gift / barrage / co-host
 * panels, etc.).
 *
 * - **dev**: vite resolves the SDK via a workspace alias and processes
 *   that CSS import as part of its module graph, injecting the styles
 *   automatically. LiveView renders correctly and the camera preview
 *   shows.
 * - **prod (esm.sh)**: esm.sh serves the SDK in bundler mode
 *   (`?external=...&target=es2022`) and STRIPS the CSS side-effect
 *   import from the JS. Without this manual injection every SDK
 *   component is unstyled — LiveView's `.no-video-container` collapses
 *   to 0px, so `openLocalCamera` succeeds yet the preview is black.
 *
 * The stylesheet URL is resolved via `resolveSdkCssUrl` (header-driven
 * with a hardcoded fallback) rather than being guessed outright.
 *
 * Idempotent: guarded by a stable id so a re-entry won't double-inject.
 *
 * Non-fatal on error: if the stylesheet 404s or the network drops, we
 * resolve anyway rather than blocking the whole app — a styled-but-
 * degraded page beats a hard boot failure, and the error is logged.
 */
async function injectSdkStylesheet(sdkEntryUrl: string, version: string): Promise<void> {
  const STYLE_LINK_ID = 'atomicx-sdk-stylesheet';
  if (document.getElementById(STYLE_LINK_ID)) {
    // Already present (e.g. same version re-injected). Nothing to do.
    return;
  }

  const href = await resolveSdkCssUrl(sdkEntryUrl, version);
  // eslint-disable-next-line no-console
  console.log(`[main] loading SDK stylesheet from ${href}`);

  await new Promise<void>((resolvePromise) => {
    const link = document.createElement('link');
    link.id = STYLE_LINK_ID;
    link.rel = 'stylesheet';
    link.href = href;
    link.addEventListener('load', () => resolvePromise(), { once: true });
    link.addEventListener(
      'error',
      () => {
        // eslint-disable-next-line no-console
        console.error(
          `[main] SDK stylesheet failed to load from ${href} — `
            + 'LiveView and other SDK components may render unstyled.',
        );
        resolvePromise();
      },
      { once: true },
    );
    document.head.appendChild(link);
  });
}

/**
 * Boot sequence. Runs as an async IIFE so we can `await` cleanly at
 * the top level without forcing the whole `main.ts` to be a top-level
 * await module (which has subtle interactions with vite's entry
 * chunk handling).
 */
(async () => {
  // -----------------------------------------------------------------
  // Step 1 (PROD-only): Expose host-side singletons.
  //
  // Why guarded on `import.meta.env.PROD`: in dev the host-shim files
  // are never loaded (the importmap isn't injected; SDK is resolved
  // via vite alias to vendor/workspace), so `__ATOMICX_HOST__` has
  // no consumer. Setting it unconditionally would keep the three
  // namespace bindings reachable in the dev bundle for no reason.
  // The vite-time constant short-circuits to dead-code elimination
  // in dev builds — there is no runtime cost to either branch.
  // -----------------------------------------------------------------
  if (import.meta.env.PROD) {
    (window as unknown as { __ATOMICX_HOST__: unknown }).__ATOMICX_HOST__ = {
      vue: VueNS,
      vueRouter: VueRouterNS,
      uikitBase: UIKitBaseNS,
    };
  }

  // -----------------------------------------------------------------
  // Step 2: In prod, dynamic-import the SDK from esm.sh and publish
  // it on the global namespace before any module that imports from
  // `tuikit-atomicx-vue3` evaluates. The `import.meta.env.PROD`
  // check is a vite-time constant — the entire prod branch is
  // tree-shaken out of dev builds.
  // -----------------------------------------------------------------
  let slowHintTimer: number | null = null;
  if (import.meta.env.PROD) {
    const version = readSelectedVersion();
    const url = composeSdkUrl(version);
    setBootOverlayLabel(bootStr(`Loading SDK · ${version}`, `正在加载 SDK · ${version}`));
    slowHintTimer = armSlowHintTimer();
    // eslint-disable-next-line no-console
    console.log(`[main] loading SDK from ${url}`);
    try {
      // Load the SDK JS and its stylesheet in parallel. The CSS is
      // MANDATORY in prod: esm.sh strips the SDK's `import
      // './styles/index.css'` from the JS bundle, so without this
      // explicit injection every SDK component (LiveView above all)
      // renders unstyled — the video stage collapses to 0px and the
      // camera preview shows black even though capture succeeds.
      // See `injectSdkStylesheet` for the full rationale.
      //
      // We `Promise.all` so the slow-first-build wait on esm.sh (JS)
      // overlaps with the CSS resolve+fetch instead of serialising
      // them. `injectSdkStylesheet` reads esm.sh's response headers
      // (x-esm-css / x-esm-path) off the same entry URL to derive the
      // authoritative stylesheet URL, so it hits the same cache entry
      // the dynamic import warms.
      const [sdk] = await Promise.all([
        import(/* @vite-ignore */ url),
        injectSdkStylesheet(url, version),
      ]);
      (window as unknown as { __ATOMICX_SDK__: unknown }).__ATOMICX_SDK__ = sdk;
    } catch (err) {
      // eslint-disable-next-line no-console
      console.error('[main] SDK dynamic import failed:', err);
      if (slowHintTimer !== null) {
        window.clearTimeout(slowHintTimer);
        slowHintTimer = null;
      }
      // Let the overlay surface the error. We deliberately do NOT
      // swallow: throwing here lets the overlay's unhandledrejection
      // handler (installed in sdkFatalOverlay.bootstrap) observe the
      // failure and render the recovery screen.
      throw err;
    }
    setBootOverlayLabel(bootStr('SDK loaded, preparing UI…', 'SDK 加载完成,正在准备界面…'));
  } else {
    // Dev path — SDK is statically resolved by vite alias, no
    // network fetch. Skip directly to mounting; the overlay still
    // shows for a tick so dev and prod look consistent during the
    // initial paint.
    setBootOverlayLabel(bootStr('Preparing UI…', '正在准备界面…'));
  }

  // -----------------------------------------------------------------
  // Step 3: Dynamic-import the app entry. We avoid a top-level static
  // import of App.vue because Vue components in `<script setup>`
  // statically import from `tuikit-atomicx-vue3`, which in prod
  // resolves to the facade — the facade is harmless to evaluate
  // (lazy reads), but the components themselves may call the hooks
  // at component setup time. Dynamic-importing here ensures the SDK
  // is installed first.
  // -----------------------------------------------------------------
  const [{ default: App }, { router }] = await Promise.all([
    import('./app/App.vue'),
    import('./app/router'),
  ]);

  // Register demo-specific i18n resources with the SDK's i18next
  // instance (provided by @tencentcloud/uikit-base-component-vue3).
  // Must run AFTER the SDK is loaded (so `addI18n` is available) but
  // BEFORE the app mounts (so the first render picks up the correct
  // locale). `restoreLocale()` re-applies any previously saved language
  // so the selection survives a page refresh. Consumers use
  // `useUIKit().t('Key')` to resolve strings.
  const i18nMod = await import('./i18n');
  await i18nMod.restoreLocale();

  const app = VueNS.createApp(App);
  app.use(router);
  app.mount('#app');

  // The Vue app is now visible under #app. Clear the slow-hint
  // timer (in case the SDK loaded right around the threshold and
  // we'd otherwise flash it) and dismiss the boot overlay with a
  // fade-out.
  if (slowHintTimer !== null) {
    window.clearTimeout(slowHintTimer);
  }
  dismissBootOverlay();

  // Tell the overlay we made it through bootstrap. From this point on,
  // only module-resolution-style errors escalate; ordinary runtime
  // exceptions go through Vue's normal error path.
  markAppReady();
})();
