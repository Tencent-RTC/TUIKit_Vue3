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

/**
 * Wait until the chat SDK is fully ready.
 * Error 2025 from chat login means an earlier login of the same user is still
 * in progress and will succeed later, so wait for SDK_READY instead of
 * treating chat as logged in (same approach as TUICallEngine TSignalClient.login).
 * Rejects on SDK_NOT_READY (logout / kicked) so callers never hang forever.
 * @internal
 */
export function waitForChatReady(chat: any, EVENT: { SDK_READY: string; SDK_NOT_READY: string }): Promise<void> {
  if (!chat || chat.isReady()) {
    return Promise.resolve();
  }
  return new Promise((resolve, reject) => {
    const cleanup = () => {
      chat.off(EVENT.SDK_READY, onReady);
      chat.off(EVENT.SDK_NOT_READY, onNotReady);
    };
    const onReady = () => {
      cleanup();
      resolve();
    };
    const onNotReady = () => {
      cleanup();
      reject(new Error('Chat SDK not ready'));
    };
    chat.on(EVENT.SDK_READY, onReady);
    chat.on(EVENT.SDK_NOT_READY, onNotReady);
  });
}
