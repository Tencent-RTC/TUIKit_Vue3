<template>
  <FloatLayout v-if="mode === 'float'" :config="config" :filter-fn="filterFn" :sort-fn="sortFn">
    <template #streamViewUI="slotProps">
      <slot name="streamViewUI" v-bind="slotProps" />
    </template>
  </FloatLayout>
  <GridLayout v-if="mode === 'grid'" :config="config" :filter-fn="filterFn" :sort-fn="sortFn">
    <template #streamViewUI="slotProps">
      <slot name="streamViewUI" v-bind="slotProps" />
    </template>
  </GridLayout>
  <CustomLayout v-if="mode === 'custom'" :config="config" :filter-fn="filterFn" :sort-fn="sortFn">
    <template #streamViewUI="slotProps">
      <slot name="streamViewUI" v-bind="slotProps" />
    </template>
  </CustomLayout>
  <MeetingLayout v-if="mode === 'meeting'" :config="config" :filter-fn="filterFn" :sort-fn="sortFn">
    <template #streamViewUI="slotProps">
      <slot name="streamViewUI" v-bind="slotProps" />
    </template>
  </MeetingLayout>
  <MixLayout v-if="mixUserInfo">
    <template #streamViewUI="slotProps">
      <slot name="streamViewUI" v-bind="slotProps" />
    </template>
  </MixLayout>
</template>

<script lang="ts" setup>
import { defineProps, computed } from 'vue';
import { UserInfo } from '../../types';
import FloatLayout from './Layout/FloatLayout.vue';
import GridLayout from './Layout/GridLayout.vue';
import CustomLayout from './Layout/CustomLayout.vue';
import MixLayout from './Layout/MixLayout.vue';
import MeetingLayout from './Layout/MeetingLayout.vue';
import { innerUserStore } from '../../states/UserState/store';

const mixUserInfo = computed(() => innerUserStore.mixUserInfo);

interface Props {
  mode: string;
  config?: string;
  filterFn?: (userInfo: UserInfo, index: number) => boolean;
  sortFn?: (userInfoA: UserInfo, userInfoB: UserInfo) => number;
}
withDefaults(defineProps<Props>(), {
  mode: 'grid',
  config: '',
  filterFn: () => true,
  sortFn: () => 0
});
</script>

<style lang="scss" scoped></style>
