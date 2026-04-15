<template>
  <div
    :class="[
      'room-message-container',
      roomCardData.isMessageFromMe ? 'isMe' : 'notMe',
    ]"
  >
    <div :class="['room-message-card-container', roomCardData.roomState]">
      <div class="content">
        <div :class="['content-title', contentTitleClass]">
          <span class="icon" />
          <p v-if="RoomState.CREATED === roomCardData.roomState">
            {{ t('RoomMessage.meeting_in_progress') }}
          </p>
          <p v-else>
            {{ t('RoomMessage.meeting') }}
          </p>
        </div>
        <div class="content-desc">
          <div class="title">
            {{ roomCardData.roomName || `${roomCardData.ownerName || roomCardData.owner}${t('RoomMessage.quick_conference')}` }}
          </div>
          <ul class="users">
            <template v-for="(user, index) in roomCardData.userList">
              <li v-if="index <= 4" :key="user.userId">
                <Avatar
                  class="avatar"
                  :src="user.faceUrl"
                  :alt="user.nickName || user.userId"
                  :size="26"
                  shape="rounded"
                />
              </li>
              <li
                v-if="index === 5"
                :key="user.userId"
                class="more"
              >
                <IconHorizontalMore2 />
              </li>
            </template>
          </ul>
        </div>
      </div>
      <div :class="['footer', footerClass, roomCardData.isInnerRoom && 'in-room']">
        <span v-if="footerView.infoVisible" class="room-info">{{
          footerView.infoMessage
        }}</span>
        <span
          v-if="footerView.statusVisible"
          :class="['room-status']"
          @click="enterRoom"
        >{{ footerView.statusMessage }}
        </span>
        <span v-if="footerView.destroyVisible" :class="['room-info', 'center']">{{
          footerView.destroyMessage
        }}</span>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref, watch } from 'vue';
import { TUIConstants, TUICore } from '@tencentcloud/tui-core-lite';
import { IconHorizontalMore2, useUIKit, TUIToast, TOAST_TYPE } from '@tencentcloud/uikit-base-component-vue3';
import { useLoginState } from '../../../../../states/LoginState';
import { useRoomState } from '../../../../../states/RoomState';
import { Avatar } from '../../../../Avatar';
import type { MessageModel } from '../../../../../types';

enum RoomState {
  CREATING = 'creating',
  CREATED = 'created',
  DESTROYED = 'destroyed',
}

const { t } = useUIKit();

const props = defineProps<{
  message: MessageModel;
}>();

const { loginUserInfo } = useLoginState();
const { currentRoom } = useRoomState();
const joinedRoomId = ref('');

interface RoomMessagePayload {
  businessID: string;
  owner: string;
  roomName: string;
  roomId: string;
  roomState: RoomState;
  userList: {
    faceUrl: string;
    nickName: string;
    userId: string;
  }[];
  ownerName: string;
}

const getDefaultRoomMessagePayload = (): RoomMessagePayload => ({
  businessID: 'group_room_message',
  owner: '',
  roomName: '',
  roomId: '',
  roomState: RoomState.DESTROYED,
  userList: [],
  ownerName: '',
});

const parseRoomMessagePayload = (message: MessageModel): RoomMessagePayload => {
  try {
    return {
      ...getDefaultRoomMessagePayload(),
      ...JSON.parse(message.payload.data || '{}'),
    };
  } catch {
    return getDefaultRoomMessagePayload();
  }
};

const handleMessage = (message: MessageModel) => {
  const currentUser = loginUserInfo.value?.userId;
  const messagePayload = parseRoomMessagePayload(message);
  const { businessID, owner, roomId, roomState, roomName, userList, ownerName } = messagePayload;
  const isInnerRoom = joinedRoomId.value === roomId;
  const isRoomCreateByMe = owner === currentUser;
  return {
    isInnerRoom,
    isRoomMessage: businessID === 'group_room_message' || businessID === 'quick_conference',
    isRoomCreateByMe,
    isMessageFromMe: message.from === currentUser,
    roomId,
    roomState,
    roomName,
    userList,
    ownerName,
    owner,
  };
};

