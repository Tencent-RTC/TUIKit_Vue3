<script setup lang="ts">
import { ref } from 'vue';
import { X, Plus, Trash2, Pill } from 'lucide-vue-next';

export interface Medication {
  name: string;
  specification: string;
  dosage: string;
  frequency: string;
  duration: string;
}

export interface PrescriptionRecord {
  id: string;
  prescriptionNo: string;
  date: string;
  patientName: string;
  gender: string;
  age: number;
  doctorName: string;
  department: string;
  diagnosis: string;
  medications: Medication[];
  status: 'confirmed' | 'pending';
  notes?: string;
}

interface MedicationInput {
  id: string;
  name: string;
  usage: string;
}

const props = withDefaults(defineProps<{
  patientInfo?: { name: string; gender: string; age: number };
}>(), {
  patientInfo: () => ({ name: '张三', gender: '男', age: 35 }),
});

const emit = defineEmits<{
  close: [];
  sendPrescription: [prescription: PrescriptionRecord];
}>();

const medications = ref<MedicationInput[]>([
  { id: '1', name: '', usage: '' },
]);
const notes = ref('');

const handleAddMedication = () => {
  medications.value.push({ id: String(Date.now()), name: '', usage: '' });
};

const handleRemoveMedication = (id: string) => {
  if (medications.value.length > 1) {
    medications.value = medications.value.filter(m => m.id !== id);
  }
};

const handleSend = () => {
  const validMeds = medications.value.filter(m => m.name.trim() !== '');
  if (validMeds.length === 0) {
    alert('请至少添加一个药品');
    return;
  }

  const now = new Date();
  const dateStr = now.toISOString().split('T')[0];
  const rxNo = `Rx-${dateStr.replace(/-/g, '')}-${String(Math.floor(Math.random() * 1000)).padStart(3, '0')}`;

  const parsedMeds: Medication[] = validMeds.map((m) => {
    const parts = m.usage.split(/\s+/);
    return {
      name: m.name,
      specification: parts[0] || '',
      dosage: parts[0] || '',
      frequency: parts[1] || '',
      duration: parts[2] || '',
    };
  });

  const prescription: PrescriptionRecord = {
    id: String(Date.now()),
    prescriptionNo: rxNo,
    date: dateStr,
    patientName: props.patientInfo.name,
    gender: props.patientInfo.gender,
    age: props.patientInfo.age,
    doctorName: '张医生',
    department: '内科',
    diagnosis: '待填写',
    medications: parsedMeds,
    status: 'pending',
    notes: notes.value.trim() || undefined,
  };

  emit('sendPrescription', prescription);
  emit('close');
};
</script>

<template>
  <div class="rx-panel">
    <!-- Header -->
    <div class="rx-panel__header">
      <h2 class="rx-panel__title">
        <Pill :size="16" class="rx-panel__title-icon" />
        <span>开具处方</span>
      </h2>
      <button class="rx-panel__close" @click="emit('close')">
        <X :size="16" />
      </button>
    </div>

    <!-- Body -->
    <div class="rx-panel__body">
      <!-- Patient Info -->
      <div class="rx-panel__section">
        <label class="rx-panel__label">患者信息</label>
        <div class="rx-panel__patient">
          <span>{{ patientInfo.name }}</span>
          <span class="rx-panel__patient-sep">|</span>
          <span>{{ patientInfo.gender }}</span>
          <span class="rx-panel__patient-sep">|</span>
          <span>{{ patientInfo.age }}岁</span>
        </div>
      </div>

      <!-- Medications -->
      <div class="rx-panel__section">
        <label class="rx-panel__label">药品清单</label>
        <div class="rx-panel__med-list">
          <div
            v-for="med in medications"
            :key="med.id"
            class="rx-panel__med-item"
          >
            <div class="rx-panel__med-row">
              <input
                v-model="med.name"
                type="text"
                class="rx-panel__input rx-panel__input--flex"
                placeholder="药品名称"
              >
              <button
                v-if="medications.length > 1"
                class="rx-panel__del-btn"
                title="删除"
                @click="handleRemoveMedication(med.id)"
              >
                <Trash2 :size="16" />
              </button>
            </div>
            <input
              v-model="med.usage"
              type="text"
              class="rx-panel__input"
              placeholder="剂量用法（如：0.5g 每日3次 5天）"
            >
          </div>
        </div>

        <button class="rx-panel__add-btn" @click="handleAddMedication">
          <Plus :size="14" />
          <span>添加药品</span>
        </button>
      </div>

      <!-- Notes -->
      <div class="rx-panel__section">
        <label class="rx-panel__label">注意事项</label>
        <textarea
          v-model="notes"
          class="rx-panel__textarea"
          placeholder="请填写用药注意事项（选填）"
          rows="3"
        />
      </div>
    </div>

    <!-- Footer -->
    <div class="rx-panel__footer">
      <button class="rx-panel__btn rx-panel__btn--cancel" @click="emit('close')">
        取消
      </button>
      <button class="rx-panel__btn rx-panel__btn--send" @click="handleSend">
        发送
      </button>
    </div>
  </div>
