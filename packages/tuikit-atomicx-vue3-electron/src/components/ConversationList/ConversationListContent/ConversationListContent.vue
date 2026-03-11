<template>
  <div
    :class="[$style.conversationListContent, className]"
    :style="style"
  >
    <slot v-if="!error && !loading && !empty" />

    <component
      :is="PlaceholderLoadError"
      v-else-if="error"
    />

    <component
      :is="PlaceholderLoading"
      v-else-if="loading"
    />

    <component
      :is="PlaceholderEmptyList"
      v-else-if="empty"
    />
  </div>
</template>

<script lang="ts" setup>
import { h } from 'vue';
import { PlaceHolderTypes } from '../../../types';
import PlaceHolder from '../ConversationPlaceHolder';
import type { ConversationListContentProps } from '../../../types';

const props = withDefaults(defineProps<ConversationListContentProps>(), {
  empty: false,
  loading: false,
  error: false,
  PlaceholderEmptyList: () => (h(PlaceHolder, {
    type: PlaceHolderTypes.NO_CONVERSATIONS
  })),
  PlaceholderLoading: () => (h(PlaceHolder, {
    type: PlaceHolderTypes.LOADING
  })),
  PlaceholderLoadError: () => (h(PlaceHolder, {
    type: PlaceHolderTypes.WRONG
  }))
});

</script>

<style lang="scss" module>
@use './ConversationListContent.scss';
</style>
