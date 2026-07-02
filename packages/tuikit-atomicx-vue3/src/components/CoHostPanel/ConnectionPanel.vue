<template>
  <div id="AtomicxCoHostPanel" class="connection-panel">
    <div
      v-if="coHostStatus === CoHostStatus.Connected"
      id="userListContainer"
      class="user-list-container"
    >
      <div class="user-list-title">
        <span class="user-list-title-text">{{ t('Current seat') }}</span>
        <span class="user-list-title-count">
          {{ `(${connected.length}/${seatNumber})` }}
        </span>
      </div>
      <div class="user-list">
        <div
          v-for="user in connected"
          :key="`${user.userId}-${user.liveId}`"
          class="user-item"
        >
          <div class="user-item-left">
            <Avatar
              :src="user.avatarUrl"
              :size="40"
            />
          </div>
          <div class="user-item-right">
            <div class="user-info">
              <span class="user-name">{{ user.userName || user.userId }}</span>
            </div>
            <div v-if="user.userId !== loginUserInfo?.userId" class="user-actions">
              <TUIButton
                size="small"
                :type="isMuted(user.liveId) ? 'primary' : 'default'"
                @click="handleToggleMuteHost(user)"
              >
                {{ isMuted(user.liveId) ? t('Unmute audio') : t('Mute audio') }}
              </TUIButton>
            </div>
            <div v-else class="user-status">
              {{ t('Connecting') }}...
            </div>
          </div>
        </div>
      </div>
      <div
        v-if="connected.length === 0"
        class="empty-state"
      >
        <span>{{ t('Seat is empty') }}</span>
      </div>
    </div>

    <RecommendHostList class="recommend-host-list">
      <template #host-item-actions="{ user }">
        <TUIButton
          v-if="!isUserInvited(user.userId, user.liveId)"
          size="small"
          :type="coHostStatus === CoHostStatus.Connected ? 'default' : 'primary'"
          :disabled="pendingInviteLiveIds.has(user.liveId) || hasPendingBattleInvite"
          @click="handleSendCoHostRequest(user)"
        >
          {{ t('Invite connection') }}
        </TUIButton>
        <TUIButton
          v-else
          size="small"
          color="gray"
          @click="handleCancelCoHostRequest(user)"
        >
          {{ t('Cancel invitation') }}
        </TUIButton>
      </template>
    </RecommendHostList>
  </div>
  <div v-if="coHostStatus === CoHostStatus.Connected" class="connection-panel-footer">
    <!-- Disable "Exit connection" during either two-phase Battle auto-start
         window (connection established but `onBattleStarted` not yet fired):
         - `isBattleAutoStartInProgress`: the inviter side (see battleAutoStart.ts);
         - `isPendingBattleAsReceiver`: the invitee side of a withBattle invite.
         Leaving now would tear down the connection mid hand-off and abort the PK. -->
    <TUIButton :color="'red'" :disabled="isBattleAutoStartInProgress || isPendingBattleAsReceiver" @click="showExitCoHostDialog = true">
      {{ t('Exit connection') }}
    </TUIButton>
    <template v-if="!currentBattleInfo?.battleId">
      <!-- Connected hosts auto-accept the PK: `handleBattleRequest` issues
           `requestBattle` with `needResponse: false`, so the receiver gets no
           accept/reject prompt and the battle starts immediately. There is
           therefore no pending invitation to revoke, so no "Cancel battle"
           button is shown here. -->
      <TUIButton
        v-if="!inPk"
        type="primary"
        :disabled="isSendingBattleRequest || hasPendingConnectionInvite || isBattleAutoStartInProgress || isPendingBattleAsReceiver"
        @click="handleBattleRequest"
      >
        {{ t('Start battle') }}
      </TUIButton>
    </template>
  </div>
  <TUIDialog
    :visible="coHostStatus === CoHostStatus.Connected && showExitCoHostDialog"
    :showClose="false"
    :modal="false"
    :customClasses="['exit-co-host-dialog']"
    @confirm="handleExitCoHost"
    @cancel="showExitCoHostDialog = false"
  >
    {{ t('Are you sure you want to exit the connection') }}
    <template #footer>
      <TUIButton
        type="default"
        @click="showExitCoHostDialog = false"
      >
        {{ t('Cancel') }}
      </TUIButton>
      <TUIButton
        type="primary"
        color="red"
        @click="handleExitCoHost"
      >
        {{ t('Exit connection') }}
      </TUIButton>
    </template>
  </TUIDialog>
