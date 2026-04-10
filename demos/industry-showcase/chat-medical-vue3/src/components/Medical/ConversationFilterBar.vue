<script setup lang="ts">
import { ref } from 'vue';
import { useUIKit } from '@tencentcloud/chat-uikit-vue3';

export type FilterType = 'all' | 'pending' | 'active' | 'done';

const { t } = useUIKit();

const emit = defineEmits<{
  change: [filter: FilterType];
}>();

const activeFilter = ref<FilterType>('all');

const filterIds: FilterType[] = ['all', 'pending', 'active', 'done'];

const filterLabelKey: Record<FilterType, string> = {
  all: 'medical.filter.all',
  pending: 'medical.filter.pending',
  active: 'medical.filter.active',
  done: 'medical.filter.done',
};

const handleChange = (id: FilterType) => {
  activeFilter.value = id;
  emit('change', id);
};
</script>

<template>
  <div class="filter-bar">
    <button
      v-for="id in filterIds"
      :key="id"
      class="filter-bar__item"
      :class="{ 'filter-bar__item--active': activeFilter === id }"
      @click="handleChange(id)"
    >
      {{ t(filterLabelKey[id]) }}
    </button>
  </div>
</template>

<style scoped>
.filter-bar {
  display: flex;
  gap: 4px;
  padding: 8px 10px;
  border-bottom: 1px solid var(--stroke-color-primary, #e5e7eb);
  flex-shrink: 0;
}

.filter-bar__item {
  padding: 3px 10px;
  border: none;
  border-radius: 6px;
  font-size: 12px;
  font-weight: 500;
  cursor: pointer;
  background: transparent;
  color: var(--text-color-secondary, #6b7280);
  transition: all 0.15s ease;
  white-space: nowrap;
}

.filter-bar__item:hover {
  background: var(--list-color-hover, #f9fafb);
}

.filter-bar__item--active {
  background: rgba(10, 191, 119, 0.1);
  color: #0ABF77;
}
</style>
