<template>
  <div id="AtomicxCoHostPanel" class="battle-panel">
    <div v-if="currentBattleInfo?.battleId" class="battle-user-list">
      <UserList :userList="battleUsers">
        <template #user-actions="{ user }">
          <div class="user-status">
            {{ t('In battle') }}...
          </div>
        </template>
      </UserList>
    </div>
    <RecommendHostList v-else class="recommend-host-list">
      <template #host-item-actions="{ user }">
        <TUIButton
          v-if="!isUserInvited(user.userId, user.liveId)"
          size="small"
          type="primary"
          :disabled="pendingInviteLiveIds.has(user.liveId) || hasPendingConnectionInvite"
          @click="handleSendBattleRequest(user)"
        >
          {{ t('Invite battle') }}
        </TUIButton>
        <TUIButton
          v-else
          size="small"
          color="gray"
          @click="handleCancelBattleRequest(user)"
        >
          {{ t('Cancel invitation') }}
        </TUIButton>
      </template>
    </RecommendHostList>
  </div>
</template>

<script lang="ts">
// ----------------------------------------------------------------------------
// Module-level battle bookkeeping (genuinely module-level)
//
// Why a separate `<script>` block (not `<script setup>`)?
//   Vue SFC compiles `<script setup>` body into the `setup()` function, so
//   any `const`/`let`/function call declared there runs ONCE PER COMPONENT
//   INSTANCE. We need real module-level semantics — runs exactly once at
//   module evaluation and survives all panel mount/unmount cycles —
//   otherwise:
//     - `pendingBattleRequests` would be re-created per mount and each new
//       BattlePanel would see an empty Map;
//     - `subscribeCoHostEvent(...)` would re-subscribe a new handler closure
//       per mount, leaking handlers into the core event bus and accumulating
//       N copies after N open/close cycles of the parent CoHostPanel dialog
//       (which internally uses `v-if` so BattlePanel really does mount and
//       unmount).
//
// Why module-level at all?
//   The user can close the CoHostPanel after sending a co-host invite that
//   has `withBattle: true`. The dialog uses `v-if="visible"` internally, so
//   closing it unmounts BattlePanel. When the invitee then accepts, the
//   `onCoHostRequestAccepted` handler must still fire `requestBattle`,
//   otherwise the two sides end up co-hosting without an actual PK ever
//   starting (UX symptom: connection bar appears but no battle/score bar).
//
// What we keep here:
//   - `pendingBattleRequests`: maps the still-outstanding invitee userId to the
//     battle duration that was active at the time the invite was sent. Capturing
//     the duration up-front means a later setting change (or panel teardown)
//     does NOT affect a battle that the user has already initiated.
//   - `acceptedBattleInvitees`: invitees who have already accepted in the
//     current invite round, parked here until the round settles so we can fire
//     ONE aggregated battle for all of them.
//   - The four CoHost event handlers + their subscription: registered
//     exactly once at module evaluation, surviving panel mount/unmount.
//
// Why aggregate instead of firing per-accept?
//   A host may invite several hosts to a PK at once. If we called
//   `requestBattle` the instant the first one accepted, that first accepter
//   would lock in a 1-on-1 battle and later accepters would be left out (race).
//   Instead we wait until EVERY invite in the round has settled — i.e.
//   `pendingBattleRequests` is empty because each invite landed on
//   accepted / rejected / timeout / cancel — AND every accepter has actually
//   finished establishing its cross-room connection (appears in `$connected`),
//   then fire a single `needResponse: false` battle for all of them.
//
// Why also gate on connection readiness?
//   `requestBattle` only pulls hosts that are ALREADY connected into the
//   battle. An "accepted" co-host invite does not guarantee the cross-room
//   connection (TRTC join + mixing) is live yet — and that handshake is
//   markedly slower on Electron (Mac/Win) than on Web. Firing the battle the
//   moment the round settles therefore drops any accepter that has not yet
//   connected, leaving it stuck in plain co-host while the others PK. We wait
//   for each accepter's `onCoHostUserJoined` (connection established) before
//   including it, backed by a bounded safety timeout so a never-connecting
//   accepter cannot stall the battle forever.
//
// Implementation notes:
//   - `subscribeCoHostEvent` and `CoHostEvent` are module-level exports of
//     the kit's CoHostState (no Vue scope dependency).
//   - `battleActions.requestBattle` is a module-level wrapper that already
//     does data reporting; we use it instead of calling `useBattleState()`
//     here, because that hook also registers `vueWatch` side effects per
//     call which would leak when invoked at module top level.
//   - `$loginUserInfo` is a nanostore atom; calling `.get()` is a synchronous
//     read with no scope tracking, safe outside any component instance.
//
// Mirrors the same pattern in `uikit-component-vue3-electron/.../BattlePanel.vue`
// to keep three-end (Web kit / Mac kit / Win demo) PK invite flow behavior
// aligned. See the corresponding block there for the canonical reference.
// ----------------------------------------------------------------------------
import { $loginUserInfo, $coHostStatus, $currentLive } from '@uikit-core/index';
// `$connected` is the canonical list of hosts whose cross-room connection is
// actually established. We read it (synchronously, no Vue scope) to gate the
// battle on connection readiness — see `maybeStartAggregatedBattle` below.
import { $connected } from '@uikit-core/states/CoHostState';
import type { SeatUserInfo } from '../../types';
import { CoHostEvent, BattleEvent, CoHostStatus } from '../../types';
import { subscribeCoHostEvent } from '../../states/CoHostState';
import { battleActions } from '../../states/BattleState';
import { setBattleAutoStartInProgress } from './battleAutoStart';