</template>

<script lang="ts">
// ----------------------------------------------------------------------------
// Module-level battle-request bookkeeping for the connection panel.
//
// Why a separate `<script>` block (not `<script setup>`)?
//   The parent CoHostPanel dialog uses `v-if` internally, so closing it
//   unmounts ConnectionPanel. If the "Start battle" pending state lived in
//   `<script setup>` (per-instance refs) it would be destroyed on unmount and
//   reset to empty on the next mount, flipping the footer button back to
//   "Start battle" even though an outstanding battle invitation is still
//   pending on the SDK side. Declaring the state at module level makes it
//   survive every panel mount/unmount cycle.
//
//   For the same reason the battle-request event handlers are subscribed once
//   here at module evaluation: handlers registered in `onMounted` stop firing
//   while the panel is closed, so accept/reject/timeout/started/ended would be
//   missed and the pending state could never be cleared.
//
// Mirrors the established pattern in `BattlePanel.vue` (see its top `<script>`
// block) and is kept aligned with the Electron kit's ConnectionPanel.vue.
// ----------------------------------------------------------------------------
import { ref } from 'vue';
// `$loginUserInfo` / `$coHostStatus` / `$currentLive` are the framework-agnostic
// nanostores from uikit-core: reading them at module level (`.get()`) and
// `.listen()`-ing for changes needs no Vue component scope, which is exactly
// what this module-level block requires.
// NOTE: identifiers imported here (`CoHostStatus`, `CoHostEvent`, `BattleEvent`,
// the `$`-prefixed nanostores, `subscribeCoHostEvent`, `resetBattleAutoStart`)
// are intentionally NOT re-imported in the sibling `<script setup>` below: in a
// Vue SFC the two script blocks share one module scope, so importing the same
// identifier in both would be a duplicate declaration. The setup block and
// template still see these bindings.
import { $loginUserInfo, $coHostStatus, $currentLive } from '@uikit-core/index';
import { battleActions } from '../../states/BattleState';
import { subscribeCoHostEvent } from '../../states/CoHostState';
import { BattleEvent, CoHostStatus, CoHostEvent } from '../../types';
import { resetBattleAutoStart } from './battleAutoStart';
import type { SeatUserInfo as ModuleSeatUserInfo } from '../../types';

// Tracks the invitees of the battle invitation that the local host initiated
// from the connection panel via "Start battle", plus the associated battleId.
// Module-level so the footer "Start battle / Cancel battle" toggle survives the
// CoHostPanel dialog's v-if unmount/remount.
const battleRequestList = ref<Set<string>>(new Set());
const requestBattleId = ref('');

// In-flight guard for the manual "Start battle" action. Declared at module
// level (not in `<script setup>`) so the guard survives the CoHostPanel
// dialog's v-if unmount/remount and, more importantly, stays locked across the
// whole `requestBattle resolve -> onBattleStarted` window. On success it is
// intentionally NOT released in `handleBattleRequest`; it is only cleared by
// `resetConnectionBattleRequestState` (started / ended / session boundary) or
// on failure, so a second click during that async gap cannot re-issue the
// request. Mirrors the `isFiringAggregatedBattle` pattern used for auto-start.
const isSendingBattleRequest = ref(false);

// Receiver-side counterpart of the inviter's `isBattleAutoStartInProgress`
// (battleAutoStart.ts). A PK started via "Invite battle" reaches the invitee
// first as a plain co-host request carrying `extensionInfo.withBattle: true`;
// the PK itself only begins later when the inviter fires the aggregated
// `requestBattle` (onBattleStarted). Between the invitee accepting
// (coHostStatus -> Connected, which auto-switches this panel to the connection
// tab) and onBattleStarted, the footer briefly shows an enabled
// "Exit connection" / "Start battle" pair. Acting in that window tears down the
// hand-off and aborts the PK, so both buttons must be disabled here too.
// Module-level (NOT `<script setup>`) so both the flag AND the subscriptions
// that drive it survive the CoHostPanel dialog's v-if unmount/remount and every
// live-session (start/stop live) boundary. This is critical for the receiver:
// the withBattle invite typically arrives while the CoHost panel is closed, so
// a `<script setup>` subscription would not exist yet (or would bind to a
// destroyed instance's refs) and the buttons would never be disabled.
const isPendingBattleAsReceiver = ref(false);
// Set when the most recent inbound co-host invite carried withBattle=true, and
// consumed on the next coHostStatus -> Connected transition to raise
// `isPendingBattleAsReceiver`. A plain invite (withBattle=false), a
// cancelled/timed-out invite, or initiating our own outbound request clears it
// so a later plain co-host connection never inherits the receiver guard.
const receiverBattleInvitePending = ref(false);