const roomCardData = computed<{
  isInnerRoom: boolean;
  isRoomMessage: boolean;
  isRoomCreateByMe: boolean;
  isMessageFromMe: boolean;
  roomId: string;
  roomState: RoomState;
  roomName: string;
  userList: {
    faceUrl: string;
    nickName: string;
    userId: string;
  }[];
  ownerName: string;
  owner: string;
}>(() => handleMessage(props.message));
const contentTitleClass = computed(() => {
  const stateMap = {
    [RoomState.CREATING]: 'default',
    [RoomState.CREATED]: 'success',
    [RoomState.DESTROYED]: 'default',
  };
  return stateMap[roomCardData.value.roomState];
});
const footerClass = computed(() => {
  const stateMap = {
    [RoomState.CREATING]: 'center',
    [RoomState.CREATED]: 'default',
    [RoomState.DESTROYED]: 'center',
  };
  return stateMap[roomCardData.value.roomState];
});
const footerView = computed(() => {
  const defaultView = {
    infoVisible: false,
    infoMessage: '',
    statusVisible: false,
    statusMessage: '',
    destroyVisible: false,
    destroyMessage: '',
  };

  if (roomCardData.value.roomState === RoomState.CREATING) {
    return {
      ...defaultView,
      destroyVisible: true,
      destroyMessage: t('RoomMessage.initiating'),
    };
  }

  if (
    roomCardData.value.isRoomCreateByMe
    && roomCardData.value.roomState === RoomState.CREATED
  ) {
    return {
      ...defaultView,
      infoVisible: true,
      infoMessage:
        roomCardData.value.userList.length > 1
          ? t('RoomMessage.x_people_have_joined', {
            number: roomCardData.value.userList.length - 1,
          })
          : t('RoomMessage.waiting_for_members_to_join_the_meeting'),
      statusVisible: true,
      statusMessage: roomCardData.value.isInnerRoom
        ? t('RoomMessage.already_joined')
        : t('RoomMessage.enter_the_meeting'),
    };
  }
  if (
    !roomCardData.value.isRoomCreateByMe
    && roomCardData.value.roomState === RoomState.CREATED
  ) {
    return {
      ...defaultView,
      infoVisible: true,
      infoMessage: t('RoomMessage.x_people_are_in_the_meeting', {
        number: roomCardData.value.userList.length,
      }),
      statusVisible: true,
      statusMessage: roomCardData.value.isInnerRoom
        ? t('RoomMessage.already_joined')
        : t('RoomMessage.enter_the_meeting'),
    };
  }
  if (roomCardData.value.roomState === RoomState.DESTROYED) {
    return {
      ...defaultView,
      destroyVisible: true,
      destroyMessage: t('RoomMessage.the_meeting_has_ended'),
    };
  }
  return defaultView;
});

const enterRoom = () => {
  if (roomCardData.value.isInnerRoom || roomCardData.value.roomState !== RoomState.CREATED) {
    return;
  }

  if (currentRoom.value?.roomId && currentRoom.value.roomId !== roomCardData.value.roomId) {
    TUIToast({
      type: TOAST_TYPE.WARNING,
      message: t('RoomMessage.cannot_enter_while_in_other_meeting'),
    });
    return;
  }

  TUICore.notifyEvent(TUIConstants.TUIRoom.SERVICE.NAME, TUIConstants.TUIRoom.SERVICE.EVENT.JOIN_ROOM, { roomId: roomCardData.value.roomId });
};

const roomJoinedNotification = {
  onNotifyEvent: (_eventName: string, subKey: string, params: { roomInfo?: { roomId?: string } }) => {
    if (subKey !== TUIConstants.TUIRoom.SERVICE.EVENT.ROOM_JOINED) {
      return;
    }
    joinedRoomId.value = params.roomInfo?.roomId || '';
  },
};

const roomLeftNotification = {
  onNotifyEvent: (_eventName: string, subKey: string, params: { roomId: string }) => {
    if (subKey !== TUIConstants.TUIRoom.SERVICE.EVENT.ROOM_LEFT) {
      return;
    }
    if (joinedRoomId.value === params.roomId) {
      joinedRoomId.value = '';
    }
  },
};

