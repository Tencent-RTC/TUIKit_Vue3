/**
 * Side-effect-only bootstrap module that installs the SDK fatal
 * overlay listeners.
 *
 * Why this is a separate file (not a top-level statement in
 * `main.ts`):
 *   ES module rules say all `import` declarations evaluate before
 *   any top-level statement of the importing module. Writing
 *   `installSdkFatalOverlay()` directly in `main.ts` would run AFTER
 *   `import 'tuikit-atomicx-vue3'`, defeating the whole point
 *   — the SDK's `SyntaxError` would fire before our listeners exist.
 *
 *   By putting the install call as a top-level statement in THIS
 *   module and importing it BEFORE the SDK in `main.ts`, the module
 *   linker guarantees this module's body runs first.
 *
 *   The cost is one extra file; the benefit is hard ordering
 *   guarantees that survive future refactors.
 */
import { installSdkFatalOverlay, captureFromString } from './sdkFatalOverlay';

installSdkFatalOverlay({
  sdkSource: (import.meta.env.VITE_ATOMICX_SOURCE as 'workspace' | 'online') || 'workspace',
  sdkVersion: (import.meta.env.VITE_ATOMICX_VERSION as string) || 'workspace',
});

// -----------------------------------------------------------------------------
// Active probe: detect ESM link-time SyntaxError on the SDK entries.
//
// Why a probe (passive listeners aren't enough):
//   When a static `import` declaration fails to LINK (e.g. the imported
//   module exists but doesn't export the named binding the importer
//   asked for), Chromium prints `Uncaught SyntaxError: The requested
//   module ... does not provide an export named X` to the console, but
//   it does NOT dispatch a `window.error` / `unhandledrejection`
//   event. That category of error is internal to the browser's module
//   loader, not a JS-level throw, so passive `window.error` listeners
//   never see it. The same call as a DYNAMIC `import()` does reject
//   the returned promise (per the ESM spec), which IS observable.
//
//   So: kick off a dynamic import of each SDK entry the demo uses.
//   The browser dedupes by URL, so the cost is zero if the static
//   import succeeded. If it FAILED, the dynamic import inherits the
//   same link-time failure and rejects — and we can finally show the
//   recovery overlay.
//
// Why literal `import()` calls (not a loop over a variable):
//   Vite resolves bare specifiers like `'tuikit-atomicx-vue3'` at
//   build time — it can only do that when the import specifier is a
//   STRING LITERAL in the source. A loop with `import(varName)` (even
//   with `/* @vite-ignore */`) hands the raw bare specifier to the
//   browser's native dynamic import, which has no idea what
//   `tuikit-atomicx-vue3` means without an import map and so rejects
//   with "Failed to resolve module specifier". That's how this probe
//   first got introduced as a regression: the rejection fired on
//   EVERY page load, not just when the SDK was actually broken.
//
//   The literal form below keeps the resolution responsibility with
//   vite, which routes the dynamic import through the same alias /
//   resolve pipeline as the matching static imports.
//
// Timing:
//   This file is the FIRST import in `main.ts`. Its top-level code
//   runs BEFORE the static `import 'tuikit-atomicx-vue3'` later in
//   `main.ts` is linked, so we cannot await here without deadlocking
//   the static import. Instead we fire the probe asynchronously: by
//   the time the microtask runs, the static link attempt has either
//   succeeded or already failed, and we just observe the result.
//
// -----------------------------------------------------------------------------
function reportProbeFailure(entry: string, err: unknown): void {
  const message = err instanceof Error ? err.message : String(err);
  const stack = err instanceof Error ? err.stack : undefined;
  captureFromString(`[${entry}] ${message}`, stack);
}

void import('tuikit-atomicx-vue3').catch(err => reportProbeFailure('tuikit-atomicx-vue3', err));
