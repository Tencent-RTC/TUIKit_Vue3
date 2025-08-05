<template>
  <div
    class="material-item"
    :class="{ active: activeMediaSource === material, 'show-dropdown': showDropdown }"
    @click="handleSelectMaterial"
  >
    <component class="material-icon" :is="getMaterialIcon(material.type)" />
    <div class="material-info">
      <span class="material-name">{{ material.name }}</span>
    </div>
    <div class="material-controls">
      <div class="control-button mirror-control" @click.stop="handleMirrorToggle" :title="t('Mirror')">
        <svg-icon
          @click="toggleMirror"
          :icon="
            material.layout.mirror === TRTCVideoMirrorType.TRTCVideoMirrorType_Enable ? CameraMirror : CameraUnMirror
          "
        />
      </div>
      <div
        class="control-button more-control"
        @mouseenter="handleMouseEnter"
        @mouseleave="handleMouseLeave"
        :title="t('More')"
      >
        <MoreIcon />
        <div
          class="dropdown-menu"
          v-if="showDropdown"
          @click.stop
          @mouseenter="handleMouseEnter"
          @mouseleave="handleMouseLeave"
        >
          <div
            class="dropdown-item"
            v-for="control in getMaterialControls(material.type)"
            :key="control.key"
            @click="handleControlClick(control, material)"
          >
            <span class="dropdown-label">{{ control.label }}</span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, defineProps, defineEmits } from 'vue';
import { MediaSource } from '../../types';
import { TRTCMediaSourceType, TRTCVideoMirrorType } from '@tencentcloud/tuiroom-engine-js';
import { IconEdit, IconSetting, IconDelIcon, useUIKit } from '@tencentcloud/uikit-base-component-vue3';
import { useVideoMixerState } from '../../states/VideoMixerState';
import SvgIcon from '../../baseComp/SvgIcon.vue';
import CameraMirror from './icons/CameraMirror.vue';
import CameraUnMirror from './icons/CameraUnmirror.vue';
import ImageIcon from './icons/ImageIcon.vue';
import ScreenIcon from './icons/ScreenIcon.vue';
import MoreIcon from './icons/MoreIcon.vue';
import CameraIcon from './icons/CameraIcon.vue';

const { t } = useUIKit();

const props = defineProps<{
  material: MediaSource;
}>();

const emits = defineEmits<{
  cameraSetting: [material: MediaSource];
  rename: [material: MediaSource];
}>();

const { updateMediaSource, removeMediaSource, activeMediaSource } = useVideoMixerState();

const showDropdown = ref(false);
let hideTimeout: ReturnType<typeof setTimeout> | null = null;

function toggleMirror() {
  const currentMirror = props.material?.layout.mirror;
  const newMirror =
    currentMirror === TRTCVideoMirrorType.TRTCVideoMirrorType_Enable
      ? TRTCVideoMirrorType.TRTCVideoMirrorType_Disable
      : TRTCVideoMirrorType.TRTCVideoMirrorType_Enable;
  updateMediaSource(props.material, {
    layout: {
      mirror: newMirror,
    },
  });
}

// 处理鼠标离开事件
const handleMouseLeave = () => {
  // 添加延迟，防止鼠标快速移动时菜单闪烁
  hideTimeout = setTimeout(() => {
    showDropdown.value = false;
  }, 150);
};

// 处理鼠标进入事件
const handleMouseEnter = () => {
  // 清除隐藏定时器
  if (hideTimeout) {
    clearTimeout(hideTimeout);
    hideTimeout = null;
  }
  showDropdown.value = true;
};

// 处理材料选择
const handleSelectMaterial = () => {
  updateMediaSource(props.material, { isSelected: true });
};

// 处理镜像切换
const handleMirrorToggle = () => {
  // 实现镜像切换逻辑
  console.log('切换镜像:', props.material);
};

// 获取材料图标
const getMaterialIcon = (mediaSourceType: TRTCMediaSourceType) => {
  const iconMap = {
    [TRTCMediaSourceType.kCamera]: CameraIcon,
    [TRTCMediaSourceType.kImage]: ImageIcon,
    [TRTCMediaSourceType.kScreen]: ScreenIcon,
  };
  return iconMap[mediaSourceType];
};