interface PendingBattleRequest {
  duration: number;
}
// Genuinely module-level state: created once on module evaluation and
// shared by every BattlePanel instance for the lifetime of the page.
const pendingBattleRequests = new Map<string, PendingBattleRequest>();
// Invitees who have already accepted in the current round, parked here until
// every pending invite has settled so we can fire ONE aggregated battle for
// all of them. Value carries the duration captured at invite time.
const acceptedBattleInvitees = new Map<string, PendingBattleRequest>();

// Safety timeout (ms) bounding how long we wait for accepters to finish
// establishing their cross-room connection before firing the battle. If an
// accepter never connects within this window (e.g. its connection fails after
// the accept signal), we proceed with whoever IS connected so the PK is never
// stalled indefinitely.
const BATTLE_CONNECTION_READY_TIMEOUT_MS = 10000;
// One-shot timer guarding the wait above. Module-level so it survives panel
// mount/unmount, paired with the rest of the round bookkeeping.
let connectionReadyTimer: ReturnType<typeof setTimeout> | null = null;

const clearConnectionReadyTimer = () => {
  if (connectionReadyTimer !== null) {
    clearTimeout(connectionReadyTimer);
    connectionReadyTimer = null;
  }
};

// True only while the aggregated `requestBattle` call is actually in flight.
// Combined with the three round-bookkeeping structures below, it lets us tell
// the Connection panel whether a Battle-tab-initiated PK is still being set up,
// covering the gap between firing the battle and `onBattleStarted`.
let isFiringAggregatedBattle = false;

// Recompute the shared "battle auto-start in progress" flag from all of the
// round bookkeeping. The window is open while any invite is still pending, any
// accepter is parked waiting to connect, the connection-ready safety timer is
// armed, or the aggregated requestBattle is in flight. The Connection panel
// disables its "Start battle" button while this is true to prevent a duplicate
// requestBattle for the same round.
const refreshBattleAutoStartFlag = () => {
  setBattleAutoStartInProgress(
    pendingBattleRequests.size > 0
    || acceptedBattleInvitees.size > 0
    || connectionReadyTimer !== null
    || isFiringAggregatedBattle
  );
};

// Subset of accepters whose cross-room connection is actually established
// (present in CoHostState's `$connected`). `requestBattle` only pulls
// already-connected hosts into the battle, so firing before an accepter has
// connected silently drops them — this is the root cause of the cross-end bug
// where a slower Electron peer accepted but stayed in plain co-host instead of
// joining the PK. We therefore only ever battle connected accepters.
const getConnectedAccepterIds = (): string[] => {
  const connectedUserIds = new Set($connected.get().map(user => user.userId));
  return Array.from(acceptedBattleInvitees.keys()).filter(userId => connectedUserIds.has(userId));
};