// Clear the pending battle-request state. Called when the round resolves
// (started/ended) and as a defensive reset when the local host leaves the
// co-host connection or the live room (see the listeners below), so a stale
// "Cancel battle" state never leaks into the next session.
const resetConnectionBattleRequestState = () => {
  requestBattleId.value = '';
  battleRequestList.value.clear();
  // Release the manual "Start battle" in-flight guard here: this is the single
  // place that clears it on success, covering started / ended / disconnect /
  // live-end so the button never stays stuck disabled into the next session.
  isSendingBattleRequest.value = false;
  // Clear the Battle-tab auto-start flag too, so a session boundary
  // (disconnect / live-end) or a started/ended battle never leaves the
  // Connection panel's "Start battle" button stuck disabled.
  resetBattleAutoStart();
  // Clear the receiver-side two-phase battle guard as well, so a started/ended
  // PK or a session boundary (disconnect / live-end) never leaves the
  // receiver's "Exit connection" / "Start battle" buttons stuck disabled.
  isPendingBattleAsReceiver.value = false;
  receiverBattleInvitePending.value = false;
};

const onBattleRequestAccept = (eventInfo: { battleId: string; inviter: ModuleSeatUserInfo; invitee: ModuleSeatUserInfo }) => {
  if (eventInfo.inviter.userId === $loginUserInfo.get()?.userId) {
    battleRequestList.value.delete(eventInfo.invitee.userId);
  }
};

const onBattleRequestRejected = (eventInfo: { battleId: string; inviter: ModuleSeatUserInfo; invitee: ModuleSeatUserInfo }) => {
  if (eventInfo.inviter.userId === $loginUserInfo.get()?.userId) {
    battleRequestList.value.delete(eventInfo.invitee.userId);
  }
};

const onBattleRequestTimeout = (eventInfo: { battleId: string; inviter: ModuleSeatUserInfo; invitee: ModuleSeatUserInfo }) => {
  if (eventInfo.inviter.userId === $loginUserInfo.get()?.userId) {
    battleRequestList.value.delete(eventInfo.invitee.userId);
  }
};

const onBattleStarted = () => {
  resetConnectionBattleRequestState();
};

const onBattleEnded = () => {
  resetConnectionBattleRequestState();
};

// Receiver-side battle detection: an "Invite battle" arrives on the invitee as
// a plain co-host request whose extensionInfo carries `withBattle: true`.
// Record the marker; it is consumed on the next coHostStatus -> Connected
// transition below to raise `isPendingBattleAsReceiver`.
const onCoHostRequestReceivedAsReceiver = ({ extensionInfo }: { inviter: ModuleSeatUserInfo; extensionInfo: string }) => {
  let withBattle = false;
  try {
    withBattle = Boolean(extensionInfo && JSON.parse(extensionInfo)?.withBattle);
  } catch (e) {
    // Malformed extensionInfo: treat it as a plain co-host invite.
  }
  // Latest invite wins: a plain co-host invite must clear a stale PK marker.
  receiverBattleInvitePending.value = withBattle;
};

// The withBattle invite was cancelled by the inviter or timed out before we
// accepted it: drop the marker so a later plain co-host connection is not
// mistaken for a battle hand-off.
const onCoHostRequestGoneAsReceiver = () => {
  receiverBattleInvitePending.value = false;
};

// One-shot subscription at module load. Intentionally not paired with an
// unsubscribe: the handlers only mutate module-level state and must keep
// firing while the panel is unmounted; the module lives for the whole page.
battleActions.subscribeEvent(BattleEvent.onBattleRequestAccept, onBattleRequestAccept);
battleActions.subscribeEvent(BattleEvent.onBattleRequestReject, onBattleRequestRejected);
battleActions.subscribeEvent(BattleEvent.onBattleRequestTimeout, onBattleRequestTimeout);
battleActions.subscribeEvent(BattleEvent.onBattleStarted, onBattleStarted);
battleActions.subscribeEvent(BattleEvent.onBattleEnded, onBattleEnded);

