<template>
  <div :class="$style.conversationGroupTypeInfo">
    <div
      v-for="{ type, name, des } in typeInfoList"
      :key="type"
      role="presentation"
      :class="[$style.conversationGroupTypeInfo__box, {
        [$style['conversationGroupTypeInfo__box--active']]: type === groupType
      }]"
      @click="selectGroupType(type)"
    >
      <div :class="$style.conversationGroupTypeInfo__header">
        <div :class="$style.conversationGroupTypeInfo__title">
          <Avatar
            size="sm"
            :src="getDefaultAvatar(type)"
          />
          {{ t(`TUIConversation.${name}`) }}
        </div>
        <IconCheckSm
          v-if="type === groupType"
          :class="$style.conversationGroupTypeInfo__activeIcon"
        />
      </div>
      <div :class="$style.conversationGroupTypeInfo__description">
        {{ t(`TUIConversation.${des}`) }}
        <a
          :class="$style.conversationGroupTypeInfo__document"
          target="_blank"
          href="https://trtc.io/document/33529?platform=web&product=chat&menulabel=uikit#group-types"
          rel="bookmark noreferrer"
        >
          {{ t('TUIConversation.See the documentation for details') }}
        </a>
      </div>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { IconCheckSm, useUIKit } from '@tencentcloud/uikit-base-component-vue3';
import {
  Avatar,
} from '../../../Avatar';
import { useConversationCreate } from '../../hooks/useConversationCreate';
import { typeInfoList } from './type';
import type { GroupType, ConversationGroupTypeInfoProps } from '../../../../types';

const props = defineProps<ConversationGroupTypeInfoProps>();

const { t } = useUIKit();
const { getDefaultAvatar } = useConversationCreate();

const selectGroupType = (type: GroupType) => {
  props.setGroupType(type);
};
</script>

<style lang="scss" module>
@use './ConversationGroupTypeInfo.scss';
</style>