// Fire the actual battle for the given accepters and reset all round
// bookkeeping (accepted set + safety timer). A no-op when nobody is connected.
const fireAggregatedBattle = async (userIdList: string[], duration: number) => {
  // Assert the in-flight flag BEFORE clearing the round bookkeeping so the
  // shared "auto-start in progress" signal stays continuously true across the
  // clear -> requestBattle -> onBattleStarted hand-off (no flicker window where
  // the Connection panel's "Start battle" button briefly re-enables).
  isFiringAggregatedBattle = true;
  acceptedBattleInvitees.clear();
  clearConnectionReadyTimer();
  refreshBattleAutoStartFlag();
  if (userIdList.length === 0) {
    isFiringAggregatedBattle = false;
    refreshBattleAutoStartFlag();
    return;
  }
  try {
    await battleActions.requestBattle({
      config: {
        duration,
        needResponse: false,
        extensionInfo: '',
      },
      userIdList,
      timeout: 0,
    });
    // SUCCESS: deliberately keep `isFiringAggregatedBattle` asserted. The
    // request resolving only means the SDK accepted the call, NOT that the PK
    // has started — `onBattleStarted` (which closes the CoHostPanel) fires
    // slightly later. Clearing the flag here would re-enable the Connection
    // panel's "Start battle" button for that gap, which is exactly the brief
    // un-disabled flicker we are preventing. The flag is instead cleared by
    // `onBattleStartedAtModule` / `onBattleEndedAtModule` and the
    // session-boundary listeners below.
  } catch (error) {
    // Toast is intentionally not shown here: the panel may already be closed
    // when this handler runs; surfacing UI noise without context confuses
    // the user. Errors are still observable via console for diagnostics.
    console.error('[BattlePanel] aggregated requestBattle after co-host accepted failed:', error);
    // FAILURE: no battle will start, so release the flag now (and recompute)
    // so the user can retry via the Connection panel's "Start battle" button.
    isFiringAggregatedBattle = false;
    refreshBattleAutoStartFlag();
  }
};

// Fire a single battle for every accepted invitee, but only once the whole
// round has settled AND every accepter has actually finished connecting.
// "Settled" means `pendingBattleRequests` is empty: every invite has landed on
// accepted / rejected / timeout / cancel. Sending one `needResponse: false`
// battle to all connected accepters avoids the race where the first accepter
// locks in a 1-on-1 battle before the others have responded.
//
// Connection-readiness gate: an accepted invite only means the peer agreed to
// co-host; the cross-room connection (TRTC join + mixing) may not be live yet,
// and is markedly slower on Electron than on Web. Firing the battle before the
// peer appears in `$connected` would leave it out of the PK. So when not all
// accepters are connected we wait for `onCoHostUserJoined` to re-trigger this,
// backed by a bounded safety timeout.
const maybeStartAggregatedBattle = async () => {
  // Some invites are still outstanding — keep waiting for their events.
  if (pendingBattleRequests.size > 0) {
    return;
  }
  // Nobody accepted in this round; nothing to start. The round has fully
  // settled, so clear the shared auto-start flag.
  if (acceptedBattleInvitees.size === 0) {
    refreshBattleAutoStartFlag();
    return;
  }
  // All accepters in one round share a single battle; reuse the duration
  // captured when the first of them was invited.
  const duration = acceptedBattleInvitees.values().next().value?.duration ?? 0;
  const connectedAccepterIds = getConnectedAccepterIds();
  // Every accepter is connected → fire immediately for all of them.
  if (connectedAccepterIds.length === acceptedBattleInvitees.size) {
    await fireAggregatedBattle(connectedAccepterIds, duration);
    return;
  }
  // Otherwise some accepters are still connecting. Wait for their
  // `onCoHostUserJoined` to re-invoke us, and arm a one-shot safety timeout so
  // a never-connecting accepter cannot stall the battle forever: when it fires
  // we proceed with whoever is connected at that moment.
  if (connectionReadyTimer === null) {
    connectionReadyTimer = setTimeout(() => {
      connectionReadyTimer = null;
      const fallbackDuration = acceptedBattleInvitees.values().next().value?.duration ?? 0;
      void fireAggregatedBattle(getConnectedAccepterIds(), fallbackDuration);
    }, BATTLE_CONNECTION_READY_TIMEOUT_MS);
  }
  // Still waiting on connection readiness: keep the auto-start flag asserted.
  refreshBattleAutoStartFlag();
};