// Receiver-side subscriptions (see `isPendingBattleAsReceiver`). Same one-shot,
// never-unsubscribed module-level pattern as the battle handlers above: the
// withBattle invite typically arrives with the CoHost panel closed, so these
// must fire while the panel is unmounted.
subscribeCoHostEvent(CoHostEvent.onCoHostRequestReceived, onCoHostRequestReceivedAsReceiver);
subscribeCoHostEvent(CoHostEvent.onCoHostRequestCancelled, onCoHostRequestGoneAsReceiver);
subscribeCoHostEvent(CoHostEvent.onCoHostRequestTimeout, onCoHostRequestGoneAsReceiver);

// Defensive cleanup gates, aligned with `resetBattleState`'s triggers in
// BattleState: drop any pending battle-request state when the local host
// leaves the co-host connection or exits the live room, so the next session
// never opens the panel showing a stale "Cancel battle" button.
$coHostStatus.listen((status) => {
  if (status === CoHostStatus.Connected) {
    // Connection established. If it originated from a withBattle invite we
    // received, raise the receiver-side two-phase guard; it is cleared later by
    // resetConnectionBattleRequestState (onBattleStarted / onBattleEnded /
    // session boundary).
    if (receiverBattleInvitePending.value) {
      isPendingBattleAsReceiver.value = true;
      receiverBattleInvitePending.value = false;
    }
  } else if (status === CoHostStatus.Disconnected) {
    resetConnectionBattleRequestState();
  }
});
$currentLive.listen((live) => {
  if (!live?.liveId) {
    resetConnectionBattleRequestState();
  }
});
</script>

<script setup lang="ts">
import { ref, onMounted, onUnmounted, computed } from 'vue';
import { TUIBattleCode, TUIConnectionCode } from '@tencentcloud/tuiroom-engine-js';
import { TUIButton, TUIToast, useUIKit, TOAST_TYPE, TUIDialog } from '@tencentcloud/uikit-base-component-vue3';
// NOTE: the `$`-prefixed nanostores (`$loginUserInfo` / `$coHostStatus` /
// `$currentLive`), `battleActions`, `subscribeCoHostEvent`, `BattleEvent`,
// `CoHostStatus`, `CoHostEvent` and `resetBattleAutoStart` are intentionally
// imported ONLY in the sibling `<script>` block above (which owns the
// module-level battle/receiver bookkeeping). Both script blocks share one
// module scope after compilation, so importing them again here would be a
// duplicate declaration. The setup block and template still see those bindings.
import { useBattleState } from '../../states/BattleState';
import { useCoHostState } from '../../states/CoHostState';
import { useLiveListState } from '../../states/LiveListState';
import { useLoginState } from '../../states/LoginState';
import { CoHostLayoutTemplate, LiveOrientation } from '../../types';
import { Avatar } from '../Avatar';
import { ERROR_MESSAGE, CONNECTION_ERROR_MESSAGE, COHOST_REQUEST_TIMEOUT_SECONDS, BATTLE_REQUEST_TIMEOUT_SECONDS } from './constants';
import RecommendHostList from './RecommendHostList.vue';
import type { SeatUserInfo } from '../../types';
import { markInviteType, useInviteMutex } from './inviteMutex';
import { useBattleAutoStart } from './battleAutoStart';

const props = defineProps<{
  battleDuration: number;
  coHostLayoutTemplate: CoHostLayoutTemplate;
}>();

const { t } = useUIKit();
const { loginUserInfo } = useLoginState();
const { currentLive } = useLiveListState();
const {
  coHostStatus,
  connected,
  applicant,
  invitees,
  mutedHosts,
  requestHostConnection,
  cancelHostConnection,
  exitHostConnection,
  muteRemoteHostAudio,
  subscribeEvent,
  unsubscribeEvent,
} = useCoHostState();
const {
  currentBattleInfo,
  battleUsers,
  requestBattle,
  cancelBattleRequest,
} = useBattleState();

// Determine the current live orientation based on layoutTemplate range.
// Landscape templates fall within [200, 599]; portrait otherwise.
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

const seatNumber = computed(() => {
  const seatNumberMap: Record<CoHostLayoutTemplate, number> = {
    [CoHostLayoutTemplate.HostDynamicGrid]: 9,
    [CoHostLayoutTemplate.HostDynamic1v6]: 7,
    [CoHostLayoutTemplate.HostVideoLandscapeFixed2Seats]: 2,
  };
  return seatNumberMap[effectiveCoHostLayoutTemplate.value];
});

