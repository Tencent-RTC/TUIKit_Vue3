<template>
  <div
    :class="[$style.conversationListHeader, className]"
    :style="style"
  >
    <div
      v-if="left || $slots.left"
      :class="$style.conversationListHeader__left"
    >
      <component
        :is="left"
        v-if="left"
      />
      <slot
        v-else
        name="left"
      />
    </div>

    <slot />

    <div
      v-if="right || $slots.right"
      :class="$style.conversationListHeader__right"
    >
      <component
        :is="right"
        v-if="right"
      />
      <slot
        v-else
        name="right"
      />
    </div>
  </div>
</template>

<script lang="ts" setup>
import type { ConversationListHeaderProps } from '../../../types';

const props = withDefaults(defineProps<ConversationListHeaderProps>(), {
  left: undefined,
  right: undefined,
  className: undefined,
  style: () => ({}),
});
</script>

<style lang="scss" module>
@use './ConversationListHeader.scss';
</style>
