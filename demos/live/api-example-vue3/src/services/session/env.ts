/**
 * Environment & credential configuration for the API Example site —
 * GitHub release version.
 *
 * This file REPLACES `env.ts` during `npm run publish` (see
 * `scripts/publish.cjs`). The internal `env.ts` fetches a debug userSig
 * from a remote endpoint with a hardcoded test SDKAppID — that code must
 * NEVER ship to GitHub. This file instead reads `SDKAPPID` /
 * `SDKSECRETKEY` from `src/config/basic-info-config.js` and generates the
 * userSig locally via `lib-generate-test-usersig-es`.
 *
 * Users fill in their own `SDKAPPID` and `SDKSECRETKEY` in
 * `src/config/basic-info-config.js` after cloning from GitHub.
 *
 * All exports are gathered at the bottom of the file for a single, easy-to-scan
 * public surface.
 */

// @ts-expect-error — basic-info-config.js is a plain JS file without type
// declarations; this file is only used in the published GitHub version where
// strict type-checking is not enforced. The internal env.ts handles dev types.
import { SDKAPPID, genTestUserSig as localGenTestUserSig } from '../../config/basic-info-config';

/**
 * Fixed DOM container id LiveView renders into (single-instance, see PRD §7).
 *
 * Mirrors `LIVE_STREAM_CONTENT_VIEW` declared at
 * `ui-component/packages/uikit-component-vue3/src/components/LiveView/constants.ts`
 * — the SDK exports it from `tuikit-atomicx-vue3`'s `./components/LiveView`
 * barrel but does NOT re-export it through the `tuikit-atomicx-vue3` /
 * `tuikit-atomicx-vue3` public entries we depend on. Re-declaring the
 * literal in one place here keeps the value out of card-level snippets and
 * gives any future drift exactly one location to update.
 */
const LIVE_STREAM_CONTENT_VIEW = 'atomicx-live-stream-content';

// ---------------------------------------------------------------------------
// Public surface (single re-export point per project convention).
// ---------------------------------------------------------------------------

export { localGenTestUserSig as genTestUserSig, LIVE_STREAM_CONTENT_VIEW, SDKAPPID as SDKAppID };
