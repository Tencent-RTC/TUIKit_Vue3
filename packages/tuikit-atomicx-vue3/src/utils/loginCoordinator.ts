/**
 * Internal module for coordinating login sequence between LoginState and various servers.
 * Ensures that server logins wait for LoginState.login to complete.
 * Uses reference counting to handle concurrent login() calls correctly.
 */

let loginPromise: Promise<void> | null = null;
let loginResolve: (() => void) | null = null;
let loginCount = 0;

/**
 * Called when LoginState.login starts.
 * Uses reference counting to handle concurrent calls.
 * @internal
 */
export function startLogin(): void {
  loginCount++;
  if (!loginPromise) {
    loginPromise = new Promise((resolve) => {
      loginResolve = resolve;
    });
  }
}

/**
 * Called when LoginState.login completes (success or failure).
 * Only resolves the promise when all concurrent login calls have finished.
 * @internal
 */
export function finishLogin(): void {
  loginCount = Math.max(0, loginCount - 1);
  if (loginCount === 0) {
    if (loginResolve) {
      loginResolve();
    }
    loginPromise = null;
    loginResolve = null;
  }
}

/**
 * Wait for LoginState.login to complete if it's in progress
 * @internal
 */
export async function waitForLogin(): Promise<void> {
  if (loginPromise) {
    await loginPromise;
  }
}
