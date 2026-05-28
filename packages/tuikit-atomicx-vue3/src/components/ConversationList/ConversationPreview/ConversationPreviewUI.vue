<template>
  <div>
    <div
      ref="conversationPreviewRef"
      :class="[$style.conversationPreview, className,
               isH5 && [$style['conversationPreview--mobile']],
               (isSelected || conversation?.conversationID === activeConversation?.conversationID)
                 && [$style['conversationPreview--active']],
               (conversation?.receiveOption === 'receive' && (conversation?.unreadCount > 0 || conversation?.conversationMarkList?.includes(2)))
                 && [$style['conversationPreview--unread']],
               conversation?.isPinned && [$style['conversationPreview--pin']],
               conversation?.receiveOption !== 'receive' && [$style['conversationPreview--mute']],
      ]"
      :style="style"
      v-bind="longPressEvents"
      @click="handleClick"
    >
      <slot>
        <div :class="$style['conversationPreview__avatar']">
          <component
            :is="Avatar"
            :src="conversation?.avatarURL"
            size="sm"
            :unreadCount="avatarUnreadCount"
            :isDotUnreadCount="avatarIsDotUnread"
          />
        </div>

        <div :class="$style['conversationPreview__content']">
          <div :class="$style['conversationPreview__header']">
            <component
              :is="Title"
              :conversation="conversation"
            />
            <component
              :is="LastMessageTimestamp"
              v-if="!isActionMenuActive"
              :conversation="conversation"
            />
          </div>
          <div :class="$style['conversationPreview__footer']">
            <component
              :is="LastMessageAbstract"
              :conversation="conversation"
            />
            <div
              v-if="conversation?.receiveOption !== 'receive' && !isActionMenuActive"
              :class="$style['conversationPreview__mute-icon']"
            >
              <IconMute />
            </div>
          </div>
        </div>

        <div
          v-if="enableActions && isActionMenuActive && !isH5"
          :class="$style['conversationPreview__actions-wrapper']"
        >
          <component
            :is="ConversationActions"
            :conversation="conversation"
            v-bind="actionsConfig"
            @close="handleCloseActionsModal"
            @dropdown-visible-change="handleDropdownVisibleChange"
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
import { ref, computed, watch, inject } from 'vue';
import { ConversationMarkType, ReceiveMessageOption } from '@atomicxcore/core';
import { IconMute } from '@tencentcloud/uikit-base-component-vue3';
import { useChatContext } from '../../../chat-store';
import { useLongPress, useMouseHover } from '../../../hooks';
import { isH5 } from '../../../utils';
import { Avatar as DefaultAvatar } from '../../Avatar';
import { ConversationActions as DefaultConversationActions } from '../ConversationActions';
import { default as DefaultLastMessageAbstract } from './ConversationPreviewAbstract.vue';
import { default as DefaultLastMessageTimestamp } from './ConversationPreviewTimestamp.vue';
import { default as DefaultTitle } from './ConversationPreviewTitle.vue';
import { default as DefaultUnread } from './ConversationPreviewUnread.vue';
import type {
  ConversationPreviewUIProps,
} from '../../../types';
import type { ConversationInfo } from '@atomicxcore/core';

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
  selectConversation: [conversation: ConversationInfo];
}>();

const channel = inject('channel', 'default') as string;
const { activeConversation } = useChatContext(channel);

const avatarUnreadCount = computed(() => {
  const conv = props.conversation as unknown as ConversationInfo;
  if (!conv) {
    return 0;
  }
  const hasUnreadMark = conv.conversationMarkList?.includes(ConversationMarkType.Unread);
  const isMuted = conv.receiveOption !== ReceiveMessageOption.Receive;
  if (isMuted) {
    return (conv.unreadCount > 0 || hasUnreadMark) ? 1 : 0;
  }
  if (conv.unreadCount > 0) {
    return conv.unreadCount;
  }
  if (hasUnreadMark) {
    return 1;
  }
  return 0;
});

const avatarIsDotUnread = computed(() => {
  const conv = props.conversation as unknown as ConversationInfo;
  const isMuted = conv?.receiveOption !== ReceiveMessageOption.Receive;
  return !!(isMuted && avatarUnreadCount.value > 0);
});

const conversationPreviewRef = ref<HTMLElement>();
const isActionMenuActive = ref(false);
const isDropdownOpen = ref(false);

const { isHovered } = useMouseHover(conversationPreviewRef);
const { getEventHandlers } = useLongPress(() => {
  if (isH5) {
    isActionMenuActive.value = true;
  }
});

const longPressEvents = getEventHandlers();

watch(isHovered, (newValue) => {
  if (!isH5) {
    // Don't hide when dropdown is open
    if (!newValue && isDropdownOpen.value) {
      return;
    }
    isActionMenuActive.value = newValue;
  }
});

const handleClick = () => {
  emit('selectConversation', props.conversation as unknown as ConversationInfo);
};

const handleCloseActionsModal = () => {
  isActionMenuActive.value = false;
};

const handleDropdownVisibleChange = (visible: boolean) => {
  isDropdownOpen.value = visible;
  // When dropdown closes and mouse is not hovering, hide actions
  if (!visible && !isHovered.value) {
    isActionMenuActive.value = false;
  }
};
</script>

<style lang="scss" module>
@use './ConversationPreview.scss';
</style>
