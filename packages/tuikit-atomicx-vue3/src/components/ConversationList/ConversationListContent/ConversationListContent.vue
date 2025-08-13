<template>
  <div
    :class="[$style.conversationListContent, className]"
    :style="style"
  >
    <slot v-if="!error && !loading && !empty" />

    <component
      :is="PlaceholderLoadError.component"
      v-else-if="error"
      v-bind="PlaceholderLoadError.props"
    />

    <component
      :is="PlaceholderLoading.component"
      v-else-if="loading"
      v-bind="PlaceholderLoading.props"
    />

    <component
      :is="PlaceholderEmptyList.component"
      v-else-if="empty"
      v-bind="PlaceholderEmptyList.props"
    />
  </div>
</template>

<script lang="ts" setup>
import { PlaceHolderTypes } from '../../../types';
import PlaceHolder from '../ConversationPlaceHolder';
import type { ConversationListContentProps } from '../../../types';

const props = withDefaults(defineProps<ConversationListContentProps>(), {
  empty: false,
  loading: false,
  error: false,
  PlaceholderEmptyList: () => ({
    component: PlaceHolder,
    props: { type: PlaceHolderTypes.NO_CONVERSATIONS },
  }),
  PlaceholderLoading: () => ({
    component: PlaceHolder,
    props: { type: PlaceHolderTypes.LOADING },
  }),
  PlaceholderLoadError: () => ({
    component: PlaceHolder,
    props: { type: PlaceHolderTypes.WRONG },
  }),
});

</script>

<style lang="scss" module>
@import './ConversationListContent.scss';
</style>