const onCoHostRequestAcceptedAtModule = ({ invitee }: { invitee: SeatUserInfo }) => {
  const ctx = pendingBattleRequests.get(invitee.userId);
  if (!ctx) {
    return;
  }
  // Move from "pending" to "accepted" and try to aggregate. We deliberately do
  // NOT fire the battle right away: waiting until the round settles lets us
  // include every accepter in a single battle.
  pendingBattleRequests.delete(invitee.userId);
  acceptedBattleInvitees.set(invitee.userId, ctx);
  refreshBattleAutoStartFlag();
  void maybeStartAggregatedBattle();
};

const onCoHostRequestCancelledAtModule = ({ inviter }: { inviter: SeatUserInfo }) => {
  pendingBattleRequests.delete(inviter.userId);
  refreshBattleAutoStartFlag();
};

const onCoHostRequestRejectedAtModule = ({ invitee }: { invitee: SeatUserInfo }) => {
  pendingBattleRequests.delete(invitee.userId);
  // A rejection may settle the round; aggregate the accepters gathered so far.
  void maybeStartAggregatedBattle();
};

const onCoHostRequestTimeoutAtModule = ({ inviter, invitee }: { inviter: SeatUserInfo; invitee: SeatUserInfo }) => {
  // Only clear if WE are the inviter that timed out; otherwise we are the
  // invitee side and have nothing in the pending map. Read login user via
  // the nanostore directly (no Vue scope needed at module level).
  if (inviter.userId === $loginUserInfo.get()?.userId) {
    pendingBattleRequests.delete(invitee.userId);
    // A timeout may settle the round; aggregate the accepters gathered so far.
    void maybeStartAggregatedBattle();
  }
};

// A previously-accepted battle invitee has now finished establishing its
// cross-room connection (it just appeared in `$connected`). Re-check whether
// the round can fire now that this accepter is connection-ready. No-op for
// joiners that are not part of the current battle round (plain co-host joins).
const onCoHostUserJoinedAtModule = ({ userInfo }: { userInfo: SeatUserInfo }) => {
  if (!acceptedBattleInvitees.has(userInfo.userId)) {
    return;
  }
  void maybeStartAggregatedBattle();
};

// Genuinely one-shot subscription at module load. Intentionally not paired
// with an `unsubscribe` because the consumer state module lives for the
// whole page lifetime; HMR teardown is out of scope for this fix.
subscribeCoHostEvent(CoHostEvent.onCoHostRequestAccepted, onCoHostRequestAcceptedAtModule);
subscribeCoHostEvent(CoHostEvent.onCoHostRequestCancelled, onCoHostRequestCancelledAtModule);
subscribeCoHostEvent(CoHostEvent.onCoHostRequestRejected, onCoHostRequestRejectedAtModule);
subscribeCoHostEvent(CoHostEvent.onCoHostRequestTimeout, onCoHostRequestTimeoutAtModule);
subscribeCoHostEvent(CoHostEvent.onCoHostUserJoined, onCoHostUserJoinedAtModule);

// Reset all round bookkeeping (including the in-flight `isFiringAggregatedBattle`
// flag) once the PK actually starts/ends, or when the session ends. This is the
// counterpart that lets `fireAggregatedBattle` keep `isFiringAggregatedBattle`
// asserted on its success path: without a reset here that flag (and therefore
// the shared "auto-start in progress" signal) would stay stuck true and leave
// the Connection panel's "Start battle" button disabled into the next round.
const resetAggregatedBattleRound = () => {
  pendingBattleRequests.clear();
  acceptedBattleInvitees.clear();
  clearConnectionReadyTimer();
  isFiringAggregatedBattle = false;
  refreshBattleAutoStartFlag();
};
const onBattleStartedAtModule = () => {
  resetAggregatedBattleRound();
};
const onBattleEndedAtModule = () => {
  resetAggregatedBattleRound();
};
battleActions.subscribeEvent(BattleEvent.onBattleStarted, onBattleStartedAtModule);
battleActions.subscribeEvent(BattleEvent.onBattleEnded, onBattleEndedAtModule);
// Session boundaries (mirrors ConnectionPanel.vue's reset triggers): drop any
// in-flight auto-start state when the local host leaves the co-host connection
// or exits the live room, so a stale flag can never bleed across sessions.
$coHostStatus.listen((status) => {
  if (status === CoHostStatus.Disconnected) {
    resetAggregatedBattleRound();
  }
});
$currentLive.listen((live) => {
  if (!live?.liveId) {
    resetAggregatedBattleRound();
  }
});

