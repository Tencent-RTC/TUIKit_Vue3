<template>
  <div class="mixer-control" @mousedown="handleMouseDown">
    <div
      class="mixer-control-item"
      v-for="control in controlList"
      :class="{ 'disable': control.disable }"
      :key="control.name"
      :style="control.style"
      @click.stop="control.onClick"
    >
      <div class="mixer-control-item-icon">
        <component :is="control.icon" style="width: 100%; height: 100%" :style="control.style" />
      </div>
      <span class="mixer-control-item-name">{{ control.text }}</span>
    </div>
  </div>
</template>

<script setup lang="ts">
import CameraMirror from '../icons/CameraMirror.vue';
import Delete from '../icons/Delete.vue';
import Rotation from '../icons/Rotation.vue';
import Up from '../icons/Up.vue';
import Down from '../icons/Down.vue';
import { useVideoMixerState } from '../../../states/VideoMixerState';
import { TRTCVideoMirrorType, TRTCVideoRotation } from '@tencentcloud/tuiroom-engine-js';
import { computed, reactive } from 'vue';
import { MediaSource } from '../../../types';
import { useUIKit } from '@tencentcloud/uikit-base-component-vue3';

const { activeMediaSource, mediaSourceList, updateMediaSource, removeMediaSource } = useVideoMixerState();
const { t } = useUIKit();

function handleMouseDown(event: Event) {
  event.stopPropagation();
}

const orderMediaSourceList = computed(() => {
  return [...mediaSourceList.value].sort((a: MediaSource, b: MediaSource) => a.layout.zOrder - b.layout.zOrder);
});

const isActiveMediaSourceTop = computed(() => activeMediaSource.value.id === orderMediaSourceList.value[0].id);
const isActiveMediaSourceBottom = computed(() => activeMediaSource.value.id === orderMediaSourceList.value[orderMediaSourceList.value.length - 1].id);

const controlList = computed(() => [
  {
    name: 'mirror',
    text: t('Mirror'),
    icon: CameraMirror,
    onClick: () => {
      const currentMirror = activeMediaSource.value.layout.mirror;
      updateMediaSource(activeMediaSource.value, {
        layout: {
          mirror:
            currentMirror === TRTCVideoMirrorType.TRTCVideoMirrorType_Enable
              ? TRTCVideoMirrorType.TRTCVideoMirrorType_Disable
              : TRTCVideoMirrorType.TRTCVideoMirrorType_Enable,
        },
      });
    },
  },
  {
    name: 'rotate',
    text: t('Rotate'),
    icon: Rotation,
    onClick: () => {
      const currentRotation = activeMediaSource.value.layout.rotation || TRTCVideoRotation.TRTCVideoRotation0;
      const rotationObj = {
        [TRTCVideoRotation.TRTCVideoRotation0]: TRTCVideoRotation.TRTCVideoRotation90,
        [TRTCVideoRotation.TRTCVideoRotation90]: TRTCVideoRotation.TRTCVideoRotation180,
        [TRTCVideoRotation.TRTCVideoRotation180]: TRTCVideoRotation.TRTCVideoRotation270,
        [TRTCVideoRotation.TRTCVideoRotation270]: TRTCVideoRotation.TRTCVideoRotation0,
      };
      const rotation = rotationObj[currentRotation];
      updateMediaSource(activeMediaSource.value, { layout: { rotation } });
    },
  },
  {
    name: 'up',
    text: t('Move Up'),
    icon: Up,
    disable: isActiveMediaSourceBottom.value,
    onClick: async () => {
      const currentIndex = orderMediaSourceList.value.findIndex(item => item.id === activeMediaSource.value.id);
      const nextMediaSource = orderMediaSourceList.value[currentIndex + 1];
      const activeZOrder = activeMediaSource.value.layout.zOrder;
      const nextZOrder = nextMediaSource?.layout.zOrder;
      if (nextMediaSource) {
        await updateMediaSource(activeMediaSource.value, { layout: { zOrder: 999 } });
        await updateMediaSource(nextMediaSource, { layout: { zOrder: activeZOrder } });
        await updateMediaSource(activeMediaSource.value, { layout: { zOrder: nextZOrder } });
      } else {
        console.error(t('Already at top'));
      }
    },
  },
  {
    name: 'down',
    text: t('Move Down'),
    icon: Down,
    disable: isActiveMediaSourceTop.value,
    onClick: async () => {
      const currentIndex = orderMediaSourceList.value.findIndex(item => item.id === activeMediaSource.value.id);
      const nextMediaSource = orderMediaSourceList.value[currentIndex - 1];
      const activeZOrder = activeMediaSource.value.layout.zOrder;
      const nextZOrder = nextMediaSource?.layout.zOrder;
      if (nextMediaSource) {
        await updateMediaSource(activeMediaSource.value, { layout: { zOrder: 0 } });
        await updateMediaSource(nextMediaSource, { layout: { zOrder: activeZOrder } });
        await updateMediaSource(activeMediaSource.value, { layout: { zOrder: nextZOrder } });
      } else {
        console.error(t('Already at bottom'));
      }
    },
  },
  {
    name: 'delete',
    text: t('Delete'),
    icon: Delete,
    style: 'color: red',
    onClick: () => {
      removeMediaSource(activeMediaSource.value);
    },
  },
]);
</script>

<style scoped lang="scss">
.mixer-control {
  display: flex;
  flex-direction: row;
  background-color: #ffffff;
  border-radius: 4px;
  padding: 6px 12px;
  gap: 16px;
  pointer-events: auto;
  .mixer-control-item {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: 2px 4px;
    cursor: pointer;
    border-radius: 4px;
    &:hover {
      background-color: rgba(255, 255, 255, 0.1);
    }
    .mixer-control-item-icon {
      width: 18px;
      height: 18px;
      color: #0F1014;
    }
    .mixer-control-item-name {
      font-size: 12px;
      font-style: normal;
      font-weight: 400;
      line-height: 18px;
      white-space: nowrap;
      margin-top: 2px;
    }
    &.disable {
      color: rgba(0, 0, 0, 0.25);
      cursor: not-allowed;
      .mixer-control-item-icon {
        color: rgba(0, 0, 0, 0.25);
      }
    }
  }
}
</style>
