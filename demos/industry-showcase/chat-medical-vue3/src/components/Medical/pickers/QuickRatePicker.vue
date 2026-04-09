<script setup lang="ts">
import { ref } from 'vue';
import { useMessageInputState } from '@tencentcloud/chat-uikit-vue3';
import { Star } from 'lucide-vue-next';
import { Popup as TPopup, Rate as TRate, Button as TButton } from 'tdesign-vue-next';
import { MEDICAL_BUSINESS_ID } from '../constants';

const isOpen = ref(false);
const rate = ref(0);
const { sendCustomMessage } = useMessageInputState();

const handleSubmit = () => {
  isOpen.value = false;
  sendCustomMessage({
    payload: {
      data: JSON.stringify({
        businessID: MEDICAL_BUSINESS_ID.RATING,
        rate: rate.value,
      }),
      description: `咨询评价 - ${rate.value}星`,
      extension: '',
    },
  });
};

const handleRateChange = (value: number) => {
  rate.value = value;
};
</script>

<template>
  <TPopup
    v-model:visible="isOpen"
    trigger="click"
    placement="top"
    :show-arrow="false"
    :destroy-on-close="true"
  >
    <button class="quick-rate-picker__trigger" title="快捷评价">
      <Star :size="18" />
    </button>
    <template #content>
      <div class="quick-rate-picker__panel">
        <div class="quick-rate-picker__header">
          <span class="quick-rate-picker__header-title">请为本次咨询打分</span>
        </div>
        <TRate class="quick-rate-picker__content" @change="handleRateChange" />
        <div class="quick-rate-picker__footer">
          <TButton theme="success" @click="handleSubmit">
            提交
          </TButton>
        </div>
      </div>
    </template>
  </TPopup>
</template>

<style scoped>
.quick-rate-picker__trigger {
  padding: 4px 6px;
  border: none;
  background: transparent;
  cursor: pointer;
  border-radius: 4px;
  display: flex;
  align-items: center;
  color: #0ABF77;
}
.quick-rate-picker__trigger:hover {
  background: var(--button-color-secondary-hover);
}
.quick-rate-picker__panel {
  width: 300px;
  display: flex;
  flex-direction: column;
  justify-content: center;
  gap: 10px;
}
.quick-rate-picker__header {
  border-bottom: 1px solid #e5e7eb;
  text-align: center;
  padding: 10px 0;
  flex-shrink: 0;
}
.quick-rate-picker__header-title {
  font-size: 14px;
}
.quick-rate-picker__content {
  padding: 10px 0 5px;
  margin: auto;
}
.quick-rate-picker__footer {
  display: flex;
  justify-content: flex-end;
}
</style>