// 获取材料类型名称
const getMaterialTypeName = (mediaSourceType: TRTCMediaSourceType) => {
  const typeNames = {
    [TRTCMediaSourceType.kCamera]: t('Camera'),
    [TRTCMediaSourceType.kScreen]: t('Screen Share'),
  };
  return typeNames[mediaSourceType] || t('Unknown');
};

// 重命名材料
const renameMaterial = (material: MediaSource) => {
  emits('rename', material);
};

// 获取材料控制选项
const getMaterialControls = (mediaSourceType: TRTCMediaSourceType) => {
  const commonControls = [
    {
      key: 'rename',
      label: t('Rename'),
      icon: IconEdit,
      onClick: renameMaterial,
    },
    {
      key: 'delete',
      label: t('Delete'),
      icon: IconDelIcon,
      onClick: handleDeleteMaterial,
      dangerous: true,
    },
  ];

  const cameraControls = [
    {
      key: 'setting',
      label: t('Settings'),
      icon: IconSetting,
      onClick: handleCameraSetting,
    },
    ...commonControls,
  ];

  const controlsMap = {
    [TRTCMediaSourceType.kCamera]: cameraControls,
    [TRTCMediaSourceType.kScreen]: commonControls,
  };

  return controlsMap[mediaSourceType] || commonControls;
};

// 处理删除材料
const handleDeleteMaterial = (material: MediaSource) => {
  removeMediaSource(material);
  showDropdown.value = false;
};

// 摄像头设置
const handleCameraSetting = (material: MediaSource) => {
  emits('cameraSetting', material);
  showDropdown.value = false;
};

// 处理控制选项点击
const handleControlClick = (control: any, material: MediaSource) => {
  control.onClick(material);
};
</script>

<style scoped lang="scss">
.material-item {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: flex-start;
  margin-bottom: 6px;
  cursor: pointer;
  padding: 4px 8px;
  z-index: 1;
  // 当显示下拉菜单时，提升层级
  &.show-dropdown {
    z-index: 1000;
  }

  .material-icon {
    display: flex;
    align-items: center;
    justify-content: center;
    color: #d5e0f2;
    transition: all 0.2s ease;
    margin-right: 10px;
  }

  .material-info {
    flex: 1;
    min-width: 0;
    display: flex;
    align-items: center;
    margin-right: 10px;
    height: 20px;

    .material-name {
      font-size: 14px;
      font-weight: 500;
      color: #d5e0f2;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
      line-height: 20px;
    }
  }

  .material-controls {
    display: flex;
    align-items: center;
  }

  .control-button {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 24px;
    height: 24px;
    border-radius: 6px;
    color: #d5e0f2;
    cursor: pointer;
    transition: all 0.2s ease;
    &:not(:last-child) {
      margin-right: 8px;
    }
    &:hover {
      background: rgba(255, 255, 255, 0.2);
    }
  }

  .dropdown-menu {
    position: absolute;
    top: 100%;
    right: 0;
    margin-top: 8px;
    padding: 4px;
    min-width: 100px;
    background: rgba(45, 50, 62, 0.95);
    border: 1px solid rgba(255, 255, 255, 0.1);
    border-radius: 8px;
    box-shadow: 0 8px 32px rgba(0, 0, 0, 0.4);
    backdrop-filter: blur(20px);
    z-index: 1001;
    overflow: hidden;
    animation: fadeInScale 0.15s ease-out;

    &::before {
      content: '';
      position: absolute;
      top: -6px;
      right: 12px;
      width: 0;
      height: 0;
      border-left: 6px solid transparent;
      border-right: 6px solid transparent;
      border-bottom: 6px solid rgba(45, 50, 62, 0.95);
    }
  }

  .dropdown-item {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 8px 12px;
    color: #d5e0f2;
    cursor: pointer;
    transition: all 0.2s ease;
    border-radius: 4px;
    &:hover {
      background: rgba(209, 217, 236, 0.1);
    }
  }

  .dropdown-icon {
    width: 16px;
    height: 16px;
    flex-shrink: 0;
  }

  .dropdown-label {
    font-size: 13px;
    font-weight: 400;
    line-height: 1.4;
  }
}

// 动画
@keyframes fadeInScale {
  from {
    opacity: 0;
    transform: scale(0.95) translateY(-8px);
  }
  to {
    opacity: 1;
    transform: scale(1) translateY(0);
  }
}
</style>
