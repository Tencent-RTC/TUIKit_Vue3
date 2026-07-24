import { reactive } from 'vue';
import { useUIKit } from '@tencentcloud/uikit-base-component-vue3';
import { SDKAppID, genTestUserSig } from './env';
import { Role } from '../../lib/types';
import { pushLog } from '../event-log/store';

const { t } = useUIKit();

/**
 * Per-tab demo session: cached userId, login/logout glue and URL-query
 * deep-link support.
 *
 * All exports are gathered at the bottom of the file for a single, easy-to-scan
 * public surface.
 */

/**
 * Storage key for the dev login userId. No userSig is ever persisted.
 *
 * Uses **sessionStorage (per-tab)**, not localStorage. The site is designed to
 * be opened in multiple tabs at once (host / audience / admin) to observe
 * multi-role flows. localStorage is shared across tabs of the same origin, so
 * a refresh in one tab would pick up another tab's userId and re-login as that
 * account — and IM single-device login would kick the sibling tab offline.
 * Per-tab sessionStorage keeps each tab's identity isolated.
 */
const USERID_STORAGE_KEY = 'live-api-example:userId';

/**
 * Cache the last joined liveId + whether the user was the host, so
 * a page refresh can auto-rejoin the room after login restore.
 * Stored in sessionStorage (per-tab) to avoid cross-tab interference.
 */
const LIVE_CACHE_KEY = 'live-api-example:lastRoom';

interface CachedRoom {
  liveId: string;
  isHost: boolean;
}

/** Cache the room info for refresh-restore. */
function cacheRoom(liveId: string, isHost: boolean): void {
  try {
    sessionStorage.setItem(LIVE_CACHE_KEY, JSON.stringify({ liveId, isHost } satisfies CachedRoom));
  } catch { /* storage unavailable */ }
}

