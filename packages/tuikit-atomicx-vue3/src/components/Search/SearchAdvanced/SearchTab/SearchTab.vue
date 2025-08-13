<!-- eslint-disable import/extensions -->
<template>
  <div :class="$style.SearchTab">
    <button
      v-for="tab in tabs"
      :key="tab.key"
      :class="[
        $style['SearchTab__item'],
        {
          [$style['SearchTab__item--active']]: activeTab === tab.key,
        },
      ]"
      @click="handleTabClick(tab.key)"
    >
      {{ tab.label }}
    </button>
  </div>
</template>

<script lang="ts" setup>
import { computed, defineProps, defineEmits } from 'vue';
import { SearchType } from '../../../../types/engine';
import type { SearchTabType } from '../../../../types/search';
import { useUIKit } from '@tencentcloud/uikit-base-component-vue3';

interface SearchTabItem {
  key: SearchTabType;
  label: string;
}

interface Props {
  activeTab: SearchTabType;
}

const props = defineProps<Props>();
const emit = defineEmits<{
  'tab-change': [tab: SearchTabType];
}>();

const { t } = useUIKit();

const tabs = computed<SearchTabItem[]>(() => [
  { key: 'all', label: t('Search.type.all') },
  { key: SearchType.MESSAGE, label: t('Search.type.messages') },
  { key: SearchType.USER, label: t('Search.type.users') },
  { key: SearchType.GROUP, label: t('Search.type.groups') },
]);

const handleTabClick = (tabKey: SearchTabType) => {
  emit('tab-change', tabKey);
};
</script>

<style lang="scss" module>
@import './SearchTab.scss';
</style>
