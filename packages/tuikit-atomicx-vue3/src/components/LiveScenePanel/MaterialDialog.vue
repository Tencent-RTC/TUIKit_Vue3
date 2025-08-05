<template>
  <div v-if="props.visible" class="material-dialog-overlay" @click="handleClose">
    <div class="material-dialog" @click.stop>
      <div class="dialog-header">
        <h3>{{ t('Add Material') }}</h3>
        <button class="close-btn" @click="handleClose">×</button>
      </div>

      <div class="dialog-content">
        <!-- 外接设备 -->
        <div class="category-section">
          <h4>{{ t('External Devices') }}</h4>
          <div class="material-grid">
            <div class="material-option" @click="selectMaterial(TRTCMediaSourceType.kCamera)">
              <div class="option-icon">📹</div>
              <span class="option-label">{{ t('Camera') }}</span>
              <div class="status-dot active"></div>
            </div>
          </div>
        </div>

        <!-- 多媒体 -->
        <div class="category-section">
          <h4>{{ t('Multimedia') }}</h4>
          <div class="material-grid">
            <div class="material-option" @click="selectMaterial(TRTCMediaSourceType.kVideo)">
              <div class="option-icon">▶️</div>
              <span class="option-label">{{ t('Video') }}</span>
            </div>
            <div class="material-option" @click="selectMaterial(TRTCMediaSourceType.kImage)">
              <div class="option-icon">🖼️</div>
              <span class="option-label">{{ t('Image') }}</span>
            </div>
            <div class="material-option" @click="selectMaterial(TRTCMediaSourceType.kText)">
              <div class="option-icon">📝</div>
              <span class="option-label">{{ t('Text') }}</span>
            </div>
          </div>
        </div>

        <!-- 画面捕捉 -->
        <div class="category-section">
          <h4>{{ t('Screen Capture') }}</h4>
          <div class="material-grid">
            <div class="material-option" @click="selectMaterial(TRTCMediaSourceType.kScreen)">
              <div class="option-icon">🤖</div>
              <span class="option-label">{{ t('Screen') }}</span>
              <div class="status-dot active"></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { TRTCMediaSourceType } from '@tencentcloud/tuiroom-engine-js';
import { useUIKit } from '@tencentcloud/uikit-base-component-vue3';
const { t } = useUIKit();

interface Props {
  visible: boolean;
}

interface Emits {
  (e: 'close'): void;
  (e: 'select', type: TRTCMediaSourceType): void;
}

const props = defineProps<Props>();
const emit = defineEmits<Emits>();

const handleClose = () => {
  emit('close');
};

const selectMaterial = (type: TRTCMediaSourceType) => {
  emit('select', type);
};
</script>

<style lang="scss" scoped>
.material-dialog-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.7);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.material-dialog {
  background: #2d2d2d;
  border-radius: 12px;
  width: 600px;
  max-width: 90vw;
  max-height: 80vh;
  overflow: hidden;
  box-shadow: 0 20px 40px rgba(0, 0, 0, 0.3);
}

.dialog-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 20px;
  border-bottom: 1px solid #404040;

  h3 {
    margin: 0;
    font-size: 16px;
    font-weight: 600;
    color: #ffffff;
  }

  .close-btn {
    width: 28px;
    height: 28px;
    background: none;
    border: none;
    color: #9ca3af;
    cursor: pointer;
    font-size: 20px;
    border-radius: 4px;
    transition: all 0.2s ease;

    &:hover {
      background: #3a3a3a;
      color: #ffffff;
    }
  }
}

.dialog-content {
  padding: 20px;
  max-height: 60vh;
  overflow-y: auto;

  &::-webkit-scrollbar {
    width: 6px;
  }

  &::-webkit-scrollbar-track {
    background: #3a3a3a;
    border-radius: 3px;
  }

  &::-webkit-scrollbar-thumb {
    background: #5a5a5a;
    border-radius: 3px;

    &:hover {
      background: #6a6a6a;
    }
  }
}

.category-section {
  margin-bottom: 24px;

  &:last-child {
    margin-bottom: 0;
  }

  h4 {
    margin: 0 0 12px 0;
    font-size: 14px;
    font-weight: 500;
    color: #9ca3af;
  }
}

.material-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(120px, 1fr));
  gap: 12px;
}

.material-option {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  padding: 16px 12px;
  background: #3a3a3a;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s ease;
  position: relative;

  &:hover {
    background: #4a4a4a;
    transform: translateY(-2px);
  }

  .option-icon {
    font-size: 32px;
    margin-bottom: 4px;
  }

  .option-label {
    font-size: 12px;
    color: #ffffff;
    text-align: center;
    line-height: 1.2;
  }

  .status-dot {
    position: absolute;
    top: 8px;
    right: 8px;
    width: 8px;
    height: 8px;
    border-radius: 50%;

    &.active {
      background: #10b981;
    }
  }
}
</style>
