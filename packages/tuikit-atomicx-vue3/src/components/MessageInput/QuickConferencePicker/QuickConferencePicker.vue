<template>
  <View>
    <div
      :class="[
        styles['quick-conference-picker__button'],
        (props.disabled || isLoading) && styles['disabled'],
      ]"
      @click="handleQuickConferenceClick"
    >
      <slot>
        <IconLoading
          v-if="isLoading"
          :size="props.iconSize"
          :class="[styles['quick-conference-picker__icon'], styles['is-loading']]"
        />
        <IconConference
          v-else
          :size="props.iconSize"
          :class="styles['quick-conference-picker__icon']"
        />
      </slot>
    </div>
  </View>
</template>

<script setup lang="ts">
import { ref, useCssModule } from 'vue';
import { TUICore, TUIConstants } from '@tencentcloud/tui-core-lite';
import { IconLoading, IconConference, useUIKit, TUIToast, TOAST_TYPE } from '@tencentcloud/uikit-base-component-vue3';
import { View } from '../../../baseComp/View';
import { useLoginState } from '../../../states/LoginState';
import { useMessageInputState } from '../../../states/MessageInputState';
import { useRoomParticipantState } from '../../../states/RoomParticipantState';
import { useRoomState } from '../../../states/RoomState';
import type { MessageModel } from '../../../types';

interface QuickConferencePickerProps {
  label?: string;
  iconSize?: number;
  disabled?: boolean;
}

const props = withDefaults(defineProps<QuickConferencePickerProps>(), {
  label: '',
  iconSize: 20,
  disabled: false,
});

const styles = useCssModule();
const { t } = useUIKit();
const { loginUserInfo } = useLoginState();
const isLoading = ref(false);

const { sendCustomMessage } = useMessageInputState();
const { currentRoom } = useRoomState();
const { localParticipant } = useRoomParticipantState();
const generateRoomId = () => String(Date.now()) + String(Math.floor(Math.random() * 1000)).padStart(3, '0');

const getQuickConferenceRoomName = () => t('ConferencePicker.Quick_Conference', {
  name: loginUserInfo.value?.userName || loginUserInfo.value?.userId,
});

const getConferenceOwnerProfile = () => {
  const roomOwner = currentRoom.value?.roomOwner;
  const participant = localParticipant.value;
  return {
    faceUrl: participant?.avatarUrl || roomOwner?.avatarUrl || loginUserInfo.value?.avatarUrl || '',
    nickName: participant?.userName || roomOwner?.userName || loginUserInfo.value?.userName || '',
    userId: participant?.userId || roomOwner?.userId || loginUserInfo.value?.userId || '',
  };
};

const createCurrentUserPayload = () => {
  const ownerProfile = getConferenceOwnerProfile();
  return ownerProfile.userId ? [ownerProfile] : [];
};

const startRoom = (params: { roomId: string; options: { roomName: string } }) => new Promise<void>((resolve, reject) => {
  TUICore.callService({
    serviceName: TUIConstants.TUIRoom.SERVICE.NAME,
    method: TUIConstants.TUIRoom.SERVICE.METHOD.START_ROOM,
    params,
    callback: (result?: unknown) => {
      if (result instanceof Error) {
        reject(result);
        return;
      }
      if ((result as any)?.code || (result as any)?.message) {
        reject(result);
        return;
      }
      resolve();
    },
  });
});

const handleQuickConferenceClick = async () => {
  if (props.disabled || isLoading.value) {
    return;
  }
  if (currentRoom.value?.roomId) {
    TUIToast({
      type: TOAST_TYPE.WARNING,
      message: t('ConferencePicker.Cannot_Start_While_In_Meeting'),
    });
    return;
  }

  isLoading.value = true;
  try {
    const roomId = generateRoomId();
    const roomName = getQuickConferenceRoomName();
    await startRoom({
      roomId,
      options: {
        roomName,
      },
    });

    const sentMessage = await sendCustomMessage({
      payload: {
        data: JSON.stringify({
          businessID: 'group_room_message',
          owner: loginUserInfo.value?.userId,
          roomId,
          roomState: 'created',
          roomName,
          userList: createCurrentUserPayload(),
          ownerName: getConferenceOwnerProfile().nickName,
        }),
      },
    });

    TUICore.notifyEvent(
      TUIConstants.TUIRoom.SERVICE.NAME,
      TUIConstants.TUIRoom.SERVICE.EVENT.QUICK_CONFERENCE_MESSAGE_CREATED,
      {
        roomId,
        message: sentMessage as MessageModel | undefined,
      },
    );
  } catch (error: unknown) {
    console.error('[QuickConferencePicker] Failed to create conference:', error);
    TUIToast({
      type: TOAST_TYPE.ERROR,
      message: t('ConferencePicker.Create_Conference_Failed'),
    });
  } finally {
    isLoading.value = false;
  }
};

</script>

<style lang="scss" module>
.quick-conference-picker {
  &__button {
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    padding: 4px 6px;
    transition: background-color 0.5s ease;
    border-radius: 4px;

    &:hover {
      background-color: var(--button-color-secondary-hover);
    }

    &:active {
      background-color: var(--button-color-secondary-active);
    }
  }

  &__icon {
    color: var(--icon-color-primary);
  }
}

.is-loading {
  animation: quick-conference-rotate 0.8s linear infinite;
}

.disabled {
  opacity: 0.5;
  cursor: not-allowed;
  user-select: none;
  pointer-events: none;
}

@keyframes quick-conference-rotate {
  from {
    transform: rotate(0deg);
  }

  to {
    transform: rotate(360deg);
  }
}
</style>
