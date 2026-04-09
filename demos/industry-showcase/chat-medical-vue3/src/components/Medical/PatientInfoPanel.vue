<script setup lang="ts">
import { useC2CSettingState, Avatar } from '@tencentcloud/chat-uikit-vue3';
import {
  Activity,
  Phone,
  AlertCircle,
  Calendar,
  FileText,
  Clock,
} from 'lucide-vue-next';

const { nick, avatar } = useC2CSettingState();

const emit = defineEmits<{
  close: [];
}>();

// Mock patient data - in real app this comes from medical system API
const patient = {
  name: nick.value,
  avatar: avatar.value,
  gender: '女',
  age: 32,
  patientId: 'P2024-1086',
  status: '在诊',
  phone: '138-8888-8888',
  emergencyContact: '李明 (丈夫) · 139-9999-9999',
  bloodType: 'A型',
  visitCount: 12,
  allergies: ['青霉素', '海鲜'],
  currentVisit: {
    department: '心内科',
    registrationTime: '2024-04-02 09:30',
    doctor: '张医生',
  },
  lastUpdated: '2024-04-02 10:15',
};

const handleViewRecords = () => {
  console.log('[PatientInfoPanel] View full medical records', patient.avatar);
};
</script>

<template>
  <div class="patient-panel">
    <!-- Title bar -->
    <div class="patient-panel__title-bar">
      <span class="patient-panel__title-text">患者详情</span>
      <button class="patient-panel__close-btn" @click="emit('close')">
        ✕
      </button>
    </div>

    <!-- Header - Patient basic info -->
    <div class="patient-panel__header">
      <div class="patient-panel__header-inner">
        <Avatar :size="56" :src="patient.avatar" />
        <div class="patient-panel__info">
          <div class="patient-panel__name-row">
            <h2 class="patient-panel__name">
              {{ patient.name }}
            </h2>
            <span class="patient-panel__status-tag">{{ patient.status }}</span>
          </div>
          <div class="patient-panel__meta">
            <span>{{ patient.gender }}</span>
            <span class="patient-panel__dot" />
            <span>{{ patient.age }}岁</span>
            <span class="patient-panel__dot" />
            <span>ID: {{ patient.patientId }}</span>
          </div>
        </div>
      </div>
    </div>

    <!-- Contact info -->
    <div class="patient-panel__section">
      <div class="patient-panel__contact-item">
        <div class="patient-panel__contact-icon">
          <Phone :size="16" />
        </div>
        <div class="patient-panel__contact-text">
          <p class="patient-panel__contact-label">
            联系电话
          </p>
          <p class="patient-panel__contact-value">
            {{ patient.phone }}
          </p>
        </div>
      </div>
      <div class="patient-panel__contact-item">
        <div class="patient-panel__contact-icon">
          <AlertCircle :size="16" />
        </div>
        <div class="patient-panel__contact-text">
          <p class="patient-panel__contact-label">
            紧急联系人
          </p>
          <p class="patient-panel__contact-value">
            {{ patient.emergencyContact }}
          </p>
        </div>
      </div>
    </div>

    <!-- Medical info -->
    <div class="patient-panel__section">
      <h3 class="patient-panel__section-title">
        <Activity :size="16" class="patient-panel__section-icon" />
        医疗信息
      </h3>
      <div class="patient-panel__grid">
        <div class="patient-panel__grid-item">
          <p class="patient-panel__grid-label">
            血型
          </p>
          <p class="patient-panel__grid-value">
            {{ patient.bloodType }}
          </p>
        </div>
        <div class="patient-panel__grid-item">
          <p class="patient-panel__grid-label">
            就诊次数
          </p>
          <p class="patient-panel__grid-value">
            {{ patient.visitCount }}次
          </p>
        </div>
        <div class="patient-panel__grid-item patient-panel__grid-item--full">
          <p class="patient-panel__grid-label">
            过敏史
          </p>
          <div class="patient-panel__allergy-tags">
            <span
              v-for="allergy in patient.allergies"
              :key="allergy"
              class="patient-panel__allergy-tag"
            >
              {{ allergy }}
            </span>
          </div>
        </div>
      </div>
    </div>

    <!-- Current visit -->
    <div class="patient-panel__section patient-panel__section--muted">
      <h3 class="patient-panel__section-title">
        当前就诊
      </h3>
      <div class="patient-panel__visit-list">
        <div class="patient-panel__visit-row">
          <span class="patient-panel__visit-label">
            <Clock :size="14" />
            就诊科室
          </span>
          <span class="patient-panel__visit-value">{{ patient.currentVisit.department }}</span>
        </div>
        <div class="patient-panel__visit-row">
          <span class="patient-panel__visit-label">
            <Calendar :size="14" />
            挂号时间
          </span>
          <span class="patient-panel__visit-value">{{ patient.currentVisit.registrationTime }}</span>
        </div>
        <div class="patient-panel__visit-row">
          <span class="patient-panel__visit-label">主诊医生</span>
          <span class="patient-panel__visit-value">{{ patient.currentVisit.doctor }}</span>
        </div>
      </div>
    </div>

    <!-- Action buttons -->
    <div class="patient-panel__actions">
      <button class="patient-panel__btn patient-panel__btn--primary" @click="handleViewRecords">
        <FileText :size="16" />
        查看完整病历
      </button>
      <div class="patient-panel__btn-row">
        <button class="patient-panel__btn patient-panel__btn--outline">
          预约挂号
        </button>
        <button class="patient-panel__btn patient-panel__btn--outline">
          缴费记录
        </button>
      </div>
    </div>

    <!-- Footer timestamp -->
    <div class="patient-panel__footer">
      最后更新: {{ patient.lastUpdated }}
    </div>
  </div>