const showExitCoHostDialog = ref(false);

const isUserInvited = (userId: string, liveId: string) => invitees.value.some(user => user.userId === userId && user.liveId === liveId);
const inPk = computed(() => battleUsers.value.some(user => user.userId === loginUserInfo.value?.userId));

// Mutual exclusion with battle invites: while any "Invite battle" is still
// pending, the "Invite connection" buttons are disabled (see inviteMutex.ts).
// `hasPendingConnectionInvite` mirrors the reverse direction: while any
// "Invite connection" is still pending, starting a PK is blocked so the host
// cannot kick off a battle with only the already-connected hosts and leave a
// later accepter stranded in plain co-host (AB in PK while BC co-host).
const { hasPendingBattleInvite, hasPendingConnectionInvite } = useInviteMutex(invitees);

// While a Battle-tab-initiated PK is auto-starting (co-host connection
// established but `onBattleStarted` not yet fired, see battleAutoStart.ts),
// disable "Start battle" so the user cannot fire a duplicate `requestBattle`
// for the same round.
const { isBattleAutoStartInProgress } = useBattleAutoStart();

const sentCoHostRequestUserList = ref<Set<string>>(new Set());
// Guard against double-clicking the "Invite connection" button: the button's
// "invited" state flips to "Cancel invitation" only after `invitees` is
// updated, which happens asynchronously once the SDK request resolves. During
// that await window the button is still clickable, so a second click would
// re-issue the request for the same liveId and the SDK returns an error code
// (e.g. Connecting), surfacing a confusing "send failed" toast right after the
// "send success" toast. We track the in-flight liveIds here to both disable
// the button immediately and ignore re-entrant calls authoritatively.
const pendingInviteLiveIds = ref<Set<string>>(new Set());
// Map userId -> close() callback of the most recent "invitation sent" toast.
// Used to dismiss the toast when the invitation is rejected/cancelled/timed
// out, so the user does not see "invitation sent" and "invitation rejected"
// at the same time (typically when invitee is busy on another connection).
const sentToastHandles = ref<Map<string, () => void>>(new Map());

const closeSentToast = (userId: string) => {
  const close = sentToastHandles.value.get(userId);
  if (close) {
    try {
      close();
    } catch (e) {
      // Ignore: toast may already be closed.
    }
    sentToastHandles.value.delete(userId);
  }
};