onMounted(() => {
  joinedRoomId.value = currentRoom.value?.roomId || '';
  TUICore.registerEvent(
    TUIConstants.TUIRoom.SERVICE.NAME,
    TUIConstants.TUIRoom.SERVICE.EVENT.ROOM_JOINED,
    roomJoinedNotification,
  );
  TUICore.registerEvent(
    TUIConstants.TUIRoom.SERVICE.NAME,
    TUIConstants.TUIRoom.SERVICE.EVENT.ROOM_LEFT,
    roomLeftNotification,
  );
});

watch(
  () => currentRoom.value?.roomId,
  (roomId) => {
    joinedRoomId.value = roomId || '';
  },
);

onUnmounted(() => {
  TUICore.unregisterEvent(
    TUIConstants.TUIRoom.SERVICE.NAME,
    TUIConstants.TUIRoom.SERVICE.EVENT.ROOM_JOINED,
    roomJoinedNotification,
  );
  TUICore.unregisterEvent(
    TUIConstants.TUIRoom.SERVICE.NAME,
    TUIConstants.TUIRoom.SERVICE.EVENT.ROOM_LEFT,
    roomLeftNotification,
  );
});
</script>

<style lang="scss" scoped>
.room-message-container.isMe {
  .room-message-card-container {
    border-top-right-radius: 0;
  }
}

.room-message-container.notMe {
  .room-message-card-container {
    border-top-left-radius: 0;
  }
}

.room-message-card-container {
  box-sizing: border-box;
  display: flex;
  flex-direction: column;
  width: 100%;
  min-width: 238px;
  max-width: 436px;
  height: 100%;
  overflow: hidden;
  user-select: none;
  border: 1px solid var(--stroke-color-primary);
  border-radius: 8px;
  font-size: 14px;
  line-height: 20px;

  .content {
    padding: 16px 16px 16px;
    background: linear-gradient(90deg,
        var(--uikit-color-theme-1) -17.36%,
        var(--bg-color-entrycard) 103.56%);
    border-bottom: 1px solid var(--stroke-color-primary);

    .content-title {
      display: flex;
      flex-direction: row;
      align-items: center;
      font-size: 14px;
      line-height: 20px;

      p {
        margin: 0;
        font-size: 14px;
        line-height: 20px;
      }

      .icon {
        width: 16px;
        height: 16px;
        margin-right: 6px;
        background-repeat: no-repeat;
        background-position: center;
        background-size: 16px 16px;
      }
    }

    .content-desc {
      padding-top: 10px;

      .title {
        overflow: hidden;
        font-size: 16px;
        font-weight: 500;
        color: var(--text-color-primary);
        text-overflow: ellipsis;
        white-space: nowrap;
      }

      .users {
        display: flex;
        flex-direction: row;
        margin-top: 10px;
        padding: 0;
        list-style: none;
        gap: 2px;

        .more {
          display: flex;
          align-items: center;
          justify-content: center;
          width: 26px;
          height: 26px;
          margin: 0;
          font-size: 16px;
          font-weight: bold;
          line-height: 1;
          color: var(--text-color-secondary);
        }

        .avatar {
          border-radius: 3px;
        }
      }
    }
  }

  .footer {
    box-sizing: border-box;
    display: flex;
    align-items: center;
    justify-content: space-between;
    width: 100%;
    padding: 12px;
    color: var(--text-color-tertiary);
    background: var(--bg-color-operate);

    .room-info {
      font-size: 14px;
      line-height: 21px;
    }

    .room-info.center {
      width: 100%;
      text-align: center;
    }

    .room-status {
      padding: 10px;
      font-size: 14px;
      font-weight: 900;
      color: var(--text-color-button);
      cursor: pointer;
      background-color: var(--button-color-primary-default);
      border-radius: 4px;
    }
  }

}

.content-title.default {
  color: var(--text-color-tertiary);

  .icon {
    background-image: url("./images/room_default.svg");
  }
}

.content-title.success {
  color: var(--text-color-success);

  .icon {
    background-image: url("./images/room_success.svg");
  }
}

.room-message-card-container .footer.in-room {
  .room-status {
    color: var(--text-color-tertiary);
    background-color: var(--bg-color-function);
    cursor: not-allowed;
    pointer-events: none;
  }
}

.room-message-card-container.destroyed .content {
  background: var(--bg-color-default);
}
</style>
