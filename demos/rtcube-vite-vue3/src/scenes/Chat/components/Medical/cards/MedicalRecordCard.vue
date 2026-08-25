<script setup lang="ts">
import { computed } from 'vue';
import { FileText } from 'lucide-vue-next';

const props = defineProps<{
  date: string;
  patientName: string;
  gender: string;
  age: number;
  department: string;
  status: 'completed' | 'in-progress';
  chiefComplaint: string;
  diagnosis: string;
}>();

const initial = computed(() => props.patientName.charAt(0));
const statusText = computed(() => props.status === 'completed' ? '已完成' : '进行中');

const handleViewDetails = () => {
  // In real scenario this opens the full EMR record
  console.log('[MedicalRecordCard] View details for', props.patientName, props.date);
};
</script>

<template>
  <div class="record-card">
    <!-- Header -->
    <div class="record-card__header">
      <div class="record-card__header-left">
        <FileText :size="16" />
        <span>就诊记录</span>
      </div>
      <span class="record-card__date">{{ date }}</span>
    </div>

    <!-- Body -->
    <div class="record-card__body">
      <!-- Patient Info -->
      <div class="record-card__patient">
        <div class="record-card__avatar">
          {{ initial }}
        </div>
        <span class="record-card__name">{{ patientName }}</span>
        <span class="record-card__tag">{{ gender }}</span>
        <span class="record-card__tag">{{ age }}岁</span>
      </div>

      <!-- Tags -->
      <div class="record-card__tags">
        <span class="record-card__dept">{{ department }}</span>
        <span
          class="record-card__status"
          :class="status === 'completed' ? 'record-card__status--done' : 'record-card__status--progress'"
        >
          {{ statusText }}
        </span>
      </div>

      <div class="record-card__divider" />

      <!-- Chief Complaint -->
      <div class="record-card__field">
        <div class="record-card__label">
          主诉
        </div>
        <div class="record-card__value">
          {{ chiefComplaint }}
        </div>
      </div>

      <!-- Diagnosis -->
      <div class="record-card__field">
        <div class="record-card__label">
          诊断
        </div>
        <div class="record-card__value record-card__value--accent">
          {{ diagnosis }}
        </div>
      </div>
    </div>

    <!-- Footer -->
    <div class="record-card__footer">
      <button class="record-card__detail-btn" @click="handleViewDetails">
        查看详情
      </button>
    </div>
  </div>
</template>

<style scoped>
.record-card {
  width: 300px;
  border-radius: 12px;
  overflow: hidden;
  border: 1px solid rgba(10, 191, 119, 0.15);
  background: #fff;
}

.record-card__header {
  padding: 10px 14px;
  background: rgba(10, 191, 119, 0.08);
  display: flex;
  align-items: center;
  justify-content: space-between;
  color: #0ABF77;
  font-size: 14px;
  font-weight: 500;
}

.record-card__header-left {
  display: flex;
  align-items: center;
  gap: 6px;
}

.record-card__date {
  font-size: 12px;
  font-weight: 400;
}

.record-card__body {
  padding: 12px 14px;
  background: #FAFFFE;
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.record-card__patient {
  display: flex;
  align-items: center;
  gap: 6px;
}

.record-card__avatar {
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

.record-card__name {
  font-size: 13px;
  font-weight: 500;
  color: #111827;
}

.record-card__tag {
  padding: 1px 6px;
  background: #f3f4f6;
  color: #374151;
  border-radius: 4px;
  font-size: 12px;
}

.record-card__tags {
  display: flex;
  align-items: center;
  gap: 6px;
}

.record-card__dept {
  padding: 2px 8px;
  background: #eff6ff;
  color: #1d4ed8;
  border-radius: 6px;
  font-size: 12px;
}

.record-card__status {
  padding: 2px 8px;
  border-radius: 6px;
  font-size: 12px;
}

.record-card__status--done {
  background: #f0fdf4;
  color: #15803d;
}

.record-card__status--progress {
  background: #fefce8;
  color: #a16207;
}

.record-card__divider {
  height: 1px;
  background: #e5e7eb;
}

.record-card__field {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.record-card__label {
  font-size: 12px;
  color: #6b7280;
}

.record-card__value {
  font-size: 13px;
  color: #111827;
}

.record-card__value--accent {
  color: #0ABF77;
  font-weight: 500;
}

.record-card__footer {
  padding: 6px 14px;
  background: #fff;
  border-top: 1px solid #f3f4f6;
  display: flex;
  justify-content: flex-end;
}

.record-card__detail-btn {
  border: none;
  background: transparent;
  font-size: 12px;
  color: #6b7280;
  cursor: pointer;
  padding: 3px 0;
}

.record-card__detail-btn:hover {
  color: #0ABF77;
}
</style>
