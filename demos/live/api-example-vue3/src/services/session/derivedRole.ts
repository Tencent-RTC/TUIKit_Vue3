/**
 * Derive the demo `Role` from real SDK state.
 *
 * Architecture principle: **all role data comes from the SDK, never from
 * local flags**. The previous design used a `session.hasEnteredRoom`
 * boolean to guard against cross-tab SDK sync leakage, but that flag was
 * lost on page refresh — leaving the role stuck at `unassigned` even
 * though the SDK knew the user was in a room. The current design queries
 * the SDK directly for both "am I in a room" (`currentLive.liveId`) and
 * "what is my role" (`roomEngine.getUserInfo`), so a refresh / rejoin
 * always converges to the correct value.
 *
 * Role derivation (in priority order):
 *   1. Not logged in, or `currentLive.liveId` is empty
 *      -> `unassigned` (no room = no role).
 *   2. `currentLive.liveOwner.userId === session.userId` -> `host`
 *      (set by `startLive` — you own the room you started).
 *   3. `selfUserRole === TUIRole.kAdministrator` -> `admin`.
 *   4. Otherwise (in a room but not owner, not admin) -> `audience`.
 *
 * ## Self-role acquisition: query + event

 * The SDK is the single source of truth for "what is my userRole". We
 * acquire it in two complementary ways:
 *
 *   - **Active query**: when `currentLive.liveId` transitions to a
 *     non-empty value (join / start / room switch), we call
 *     `roomEngine.getUserInfo({ userId: session.userId })` to fetch the
 *     authoritative role. This covers the refresh-after-rejoin case that
 *     passive event listening cannot.
 *
 *   - **Passive events**: `TUIRoomEvents.onUserInfoChanged` fires for
 *     every user info change in the room. Filtering `userId === me`
 *     captures admin promotions / revocations that happen while we're
 *     already in the room, without needing another query.
 *
 * Both paths write to the same `selfUserRole` ref; the active query seeds
 * it on entry, the event handler keeps it fresh thereafter.
 *
 * ## Runtime gate integration
 *
 * `unassigned` is treated by the runtime gate (`ExampleCard.roleOk`) as
 * "allow": pre-room APIs like `startLive` and `joinLive` MUST be
 * runnable before any role can exist. Once you enter a room the badge
 * switches to a concrete role, and role-gated cards start behaving
 * according to their `roles: [...]` declaration.
 *
 * ## Idempotency
 *
 * `installDerivedRole` caches its readout on first call and returns
 * the same instance on subsequent calls. The function MUST be first
 * invoked from within a component setup so `useLiveListState()` and
 * friends register correctly; later callers are fine outside setup
 * because they only receive the cached ComputedRefs.
 */
import { computed, ref, watch, watchEffect, type ComputedRef } from 'vue';
// Import via the package name (NOT the facade) so vite's alias picks
// the right target per mode: dev -> real workspace/vendor SDK,
// prod -> facade (which by then has `__ATOMICX_SDK__` installed by
// main.ts). Importing the facade directly would force facade
// evaluation in dev too, and the lazy hooks would throw because
// `__ATOMICX_SDK__` is never set in dev mode.
//
// `TUIRole` / `TUIRoomEvents` are runtime enums re-exported by the
// SDK; in prod they resolve through the facade's lazy proxies so
// property access is deferred until after bootstrap.
import {
  useLiveListState,
  useRoomEngine,
  TUIRole,
  TUIRoomEvents,
} from 'tuikit-atomicx-vue3';
import { useUIKit } from '@tencentcloud/uikit-base-component-vue3';
import { session } from './session';
import { pushToast } from '../toast/store';
import { Role } from '../../lib/types';

const { t } = useUIKit();

interface DerivedRoleReadout {
  /** Currently derived role. */
  role: ComputedRef<Role>;
  /** Human-readable reason string, shown as a tooltip on the role badge. */
  reason: ComputedRef<string>;
}

// Cached readout — see the "Idempotency" section above. `null` until
// first call; subsequent calls return the same object.
let cachedReadout: DerivedRoleReadout | null = null;

/**
 * Wire the SDK-derived role into the global `session`.
 *
 * First invocation must happen inside a component setup so
 * `useLiveListState()` / `useRoomEngine()` register correctly.
 *
 * Subsequent invocations return the cached readout without doing
 * any additional side-effects.
 */
