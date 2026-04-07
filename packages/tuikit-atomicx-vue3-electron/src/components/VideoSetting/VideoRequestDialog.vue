<template>
  <tui-dialog
    v-model="showRequestOpenCameraDialog"
    :title="t('VideoSetting.Tips')"
    :modal="true"
    :show-close="false"
    :close-on-click-modal="false"
    width="500px"
    :append-to-room-container="true"
    :confirm-button="t('VideoSetting.TurnOnCamera')"
    :cancel-button="t('VideoSetting.KeepClosed')"
    @confirm="handleAccept"
    @cancel="handleReject"
  >
    <span>
      {{ dialogContent }}
    </span>
    <template #footer>
      <TUIButton @click="handleAccept" type="primary">
        {{ t('VideoSetting.TurnOnCamera') }}
      </TUIButton>
      <TUIButton @click="handleReject">
        {{ t('VideoSetting.KeepClosed') }}
      </TUIButton>
    </template>
  </tui-dialog>
</template>

<script setup lang="ts">
import { ref, onUnmounted, Ref } from 'vue';
import TUIRoomEngine, {
  TUIRoomEvents, TUIRequest, TUIRequestAction, TUIRole, } from '@tencentcloud/tuiroom-engine-electron';
import TuiDialog from '../../baseComp/Dialog'
import { TUIButton, useUIKit } from '@tencentcloud/uikit-base-component-vue3';

import useUserState from '../../states/UserState/index';
import useRoomEngine from '../../hooks/useRoomEngine';
const roomEngine = useRoomEngine();

const dialogContent: Ref<string> = ref('');

const { getUserInfo } = useUserState();

const { t } = useUIKit();

/**
 * Handling host or administrator turn on/off camera signalling
 **/
const showRequestOpenCameraDialog: Ref<boolean> = ref(false);
const requestOpenCameraRequestId: Ref<string> = ref('');
async function onRequestReceived(eventInfo: { request: TUIRequest }) {
  const { userId, requestAction, requestId } = eventInfo.request;
  if (requestAction === TUIRequestAction.kRequestToOpenRemoteCamera) {
    const userRole =
      getUserInfo({ userId })?.userRole === TUIRole.kRoomOwner
        ? t('VideoSetting.RoomOwner')
        : t('VideoSetting.Admin');
    dialogContent.value = t('VideoSetting.InviteTurnOnCamera', {
      role: userRole,
    });
    requestOpenCameraRequestId.value = requestId;
    showRequestOpenCameraDialog.value = true;
  }
}

// Accept the host invitation and turn on the camera
async function handleAccept() {
  await roomEngine.instance?.responseRemoteRequest({
    requestId: requestOpenCameraRequestId.value,
    agree: true,
  });
  requestOpenCameraRequestId.value = '';
  showRequestOpenCameraDialog.value = false;
}

// keep mute
async function handleReject() {
  await roomEngine.instance?.responseRemoteRequest({
    requestId: requestOpenCameraRequestId.value,
    agree: false,
  });
  requestOpenCameraRequestId.value = '';
  showRequestOpenCameraDialog.value = false;
}

// Request canceled
async function onRequestCancelled(eventInfo: { requestId: string }) {
  const { requestId } = eventInfo;
  if (requestOpenCameraRequestId.value === requestId) {
    showRequestOpenCameraDialog.value = false;
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
    onRequestCancelled
  );
});
</script>
