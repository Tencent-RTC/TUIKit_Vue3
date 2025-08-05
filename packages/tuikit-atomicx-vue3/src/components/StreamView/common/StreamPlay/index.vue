<template>
  <div
    ref="playRegionDomRef"
    :id="playRegionDomId"
    class="stream-play-container"
  ></div>
</template>

<script setup lang="ts">
import {
  ref,
  defineProps,
  computed,
  onMounted,
  watch,
  onBeforeUnmount,
  withDefaults,
  nextTick,
} from 'vue';
import { TUIVideoStreamType } from '@tencentcloud/tuiroom-engine-js';
import {
  StreamPlayMode,
  StreamPlayQuality,
} from '../../manager/mediaManager';
import { getNanoId } from '../../../../utils/utils';
import { MediaManager } from '../../manager/mediaManager';
import useUserState from '../../../../states/UserState/index';
import { UserInfo, DeviceStatus } from '../../../../types';

const { localUser, getUserInfo } = useUserState();
const mediaManager = new MediaManager();

interface Props {
  userInfo: UserInfo;
  streamType: TUIVideoStreamType;
  streamPlayQuality?: StreamPlayQuality;
  streamPlayMode?: StreamPlayMode;
}
const props = withDefaults(defineProps<Props>(), {
  streamPlayQuality: StreamPlayQuality.Default,
  streamPlayMode: StreamPlayMode.PLAY,
});

const playRegionDomRef = ref();
const nanoId = getNanoId(5);
const playRegionDomId = computed(
  () => `${props.userInfo.userId}_${props.streamType}_${nanoId}`
);
const isNeedPlayStream = computed(
  () =>
    props.streamPlayMode !== StreamPlayMode.STOP &&
    ((props.streamType === TUIVideoStreamType.kCameraStream && props.userInfo.cameraStatus === DeviceStatus.On) ||
    (props.streamType === TUIVideoStreamType.kScreenStream && props.userInfo.screenStatus === DeviceStatus.On))
    || props.userInfo.userId.indexOf('livekit_') === 0
);

// The stream type to be pulled from the remote user
const streamTypeToFetch = computed(() => {
  const { userId } = props.userInfo;
  const streamType = props.streamType;
  if (streamType === TUIVideoStreamType.kScreenStream) {
    return TUIVideoStreamType.kScreenStream;
  }
  if (
    props.streamPlayQuality === StreamPlayQuality.HIGH ||
    userId === localUser.value?.userId
  ) {
    return TUIVideoStreamType.kCameraStream;
  }
  if (props.streamPlayQuality === StreamPlayQuality.LOW) {
    return TUIVideoStreamType.kCameraStreamLow;
  }
  // todo: 需要添加 roomStore 中的 defaultStreamType 的逻辑
  return TUIVideoStreamType.kCameraStream;
});

async function startPlayVideo() {
  // todo: 这里更严谨的是要判断流是不是存在
  // if (
  //   !getUserInfo({ userId: props.userInfo.userId }) ||
  //   !playRegionDomRef.value
  // ) {
  //   return;
  // }
  await nextTick();
  if (isNeedPlayStream.value) {
    await mediaManager.startPlayVideo({
      userId: props.userInfo.userId,
      streamType: streamTypeToFetch.value,
      view: playRegionDomRef.value,
      observerViewInVisible:
        props.streamPlayMode === StreamPlayMode.PLAY_IN_VISIBLE,
    });
  }
}

async function stopPlayVideo() {
  await mediaManager.stopPlayVideo({
    userId: props.userInfo.userId,
    streamType: streamTypeToFetch.value,
    view: playRegionDomRef.value,
  });
}

watch(
  () => [
    props.userInfo.userId,
    props.streamType,
    isNeedPlayStream.value,
  ],
  async (val, oldVal) => {
    if (JSON.stringify(val) === JSON.stringify(oldVal)) {
      return;
    }
    const [oldUserId, oldStreamType] = oldVal;
    if (
      oldUserId !== props.userInfo.userId ||
      oldStreamType !== props.streamType
    ) {
      // Stops play of the previous stream of the current dom
      mediaManager.stopPlayVideo({
        userId: oldUserId as string,
        streamType: oldStreamType as TUIVideoStreamType,
        view: playRegionDomRef.value,
      });
    }
    if (isNeedPlayStream.value) {
      await startPlayVideo();
    } else {
      await stopPlayVideo();
    }
  }
);

watch(
  () => streamTypeToFetch,
  async () => {
    if (isNeedPlayStream.value) {
      await startPlayVideo();
    }
  }
);

onMounted(async () => {
  if (isNeedPlayStream.value) {
    await startPlayVideo();
  }
});

onBeforeUnmount(async () => {
  await stopPlayVideo();
});
</script>

<style lang="scss" scoped>
.stream-play-container {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  overflow: hidden;
}
</style>
