/**
 * Factory that selects the appropriate adapter for the current
 * build mode.
 *
 * Why a factory (vs. a top-level const):
 *   Vite replaces `import.meta.env.PROD` / `.DEV` with hard-coded
 *   booleans at build time. Wrapping the branch in a function with
 *   an `if` lets esbuild eliminate the dead branch (and the
 *   matching import) entirely.
 *
 *   - In a dev bundle: `PROD === false`, so the `ImportMapAdapter`
 *     branch is dead code. esbuild drops both the branch and the
 *     `./importMap` import — the dev bundle contains zero
 *     production-mode code.
 *   - In a build bundle: `PROD === true`, the `DevServerAdapter`
 *     branch is dead. The build bundle contains zero dev-only
 *     code (no fetch to `/__sdk/*`, no install state, etc.).
 *
 * The picker UI consumes this through a single call; it never
 * imports either concrete adapter directly.
 */
import type { SdkSourceAdapter } from './index';
import { DevServerAdapter } from './devServer';
import { ImportMapAdapter } from './importMap';

let cached: SdkSourceAdapter | null = null;

export function createSdkSourceAdapter(): SdkSourceAdapter {
  if (cached) return cached;
  // Both branches kept as `import.meta.env.PROD` rather than its
  // negation so the dead-branch eliminator has the cleanest pattern
  // to recognise.
  if (import.meta.env.PROD) {
    cached = new ImportMapAdapter();
  } else {
    cached = new DevServerAdapter();
  }
  return cached;
}
