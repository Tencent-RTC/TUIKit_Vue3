<template>
  <div class="virtual-background">
    <div id="stream-preview" class="stream-preview">
      <div v-if="isLoading" class="mask" />
      <div v-if="isLoading" class="spinner" />
    </div>
    <div class="setting">
      <div
        :class="[
          'setting-item',
          selectedBackground === 'close' ? 'active' : '',
          !isInitialized ? 'disabled' : '',
        ]"
        @click="applyVirtualBackground('close')"
      >
        <i class="setting-item-icon">
          <img
            :src="CloseVirtualBackground"
            alt="close"
            style="width: 32px"
          >
        </i>
        <span class="setting-item-text">{{ t('VirtualBackground.Close') }}</span>
      </div>
      <div
        :class="[
          'setting-item',
          selectedBackground === 'blur' ? 'active' : '',
          !isInitialized ? 'disabled' : '',
        ]"
        @click="applyVirtualBackground('blur')"
      >
        <i class="setting-item-icon">
          <img :src="BlurredBackground" alt="blurred">
        </i>
        <span class="setting-item-text">{{ t('VirtualBackground.Blurred') }}</span>
      </div>
    </div>
    <div class="footer">
      <TUIButton
        :disabled="!isInitialized"
        type="primary"
        @click="confirmVirtualBackground"
      >
        {{ t('VirtualBackground.Save') }}
      </TUIButton>
      <TUIButton @click="cancelVirtualBackground">
        {{
          t('VirtualBackground.Cancel')
        }}
      </TUIButton>
    </div>
  </div>
</template>

<script setup lang="ts">
import { onMounted, onUnmounted, ref } from 'vue';
import { TOAST_TYPE, TUIButton, TUIToast, useUIKit } from '@tencentcloud/uikit-base-component-vue3';
import { useDeviceState } from '../../states/DeviceState';
import { useVirtualBackgroundState } from '../../states/VirtualBackgroundState';
import { VirtualBackgroundEvent, VirtualBackgroundType } from '../../types/virtualBackground';
// Asset imports
import BlurredBackground from './assets/blurred-background.png';
import CloseVirtualBackground from './assets/close-virtual-background.png';

// Hooks and composables
const { t } = useUIKit();
const emit = defineEmits(['close']);
const props = withDefaults(defineProps<{
  assetsPath: string;
}>(), {
  assetsPath: 'https://web.sdk.qcloud.com/hybrid/trtc-sdk-v5/assets',
});

const {
  startCameraTest,
  stopCameraTest,
} = useDeviceState();

const {
  virtualBackgroundConfig,
  initVirtualBackground,
  setVirtualBackground,
  saveVirtualBackground,
  subscribeEvent,
  unsubscribeEvent,
} = useVirtualBackgroundState();

// Types
type BackgroundType = 'close' | 'blur';

// State references
const selectedBackground = ref<BackgroundType>(
  virtualBackgroundConfig.value?.enable ? 'blur' : 'close',
);
const isLoading = ref(false);
const isInitialized = ref(false);

// Helper functions
/**
 * Get virtual background configuration based on type
 */
function getVirtualBackgroundConfig(type: BackgroundType) {
  switch (type) {
    case 'close':
      return { enable: false };
    case 'blur':
      return { enable: true, type: VirtualBackgroundType.blur };
    default:
      return { enable: false };
  }
}

/**
 * Close the virtual background panel
 */
async function closePanel() {
  emit('close');
}

/**
 * Show error toast message
 */
function showErrorToast(message: string) {
  TUIToast({
    type: TOAST_TYPE.ERROR,
    message: t(message),
  });
}

/**
 * Initialize and restore virtual background settings
 */
async function initializeVirtualBackground() {
  isLoading.value = true;
  isInitialized.value = false;
  try {
    await initVirtualBackground({ assetsPath: props.assetsPath });
    await startCameraTest({ view: 'stream-preview' });

    const { enable, type } = virtualBackgroundConfig.value || {};
    await setVirtualBackground({ enable, type });
    isInitialized.value = true;
  } catch (error) {
    console.error('Failed to initialize virtual background:', error);
    showErrorToast('VirtualBackground.InitializeFailed');
  } finally {
    isLoading.value = false;
  }
}