export { pendingBattleRequests };
</script>

<script setup lang="ts">
import { ref, computed } from 'vue';
import { TUIConnectionCode } from '@tencentcloud/tuiroom-engine-js';
import { TUIButton, TUIToast, useUIKit, TOAST_TYPE } from '@tencentcloud/uikit-base-component-vue3';
import { useBattleState } from '../../states/BattleState';
import { useCoHostState } from '../../states/CoHostState';
import { useLiveListState } from '../../states/LiveListState';
import { CoHostLayoutTemplate, LiveOrientation } from '../../types';
import UserList from './UserList.vue';
import RecommendHostList from './RecommendHostList.vue';
import type { SeatUserInfo as SeatUserInfoSetup } from '../../types';
import { COHOST_REQUEST_TIMEOUT_SECONDS } from './constants';
import { markInviteType, useInviteMutex } from './inviteMutex';

const { t } = useUIKit();
const props = defineProps<{
  battleDuration: number;
  coHostLayoutTemplate: CoHostLayoutTemplate;
}>();
const { currentLive } = useLiveListState();
const {
  invitees,
  requestHostConnection,
  cancelHostConnection,
} = useCoHostState();
const {
  currentBattleInfo,
  battleUsers,
} = useBattleState();

// Per-instance UI guard against double-clicking the "Invite battle" button:
// the button only flips to "Cancel invitation" after `invitees` updates, which
// happens asynchronously once `requestHostConnection` resolves. During that
// await window the button is still clickable, so a second click would re-issue
// the request for the same liveId and the SDK returns `Connecting`, surfacing a
// "send failed" toast right after the "send success" one. We track in-flight
// liveIds here to both disable the button immediately and ignore re-entrant
// calls. (This is distinct from the module-level `pendingBattleRequests`, which
// tracks the PK aggregation round across panel mount/unmount.)
const pendingInviteLiveIds = ref<Set<string>>(new Set());
const isUserInvited = (userId: string, liveId: string) => invitees.value.some(user => user.userId === userId && user.liveId === liveId);

// Mutual exclusion with connection invites: while any "Invite connection" is
// still pending, the "Invite battle" buttons are disabled (see inviteMutex.ts).
const { hasPendingConnectionInvite } = useInviteMutex(invitees);

// Determine the current live orientation based on layoutTemplate range.
// Landscape templates fall within [200, 599]; portrait otherwise.
//
// NOTE: Web kit derives orientation locally from `currentLive.layoutTemplate`,
// whereas Electron kit takes it as a `currentLiveOrientation` prop. Both
// pathways resolve to the same `effectiveCoHostLayoutTemplate` below; the
// divergence is purely about who owns the orientation source-of-truth.
const currentLiveOrientation = computed(() => {
  const layout = currentLive.value?.layoutTemplate;
  if (typeof layout === 'number' && layout >= 200 && layout <= 599) {
    return LiveOrientation.Landscape;
  }
  return LiveOrientation.Portrait;
});

// In landscape mode, force the co-host layout to the fixed 2-seat landscape template.
const effectiveCoHostLayoutTemplate = computed(() => {
  if (currentLiveOrientation.value === LiveOrientation.Landscape) {
    return CoHostLayoutTemplate.HostVideoLandscapeFixed2Seats;
  }
  return props.coHostLayoutTemplate;
});

