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
      <div :class="$style.conversationGroupTypeInfo__title">
        <IconCheckSm
          v-if="type === groupType"
          :class="$style.conversationGroupTypeInfo__activeIcon"
        />
        {{ t(`TUIConversation.${name}`) }}
      </div>
      <div :class="$style.conversationGroupTypeInfo__description">
        {{ t(`TUIConversation.${des}`) }}
      </div>
    </div>
    <a
      :class="$style.conversationGroupTypeInfo__document"
      target="_blank"
      href="https://trtc.io/document/33529?platform=web&product=chat&menulabel=uikit#group-types"
      rel="bookmark noreferrer"
    >
      {{ t('TUIConversation.Details') }}
    </a>
  </div>
</template>

<script lang="ts" setup>
import { IconCheckSm, useUIKit } from '@tencentcloud/uikit-base-component-vue3';
import { PageStateTypes } from '../../../../types';
import { typeInfoList } from './type';
import type { GroupType } from './type';

const props = defineProps<{
  groupType: GroupType;
  setGroupType: (type: GroupType) => void;
  setPageState: (state: PageStateTypes) => void;
}>();

const { t } = useUIKit();

const selectGroupType = (type: GroupType) => {
  props.setGroupType(type);
  props.setPageState(PageStateTypes.CREATE_DETAIL);
};
</script>

<style lang="scss" module>
@import './ConversationGroupTypeInfo.scss';
</style>
