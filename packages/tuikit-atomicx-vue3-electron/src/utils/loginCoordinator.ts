/**
 * Internal module for coordinating login sequence between LoginState and various servers.
 * Ensures that server logins wait for LoginState.login to complete.
 * Uses reference counting to handle concurrent login() calls correctly.
 */

let loginPromise: Promise<void> | null = null;
let loginResolve: (() => void) | null = null;
let loginCount = 0;
// Tracks whether at least one login cycle has fully completed since module
// load. Once `true`, `waitForLogin` resolves immediately and we no longer
// gate consumers on a promise. This intentionally does NOT reset on logout
// to preserve the previous behaviour of `waitForLogin` returning immediately
// in the gap between logout and the next login.
let hasCompletedOnce = false;

/**
 * Lazily ensures `loginPromise` exists. Called by both `startLogin` and
 * `waitForLogin`, so that consumers calling `waitForLogin` BEFORE
 * `startLogin` (e.g. eager candidate fetch on module load) still observe
 * a pending promise instead of a falsy short-circuit.
 */
function ensureLoginPromise(): void {
  if (!loginPromise) {
    loginPromise = new Promise((resolve) => {
      loginResolve = resolve;
    });
  }
}

/**
 * Called when LoginState.login starts.
 * Uses reference counting to handle concurrent calls.
 * @internal
 */
export function startLogin(): void {
  loginCount++;
  ensureLoginPromise();
}

/**
 * Called when LoginState.login completes (success or failure).
 * Only resolves the promise when all concurrent login calls have finished.
 * @internal
 */
export function finishLogin(): void {
  loginCount = Math.max(0, loginCount - 1);
  if (loginCount === 0) {
    hasCompletedOnce = true;
    if (loginResolve) {
      loginResolve();
    }
    loginPromise = null;
    loginResolve = null;
  }
}

/**
 * Wait for LoginState.login to complete.
 *
 * Behaviour:
 * - If a login cycle is in progress, await it.
 * - If `waitForLogin` is called BEFORE `startLogin` is ever invoked, lazily
 *   create the pending promise so the consumer is parked until the first
 *   `finishLogin` resolves it. This fixes the early-mount race where a
 *   consumer such as `getCoHostCandidates` could otherwise short-circuit
 *   and trigger `not inited` SDK errors.
 * - Once the first login cycle has completed, returns immediately for the
 *   rest of the module's lifetime (including any later logout / re-login).
 * @internal
 */
export async function waitForLogin(): Promise<void> {
  if (hasCompletedOnce) {
    return;
  }
  ensureLoginPromise();
  await loginPromise;
}