</template>

<style scoped>
.patient-panel {
  display: flex;
  flex-direction: column;
  height: 100%;
  background: #fff;
}

.patient-panel__title-bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 20px;
  border-bottom: 1px solid #f3f4f6;
  flex-shrink: 0;
}

.patient-panel__title-text {
  font-size: 15px;
  font-weight: 600;
  color: #111827;
}

.patient-panel__close-btn {
  width: 28px;
  height: 28px;
  display: flex;
  align-items: center;
  justify-content: center;
  border: none;
  background: transparent;
  border-radius: 6px;
  color: #6b7280;
  cursor: pointer;
  font-size: 14px;
}

.patient-panel__close-btn:hover {
  background: #f3f4f6;
}

.patient-panel__header {
  padding: 20px;
}

.patient-panel__header-inner {
  display: flex;
  align-items: flex-start;
  gap: 14px;
}

.patient-panel__avatar {
  width: 56px;
  height: 56px;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.15);
  border: 2px solid rgba(255, 255, 255, 0.2);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 20px;
  font-weight: 500;
  flex-shrink: 0;
}

.patient-panel__info {
  flex: 1;
  min-width: 0;
}

.patient-panel__name-row {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 4px;
}

.patient-panel__name {
  font-size: 18px;
  font-weight: 600;
  margin: 0;
}

.patient-panel__status-tag {
  padding: 2px 8px;
  background: rgba(255, 255, 255, 0.2);
  border-radius: 4px;
  font-size: 12px;
  font-weight: 500;
}

.patient-panel__meta {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 13px;
  opacity: 0.9;
}

.patient-panel__dot {
  width: 4px;
  height: 4px;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.4);
}

.patient-panel__section {
  padding: 16px 20px;
  border-bottom: 1px solid #f3f4f6;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.patient-panel__section--muted {
  background: rgba(0, 0, 0, 0.015);
}

.patient-panel__section-title {
  font-size: 13px;
  font-weight: 600;
  color: #111827;
  margin: 0;
  display: flex;
  align-items: center;
  gap: 6px;
}

.patient-panel__section-icon {
  color: #0ABF77;
}

.patient-panel__contact-item {
  display: flex;
  align-items: center;
  gap: 12px;
}

.patient-panel__contact-icon {
  width: 32px;
  height: 32px;
  border-radius: 8px;
  background: #f3f4f6;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #6b7280;
  flex-shrink: 0;
}

.patient-panel__contact-text {
  flex: 1;
}

.patient-panel__contact-label {
  font-size: 11px;
  color: #9ca3af;
  margin: 0 0 2px;
}

.patient-panel__contact-value {
  font-size: 13px;
  font-weight: 500;
  color: #111827;
  margin: 0;
}

.patient-panel__grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 14px;
}

.patient-panel__grid-item {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.patient-panel__grid-item--full {
  grid-column: 1 / -1;
}

.patient-panel__grid-label {
  font-size: 11px;
  color: #9ca3af;
  margin: 0;
}

.patient-panel__grid-value {
  font-size: 15px;
  font-weight: 600;
  color: #111827;
  margin: 0;
}

.patient-panel__allergy-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  margin-top: 4px;
}

.patient-panel__allergy-tag {
  padding: 4px 10px;
  background: rgba(239, 68, 68, 0.08);
  color: #dc2626;
  font-size: 12px;
  font-weight: 500;
  border-radius: 6px;
  border: 1px solid rgba(239, 68, 68, 0.15);
}

.patient-panel__visit-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.patient-panel__visit-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  font-size: 13px;
}

.patient-panel__visit-label {
  color: #9ca3af;
  display: flex;
  align-items: center;
  gap: 6px;
}

.patient-panel__visit-value {
  font-weight: 500;
  color: #111827;
}

.patient-panel__actions {
  padding: 16px 20px;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.patient-panel__btn {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  padding: 10px;
  border-radius: 8px;
  font-size: 13px;
  font-weight: 500;
  cursor: pointer;
  border: none;
  transition: all 0.15s ease;
}

.patient-panel__btn--primary {
  background: #0ABF77;
  color: #fff;
  box-shadow: 0 1px 3px rgba(10, 191, 119, 0.2);
}

.patient-panel__btn--primary:hover {
  background: #09a868;
}

.patient-panel__btn-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 8px;
}

.patient-panel__btn--outline {
  background: #fff;
  color: #374151;
  border: 1px solid rgba(10, 191, 119, 0.2);
}

.patient-panel__btn--outline:hover {
  background: #f9fafb;
}

.patient-panel__footer {
  padding: 10px 20px;
  background: rgba(0, 0, 0, 0.015);
  border-top: 1px solid #f3f4f6;
  font-size: 11px;
  color: #9ca3af;
  text-align: center;
}
</style>