const handleSendCoHostRequest = async (user: SeatUserInfo) => {
  // Re-entrancy guard: ignore a second click while a request for the same
  // liveId is still in flight (see `pendingInviteLiveIds` for details).
  if (pendingInviteLiveIds.value.has(user.liveId)) {
    return;
  }
  pendingInviteLiveIds.value.add(user.liveId);
  // We are initiating our own co-host request, so we are the inviter, not a
  // battle receiver: drop any stale received-invite marker so a previously
  // declined withBattle invite cannot wrongly raise the receiver guard when
  // this connection establishes.
  receiverBattleInvitePending.value = false;
  try {
    const result = await requestHostConnection({
      liveId: user.liveId,
      layoutTemplate: effectiveCoHostLayoutTemplate.value,
      timeout: COHOST_REQUEST_TIMEOUT_SECONDS,
      // Pass the candidate's own info so the pending invitee entry uses the
      // exact same identity as the rendered list, guaranteeing the invite
      // button reliably switches to "Cancel invitation".
      userInfo: {
        userId: user.userId,
        userName: user.userName,
        avatarUrl: user.avatarUrl,
      },
      extensionInfo: JSON.stringify({
        timeout: COHOST_REQUEST_TIMEOUT_SECONDS,
        withBattle: false,
      }),
    });
    if (result.get(user.liveId) === TUIConnectionCode.TUIConnectionCodeSuccess) {
      sentCoHostRequestUserList.value.add(user.userId);
      // Tag this liveId as a connection invite so all "Invite battle" buttons
      // are disabled while it stays pending.
      markInviteType(user.liveId, 'connection');
      // Keep a handle to the "invitation sent" toast so we can close it later.
      // When the invitee is already busy on another co-host connection, the
      // SDK returns Success here and then fires `onConnectionRequestReject`
      // almost immediately, which surfaces an "Invitation rejected" toast in
      // the host app. To avoid showing two conflicting toasts at the same
      // time, we proactively dismiss the "sent" toast on reject/timeout
      // (see `handleCoHostRequestRejected` / `handleCoHostRequestTimeout`).
      const sentToast = TUIToast({
        type: TOAST_TYPE.SUCCESS,
        message: t('Co-host invitation sent to user', { userName: user.userName || user.userId }),
      });
      if (sentToast?.close) {
        sentToastHandles.value.set(user.userId, sentToast.close);
      }
    } else {
      switch (result.get(user.liveId)) {
        case TUIConnectionCode.TUIConnectionCodeRoomNotExist:
          TUIToast({ type: TOAST_TYPE.ERROR, message: t('Send co-host request failed, Room not exist') });
          break;
        case TUIConnectionCode.TUIConnectionCodeConnecting:
          TUIToast({ type: TOAST_TYPE.ERROR, message: t('Send co-host request failed, Room is connecting') });
          break;
        case TUIConnectionCode.TUIConnectionCodeConnectingOtherRoom:
          TUIToast({ type: TOAST_TYPE.ERROR, message: t('Send co-host request failed, Room is connecting other room') });
          break;
        case TUIConnectionCode.TUIConnectionCodeFull:
          TUIToast({ type: TOAST_TYPE.ERROR, message: t('Send co-host request failed, Connected count is full') });
          break;
        case TUIConnectionCode.TUIConnectionCodeRetry:
          TUIToast({ type: TOAST_TYPE.ERROR, message: t('Send co-host request failed') });
          break;
        default:
          TUIToast({ type: TOAST_TYPE.ERROR, message: t('Send co-host request failed') });
          break;
      }
    }
  } catch (error: any) {
    // The SDK rejects with a `TUIError` carrying a numeric `code` (e.g. 100402
    // "the sponsor room is still in pending status" when the local host already
    // has a pending connection request). Map known codes to a friendly message
    // and fall back to the generic one otherwise.
    const mappedMessage = CONNECTION_ERROR_MESSAGE[error?.code as keyof typeof CONNECTION_ERROR_MESSAGE];
    TUIToast({ type: TOAST_TYPE.ERROR, message: t(mappedMessage || 'Send co-host request failed') });
    throw error;
  } finally {
    // Release the guard once the request settles. On success the button is
    // already flipped to "Cancel invitation" by `invitees`; on failure it
    // becomes clickable again so the user can retry.
    pendingInviteLiveIds.value.delete(user.liveId);
  }
};

const handleCancelCoHostRequest = async (user: SeatUserInfo) => {
  try {
    await cancelHostConnection({ liveId: user.liveId });
    sentCoHostRequestUserList.value.delete(user.userId);
    closeSentToast(user.userId);
  } catch (error) {
    TUIToast({ type: TOAST_TYPE.ERROR, message: t('Cancel co-host request failed') });
    throw error;
  }
};

const isMuted = (liveId: string) => mutedHosts.value.includes(liveId);

const handleToggleMuteHost = async (user: SeatUserInfo) => {
  const muted = isMuted(user.liveId);
  try {
    // The mute state is persisted in the CoHostState store, so it stays in
    // sync after the dialog is closed and reopened. No local bookkeeping here.
    await muteRemoteHostAudio(user.liveId, !muted);
  } catch (error) {
    TUIToast({ type: TOAST_TYPE.ERROR, message: t('Mute audio failed') });
  }
};

const handleExitCoHost = async () => {
  if (requestBattleId.value && battleRequestList.value.size > 0) {
    try {
      await cancelBattleRequest({
        battleId: requestBattleId.value,
        userIdList: Array.from(battleRequestList.value),
      });
    } catch (error) {
      console.warn('Cancel pending battle request on exit co-host failed:', error);
    }
    requestBattleId.value = '';
    battleRequestList.value.clear();
  }
  exitHostConnection();
  showExitCoHostDialog.value = false;
};