function installDerivedRole(): DerivedRoleReadout {
  if (cachedReadout) {
    return cachedReadout;
  }

  const { currentLive } = useLiveListState();
  const roomEngine = useRoomEngine();

  // Self's `userRole` from the SDK. Seeded by an active query on room
  // entry (see watcher below) and kept fresh by the `onUserInfoChanged`
  // event handler. `null` means "not yet known" — the derivation treats
  // null the same as "not admin" so it falls through to `audience`.
  const selfUserRole = ref<number | null>(null);

  // ---- Passive: event-driven role updates ----
  //
  // `onUserInfoChanged` fires for every user in the room whose info
  // changes. Filtering `userId === me` captures admin promotions /
  // revocations that happen while we're already in the room.
  const onUserInfoChanged = ({ userInfo }: { userInfo: { userId: string; userRole: number } }) => {
    if (userInfo?.userId && userInfo.userId === session.userId) {
      selfUserRole.value = userInfo.userRole;
    }
  };
  watch(
    () => roomEngine.instance,
    (instance, _prev, onCleanup) => {
      if (!instance) {
        return;
      }
      instance.on(TUIRoomEvents.onUserInfoChanged, onUserInfoChanged);
      onCleanup(() => {
        instance.off(TUIRoomEvents.onUserInfoChanged, onUserInfoChanged);
      });
    },
    { immediate: true },
  );

  // ---- Active: query self role on room entry ----
  //
  // When `currentLive.liveId` transitions to a non-empty value (join /
  // start / room switch / refresh-then-rejoin), actively query the SDK
  // for our own `userRole`. This is the authoritative seed — the event
  // handler only fires on *changes*, so without the query a refresh
  // after being promoted to admin would leave `selfUserRole` stale
  // until the next SDK event happens to arrive.
  //
  // Also resets `selfUserRole` on room leave so it doesn't carry over
  // to the next room.
  watch(
    () => currentLive.value?.liveId ?? '',
    async (liveId, prevLiveId) => {
      if (!liveId) {
        // Left the room — clear stale role.
        selfUserRole.value = null;
        return;
      }
      // Only query on entry or room switch, not on every currentLive
      // field update (e.g. liveName change).
      if (prevLiveId === liveId) {
        return;
      }
      // Active query: fetch our own userRole from the SDK. This is the
      // key fix for the refresh-after-rejoin case — the SDK knows our
      // role even if we just loaded the page.
      try {
        const info = await roomEngine.instance?.getUserInfo({
          userId: session.userId,
        });
        if (info?.userRole !== undefined) {
          selfUserRole.value = info.userRole;
        }
      } catch (e) {
        // Query may fail if the room is being torn down or the engine
        // is not yet ready. Log so the stale role is traceable — the
        // event handler will pick up the correct value on the next
        // onUserInfoChanged for self.
        console.warn('[derivedRole] getUserInfo failed, role may be stale:', e);
      }
    },
    { immediate: true },
  );

  const role = computed<Role>(() => {
    const userId = session.userId;
    if (!userId) {
      return Role.Unassigned;
    }
    // "In room" is derived directly from SDK state — no local flag.
    // `currentLive.liveId` is the authoritative signal: it's populated
    // by startLive/joinLive and cleared by leaveLive/endLive.
    const liveId = currentLive.value?.liveId;
    if (!liveId) {
      return Role.Unassigned;
    }
    const ownerId = currentLive.value?.liveOwner?.userId;
    if (ownerId && ownerId === userId) {
      return Role.Host;
    }
    // Fallback: the SDK's startLive response may omit roomOwner in some
    // flows (e.g. re-login after logout then startLive again), leaving
    // liveOwner.userId empty. The active getUserInfo query reports the
    // authoritative role — kRoomOwner means this user created the room
    // and is the host regardless of what liveOwner.userId says.
    if (selfUserRole.value === TUIRole.kRoomOwner) {
      return Role.Host;
    }
    if (selfUserRole.value === TUIRole.kAdministrator) {
      return Role.Admin;
    }
    return Role.Audience;
  });

  const reason = computed<string>(() => {
    const r = role.value;
    if (!session.userId) {
      return t('Role.ReasonNotLoggedIn', '尚未登录 · 角色未定');
    }
    if (r === Role.Unassigned) {
      return t('Role.ReasonUnassigned',
        '未进入任何直播间 · 角色需要通过 startLive（成为主播）或 joinLive（成为观众）后才能确定');
    }
    if (r === Role.Host) {
      const ownerId = currentLive.value?.liveOwner?.userId;
      return t('Role.ReasonHost', {
        // When liveOwner.userId is empty (e.g. re-login then startLive
        // again), the role is derived from the SDK getUserInfo fallback
        // (selfUserRole === kRoomOwner) instead of the liveOwner match.
        defaultValue: ownerId
          ? '你是 currentLive.liveOwner（{{userId}}）· 由 useLiveListState 派生'
          : '你是本房间主播 · SDK getUserInfo 报告 userRole = kRoomOwner（liveOwner.userId 为空，由 derivedRole 回退派生）',
        userId: session.userId,
      });
    }
    if (r === Role.Admin) {
      return t('Role.ReasonAdmin',
        'SDK getUserInfo / onUserInfoChanged 报告 userRole = TUIRole.kAdministrator');
    }
    const ownerId = currentLive.value?.liveOwner?.userId;
    return t('Role.ReasonAudience', {
      defaultValue: '已进入 {{ownerId}} 的直播间，且未被设为管理员',
      ownerId,
    });
  });

  // Keep the module-level `session.role` in sync so existing consumers
  // (log tagging, `roleOk`, pushToast role field) continue to read a
  // plain string field.
  //
  // `flush: 'sync'` is CRITICAL here: the default `'pre'` flush batches
  // the callback into the next microtask. That means code which runs
  // synchronously after a role-changing API call (e.g. startLive's
  // `run` closure calling `pushToast({ role: session.role })` right
  // after `currentLive` is populated) would read the STALE pre-call
  // role value. With `'sync'`, the assignment happens immediately when
  // any dependency of `role` changes, so `session.role` always reflects
  // the current derived value at any point in synchronous code.
  watchEffect(() => {
    session.role = role.value;
  }, { flush: 'sync' });

  // Toast every meaningful role transition so status changes are
  // visible even when the operator is focused on a specific card.
  //
  // Design notes:
  // - The FIRST assignment (undefined -> initial value) is skipped
  //   via the `oldRole == null` guard. Without this, every page
  //   load would flash a "未进房" toast right after login.
  // - Titles are deliberately short and free of action buttons.
  //   Some transitions (startLive / joinLive / leaveLive / endLive)
  //   already have richer action toasts pushed manually from the
  //   examples' `run` closures. The role toast supplements those
  //   with a *state* summary ("你现在是什么"), keeping the two
  //   messages complementary rather than redundant.
  // - The admin transitions (audience <-> admin) are the KEY use
  //   case: they're triggered by the host's `setAdministrator` on
  //   another window, so the promoted user has no local action
  //   toast to lean on. Without this role toast, self-promotion to
  //   admin would only be visible via the badge changing color —
  //   easy to miss.
  watch(
    () => role.value,
    (newRole, oldRole) => {
      if (oldRole == null || oldRole === newRole) {
        return;
      }
      const notice = describeTransition(oldRole, newRole);
      if (!notice) {
        return;
      }
      pushToast({
        source: 'live-list',
        role: newRole,
        level: 'success',
        title: notice.title,
        description: notice.description,
      });
    },
  );

  cachedReadout = { role, reason };
  return cachedReadout;
}

