<script lang="ts" setup>
import { computed } from 'vue';
import { useUIKit } from '@tencentcloud/uikit-base-component-vue3';
import cs from 'classnames';
import {
  ContextMenuRoot,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuTrigger,
  ContextMenuPortal,
} from 'reka-ui';
import { useMessageActions } from '../../../../../hooks/useMessageActions';
import classes from './MessageActionDropdown.module.scss';
import type { MessageAction } from '../../../../../hooks/useMessageActions';
import type { MessageModel } from '../../../../../types/engine';

interface MessageActionDropdownProps {
  message: MessageModel;
  messageActionList?: MessageAction[] | undefined;
}

const props = withDefaults(defineProps<MessageActionDropdownProps>(), {
  messageActionList: undefined,
  message: () => ({}) as MessageModel,
});

const { t } = useUIKit();
const defaultActionList = useMessageActions();

// Get visible action list
const visibleActions = computed(() => {
  const availableActions: MessageAction[] = props.messageActionList ?? defaultActionList;

  return availableActions.filter((action) => {
    // while action.visible is undefined, default to show it
    if (action.visible === undefined) {
      return true;
    }
    if (typeof action.visible === 'function') {
      return action.visible(props.message);
    }
    return action.visible;
  });
});

const handleActionClick = (action: MessageAction) => {
  action.onClick?.(props.message);
};

const bodyElement = document.body;
</script>

<template>
  <template v-if="visibleActions.length <= 0">
    <slot />
  </template>
  <ContextMenuRoot v-else>
    <ContextMenuTrigger as-child>
      <slot />
    </ContextMenuTrigger>
    <ContextMenuPortal :to="bodyElement">
      <ContextMenuContent :class="cs(classes['message-action-dropdown'])">
        <ContextMenuItem
          v-for="action in visibleActions"
          :key="action.key"
          as="button"
          :class="cs('message-action-dropdown__item', action.className)"
          :style="action.style"
          @select="handleActionClick(action)"
        >
          <component
            :is="action.component"
            v-if="action.component && action.visible"
            :message="message"
          />
          <template v-else-if="action.visible">
            <template v-if="action.icon">
              <span v-if="typeof action.icon === 'string'" :class="cs('message-action-dropdown__icon')">{{ action.icon }}</span>
              <component
                :is="action.icon"
                v-else
                :class="cs('message-action-dropdown__icon')"
              />
            </template>
            <span>{{ t(`MessageList.${action.label}`, { defaultValue: action.label }) }}</span>
          </template>
        </ContextMenuItem>
      </ContextMenuContent>
    </ContextMenuPortal>
  </ContextMenuRoot>
</template>

<style lang="scss" scoped>
.message-action-dropdown__item {
  display: flex;
  flex-direction: row;
  align-items: center;
  justify-content: flex-start;
  gap: 4px;
  border: none;
  outline: none;
  width: 100%;
  padding: 14px 12px;
  font-size: 14px;
  background-color: var(--dropdown-color-default);
  color: var(--text-color-primary);
  cursor: pointer;
  position: relative;
  transition: background-color 0.2s ease;

  &:not(:last-child)::after {
    content: '';
    position: absolute;
    bottom: 0;
    left: 12px;
    right: 12px;
    height: 1px;
    background-color: var(--stroke-color-secondary);
  }

  &:hover {
    background-color: var(--dropdown-color-hover);
  }

  &:active {
    background-color: var(--dropdown-color-active);
  }
}

.message-action-dropdown__icon {
  flex-shrink: 0;
  width: 16px;
  height: 16px;
}
</style>
