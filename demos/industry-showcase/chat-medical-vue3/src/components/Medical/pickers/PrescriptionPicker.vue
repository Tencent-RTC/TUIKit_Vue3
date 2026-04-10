<script setup lang="ts">
import { ref } from 'vue';
import { useMessageInputState } from '@tencentcloud/chat-uikit-vue3';
import { Pill } from 'lucide-vue-next';
import { Popup as TPopup } from 'tdesign-vue-next';
import { MEDICAL_BUSINESS_ID } from '../constants';
import PrescriptionPanel from './PrescriptionPanel.vue';
import type { PrescriptionRecord } from './PrescriptionPanel.vue';

const isOpen = ref(false);
const { sendCustomMessage } = useMessageInputState();

const handleSendPrescription = async (prescription: PrescriptionRecord) => {
  await sendCustomMessage({
    payload: {
      data: JSON.stringify({
        businessID: MEDICAL_BUSINESS_ID.PRESCRIPTION,
        ...prescription,
      }),
      description: `电子处方 - ${prescription.patientName} ${prescription.prescriptionNo}`,
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
    :destroy-on-close="false"
  >
    <button
      class="rx-picker__trigger"
      title="开具处方"
    >
      <Pill :size="18" />
    </button>
    <template #content>
      <PrescriptionPanel
        @close="handleClose"
        @send-prescription="handleSendPrescription"
      />
    </template>
  </TPopup>
</template>

<style scoped>
.rx-picker__trigger {
  padding: 4px 6px;
  border: none;
  background: transparent;
  cursor: pointer;
  border-radius: 4px;
  display: flex;
  align-items: center;
  color: #0ABF77;
}
.rx-picker__trigger:hover {
  background: var(--button-color-secondary-hover);
}
</style>