/**
 * Map a role transition to a toast payload, or return `null` if the
 * transition is not worth surfacing (e.g. transient / unreachable).
 *
 * Kept as a small pure function so the transition rules are easy to
 * eyeball / extend without wrestling with the `watch` callback.
 */
function describeTransition(
  from: Role,
  to: Role,
): { title: string; description: string } | null {
  // Entering a room.
  if (from === Role.Unassigned && to === Role.Host) {
    return { title: t('Toast.RoleHost'), description: t('Toast.RoleHostDesc') };
  }
  if (from === Role.Unassigned && to === Role.Audience) {
    return { title: t('Toast.RoleAudience'), description: t('Toast.RoleAudienceDesc') };
  }
  // Promoted / revoked by the host from another window — the KEY
  // use case: the promoted user has no manual toast to lean on.
  if (from === Role.Audience && to === Role.Admin) {
    return { title: t('Toast.RoleAdmin'), description: t('Toast.RoleAdminDesc') };
  }
  if (from === Role.Admin && to === Role.Audience) {
    return { title: t('Toast.RoleAdminRevoked'), description: t('Toast.RoleAdminRevokedDesc') };
  }
  // Leaving the room.
  if (to === Role.Unassigned) {
    if (from === Role.Host) {
      return { title: t('Toast.RoleLeftHost'), description: t('Toast.RoleLeftHostDesc') };
    }
    return { title: t('Toast.RoleLeft'), description: t('Toast.RoleLeftDesc') };
  }
  // Any other transition (e.g. unassigned -> admin, host -> admin,
  // admin -> host) is not reachable via normal SDK flows. Fall
  // through with no toast; the log record via `session.role` write
  // still captures the transition for debugging.
  return null;
}

export { installDerivedRole };
export type { DerivedRoleReadout };
