<template>
  <div>
    <div
      ref="conversationPreviewRef"
      :class="[$style.conversationPreview, className,
               isH5 && [$style['conversationPreview--mobile']],
               (isSelected || conversation?.conversationID === activeConversation?.conversationID)
                 && [$style['conversationPreview--active']],
               (!conversation?.isMuted && (conversation?.unreadCount > 0 || conversation?.markList?.includes(TUIChatEngine.TYPES.CONV_MARK_TYPE_UNREAD)))
                 && [$style['conversationPreview--unread']],
               conversation?.isPinned && [$style['conversationPreview--pin']],
               conversation?.isMuted && [$style['conversationPreview--mute']],
      ]"
      :style="style"
      v-bind="longPressEvents"
      @click="handleClick"
    >
      <slot>
        <div :class="$style['conversationPreview__avatar']">
          <component
            :is="Avatar"
            :src="conversation?.getAvatar?.()"
            :unreadCount="conversation?.isMuted && conversation?.markList?.includes(TUIChatEngine.TYPES.CONV_MARK_TYPE_UNREAD) ? 1 : undefined"
            :isDotUnreadCount="conversation?.isMuted && conversation?.markList?.includes(TUIChatEngine.TYPES.CONV_MARK_TYPE_UNREAD)"
          />
        </div>

        <div :class="$style['conversationPreview__content']">
          <component
            :is="Title"
            :conversation="conversation"
          />
          <component
            :is="LastMessageAbstract"
            :conversation="conversation"
          />
        </div>

        <div :class="$style['conversationPreview__external']">
          <component
            :is="Unread"
            :conversation="conversation"
          />
          <component
            :is="ConversationActions"
            v-if="enableActions && isActionMenuActive && !isH5"
            :conversation="conversation"
            v-bind="actionsConfig"
            @close="handleCloseActionsModal"
          />
          <component
            :is="LastMessageTimestamp"
            v-else
            :conversation="conversation"
          />
        </div>
      </slot>
    </div>

    <component
      :is="ConversationActions"
      v-if="isH5 && enableActions && isActionMenuActive"
      :conversation="conversation"
      v-bind="actionsConfig"
      @close="handleCloseActionsModal"
    />
  </div>
</template>

<script lang="ts" setup>
import { ref, watch } from 'vue';
import TUIChatEngine from '@tencentcloud/chat-uikit-engine';
import { useLongPress, useMouseHover } from '../../../hooks';
import { useConversationListState } from '../../../states/ConversationListState';
import { isH5 } from '../../../utils';
import { Avatar as DefaultAvatar } from '../../Avatar';
import { ConversationActions as DefaultConversationActions } from '../ConversationActions';
import { default as DefaultLastMessageAbstract } from './ConversationPreviewAbstract.vue';
import { default as DefaultLastMessageTimestamp } from './ConversationPreviewTimestamp.vue';
import { default as DefaultTitle } from './ConversationPreviewTitle.vue';
import { default as DefaultUnread } from './ConversationPreviewUnread.vue';
import type {
  ConversationModel,
  ConversationPreviewUIProps,
} from '../../../types';

const props = withDefaults(defineProps<ConversationPreviewUIProps>(), {
  isSelected: false,
  enableActions: true,
  Avatar: () => DefaultAvatar,
  ConversationActions: () => DefaultConversationActions,
  Title: () => DefaultTitle,
  LastMessageAbstract: () => DefaultLastMessageAbstract,
  Unread: () => DefaultUnread,
  LastMessageTimestamp: () => DefaultLastMessageTimestamp,
});

const emit = defineEmits<{
  selectConversation: [conversation: ConversationModel];
}>();

const { activeConversation, setActiveConversation } = useConversationListState();

const conversationPreviewRef = ref<HTMLElement>();
const isActionMenuActive = ref(false);

const { isHovered } = useMouseHover(conversationPreviewRef);
const { getEventHandlers } = useLongPress(() => {
  if (isH5) {
    isActionMenuActive.value = true;
  }
});

const longPressEvents = getEventHandlers();

watch(isHovered, (newValue) => {
  if (!isH5) {
    isActionMenuActive.value = newValue;
  }
});

const handleClick = () => {
  emit('selectConversation', props.conversation);
  setActiveConversation(props.conversation.conversationID);
};

const handleCloseActionsModal = () => {
  isActionMenuActive.value = false;
};
</script>

<style lang="scss" module>
@use './ConversationPreview.scss';
</style>