</template>

<style scoped>
.rx-panel {
  width: 400px;
  max-height: 520px;
  background: #fff;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.rx-panel__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 10px;
  border-bottom: 1px solid #e5e7eb;
  flex-shrink: 0;
}

.rx-panel__title {
  font-size: 14px;
  font-weight: 500;
  color: #111827;
  display: flex;
  align-items: center;
  gap: 6px;
  margin: 0;
}

.rx-panel__title-icon {
  color: #0ABF77;
}

.rx-panel__close {
  width: 24px;
  height: 24px;
  display: flex;
  align-items: center;
  justify-content: center;
  border: none;
  background: transparent;
  border-radius: 4px;
  color: #6b7280;
  cursor: pointer;
}

.rx-panel__close:hover {
  background: #f3f4f6;
}

.rx-panel__body {
  flex: 1;
  overflow-y: auto;
  padding: 16px 10px;
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.rx-panel__section {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.rx-panel__label {
  font-size: 12px;
  color: #6b7280;
}

.rx-panel__patient {
  background: #f9fafb;
  border-radius: 8px;
  padding: 8px 12px;
  display: flex;
  align-items: center;
  gap: 10px;
  font-size: 13px;
  color: #374151;
}

.rx-panel__patient-sep {
  color: #d1d5db;
}

.rx-panel__med-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.rx-panel__med-item {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.rx-panel__med-row {
  display: flex;
  align-items: center;
  gap: 8px;
}

.rx-panel__input {
  width: 100%;
  padding: 6px 12px;
  border: 1px solid #d1d5db;
  border-radius: 6px;
  font-size: 13px;
  outline: none;
  color: #111827;
  background: #fff;
  box-sizing: border-box;
}

.rx-panel__input--flex {
  flex: 1;
}

.rx-panel__input:focus {
  border-color: #0ABF77;
}

.rx-panel__input::placeholder {
  color: #9ca3af;
}

.rx-panel__del-btn {
  padding: 6px;
  border: none;
  background: transparent;
  border-radius: 4px;
  color: #ef4444;
  cursor: pointer;
  flex-shrink: 0;
  display: flex;
  align-items: center;
}

.rx-panel__del-btn:hover {
  background: #fef2f2;
}

.rx-panel__add-btn {
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 4px;
  padding: 8px;
  border: 1px dashed #d1d5db;
  border-radius: 6px;
  background: transparent;
  font-size: 12px;
  color: #6b7280;
  cursor: pointer;
}

.rx-panel__add-btn:hover {
  border-color: #0ABF77;
  color: #0ABF77;
}

.rx-panel__textarea {
  width: 100%;
  padding: 8px 12px;
  border: 1px solid #d1d5db;
  border-radius: 6px;
  font-size: 13px;
  outline: none;
  color: #111827;
  resize: none;
  font-family: inherit;
  box-sizing: border-box;
}

.rx-panel__textarea:focus {
  border-color: #0ABF77;
}

.rx-panel__textarea::placeholder {
  color: #9ca3af;
}

.rx-panel__footer {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 8px;
  padding: 10px;
  border-top: 1px solid #e5e7eb;
  flex-shrink: 0;
}

.rx-panel__btn {
  padding: 6px 16px;
  border-radius: 6px;
  font-size: 13px;
  cursor: pointer;
  border: none;
}

.rx-panel__btn--cancel {
  background: #fff;
  border: 1px solid #d1d5db;
  color: #374151;
}

.rx-panel__btn--cancel:hover {
  background: #f9fafb;
}

.rx-panel__btn--send {
  background: #0ABF77;
  color: #fff;
}

.rx-panel__btn--send:hover {
  background: #09a868;
}
</style>
