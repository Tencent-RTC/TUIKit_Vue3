<!-- eslint-disable import/extensions -->
<template>
  <div :class="$style.SearchGroup" @click="handleClick">
    <div :class="$style['SearchGroup__avatar']">
      <Avatar :src="groupInfo.avatar" :alt="groupInfo?.name || groupInfo?.groupID" />
    </div>
    <div :class="$style['SearchGroup__info']">
      <div
        :class="$style['SearchGroup__name']"
        v-html="highlightText(groupInfo?.name || groupInfo?.groupID, keyword, $style['SearchGroup__highlight'])"
      ></div>
      <div
        v-if="groupInfo"
        :class="$style['SearchGroup__intro']"
        v-html="highlightText(groupInfo.introduction, keyword, $style['SearchGroup__highlight'])"
      ></div>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { computed, defineProps } from 'vue';
import { SearchType } from '../../../../../types/engine';
import type { ResultItemProps } from '../../../../../types/search';
import { Avatar } from '../../../../Avatar';
import { highlightText } from '../utils';

const props = defineProps<ResultItemProps<SearchType.GROUP>>();

const groupInfo = computed(() => props.data.groupInfo);

const handleClick = () => {
  props.onClick?.(props.data, SearchType.GROUP);
};
</script>

<style lang="scss" module>
@import './Group.scss';
</style>
