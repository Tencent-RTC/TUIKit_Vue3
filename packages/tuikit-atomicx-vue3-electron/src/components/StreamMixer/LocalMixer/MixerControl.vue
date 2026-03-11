<template>
  <div
    class="mixer-control"
    @mousedown="handleMouseDown"
  >
    <div
      v-for="control in controlList"
      :key="control.name"
      class="mixer-control-item"
      :class="{ 'disable': control.disable }"
      :style="control.style"
      @click.stop="control.onClick"
    >
      <div class="mixer-control-item-icon">
        <component
          :is="control.icon"
          style="width: 100%; height: 100%"
          :style="control.style"
        />
      </div>
      <span class="mixer-control-item-name">{{ control.text }}</span>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { TRTCVideoMirrorType, TRTCVideoRotation } from '@tencentcloud/tuiroom-engine-electron';
import { useUIKit } from '@tencentcloud/uikit-base-component-vue3';
import { useVideoMixerState } from '../../../states/VideoMixerState';
import CameraMirror from '../icons/CameraMirror.vue';
import Delete from '../icons/Delete.vue';
import Down from '../icons/Down.vue';
import Rotation from '../icons/Rotation.vue';
import Up from '../icons/Up.vue';
import type { MediaSource } from '../../../types';

const { activeMediaSource, mediaSourceList, updateMediaSource, removeMediaSource } = useVideoMixerState();
const { t } = useUIKit();

function handleMouseDown(event: Event) {
  event.stopPropagation();
}

const orderMediaSourceList = computed(() => [...mediaSourceList.value].sort((a: MediaSource, b: MediaSource) => a.zOrder - b.zOrder));

const isActiveMediaSourceTop = computed(() => activeMediaSource.value?.sourceId === orderMediaSourceList.value[0]?.sourceId);
const isActiveMediaSourceBottom = computed(() => activeMediaSource.value?.sourceId === orderMediaSourceList.value[orderMediaSourceList.value.length - 1]?.sourceId);

const controlList = computed(() => [
  {
    name: 'mirror',
    text: t('Mirror'),
    icon: CameraMirror,
    onClick: () => {
      if (activeMediaSource.value) {
        const currentMirror = activeMediaSource.value.mirrorType;
        updateMediaSource(activeMediaSource.value, {
          mirrorType:
            currentMirror === TRTCVideoMirrorType.TRTCVideoMirrorType_Enable
              ? TRTCVideoMirrorType.TRTCVideoMirrorType_Disable
              : TRTCVideoMirrorType.TRTCVideoMirrorType_Enable,
        });
      }
    },
  },
  {
    name: 'rotate',
    text: t('Rotate'),
    icon: Rotation,
    onClick: () => {
      if (activeMediaSource.value) {
        const currentRotation = activeMediaSource.value?.rotation as TRTCVideoRotation || TRTCVideoRotation.TRTCVideoRotation0;
        const rotationObj = {
          [TRTCVideoRotation.TRTCVideoRotation0]: TRTCVideoRotation.TRTCVideoRotation90,
          [TRTCVideoRotation.TRTCVideoRotation90]: TRTCVideoRotation.TRTCVideoRotation180,
          [TRTCVideoRotation.TRTCVideoRotation180]: TRTCVideoRotation.TRTCVideoRotation270,
          [TRTCVideoRotation.TRTCVideoRotation270]: TRTCVideoRotation.TRTCVideoRotation0,
        };
        const rotation = rotationObj[currentRotation];
        const { top, left, right, bottom } = activeMediaSource.value.rect;
        updateMediaSource(activeMediaSource.value, {
          rotation,
          rect: {
            top,
            left,
            right: left + bottom - top,
            bottom: top + right - left,
          },
        });
      }
    },
  },
  {
    name: 'up',
    text: t('Move Up'),
    icon: Up,
    disable: isActiveMediaSourceBottom.value,
    onClick: async () => {
      if (activeMediaSource.value) {
        const currentIndex = orderMediaSourceList.value.findIndex(item => item.sourceId === activeMediaSource.value?.sourceId);
        const nextMediaSource = orderMediaSourceList.value[currentIndex + 1];
        const activeZOrder = activeMediaSource.value.zOrder;
        const nextZOrder = nextMediaSource.zOrder;
        if (nextMediaSource) {
          try {
            await updateMediaSource(activeMediaSource.value, { zOrder: 999 });
            await updateMediaSource(nextMediaSource, { zOrder: activeZOrder });
            await updateMediaSource(activeMediaSource.value, { zOrder: nextZOrder });
          } catch (error) {
            console.warn('Move up failed.', error);
          }
        } else {
          console.error(t('Already at top'));
        }
      }
    },
  },
  {
    name: 'down',
    text: t('Move Down'),
    icon: Down,
    disable: isActiveMediaSourceTop.value,
    onClick: async () => {
      if (activeMediaSource.value) {
        const currentIndex = orderMediaSourceList.value.findIndex(item => item.sourceId === activeMediaSource.value?.sourceId);
        const nextMediaSource = orderMediaSourceList.value[currentIndex - 1];
        const activeZOrder = activeMediaSource.value.zOrder;
        const nextZOrder = nextMediaSource.zOrder;
        if (nextMediaSource) {
          try {
            await updateMediaSource(activeMediaSource.value, { zOrder: 0 });
            await updateMediaSource(nextMediaSource, { zOrder: activeZOrder });
            await updateMediaSource(activeMediaSource.value, { zOrder: nextZOrder });
          } catch (error) {
            console.warn('Move down failed.', error);
          }
        } else {
          console.error(t('Already at bottom'));
        }
      }
    },
  },
  {
    name: 'delete',
    text: t('Delete'),
    icon: Delete,
    style: 'color: red',
    onClick: () => {
      if (activeMediaSource.value) {
        removeMediaSource(activeMediaSource.value);
      }
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