// Event handlers
/**
 * Apply virtual background based on selected type
 */
async function applyVirtualBackground(type: BackgroundType) {
  if (!isInitialized.value) {
    return;
  }

  isLoading.value = true;
  try {
    selectedBackground.value = type;
    const config = getVirtualBackgroundConfig(type);
    await setVirtualBackground(config);
  } catch (error) {
    console.error('Failed to apply virtual background:', error);
    showErrorToast('VirtualBackground.ApplyFailed');
  } finally {
    isLoading.value = false;
  }
}

/**
 * Save current virtual background settings and close panel
 */
async function confirmVirtualBackground() {
  if (!isInitialized.value) {
    return;
  }

  try {
    await saveVirtualBackground();
    closePanel();
  } catch (error) {
    console.error('Failed to save virtual background:', error);
    showErrorToast('VirtualBackground.SaveFailed');
  }
}

/**
 * Cancel virtual background changes and close panel
 */
async function cancelVirtualBackground() {
  closePanel();
}

/**
 * Handle virtual background error event
 */
function handleVirtualBackgroundAbort() {
  showErrorToast('VirtualBackground.Aborted');
}

// Lifecycle hooks
onMounted(async () => {
  await initializeVirtualBackground();
  subscribeEvent(
    VirtualBackgroundEvent.onAbort,
    handleVirtualBackgroundAbort,
  );
});

onUnmounted(() => {
  stopCameraTest();

  unsubscribeEvent(
    VirtualBackgroundEvent.onAbort,
    handleVirtualBackgroundAbort,
  );
});
</script>

<style lang="scss" scoped>
.virtual-background {
  display: flex;
  align-items: center;
  flex-direction: column;
  width: 100%;
  height: 100%;
}
.stream-preview {
  position: relative;
  box-sizing: border-box;
  display: flex;
  align-items: center;
  justify-content: center;
  height: 310px;
  width: 100%;
  overflow: hidden;
  border-radius: 8px;
  background-color: var(--uikit-color-black-1);
}

.setting {
  box-sizing: border-box;
  width: 100%;
  display: flex;
  gap: 16px;
  padding: 1rem;
  align-items: center;
  margin-top: 10px;
  border-radius: 8px;
  border: 1px solid var(--stroke-color-primary);

  &-item {
    display: flex;
    flex-direction: column;
    justify-content: center;
    font-size: 12px;
    text-align: center;
    cursor: pointer;
    border: 1px solid transparent;
    border-radius: 8px;
    color: var(--text-color-secondary);

    &-icon {
      display: flex;
      align-items: center;
      justify-content: center;
      width: 54px;
      height: 54px;
      overflow: hidden;
      border-radius: 8px;
      background-color: var(--bg-color-dialog);
      border: 1px solid var(--stroke-color-primary);
    }

    &-text {
      padding: 3px 0;
    }
  }

  &-item.active {
    color: var(--text-color-button);
    background-color: var(--button-color-primary-default);
    border: 1px solid var(--button-color-primary-default);
  }

  &-item.disabled {
    cursor: not-allowed;
    opacity: 0.5;
  }
}

.spinner {
  position: absolute;
  top: 50%;
  left: 50%;
  z-index: 3;
  width: 40px;
  height: 40px;
  border: 4px solid var(--uikit-color-white-2);
  border-top: 4px solid var(--text-color-link);
  border-radius: 50%;
  transform: translate(-50%, -50%);
  animation: spin 1s linear infinite;
}

.mask {
  position: absolute;
  z-index: 2;
  width: 100%;
  height: 100%;
  background-color: var(--uikit-color-black-1);
}

@keyframes spin {
  0% {
    transform: translate(-50%, -50%) rotate(0deg);
  }

  100% {
    transform: translate(-50%, -50%) rotate(360deg);
  }
}

.footer {
  display: flex;
  gap: 1rem;
  align-items: center;
  justify-content: center;
  padding: 1rem;
  margin-top: 10px;
  border-radius: 8px;
}
</style>
