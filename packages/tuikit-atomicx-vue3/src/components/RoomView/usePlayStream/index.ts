import type { Ref } from 'vue';
import { ref, watch } from 'vue';
import TUIRoomEngine, { TUIRoomEvents } from '@tencentcloud/tuiroom-engine-js';
import useRoomEngine from '../../../hooks/useRoomEngine';
import { useRoomState } from '../../../states/RoomState';
import { useRoomStore } from '../../../states/RoomState/store';
import { DeviceStatus } from '../../../types';
import { MixStreamPlayer } from './MixStreamPlayer';
import { RTCStreamManager } from './RTCStreamManager';
import { useStreamPosition } from './useStreamPostion';
import type { TUIVideoStreamType } from '@tencentcloud/tuiroom-engine-js';

let hasInit = false;
let initResult = {
  startPlayStream: async ({ view }: { view: string }) => {},
  stopPlayStream: () => {},
};

const { hasVideoUserList } = useRoomStore();

function initPlayStream() {
  if (hasInit) {
    return initResult;
  }

  const roomEngine = useRoomEngine();
  const { positionList, createResizeObserver, deleteResizeObserver } = useStreamPosition();
  const { currentRoom } = useRoomState();

  const isNeedPlayStream = ref(false);
  const containerId = ref<string | null>(null);

  const mixStreamPlayer = new MixStreamPlayer();
  const rtcStreamManager = new RTCStreamManager();

  let playContainerId = '';

  const mixUserInfo: Ref<{ userId: string; cameraStatus: DeviceStatus } | null> = ref(null);

  const rtcUserInfoList = ref<{ userId: string; cameraStatus: DeviceStatus; rect: { left: number; top: number; width: number; height: number } }[]>([]);

  async function startPlayStream({ view }: { view: string }) {
    playContainerId = view;
    isNeedPlayStream.value = true;
    createResizeObserver({ view });
    if (mixUserInfo.value?.userId && mixUserInfo.value?.cameraStatus === DeviceStatus.On) {
      await mixStreamPlayer?.start({ view, userInfo: mixUserInfo.value });
    } else if (rtcUserInfoList.value.length > 0) {
      await rtcStreamManager?.start({ view, userList: rtcUserInfoList.value });
    }
  }

  watch(positionList, (newPositionList) => {
    rtcUserInfoList.value.forEach((item) => {
      if (newPositionList.find(positionItem => positionItem.userId === item.userId)) {
        item.rect = newPositionList.find(positionItem => positionItem.userId === item.userId) as any;
      }
    });
    if (isNeedPlayStream.value && rtcUserInfoList.value.length > 0) {
      rtcStreamManager.update({ userList: rtcUserInfoList.value });
    }
  });

  async function stopPlayStream() {
    mixStreamPlayer?.stop();
    rtcStreamManager?.stop();
    containerId.value = null;
    isNeedPlayStream.value = false;
    playContainerId = '';
    deleteResizeObserver();
  }

  async function handleUserVideoStateChanged(event: { userId: string; streamType: TUIVideoStreamType; hasVideo: boolean }) {
    const { userId, hasVideo } = event;
    if (userId.indexOf('livekit_') === 0) {
      if (hasVideo) {
        mixUserInfo.value = {
          userId,
          cameraStatus: DeviceStatus.On,
        };
        rtcUserInfoList.value = [];
        await mixStreamPlayer?.start({ view: playContainerId, userInfo: mixUserInfo.value });
      } else {
        mixUserInfo.value = null;
        await mixStreamPlayer?.stop();
      }
    } else if (hasVideo) {
      rtcUserInfoList.value.push({ userId, cameraStatus: DeviceStatus.On, rect: positionList.value.find(item => item.userId === userId) });
    } else {
      rtcUserInfoList.value = rtcUserInfoList.value.filter(item => item.userId !== userId);
    }
  }

  // 根据记录数据进行初始化调用
  if (hasVideoUserList.value.length > 0) {
    const mixUser = hasVideoUserList.value.find(item => item.userId.indexOf('livekit_') === 0);
    if (mixUser && mixUser.hasVideo) {
      mixUserInfo.value = {
        userId: mixUser.userId,
        cameraStatus: DeviceStatus.On,
      };
      mixStreamPlayer?.start({ view: playContainerId, userInfo: mixUserInfo.value });
    } else {
      rtcUserInfoList.value = hasVideoUserList.value.filter(item => item.hasVideo).map(item => ({
        userId: item.userId,
        cameraStatus: DeviceStatus.On,
        rect: positionList.value.find(positionItem => positionItem.userId === item.userId),
      }));
    }
  }

  watch(
    () => rtcUserInfoList.value.length,
    (newUserListLength, oldUserListLength) => {
      if (!isNeedPlayStream.value) {
        return;
      }
      try {
        if (oldUserListLength === 0 && newUserListLength > 0) {
          rtcStreamManager?.start({ view: playContainerId, userList: rtcUserInfoList.value });
        } else if (oldUserListLength > 0 && newUserListLength === 0) {
          rtcStreamManager?.stop();
        } else {
          rtcStreamManager?.update({ userList: [...rtcUserInfoList.value] });
        }
      } catch (error) {
        console.error('rtcStreamManager failed to update stream:', error);
      }
    },
  );

  watch(
    () => currentRoom.value?.roomId,
    (roomId) => {
      if (!roomId) {
        mixUserInfo.value = null;
        rtcUserInfoList.value = [];
      }
    },
  );

  TUIRoomEngine.once('ready', () => {
    roomEngine.instance?.on(TUIRoomEvents.onUserVideoStateChanged, handleUserVideoStateChanged);
  });

  hasInit = true;
  initResult = {
    startPlayStream,
    stopPlayStream,
  };
  return initResult;
}

export function usePlayStream() {
  const { startPlayStream, stopPlayStream } = initPlayStream();
  return {
    startPlayStream,
    stopPlayStream,
  };
}
