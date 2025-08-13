<template>
  <IconSearchMore
    v-if="visible"
    :class="[$style['conversation-create-button'], className]"
    size="24px"
    @click="handleClick"
  />
</template>

<script lang="ts" setup>
import { IconSearchMore } from '@tencentcloud/uikit-base-component-vue3';
import type { ConversationCreateButtonProps } from '../../../../types';

const props = withDefaults(defineProps<ConversationCreateButtonProps>(), {
  visible: true,
  height: 24,
  width: 24,
});

const emit = defineEmits<{
  click: [event: Event];
}>();

const handleClick = (event: Event) => {
  emit('click', event);
  props.onClick?.(event);
};
</script>

<style lang="scss" module>
@import './ConversationCreateButton.scss';
</style>
