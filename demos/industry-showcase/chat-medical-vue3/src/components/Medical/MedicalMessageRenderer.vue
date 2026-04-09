<script setup lang="ts">
import { computed } from 'vue';
import { CustomMessage } from '@tencentcloud/chat-uikit-vue3';
import MedicalRateCard from './cards/MedicalRateCard.vue';
import MedicalRecordCard from './cards/MedicalRecordCard.vue';
import PrescriptionCard from './cards/PrescriptionCard.vue';
import { MEDICAL_BUSINESS_ID } from './constants';

interface Props {
  message: any;
}

const props = defineProps<Props>();

const parsedData = computed(() => {
  try {
    const { payload } = props.message;
    return JSON.parse(payload?.data || '{}');
  } catch {
    return {};
  }
});

const businessID = computed(() => parsedData.value?.businessID);
</script>

<template>
  <MedicalRecordCard
    v-if="businessID === MEDICAL_BUSINESS_ID.MEDICAL_RECORD"
    :date="parsedData.date"
    :patient-name="parsedData.patientName"
    :gender="parsedData.gender"
    :age="parsedData.age"
    :department="parsedData.department"
    :status="parsedData.status || 'completed'"
    :chief-complaint="parsedData.chiefComplaint"
    :diagnosis="parsedData.diagnosis"
  />

  <!-- Prescription card -->
  <PrescriptionCard
    v-else-if="businessID === MEDICAL_BUSINESS_ID.PRESCRIPTION"
    :prescription-no="parsedData.prescriptionNo"
    :date="parsedData.date"
    :patient-name="parsedData.patientName"
    :gender="parsedData.gender"
    :age="parsedData.age"
    :doctor-name="parsedData.doctorName"
    :department="parsedData.department"
    :diagnosis="parsedData.diagnosis"
    :medications="parsedData.medications || []"
    :notes="parsedData.notes"
  />

  <MedicalRateCard
    v-else-if="businessID === MEDICAL_BUSINESS_ID.RATING"
    :rate="parsedData.rate"
  />

  <!-- Fallback for unknown custom messages -->
  <CustomMessage v-else :message="message" />
</template>

<style scoped>
.medical-custom-default {
  padding: 10px 12px;
  border-radius: 8px;
  background: var(--bg-color-default, #f5f5f5);
  color: var(--text-color-primary);
  font-size: 13px;
}
</style>