const handleSendBattleRequest = async (user: SeatUserInfoSetup) => {
  // Re-entrancy guard: ignore a second click while a request for the same
  // liveId is still in flight (see `pendingInviteLiveIds` for details).
  if (pendingInviteLiveIds.value.has(user.liveId)) {
    return;
  }
  pendingInviteLiveIds.value.add(user.liveId);
  try {
    const result = await requestHostConnection({
      liveId: user.liveId,
      layoutTemplate: effectiveCoHostLayoutTemplate.value,
      timeout: COHOST_REQUEST_TIMEOUT_SECONDS,
      extensionInfo: JSON.stringify({
        timeout: COHOST_REQUEST_TIMEOUT_SECONDS,
        withBattle: true,
      }),
    });
    switch (result.get(user.liveId)) {
      case TUIConnectionCode.TUIConnectionCodeSuccess:
        // Capture the active battle duration at request time so a later
        // settings change won't retroactively alter this battle. Writes go
        // into the module-level `pendingBattleRequests` declared in the
        // sibling `<script>` block above.
        pendingBattleRequests.set(user.userId, { duration: props.battleDuration });
        // Tag this liveId as a battle invite so all "Invite connection"
        // buttons are disabled while it stays pending.
        markInviteType(user.liveId, 'battle');
        TUIToast({ type: TOAST_TYPE.SUCCESS, message: t('Battle invitation sent to user', { userName: user.userName || user.userId }) });
        break;
      case TUIConnectionCode.TUIConnectionCodeRoomNotExist:
        TUIToast({ type: TOAST_TYPE.ERROR, message: t('Send battle request failed, Room not exist') });
        break;
      case TUIConnectionCode.TUIConnectionCodeConnecting:
        TUIToast({ type: TOAST_TYPE.ERROR, message: t('Send battle request failed, Room is connecting') });
        break;
      case TUIConnectionCode.TUIConnectionCodeConnectingOtherRoom:
        TUIToast({ type: TOAST_TYPE.ERROR, message: t('Send battle request failed, Room is connecting other room') });
        break;
      case TUIConnectionCode.TUIConnectionCodeFull:
        TUIToast({ type: TOAST_TYPE.ERROR, message: t('Send battle request failed, Connected count is full') });
        break;
      case TUIConnectionCode.TUIConnectionCodeRetry:
        TUIToast({ type: TOAST_TYPE.ERROR, message: t('Send battle request failed') });
        break;
      default:
        break;
    }
  } catch (error) {
    // Defensive cleanup: under normal flow the entry is only set on the
    // Success branch above so there is nothing to delete here, but keep
    // the call as a safety net for any future code path that might add
    // an entry before throwing.
    pendingBattleRequests.delete(user.userId);
    TUIToast({ type: TOAST_TYPE.ERROR, message: t('Send battle request failed') });
    // Log instead of rethrow: the caller is a template `@click` handler
    // which does not await us, so a rethrow would surface as an unhandled
    // promise rejection. The toast above already informs the user, and
    // console.error preserves the stack for diagnostics.
    console.error('[BattlePanel] handleSendBattleRequest failed:', error);
  } finally {
    // Release the guard once the request settles. On success the button is
    // already flipped to "Cancel invitation" by `invitees`; on failure it
    // becomes clickable again so the user can retry.
    pendingInviteLiveIds.value.delete(user.liveId);
    // Recompute the shared auto-start flag: on success a new pending entry was
    // added (flag -> true), on failure the entry was removed (flag may clear).
    refreshBattleAutoStartFlag();
  }
};

const handleCancelBattleRequest = async (user: SeatUserInfoSetup) => {
  await cancelHostConnection({ liveId: user.liveId });
  pendingBattleRequests.delete(user.userId);
  refreshBattleAutoStartFlag();
  // Cancelling one outstanding invite may settle the round: if others have
  // already accepted, start the aggregated battle for them now.
  void maybeStartAggregatedBattle();
};
</script>

<style scoped lang="scss">
.battle-panel {
  width: 100%;
  height: 100%;
  display: flex;
  overflow: auto;
}

.battle-user-list {
  flex: 1;
  min-height: 0;
  overflow: hidden;
}

.user-status {
  color: var(--text-color-secondary);
  font-size: 14px;
  margin-right: 12px;
}

.recommend-host-list {
  flex: 1;
  min-height: 0;
}

.empty-state {
  display: flex;
  align-items: center;
  justify-content: center;
  align-self: center;
  flex: 1;
  color: var(--text-color-secondary);
  min-height: 60px;
}

.battle-panel-footer {
  display: flex;
  gap: 12px;
  justify-content: right;
  align-items: center;
  padding: 20px 0 0 0;
}
</style>