const handleBattleRequest = async () => {
  if (isSendingBattleRequest.value) {
    return;
  }
  // Defensive guard against a race where the button's :disabled state has not
  // caught up yet: never start a PK while connection invites are still pending
  // (accept / reject / cancel / timeout all clear them). Keeps the button-level
  // disable and the handler-level guard in agreement.
  if (hasPendingConnectionInvite.value) {
    return;
  }
  // Defensive guard mirroring the button's :disabled state: never fire a manual
  // PK while a Battle-tab-initiated PK is still auto-starting for the same
  // round, otherwise the SDK rejects the duplicate `requestBattle` and a
  // "Request battle failed" toast is shown (see battleAutoStart.ts).
  if (isBattleAutoStartInProgress.value) {
    return;
  }
  // Defensive guard mirroring the button's :disabled state: never fire a manual
  // PK while we are still in the receiver-side two-phase window of a withBattle
  // invite we accepted (connected but onBattleStarted not yet fired).
  if (isPendingBattleAsReceiver.value) {
    return;
  }
  isSendingBattleRequest.value = true;
  const userIdList = connected.value.filter(item => item.userId !== loginUserInfo.value?.userId).map(item => item.userId);
  try {
    const battleRes = await requestBattle({
      config: {
        duration: props.battleDuration,
        // Connected hosts auto-join the PK without a per-invitee prompt: the
        // receiver no longer gets `onBattleRequestReceived`, so no accept/reject
        // dialog is shown and the battle starts immediately.
        needResponse: false,
        extensionInfo: '',
      },
      userIdList,
      timeout: 0,
    });
    // `battleRes.result` maps each invitee userId to a `TUIBattleCode`. The
    // request only counts as failed when every invitee failed (none returned
    // `kSuccess`); if at least one invitee succeeded the battle is under way,
    // so no error toast is shown.
    const inviteeResults = (battleRes?.result ?? {}) as Record<string, TUIBattleCode>;
    const resultCodes = Object.values(inviteeResults);
    const allInviteesFailed = resultCodes.length > 0 && resultCodes.every(code => code !== TUIBattleCode.kSuccess);
    if (allInviteesFailed) {
      TUIToast.error({ message: t('Request battle failed') });
      // Every invitee failed: release the guard so the host can retry.
      isSendingBattleRequest.value = false;
      return;
    }
    requestBattleId.value = battleRes.battleId;
    // Only track invitees who actually accepted the request (returned
    // `kSuccess`); invitees that failed must not be added to the pending list.
    Object.entries(inviteeResults).forEach(([userId, code]) => {
      if (code === TUIBattleCode.kSuccess) {
        battleRequestList.value.add(userId);
      }
    });
    // Success: intentionally keep `isSendingBattleRequest` locked. It is
    // released only by `resetConnectionBattleRequestState` (onBattleStarted /
    // onBattleEnded / session boundary), which closes the
    // `resolve -> onBattleStarted` gap where `inPk` is still false and a second
    // click could otherwise re-issue the request.
  } catch (error: any) {
    const message = t(ERROR_MESSAGE[error.code as keyof typeof ERROR_MESSAGE] || 'Request battle failed');
    TUIToast.error({ message });
    // Request threw: release the guard so the host can retry.
    isSendingBattleRequest.value = false;
  }
};

const handleCoHostRequestAccepted = ({ invitee }: { invitee: SeatUserInfo }) => {
  if (sentCoHostRequestUserList.value.has(invitee.userId)) {
    sentCoHostRequestUserList.value.delete(invitee.userId);
  }
  // Drop the toast handle without closing — the "invitation sent" toast can
  // finish its normal life-cycle since the invitation was actually accepted.
  sentToastHandles.value.delete(invitee.userId);
};

const handleCoHostRequestRejected = ({ invitee }: { invitee: SeatUserInfo }) => {
  if (sentCoHostRequestUserList.value.has(invitee.userId)) {
    sentCoHostRequestUserList.value.delete(invitee.userId);
  }
  // Dismiss the just-shown "invitation sent" toast to avoid showing it
  // alongside the host app's "invitation rejected" toast.
  closeSentToast(invitee.userId);
};

const handleCoHostRequestTimeout = ({ inviter, invitee }: { inviter: SeatUserInfo; invitee: SeatUserInfo }) => {
  if (inviter.userId === loginUserInfo.value?.userId && sentCoHostRequestUserList.value.has(invitee.userId)) {
    sentCoHostRequestUserList.value.delete(invitee.userId);
  }
  if (inviter.userId === loginUserInfo.value?.userId) {
    closeSentToast(invitee.userId);
  }
};

onMounted(() => {
  subscribeEvent(CoHostEvent.onCoHostRequestAccepted, handleCoHostRequestAccepted);
  subscribeEvent(CoHostEvent.onCoHostRequestRejected, handleCoHostRequestRejected);
  subscribeEvent(CoHostEvent.onCoHostRequestTimeout, handleCoHostRequestTimeout);
});

