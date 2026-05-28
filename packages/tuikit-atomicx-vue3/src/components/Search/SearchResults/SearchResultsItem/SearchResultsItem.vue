<template>
  <div :class="[$style.SearchResultsItem, className]">
    <component
      v-if="type === SearchType.MESSAGE"
      :is="Conversation"
      :data="data"
      :keyword="keyword"
      @click="onClick"
    />
    <component
      v-else-if="type === SearchType.USER"
      :is="User"
      :data="data"
      :keyword="keyword"
      @click="onClick"
    />
    <component
      v-else-if="type === SearchType.GROUP"
      :is="Group"
      :data="data"
      :keyword="keyword"
      @click="onClick"
    />
    <component
      v-else-if="type === SearchType.CHAT_MESSAGE"
      :is="Message"
      :data="data"
      :keyword="keyword"
      @click="onClick"
    />
  </div>
</template>

<script lang="ts" setup>
import { SearchType } from '../../../../types/search';
import { Conversation } from './Conversation';
import { User } from './User';
import { Group } from './Group';
import { Message } from './Message';

interface ISearchResultsItemProps {
  keyword: string;
  onClick?: () => void;
  data: any;
  type: SearchType;
  className?: string;
}

const props = withDefaults(defineProps<ISearchResultsItemProps>(), {
  className: '',
});
</script>

<style lang="scss" module>
@use './SearchResultsItem.scss';
</style>
