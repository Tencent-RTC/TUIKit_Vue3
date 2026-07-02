/**
 * Shared constants for the LiveAudienceList component.
 *
 * Kept as a dependency-free leaf module so that both the barrel (`index.ts`)
 * and the component SFCs can import these constants without creating a
 * circular dependency. The previous `*.vue -> ./index` reverse import formed
 * an `index.ts <-> *.vue` cycle, which made the bundler interleave the
 * barrel body between the component definitions and triggered a
 * "Cannot access '...' before initialization" (TDZ) error in production.
 *
 * This is the Electron-package mirror of the same fix originally landed for
 * the Web package in commit `059e74bfe` (`tuikit-atomicx-vue3`). Do NOT move
 * these constants back into `index.ts`.
 */

/** Maximum number of audiences shown in the live audience list. */
export const MAX_AUDIENCE_COUNT = 200;
