<template>
  <tui-dialog
    v-model="showRequestOpenMicDialog"
    :title="t('Tips')"
    :modal="true"
    :show-close="false"
    :close-on-click-modal="false"
    width="500px"
    :append-to-room-container="true"
    :confirm-button="t('Turn on the microphone')"
    :cancel-button="t('Keep it closed')"
    @confirm="handleAccept"
    @cancel="handleReject"
  >
    <span>{{ dialogContent }}</span>
    <template #footer>
      <TUIButton type="primary" @click="handleAccept">
        {{ t('Turn on the microphone') }}
      </TUIButton>
      <TUIButton @click="handleReject">
        {{ t('Keep it closed') }}
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
} from '@tencentcloud/tuiroom-engine-js';
import { TUIButton, useUIKit } from '@tencentcloud/uikit-base-component-vue3';
import TuiDialog from '../../baseComp/Dialog';
import { useRoomEngine } from '../../hooks/useRoomEngine';
import { useUserState } from '../../states/UserState';
import type { TUIRequest } from '@tencentcloud/tuiroom-engine-js';

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
        ? t('RoomOwner')
        : t('Admin');
    dialogContent.value = t('Sb invites you to turn on the microphone', {
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
