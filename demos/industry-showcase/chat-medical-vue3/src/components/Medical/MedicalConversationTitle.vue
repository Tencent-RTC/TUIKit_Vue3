<script setup lang="ts">
import { computed } from 'vue';
import type { ConversationModel } from '@tencentcloud/chat-uikit-vue3';

const props = defineProps<{
  conversation: ConversationModel;
}>();

const title = computed(() => props.conversation?.getShowName?.() || '');

// Mock patient data from conversationID hash (demo only)
const mockData = computed(() => {
  const id = props.conversation?.conversationID || '';
  let hash = 0;
  for (let i = 0; i < id.length; i++) {
    hash = ((hash << 5) - hash) + id.charCodeAt(i);
  }
  const absHash = Math.abs(hash);
  const age = 20 + (absHash % 50);
  const genders = ['男', '女'];
  const gender = genders[absHash % 2];
  const statuses = ['待问诊', '问诊中', '已结束'] as const;
  const status = statuses[absHash % 3];
  return { age, gender, status };
});

const statusClass = computed(() => {
  switch (mockData.value.status) {
    case '待问诊': return 'medical-title__status--pending';
    case '问诊中': return 'medical-title__status--active';
    case '已结束': return 'medical-title__status--done';
    default: return '';
  }
});
</script>

<template>
  <div class="medical-title">
    <span class="medical-title__name">{{ title }}</span>
    <span class="medical-title__badge">{{ mockData.gender }} {{ mockData.age }}岁</span>
    <span class="medical-title__status" :class="statusClass">{{ mockData.status }}</span>
  </div>
</template>

<style scoped>
.medical-title {
  display: flex;
  align-items: center;
  gap: 4px;
  min-width: 0;
  flex: 1;
}

.medical-title__name {
  font-size: 14px;
  font-weight: 500;
  color: var(--text-color-primary);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.medical-title__badge {
  flex-shrink: 0;
  padding: 1px 5px;
  font-size: 10px;
  font-weight: 500;
  border-radius: 4px;
  background: rgba(10, 191, 119, 0.1);
  color: #0ABF77;
  white-space: nowrap;
}

.medical-title__status {
  flex-shrink: 0;
  padding: 1px 5px;
  font-size: 10px;
  font-weight: 500;
  border-radius: 4px;
  white-space: nowrap;
}

.medical-title__status--pending {
  background: #fef3c7;
  color: #a16207;
}

.medical-title__status--active {
  background: #dbeafe;
  color: #1d4ed8;
}

.medical-title__status--done {
  background: #f3f4f6;
  color: #6b7280;
}
</style>
