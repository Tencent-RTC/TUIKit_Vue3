<template>
  <tui-dialog
    v-model="showRequestOpenMicDialog"
    :title="t('AudioSetting.Tips')"
    :modal="true"
    :show-close="false"
    :close-on-click-modal="false"
    width="500px"
    :append-to-room-container="true"
    :confirm-button="t('AudioSetting.TurnOnMicrophone')"
    :cancel-button="t('AudioSetting.KeepClosed')"
    @confirm="handleAccept"
    @cancel="handleReject"
  >
    <span>{{ dialogContent }}</span>
    <template #footer>
      <TUIButton type="primary" @click="handleAccept">
        {{ t('AudioSetting.TurnOnMicrophone') }}
      </TUIButton>
      <TUIButton @click="handleReject">
        {{ t('AudioSetting.KeepClosed') }}
      </TUIButton>
    </template>
  </tui-dialog>
</template>

<script setup lang="ts">
import type { Ref } from 'vue';
import { ref, onUnmounted } from 'vue';
import TUIRoomEngine, {
  TUIRoomEvents,
  TUIRequestAction,
  TUIRole,
} from '@tencentcloud/tuiroom-engine-electron';
import { TUIButton, useUIKit } from '@tencentcloud/uikit-base-component-vue3';
import TuiDialog from '../../baseComp/Dialog';
import { useRoomEngine } from '../../hooks/useRoomEngine';
import { useUserState } from '../../states/UserState';
import type { TUIRequest } from '@tencentcloud/tuiroom-engine-electron';

const roomEngine = useRoomEngine();
const { t } = useUIKit();
const dialogContent: Ref<string> = ref('');

const { getUserInfo } = useUserState();

/**
 * Handling host or administrator turn on/off microphone signalling
 **/
const showRequestOpenMicDialog: Ref<boolean> = ref(false);
const requestOpenMicRequestId: Ref<string> = ref('');
async function onRequestReceived(eventInfo: { request: TUIRequest }) {
  const { userId, requestAction, requestId } = eventInfo.request;
  if (requestAction === TUIRequestAction.kRequestToOpenRemoteMicrophone) {
    const userRole
      = getUserInfo({ userId })?.userRole === TUIRole.kRoomOwner
        ? t('AudioSetting.RoomOwner')
        : t('AudioSetting.Admin');
    dialogContent.value = t('AudioSetting.InviteTurnOnMicrophone', {
      role: userRole,
    });
    requestOpenMicRequestId.value = requestId;
    showRequestOpenMicDialog.value = true;
  }
}
// Accept the host invitation and turn on the microphone
async function handleAccept() {
  await roomEngine.instance?.responseRemoteRequest({
    requestId: requestOpenMicRequestId.value,
    agree: true,
  });
  requestOpenMicRequestId.value = '';
  showRequestOpenMicDialog.value = false;
}

// keep mute
async function handleReject() {
  await roomEngine.instance?.responseRemoteRequest({
    requestId: requestOpenMicRequestId.value,
    agree: false,
  });
  requestOpenMicRequestId.value = '';
  showRequestOpenMicDialog.value = false;
}

// Request canceled
async function onRequestCancelled(eventInfo: { requestId: string }) {
  const { requestId } = eventInfo;
  if (requestOpenMicRequestId.value === requestId) {
    showRequestOpenMicDialog.value = false;
  }
}
TUIRoomEngine.once('ready', () => {
  roomEngine.instance?.on(TUIRoomEvents.onRequestReceived, onRequestReceived);
  roomEngine.instance?.on(TUIRoomEvents.onRequestCancelled, onRequestCancelled);
});

onUnmounted(() => {
  roomEngine.instance?.off(TUIRoomEvents.onRequestReceived, onRequestReceived);
  roomEngine.instance?.off(
    TUIRoomEvents.onRequestCancelled,
    onRequestCancelled,
  );
});
</script>
