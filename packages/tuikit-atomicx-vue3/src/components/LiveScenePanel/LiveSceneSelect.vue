<template>
  <div class="live-scene-placeholder" v-if="displayMode === 'panel'">
    <div class="live-scene-placeholder-content">
      <span>{{ t('We support you to add rich sources') }}</span>
      <div class="add-material-list">
        <div
          class="add-material-item"
          @click="handleAddMaterial(item.type)"
          v-for="item in defaultMaterialList"
          :key="item.title"
        >
          <svg-icon :icon="item.icon" class="icon-container" />
          <span>{{ item.title }}</span>
        </div>
      </div>
    </div>
  </div>
  <div
    class="live-scene-button"
    v-if="displayMode === 'button'"
    @mouseenter="handleMouseEnter"
    @mouseleave="handleMouseLeave"
  >
    <div class="add-material-button">
      <svg-icon :icon="AddIcon" class="icon-container" />
      <span>{{ t('Add') }}</span>
    </div>
    <transition name="dropdown">
      <div class="add-material-list" v-show="isDropdownVisible">
        <div
          class="add-material-item"
          @click="handleAddMaterial(item.type)"
          v-for="item in defaultMaterialList"
          :key="item.title"
        >
          <svg-icon :icon="item.icon" class="icon-container" />
          <span>{{ item.title }}</span>
        </div>
      </div>
    </transition>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { TRTCMediaSourceType } from '@tencentcloud/tuiroom-engine-js';
import SvgIcon from '../../baseComp/SvgIcon.vue';
import AddIcon from './icons/AddIcon.vue';
import CameraIcon from './icons/CameraIcon.vue';
import ScreenIcon from './icons/ScreenIcon.vue';
import ImageIcon from './icons/ImageIcon.vue';
import { useUIKit } from '@tencentcloud/uikit-base-component-vue3';
const { t } = useUIKit();

const props = defineProps<{
  displayMode: 'panel' | 'button';
}>();
const emits = defineEmits(['addMaterial']);

// 控制下拉列表显示状态
const isDropdownVisible = ref(false);
let hideTimer: ReturnType<typeof setTimeout> | null = null;

const defaultMaterialList = [
  { icon: CameraIcon, title: t('Add Camera'), type: TRTCMediaSourceType.kCamera },
  { icon: ScreenIcon, title: t('Add Screen Share'), type: TRTCMediaSourceType.kScreen },
  { icon: ImageIcon, title: t('Add Image'), type: TRTCMediaSourceType.kImage },
];

// 鼠标进入时显示下拉列表
const handleMouseEnter = () => {
  if (hideTimer) {
    clearTimeout(hideTimer);
    hideTimer = null;
  }
  isDropdownVisible.value = true;
};

// 鼠标离开时延迟隐藏下拉列表
const handleMouseLeave = () => {
  hideTimer = setTimeout(() => {
    isDropdownVisible.value = false;
  }, 200); // 200ms 延迟，避免鼠标快速移动时闪烁
};

// 点击材料项时的处理
const handleAddMaterial = (type: TRTCMediaSourceType) => {
  emits('addMaterial', type);
  // 只在 button 模式下隐藏下拉列表
  if (props.displayMode === 'button') {
    isDropdownVisible.value = false;
  }
};
</script>

<style scoped lang="scss">
.live-scene-placeholder {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100%;
  color: rgba(255, 255, 255, 0.55);
  font-size: 14px;
  line-height: 22px;
  font-weight: 500;

  .add-material-list {
    margin-top: 50px;
    width: 100%;
    .add-material-item {
      display: flex;
      flex-direction: row;
      align-items: center;
      justify-content: center;
      width: 100%;
      height: 40px;
      border-radius: 20px;
      background-color: #383f4d;
      color: var(--text-color-primary);
      font-size: 12px;
      font-weight: 400;
      margin-top: 24px;
      cursor: pointer;
      gap: 4px;
      &:hover {
        background-color: #4f586b;
      }
    }
  }
}

.live-scene-button {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  width: 100%;
  position: relative;

  .add-material-button {
    display: flex;
    flex-direction: row;
    align-items: center;
    justify-content: center;
    width: 100%;
    height: 40px;
    border-radius: 20px;
    background-color: #383f4d;
    color: var(--text-color-primary);
    font-size: 12px;
    font-weight: 400;
    cursor: pointer;
    gap: 4px;
    transition: background-color 0.2s ease;

    &:hover {
      background-color: #4f586b;
    }
  }

  .add-material-list {
    width: 100%;
    padding: 9px;
    position: absolute;
    right: 0;
    top: calc(100% + 10px);
    z-index: 9;
    border-radius: 8px;
    background-color: rgba(45, 50, 62, 0.8);
    border: 1px solid rgba(255, 255, 255, 0.1);
    backdrop-filter: blur(10px);
    box-shadow: 0 4px 20px rgba(0, 0, 0, 0.3);

    .add-material-item {
      display: flex;
      justify-content: center;
      align-items: center;
      width: 100%;
      height: 40px;
      color: #d5e0f2;
      font-size: 12px;
      font-weight: 400;
      border-radius: 4px;
      cursor: pointer;
      transition: background-color 0.2s ease;
      gap: 4px;

      &:hover {
        background-color: rgba(209, 217, 236, 0.1);
      }
    }
  }
}

// 下拉动画效果
.dropdown-enter-active,
.dropdown-leave-active {
  transition: all 0.3s ease;
}

.dropdown-enter-from {
  opacity: 0;
  transform: translateY(-10px) scale(0.95);
}

.dropdown-leave-to {
  opacity: 0;
  transform: translateY(-10px) scale(0.95);
}

.dropdown-enter-to,
.dropdown-leave-from {
  opacity: 1;
  transform: translateY(0) scale(1);
}
</style>
