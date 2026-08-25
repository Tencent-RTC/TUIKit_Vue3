<script setup lang="ts">
import { ref } from 'vue';
import { useChatContext } from '@tencentcloud/chat-uikit-vue3';
import { ClipboardList } from 'lucide-vue-next';
import { Popup as TPopup } from 'tdesign-vue-next';
// Aegis data reporting (remove for GitHub demo)
import { reportEvent } from '@/utils/aegis';
import { MEDICAL_BUSINESS_ID } from '../constants';
import MedicalRecordPanel from './MedicalRecordPanel.vue';
import type { VisitRecord } from './MedicalRecordPanel.vue';

const isOpen = ref(false);
const { sendMessage } = useChatContext();

const handleSendRecord = async (record: VisitRecord) => {
  await sendMessage({
    type: 'customMessage',
    customData: JSON.stringify({
      businessID: MEDICAL_BUSINESS_ID.MEDICAL_RECORD,
      ...record,
    }),
    description: `就诊记录 - ${record.patientName} ${record.date}`,
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
    <!-- Report medical picker click event (remove for GitHub demo) -->
    <button
      class="record-picker__trigger"
      title="发送病历"
      @click="reportEvent('medical_picker_click', 'medical_record')"
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
