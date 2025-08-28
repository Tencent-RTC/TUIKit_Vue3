<template>
  <template v-if="!enableSearch">
    <ul :class="[$style['conversation-create-list'], {[$style['conversation-create-list--detail']]: !enableSearch }]">
      <li
        v-for="(action, key) in createActions"
        :key="key"
        :class="[$style['conversation-create-item']]"
        @click="() => handleClick(action.key)"
      >
        <component :is="action.icon" />
        <span :class="[$style['conversation-create-text']]">{{ action.label }}</span>
      </li>
    </ul>
  </template>
  <template v-else>
    <TUIDropdown
      trigger="click"
      placement="bottom-end"
    >
      <IconSearchMore
        :class="[$style['conversation-create-button']]"
        :size="`${size}px`"
      />
      <template #dropdown>
        <div :class="[$style['conversation-create-dropdown']]">
          <ul :class="[$style['conversation-create-list']]">
            <li
              v-for="(action, key) in createActions"
              :key="key"
              :class="[$style['conversation-create-item']]"
              @click="() => handleClick(action.key)"
            >
              <component :is="action.icon" />
              <span :class="[$style['conversation-create-text']]">{{ action.label }}</span>
            </li>
          </ul>
        </div>
      </template>
    </TUIDropdown>
  </template>
</template>

<script lang="ts" setup>
import { shallowRef } from 'vue';
import {
  IconSearchMore,
  TUIDropdown,
  IconIconC2c,
  IconStartGroup,
  useUIKit,
} from '@tencentcloud/uikit-base-component-vue3';
import { CreateConvTypes } from '../../../../types';
import { useConversation } from '../../hooks/useConversation';
import type { ConversationCreateButtonProps } from '../../../../types';

const { t } = useUIKit();
const { enableSearch } = useConversation();

withDefaults(defineProps<ConversationCreateButtonProps>(), {
  size: 24,
});

const emit = defineEmits<{
  click: [key: CreateConvTypes];
}>();

const createActions = shallowRef([
  {
    icon: IconIconC2c,
    key: CreateConvTypes.C2C,
    label: t('TUIConversation.Start C2C Chat'),
  },
  {
    icon: IconStartGroup,
    key: CreateConvTypes.GROUP,
    label: t('TUIConversation.Start Group Chat'),
  },
]);

const handleClick = (action: CreateConvTypes) => {
  emit('click', action);
};
</script>

<style lang="scss" module>
@import './ConversationCreateButton.scss';
</style>
