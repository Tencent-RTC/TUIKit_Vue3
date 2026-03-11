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
import { computed, ref, watch } from 'vue';
import TUIChatEngine from '@tencentcloud/chat-uikit-engine-lite';
import { IconEllipsis, useUIKit, TUIDropdown } from '@tencentcloud/uikit-base-component-vue3';
import { useConversationListState } from '../../../states/ConversationListState';
import { isH5 } from '../../../utils';
import type {
  ConversationModel,
  ConversationActionItem,
  ConversationActionsProps,
} from '../../../types';

const props = withDefaults(defineProps<ConversationActionsProps>(), {
  enablePin: true,
  enableMute: true,
  enableDelete: true,
  enableMarkUnread: true,
});

const emit = defineEmits<{
  click: [e: Event, key?: string, conversation?: ConversationModel];
  close: [];
  dropdownVisibleChange: [visible: boolean];
  markConversationUnread: [conversation: ConversationModel, e?: Event];
  conversationPin: [conversation: ConversationModel, e?: Event];
  conversationMute: [conversation: ConversationModel, e?: Event];
  conversationDelete: [conversation: ConversationModel, e?: Event];
}>();

const { t } = useUIKit();
const { markConversationUnread } = useConversationListState();

const markUnreadStatus = ref(true);
const conversationActions = ref<Record<string, ConversationActionItem>>({});

const enabledActions = computed(() => Object.entries(conversationActions.value)
  .filter(([, action]) => action.enable !== false)
  .reduce((acc, [key, action]) => {
    acc[key] = action;
    return acc;
  }, {} as Record<string, ConversationActionItem>));

const generateConversationActions = (): Record<string, ConversationActionItem> => ({
  pin: {
    enable: !!props.enablePin,
    label: props.conversation.isPinned ? t('TUIConversation.Unpin') : t('TUIConversation.Pin'),
    onClick: (_conversation: ConversationModel, e?: Event) => {
      _conversation.pinConversation();
      emit('conversationPin', _conversation, e);
    },
  },
  mute: {
    enable: !!props.enableMute,
    label: props.conversation.isMuted ? t('TUIConversation.Unmute') : t('TUIConversation.Mute'),
    onClick: (_conversation: ConversationModel, e?: Event) => {
      _conversation.muteConversation();
      emit('conversationMute', _conversation, e);
    },
  },
  markUnread: {
    enable: !!props.enableMarkUnread,
    label: markUnreadStatus.value ? t('TUIConversation.MarkRead') : t('TUIConversation.MarkUnRead'),
    onClick: (_conversation: ConversationModel, e?: Event) => {
      markConversationUnread(_conversation.conversationID, !markUnreadStatus.value);
      emit('markConversationUnread', _conversation, e);
    },
  },
  delete: {
    enable: !!props.enableDelete,
    label: t('TUIConversation.Delete'),
    onClick: (_conversation: ConversationModel, e?: Event) => {
      _conversation.deleteConversation();
      emit('conversationDelete', _conversation, e);
    },
  },
});

watch(
  () => props.conversation,
  (newConversation) => {
    if (newConversation.unreadCount > 0) {
      markUnreadStatus.value = true;
    } else {
      const targetValue = TUIChatEngine.TYPES.CONV_MARK_TYPE_UNREAD;
      const unreadStatus = newConversation?.markList?.includes(targetValue);
      markUnreadStatus.value = unreadStatus;
    }
  },
  { immediate: true },
);

watch(
  [() => props.conversation, () => props.customConversationActions],
  ([newConversation, newCustomActions]) => {
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
    action.onClick(props.conversation, e);
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