onUnmounted(() => {
  unsubscribeEvent(CoHostEvent.onCoHostRequestAccepted, handleCoHostRequestAccepted);
  unsubscribeEvent(CoHostEvent.onCoHostRequestRejected, handleCoHostRequestRejected);
  unsubscribeEvent(CoHostEvent.onCoHostRequestTimeout, handleCoHostRequestTimeout);
});
</script>

<style lang="scss">
.exit-co-host-dialog {
  width: 300px;
  border-radius: 16px;
  border: 1px solid var(--stroke-color-module, #48494F);
  background: var(--bg-color-operate, #1F2024);
  box-shadow: 0 1px 8px 0 rgba(0, 0, 0, 0.40),
              0 4px 12px 0 rgba(0, 0, 0, 0.40),
              0 10px 30px 0 rgba(0, 0, 0, 0.40);
}
</style>

<style scoped lang="scss">
.connection-panel {
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  min-height: 0;
  flex: 1;
}

.user-list-container {
  display: flex;
  flex-direction: column;
  margin-bottom: 8px;
  max-height: 220px;
  .user-list-title {
    display: flex;
    align-items: center;
    color: var(--text-color-secondary);
    font-size: 14px;
    font-weight: 400;
    gap: 8px;
    margin: 12px 0 8px 0;
  }

  .refresh-icon {
    cursor: pointer;
    &.loading {
      animation: spin 1s linear infinite;
    }
  }

  @keyframes spin {
    from {
      transform: rotate(0deg);
    }
    to {
      transform: rotate(360deg);
    }
  }

  .user-list {
    display: flex;
    flex-direction: column;
    gap: 12px;
    overflow-y: scroll;

    &::-webkit-scrollbar {
      display: none;
    }
  }

  .user-item {
    display: flex;
    align-items: center;
    gap: 12px;
    height: 50px;
    box-sizing: border-box;

    .user-item-left {
      height: 100%;
      display: flex;
      align-items: center;
    }

    .user-item-right {
      flex: 1;
      display: flex;
      height: 100%;
      align-items: center;
      border-bottom: 1px solid var(--stroke-color-secondary);
    }

    .user-info {
      flex-grow: 1;
      display: flex;
      align-items: center;
      gap: 8px;

      .user-name {
        font-size: 16px;
        font-weight: 500;
        color: var(--text-color-primary);
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
        max-width: 200px;
      }

      .user-level {
        background: #3b82f6;
        color: white;
        font-size: 12px;
        padding: 2px 6px;
        border-radius: 10px;
        min-width: 24px;
        text-align: center;
        font-weight: 500;
      }

      .is-me {
        color: var(--text-color-secondary);
        font-size: 14px;
      }
    }

    .user-status {
      color: var(--text-color-secondary);
      font-size: 14px;
      margin-right: 12px;
    }

    .user-actions {
      display: flex;
      gap: 6px;
    }
  }
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

.recommend-host-list {
  flex: 1;
  min-height: 0;
}

.connection-panel-footer {
  display: flex;
  gap: 12px;
  justify-content: right;
  align-items: center;
  padding: 20px 0 0 0;
}

.layout-template-container {
  padding: 16px;
  margin-bottom: 16px;
  background: var(--background-color-secondary);
  border-radius: 12px;
  border: 1px solid var(--border-color);
}

.layout-template-title {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 16px;

  .layout-template-title-text {
    font-size: 16px;
    font-weight: 600;
    color: var(--text-color-primary);
  }
}

.layout-template-options {
  display: flex;
  flex-direction: row;
  gap: 12px;
}

.layout-template-option {
  display: flex;
  align-items: center;
  padding: 12px 16px;
  border: 2px solid var(--border-color);
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s ease;
  background: var(--background-color-primary);

  &:hover {
    border-color: var(--primary-color);
    background: var(--background-color-hover);
  }

  &.active {
    border-color: var(--primary-color);
    background: var(--primary-color-light);

    .layout-template-label {
      color: var(--primary-color);
      font-weight: 600;
    }

    .layout-template-count {
      color: var(--primary-color);
    }
  }
}

.layout-template-radio {
  margin-right: 12px;
  width: 18px;
  height: 18px;
  accent-color: var(--primary-color);
  cursor: pointer;
}

.layout-template-label {
  flex: 1;
  font-size: 14px;
  color: var(--text-color-primary);
  font-weight: 500;
  cursor: pointer;
}

.layout-template-count {
  font-size: 14px;
  color: var(--text-color-secondary);
  font-weight: 400;
  margin-left: 8px;
}
</style>
