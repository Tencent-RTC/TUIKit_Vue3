<template>
  <div
    :class="[$style.conversationActions, {
      [$style.conversationActions__h5]: isH5,
    }, className]"
    :style="style"
    @click="handleMaskClick"
  >
    <div
      v-if="isH5"
      :class="$style.conversationActions__h5__container"
      @click.stop
    >
      <div
        v-for="(action, key) in enabledActions"
        :key="key"
        :class="[$style.conversationActions__item, {
          [$style['conversationActions__item--delete']]: key === 'delete'
        }]"
        @click="(e) => onClickMenuItem(e, key)"
      >
        {{ action.label }}
      </div>
    </div>
    <TUIDropdown
      v-else
      trigger="click"
      :teleported="true"
      placement="bottom-end"
      @visible-change="handleDropdownVisibleChange"
    >
      <div
        :class="$style['conversationActions__popup-icon']"
      >
        <IconEllipsis size="18px" />
      </div>
      <template #dropdown>
        <div
          v-for="(action, key) in enabledActions"
          :key="key"
          :class="[$style.conversationActions__item, {
            [$style['conversationActions__item--delete']]: key === 'delete'
          }]"
          @click="(e) => onClickMenuItem(e, key)"
        >
          {{ action.label }}
        </div>
      </template>
    </TUIDropdown>
  </div>
</template>

<script lang="ts" setup>
import { computed, ref, watch, inject } from 'vue';
import { ConversationMarkType, ReceiveMessageOption } from '@atomicxcore/core';
import { IconEllipsis, useUIKit, TUIDropdown } from '@tencentcloud/uikit-base-component-vue3';
import { isH5 } from '../../../utils';
import { useChatContext } from '../../../chat-store';
import type {
  ConversationActionItem,
  ConversationActionsProps,
} from '../../../types';
import type { ConversationInfo } from '@atomicxcore/core';

const props = withDefaults(defineProps<ConversationActionsProps>(), {
  enablePin: true,
  enableMute: true,
  enableDelete: true,
  enableMarkUnread: true,
});

const emit = defineEmits<{
  click: [e: Event, key?: string, conversation?: ConversationInfo];
  close: [];
  dropdownVisibleChange: [visible: boolean];
  markConversationUnread: [conversation: ConversationInfo, e?: Event];
  conversationPin: [conversation: ConversationInfo, e?: Event];
  conversationMute: [conversation: ConversationInfo, e?: Event];
  conversationDelete: [conversation: ConversationInfo, e?: Event];
}>();

const { t } = useUIKit();
const channel = inject('channel', 'default') as string;
const {
  activeConversation,
  clearConversationUnreadCount,
  deleteConversation,
  markConversation,
  pinConversation,
  setActiveConversation,
  setReceiveMessageOpt,
} = useChatContext(channel);

const markUnreadStatus = ref(true);
const conversationActions = ref<Record<string, ConversationActionItem>>({});

const enabledActions = computed(() => (Object.entries(conversationActions.value) as [string, ConversationActionItem][])
  .filter(([, action]) => action.enable !== false)
  .reduce((acc, [key, action]) => {
    acc[key] = action;
    return acc;
  }, {} as Record<string, ConversationActionItem>));

/**
 * Determine whether the conversation is muted (any non-receive option counts as muted).
 */
const isMuted = (conv: ConversationInfo) => conv.receiveOption !== ReceiveMessageOption.Receive;

/**
 * Replicate the legacy markConversationUnread logic at the component level.
 * - Has real unread + want to mark read  → clearConversationUnreadCount
 * - Otherwise                            → markConversation with Unread mark type
 */
const markConversationUnread = async (conversationID: string, isUnread: boolean) => {
  const conv = props.conversation;
  const isMarked = conv.conversationMarkList?.includes(ConversationMarkType.Unread);
  const hasUnreadCount = conv.unreadCount > 0;
  const isNotNeedMarkUnread = isUnread && (hasUnreadCount || isMarked);
  const isNotNeedMarkRead = !isUnread && !hasUnreadCount && !isMarked;

  if (isNotNeedMarkUnread || isNotNeedMarkRead) {
    return;
  }

  if (hasUnreadCount && !isUnread) {
    clearConversationUnreadCount(conversationID);
    markConversation([conversationID], ConversationMarkType.Unread, false);
  } else {
    await markConversation([conversationID], ConversationMarkType.Unread, isUnread);
  }
};

const generateConversationActions = (): Record<string, ConversationActionItem> => ({
  pin: {
    enable: !!props.enablePin,
    label: props.conversation.isPinned ? t('TUIConversation.Unpin') : t('TUIConversation.Pin'),
    onClick: (_conversation: ConversationInfo, e?: Event) => {
      pinConversation(_conversation.conversationID, !_conversation.isPinned);
      emit('conversationPin', _conversation, e);
    },
  },
  mute: {
    enable: !!props.enableMute,
    label: isMuted(props.conversation) ? t('TUIConversation.Unmute') : t('TUIConversation.Mute'),
    onClick: (_conversation: ConversationInfo, e?: Event) => {
      const targetOpt = isMuted(_conversation)
        ? ReceiveMessageOption.Receive
        : ReceiveMessageOption.NotNotify;
      setReceiveMessageOpt(_conversation.conversationID, targetOpt);
      emit('conversationMute', _conversation, e);
    },
  },
  markUnread: {
    enable: !!props.enableMarkUnread,
    label: markUnreadStatus.value ? t('TUIConversation.MarkRead') : t('TUIConversation.MarkUnRead'),
    onClick: (_conversation: ConversationInfo, e?: Event) => {
      markConversationUnread(_conversation.conversationID, !markUnreadStatus.value);
      emit('markConversationUnread', _conversation, e);
    },
  },
  delete: {
    enable: !!props.enableDelete,
    label: t('TUIConversation.Delete'),
    onClick: (_conversation: ConversationInfo, e?: Event) => {
      deleteConversation(_conversation.conversationID);
      if (activeConversation.value?.conversationID === _conversation.conversationID) {
        setActiveConversation(undefined);
      }
      emit('conversationDelete', _conversation, e);
    },
  },
});

watch(
  () => props.conversation,
  (newConversation: ConversationInfo) => {
    if (newConversation.unreadCount > 0) {
      markUnreadStatus.value = true;
    } else {
      const unreadStatus = newConversation?.conversationMarkList?.includes(ConversationMarkType.Unread);
      markUnreadStatus.value = !!unreadStatus;
    }
  },
  { immediate: true },
);

watch(
  [() => props.conversation, () => props.customConversationActions],
  ([_newConversation, newCustomActions]: [ConversationInfo, Record<string, ConversationActionItem> | undefined]) => {
    conversationActions.value = {
      ...generateConversationActions(),
      ...(newCustomActions || {}),
    };
  },
  { immediate: true, deep: true },
);

const onClickMenuItem = (e: Event, key: string) => {
  emit('click', e, key, props.conversation);

  const action = conversationActions.value[key];
  if (action) {
    action.onClick(props.conversation as ConversationInfo, e);
  }

  if (props.onClose) {
    props.onClose();
  }
};

const handleMaskClick = (e: Event) => {
  e.stopPropagation();
  if ((e.target as HTMLElement) === (e.currentTarget as HTMLElement) && isH5 && props.onClose) {
    props.onClose();
  }
};

const handleDropdownVisibleChange = (visible: boolean) => {
  emit('dropdownVisibleChange', visible);
};
</script>

<style lang="scss" module>
@use './ConversationActions.scss';
</style>
