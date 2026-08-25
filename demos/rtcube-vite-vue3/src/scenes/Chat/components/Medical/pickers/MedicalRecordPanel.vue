<script setup lang="ts">
import { ref } from 'vue';
import { FileText, Send } from 'lucide-vue-next';

export interface VisitRecord {
  id: string;
  date: string;
  department: string;
  chiefComplaint: string;
  diagnosis: string;
  status: 'completed' | 'in-progress';
  patientName: string;
  gender: string;
  age: number;
}

const emit = defineEmits<{
  close: [];
  sendRecord: [record: VisitRecord];
}>();

const mockRecords: VisitRecord[] = [
  {
    id: '1',
    date: '2026-03-28',
    department: '内科',
    chiefComplaint: '头痛、发热两天',
    diagnosis: '上呼吸道感染',
    status: 'completed',
    patientName: '张三',
    gender: '男',
    age: 35,
  },
  {
    id: '2',
    date: '2026-03-15',
    department: '心内科',
    chiefComplaint: '胸闷气短一周，活动后加重',
    diagnosis: '高血压病 2级',
    status: 'completed',
    patientName: '李四',
    gender: '女',
    age: 58,
  },
  {
    id: '3',
    date: '2026-03-10',
    department: '骨科',
    chiefComplaint: '左膝关节疼痛三天，伴活动受限',
    diagnosis: '膝关节损伤',
    status: 'in-progress',
    patientName: '王五',
    gender: '男',
    age: 42,
  },
];

const selectedId = ref<string | null>(null);
const hoveredId = ref<string | null>(null);

const handleSendRecord = (record: VisitRecord) => {
  selectedId.value = record.id;
  emit('sendRecord', record);
};
</script>

<template>
  <div class="record-panel">
    <!-- Header -->
    <div class="record-panel__header">
      <div class="record-panel__title">
        <FileText :size="16" class="record-panel__title-icon" />
        <span>就诊记录</span>
      </div>
      <button class="record-panel__close" @click="emit('close')">
        ✕
      </button>
    </div>

    <!-- Body -->
    <div class="record-panel__body">
      <div
        v-for="record in mockRecords"
        :key="record.id"
        class="record-item"
        :class="{
          'record-item--hovered': hoveredId === record.id,
          'record-item--selected': selectedId === record.id,
        }"
        @mouseenter="hoveredId = record.id"
        @mouseleave="hoveredId = null"
        @click="handleSendRecord(record)"
      >
        <div class="record-item__inner">
          <!-- Status Dot -->
          <div class="record-item__dot-wrapper">
            <div
              class="record-item__dot"
              :class="record.status === 'completed' ? 'record-item__dot--completed' : 'record-item__dot--progress'"
            />
          </div>

          <!-- Content -->
          <div class="record-item__content">
            <div class="record-item__meta">
              <span class="record-item__date">{{ record.date }}</span>
              <span class="record-item__dept">{{ record.department }}</span>
            </div>
            <div class="record-item__complaint">
              {{ record.chiefComplaint }}
            </div>
            <div class="record-item__diagnosis">
              {{ record.diagnosis }}
            </div>
          </div>

          <!-- Send Button -->
          <button
            class="record-item__send"
            :class="{ 'record-item__send--active': hoveredId === record.id }"
            @click.stop="handleSendRecord(record)"
          >
            <span>发送</span>
            <Send :size="12" />
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.record-panel {
  width: 360px;
  max-height: 400px;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.record-panel__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 10px 6px;
  border-bottom: 1px solid #e5e7eb;
  flex-shrink: 0;
}

.record-panel__title {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 13px;
  font-weight: 500;
  color: #111827;
}

.record-panel__title-icon {
  color: #0ABF77;
}

.record-panel__close {
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
  font-size: 12px;
}

.record-panel__close:hover {
  background: #f3f4f6;
}

.record-panel__body {
  flex: 1;
  overflow-y: auto;
  padding: 10px 0;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.record-item {
  position: relative;
  background: #fff;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  padding: 10px;
  cursor: pointer;
  transition: all 0.15s ease;
}

.record-item--hovered {
  background: #f9fafb;
}

.record-item--selected {
  border-left: 4px solid #0ABF77;
  padding-left: 7px;
}

.record-item__inner {
  display: flex;
  align-items: flex-start;
  gap: 10px;
}

.record-item__dot-wrapper {
  flex-shrink: 0;
  padding-top: 4px;
}

.record-item__dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
}

.record-item__dot--completed {
  background: #0ABF77;
}

.record-item__dot--progress {
  background: #FBBF24;
}

.record-item__content {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 3px;
}

.record-item__meta {
  display: flex;
  align-items: center;
  gap: 6px;
}

.record-item__date {
  font-size: 13px;
  color: #111827;
}

.record-item__dept {
  padding: 1px 6px;
  background: #f3f4f6;
  color: #374151;
  border-radius: 4px;
  font-size: 12px;
}

.record-item__complaint {
  font-size: 12px;
  color: #6b7280;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.record-item__diagnosis {
  font-size: 12px;
  color: #0ABF77;
}

.record-item__send {
  flex-shrink: 0;
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 4px 8px;
  border: none;
  border-radius: 4px;
  font-size: 12px;
  cursor: pointer;
  transition: all 0.15s ease;
  background: #f3f4f6;
  color: #6b7280;
}

.record-item__send--active {
  background: #0ABF77;
  color: #fff;
}
</style>