/** Read the cached room info (null if none / unavailable). */
function getCachedRoom(): CachedRoom | null {
  try {
    const raw = sessionStorage.getItem(LIVE_CACHE_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as CachedRoom;
  } catch {
    return null;
  }
}

/** Clear the cached room info (call on leaveLive / endLive). */
function clearCachedRoom(): void {
  try {
    sessionStorage.removeItem(LIVE_CACHE_KEY);
  } catch { /* storage unavailable */ }
}

/** Read the cached dev login userId (empty string if none / unavailable). */
function getCachedUserId(): string {
  try {
    return sessionStorage.getItem(USERID_STORAGE_KEY) || '';
  } catch {
    return '';
  }
}

/** Clear the cached dev login userId (call on logout). */
function clearCachedUserId(): void {
  try {
    sessionStorage.removeItem(USERID_STORAGE_KEY);
  } catch { /* storage unavailable */ }
}

/**
 * Derive a distinct userId for a target role, so opening a second window logs
 * in as a **separate IM account** instead of kicking the current tab offline.
 *
 * A previously appended role suffix is stripped first so re-deriving stays
 * stable (e.g. `alice_host` -> base `alice` -> `alice_audience`).
 */
function deriveUserIdForRole(userId: string, role: Role): string {
  const base = userId.replace(/_(host|audience|admin)$/, '') || 'user';
  return `${base}_${role}`;
}

/**
 * Global demo session state.
 *
 * The login hook (`useLoginState`) must be created within a component setup,
 * so `App.vue` binds its `login`/`logout` actions here via `bindLoginApi`.
 * Example `run` closures only read plain reactive fields (role/liveId/userId).
 *
 * `role` is now DERIVED from SDK state (see `derivedRole.ts`) and updated
 * automatically via a `watchEffect` installed by `App.vue`. Consumers should
 * treat it as read-only: writing to it will be immediately overwritten on
 * the next SDK tick. It remains a plain field (rather than a `computed`)
 * so log-tagging code paths (`pushLog(..., session.role, ...)`) can stay
 * synchronous and unchanged.
 */
interface SessionState {
  loggedIn: boolean;
  loggingIn: boolean;
  userId: string;
  role: Role;
  liveId: string;

  /**
   * The userId the topbar login attempted. When a topbar login fails,
   * ExampleCard (login.login) reads this and auto-runs the login example
   * with it, so the raw API error shows in the card's own output area —
   * the single source of truth for error display. We pass the userId,
   * not the error string, to avoid cross-component timing bugs.
   *
   * Consumed (set to '') by ExampleCard once the auto-run starts.
   */
  pendingLoginUserId: string;
}

const session = reactive<SessionState>({
  loggedIn: false,
  loggingIn: false,
  userId: '',
  // Default `unassigned`: a role only exists once the user is in a
  // live room. `installDerivedRole` (see `derivedRole.ts`) flips this
  // to `host` / `audience` / `admin` based on SDK state.
  role: Role.Unassigned,
  liveId: '',
  pendingLoginUserId: '',
});

type LoginFn = (opts: { userId: string; userSig: string; sdkAppId: number }) => Promise<void>;
type LogoutFn = () => Promise<void>;

let loginFn: LoginFn | null = null;
let logoutFn: LogoutFn | null = null;

/** Called once from App.vue setup to wire the real login actions. */
function bindLoginApi(login: LoginFn, logout: LogoutFn): void {
  loginFn = login;
  logoutFn = logout;
}

/** Log in via the configured UserSig generator and update the session. */
async function loginSession(userId: string): Promise<void> {
  if (!loginFn) {
    throw new Error('Login API not bound yet');
  }
  if (!userId.trim()) {
    throw new Error(t('Login.UserIdRequired', 'userId 不能为空'));
  }
  session.loggingIn = true;
  pushLog('login', 'call login()', { userId }, session.role, 'call');
  try {
    const userSig = await genTestUserSig(userId);
    await loginFn({ userId, userSig, sdkAppId: SDKAppID });
    session.userId = userId;
    session.loggedIn = true;
    pushLog('login', 'login success', { userId }, session.role, 'event');
    try {
      sessionStorage.setItem(USERID_STORAGE_KEY, userId);
    } catch {
      /* storage may be unavailable */
    }
  } catch (e) {
    const message = e instanceof Error ? e.message : String(e);
    pushLog('login', 'login failed', { userId, error: message }, session.role, 'error');
    throw e;
  } finally {
    session.loggingIn = false;
  }
}

async function logoutSession(): Promise<void> {
  const userId = session.userId;
  pushLog('login', 'call logout()', { userId }, session.role, 'call');
  if (logoutFn) {
    try {
      await logoutFn();
      pushLog('login', 'logout success', { userId }, session.role, 'event');
    } catch (e) {
      const message = e instanceof Error ? e.message : String(e);
      pushLog('login', 'logout failed', { userId, error: message }, session.role, 'error');
      throw e;
    }
  }
  session.loggedIn = false;
  session.userId = '';
  try {
    sessionStorage.removeItem(USERID_STORAGE_KEY);
  } catch {
    /* storage may be unavailable */
  }
}

/**
 * Apply liveId from URL query (deep-link support).
 *
 * `role` used to be applied here too, but role is now derived from SDK
 * state (see `derivedRole.ts`) and cannot be assigned from URL. The
 * `?role=` query is still emitted by "新开窗口（不同角色）" as an INTENT
 * hint — the operator reads it to know what action to take next
 * (open the room and startLive to become host, or just join to be
 * audience). We intentionally do NOT write it into `session.role`
 * here because the SDK-derived value would immediately overwrite it.
 */
function applyQuery(query: Record<string, unknown>): void {
  if (typeof query.liveId === 'string') {
    session.liveId = query.liveId;
  }
}

/** Read the URL `?role=` intent (nullable). See `applyQuery` for context. */
function readRoleIntentFromQuery(query: Record<string, unknown>): Role | null {
  const role = query.role;
  // Only established roles are accepted as an intent — `unassigned`
  // is a state, not a plan you can hand off across tabs.
  if (role === Role.Host || role === Role.Audience || role === Role.Admin) {
    return role;
  }
  return null;
}

// ---------------------------------------------------------------------------
// Public surface (single re-export point per project convention).
// ---------------------------------------------------------------------------

export {
  applyQuery,
  bindLoginApi,
  cacheRoom,
  clearCachedRoom,
  clearCachedUserId,
  deriveUserIdForRole,
  getCachedRoom,
  getCachedUserId,
  loginSession,
  logoutSession,
  readRoleIntentFromQuery,
  session,
};
export type { SessionState };
