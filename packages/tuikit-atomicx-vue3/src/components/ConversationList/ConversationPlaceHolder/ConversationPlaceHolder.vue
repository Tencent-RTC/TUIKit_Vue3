<template>
  <div :class="[$style.conversationPlaceHolder, className]">
    <div :class="$style.conversationPlaceHolder__icon">
      <IconLiveLoading
        v-if="type === PlaceHolderTypes.LOADING"
        :class="$style.conversationPlaceHolder__loading"
      />
      <div
        v-else-if="type === PlaceHolderTypes.NO_CONVERSATIONS"
        :class="$style.conversationPlaceHolder__empty"
      >
        <img
          :class="$style.conversationPlaceHolder__emptyIcon"
          src="./images/cry.png"
          alt="empty"
        >
      </div>
      <div
        v-else-if="type === PlaceHolderTypes.WRONG"
        :class="$style.conversationPlaceHolder__error"
      >
        <img
          :class="$style.conversationPlaceHolder__errorIcon"
          src="./images/effort.png"
          alt="error"
        >
      </div>
    </div>

    <div
      v-if="placeholderText"
      :class="$style.conversationPlaceHolder__label"
    >
      {{ searchString ? `${placeholderText} '${searchString}'` : placeholderText }}
    </div>
    <TUIButton
      v-if="type === PlaceHolderTypes.WRONG && retry"
      type="primary"
      @click="retry"
    >
      {{ t('TUIConversation.Retry') }}
    </TUIButton>
  </div>
</template>

<script setup lang="ts">
import { computed, withDefaults, defineProps } from 'vue';
import { TUIButton, useUIKit, IconLiveLoading } from '@tencentcloud/uikit-base-component-vue3';
import { PlaceHolderTypes } from '../../../types/conversation';
import type { ConversationPlaceHolderProps } from '../../../types/conversation';

const props = withDefaults(defineProps<ConversationPlaceHolderProps>(), {
  className: '',
  type: PlaceHolderTypes.NO_CONVERSATIONS,
  iconSize: 42,
  searchString: '',
  retry: undefined,
});

const { t } = useUIKit();

const placeholderText = computed(() => {
  switch (props.type) {
    case PlaceHolderTypes.LOADING:
      return t('TUIConversation.Loading');
    case PlaceHolderTypes.NO_CONVERSATIONS:
      return t('TUIConversation.No conversations');
    case PlaceHolderTypes.WRONG:
      return t('TUIConversation.Load failed');
    default:
      return '';
  }
});
</script>

<style lang="scss" module>
@use './ConversationPlaceHolder.scss';
</style>
