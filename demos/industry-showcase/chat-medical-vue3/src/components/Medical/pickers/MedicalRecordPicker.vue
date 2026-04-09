<script setup lang="ts">
import { ref } from 'vue';
import { useMessageInputState } from '@tencentcloud/chat-uikit-vue3';
import { ClipboardList } from 'lucide-vue-next';
import { Popup as TPopup } from 'tdesign-vue-next';
import { MEDICAL_BUSINESS_ID } from '../constants';
import MedicalRecordPanel from './MedicalRecordPanel.vue';
import type { VisitRecord } from './MedicalRecordPanel.vue';

const isOpen = ref(false);
const { sendCustomMessage } = useMessageInputState();

const handleSendRecord = async (record: VisitRecord) => {
  await sendCustomMessage({
    payload: {
      data: JSON.stringify({
        businessID: MEDICAL_BUSINESS_ID.MEDICAL_RECORD,
        ...record,
      }),
      description: `就诊记录 - ${record.patientName} ${record.date}`,
      extension: '',
    },
  });
  isOpen.value = false;
};

const handleClose = () => {
  isOpen.value = false;
};
</script>

<template>
  <TPopup
    v-model:visible="isOpen"
    trigger="click"
    placement="top-left"
    :show-arrow="false"
    :destroy-on-close="true"
  >
    <button
      class="record-picker__trigger"
      title="发送病历"
    >
      <ClipboardList :size="18" />
    </button>
    <template #content>
      <MedicalRecordPanel
        @close="handleClose"
        @send-record="handleSendRecord"
      />
    </template>
  </TPopup>
</template>

<style scoped>
.record-picker__trigger {
  padding: 4px 6px;
  border: none;
  background: transparent;
  cursor: pointer;
  border-radius: 4px;
  display: flex;
  align-items: center;
  color: #0ABF77;
}
.record-picker__trigger:hover {
  background: var(--button-color-secondary-hover);
}
</style>
