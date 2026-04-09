<script setup lang="ts">
import { computed } from 'vue';
import { FileText } from 'lucide-vue-next';

interface Medication {
  name: string;
  specification: string;
  dosage: string;
  frequency: string;
  duration: string;
}

const props = defineProps<{
  prescriptionNo: string;
  date: string;
  patientName: string;
  gender: string;
  age: number;
  doctorName: string;
  department: string;
  diagnosis: string;
  medications: Medication[];
  notes?: string;
}>();

const initial = computed(() => props.patientName.charAt(0));

const handleViewDetails = () => {
  console.log('[PrescriptionCard] View details for', props.prescriptionNo);
};
</script>

<template>
  <div class="rx-card">
    <!-- Header -->
    <div class="rx-card__header">
      <div class="rx-card__header-left">
        <FileText :size="16" />
        <span>处方单</span>
      </div>
      <span class="rx-card__date">{{ date }}</span>
    </div>

    <!-- Body -->
    <div class="rx-card__body">
      <!-- Patient Info -->
      <div class="rx-card__patient-row">
        <div class="rx-card__patient-info">
          <div class="rx-card__avatar">
            {{ initial }}
          </div>
          <div class="rx-card__patient-meta">
            <div class="rx-card__patient-name-row">
              <span class="rx-card__name">{{ patientName }}</span>
              <span class="rx-card__tag">{{ gender }}</span>
              <span class="rx-card__tag">{{ age }}岁</span>
            </div>
          </div>
        </div>
      </div>

      <!-- Prescription Number -->
      <div class="rx-card__rx-no">
        处方编号：{{ prescriptionNo }}
      </div>

      <div class="rx-card__divider" />

      <!-- Doctor & Department -->
      <div class="rx-card__doctor-row">
        <div class="rx-card__doctor-item">
          <span class="rx-card__label">医生：</span>
          <span class="rx-card__value">{{ doctorName }}</span>
        </div>
        <div class="rx-card__doctor-item">
          <span class="rx-card__label">科室：</span>
          <span class="rx-card__dept">{{ department }}</span>
        </div>
      </div>

      <!-- Diagnosis -->
      <div class="rx-card__field">
        <div class="rx-card__label">
          诊断
        </div>
        <div class="rx-card__diagnosis">
          {{ diagnosis }}
        </div>
      </div>

      <div class="rx-card__divider" />

      <!-- Medications -->
      <div class="rx-card__field">
        <div class="rx-card__label rx-card__label--mb">
          药品清单
        </div>
        <div class="rx-card__med-list">
          <div
            v-for="(med, idx) in medications"
            :key="idx"
            class="rx-card__med-item"
          >
            <div class="rx-card__med-header">
              <span class="rx-card__med-name">{{ med.name }}</span>
              <span class="rx-card__med-spec">{{ med.specification }}</span>
            </div>
            <div class="rx-card__med-usage">
              {{ med.dosage }} · {{ med.frequency }} · {{ med.duration }}
            </div>
          </div>
        </div>
      </div>

      <div class="rx-card__divider" />

      <!-- Notes -->
      <div v-if="notes" class="rx-card__field">
        <div class="rx-card__label rx-card__label--mb">
          备注
        </div>
        <div class="rx-card__notes-text">
          {{ notes }}
        </div>
      </div>
    </div>

    <!-- Footer -->
    <div class="rx-card__footer">
      <span class="rx-card__disclaimer">仅供医疗使用</span>
      <button class="rx-card__detail-btn" @click="handleViewDetails">
        查看详情
      </button>
    </div>
  </div>
</template>

<style scoped>
.rx-card {
  width: 320px;
  border-radius: 12px;
  overflow: hidden;
  border: 1px solid rgba(10, 191, 119, 0.15);
  background: #fff;
}

.rx-card__header {
  padding: 10px 14px;
  background: rgba(10, 191, 119, 0.08);
  display: flex;
  align-items: center;
  justify-content: space-between;
  color: #0ABF77;
  font-size: 14px;
  font-weight: 500;
}

.rx-card__header-left {
  display: flex;
  align-items: center;
  gap: 6px;
}

.rx-card__date {
  font-size: 12px;
  font-weight: 400;
}

.rx-card__body {
  padding: 12px 14px;
  background: #FAFFFE;
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.rx-card__patient-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.rx-card__patient-info {
  display: flex;
  align-items: center;
  gap: 8px;
}

.rx-card__avatar {
  width: 28px;
  height: 28px;
  border-radius: 50%;
  background: #0ABF77;
  color: #fff;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 13px;
  font-weight: 500;
  flex-shrink: 0;
}

.rx-card__patient-name-row {
  display: flex;
  align-items: center;
  gap: 6px;
}

.rx-card__name {
  font-size: 13px;
  font-weight: 500;
  color: #111827;
}

.rx-card__tag {
  padding: 1px 6px;
  background: #f3f4f6;
  color: #374151;
  border-radius: 4px;
  font-size: 12px;
}

.rx-card__rx-no {
  font-size: 12px;
  color: #6b7280;
}

.rx-card__divider {
  height: 1px;
  background: #e5e7eb;
}

.rx-card__doctor-row {
  display: flex;
  align-items: center;
  gap: 16px;
  font-size: 12px;
}

.rx-card__doctor-item {
  display: flex;
  align-items: center;
  gap: 2px;
}

.rx-card__label {
  font-size: 12px;
  color: #6b7280;
}

.rx-card__label--mb {
  margin-bottom: 6px;
}

.rx-card__value {
  color: #111827;
}

.rx-card__dept {
  padding: 1px 6px;
  background: #eff6ff;
  color: #1d4ed8;
  border-radius: 4px;
  font-size: 12px;
}

.rx-card__field {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.rx-card__diagnosis {
  font-size: 13px;
  color: #0ABF77;
  font-weight: 500;
}

.rx-card__med-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.rx-card__med-item {
  background: #fff;
  border-radius: 8px;
  padding: 10px;
  border: 1px solid #f3f4f6;
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.rx-card__med-header {
  display: flex;
  align-items: baseline;
  gap: 6px;
}

.rx-card__med-name {
  font-size: 14px;
  font-weight: 500;
  color: #111827;
}

.rx-card__med-spec {
  font-size: 12px;
  color: #9ca3af;
}

.rx-card__med-usage {
  font-size: 12px;
  color: #6b7280;
  line-height: 1.5;
}

.rx-card__notes-text {
  font-size: 13px;
  color: #111827;
}

.rx-card__footer {
  padding: 6px 14px;
  background: #fff;
  border-top: 1px solid #f3f4f6;
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.rx-card__disclaimer {
  font-size: 12px;
  color: #9ca3af;
}

.rx-card__detail-btn {
  border: none;
  background: transparent;
  font-size: 12px;
  color: #6b7280;
  cursor: pointer;
  padding: 2px 0;
}

.rx-card__detail-btn:hover {
  color: #0ABF77;
}
</style>
