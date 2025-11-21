<template>
  <div
    :class="[
      $style.conversationCreateGroupDetail,
      isH5 && $style['conversationCreateGroupDetail--h5'],
    ]"
  >
    <div
      v-if="pageState !== PageStateTypes.GROUP_TYPE"
      :class="$style.conversationCreateGroupDetail__main"
    >
      <div :class="$style.conversationCreateGroupDetail__box">
        <label
          :class="$style.from__label"
          for="group-avatar"
        >{{ t('TUIConversation.Group Avatar') }}</label>
        <Avatar
          size="sm"
          :src="groupInfo.avatar"
        />
      </div>
      <div :class="$style.conversationCreateGroupDetail__box">
        <label
          :class="$style.from__label"
          for="group-name"
        >{{ t('TUIConversation.Group Name') }}</label>
        <TUIInput
          id="group-name"
          v-model="groupInfo.name"
          clearable
          :class="$style.conversationCreateGroupDetail__inputText"
          :max-length="30"
          :border="false"
          :placeholder="t('TUIConversation.Group Name')"
          @update:model-value="(value) => groupInfoChange(String(value), GroupLabelTypes.NAME)"
        />
      </div>

      <div :class="$style.conversationCreateGroupDetail__box">
        <label
          :class="$style.from__label"
          for="group-id"
        >{{ t('TUIConversation.Group ID') }}</label>
        <TUIInput
          id="group-id"
          v-model="groupInfo.groupID"
          clearable
          :class="$style.conversationCreateGroupDetail__inputText"
          :border="false"
          :placeholder="t('TUIConversation.Group ID')"
          @update:model-value="(value) => groupInfoChange(String(value), GroupLabelTypes.GROUP_ID)"
        />
      </div>

      <div
        :class="$style.conversationCreateGroupDetail__box"
        :style="{ alignItems: 'flex-start' }"
      >
        <label
          :class="$style.from__label"
          for="group-type"
        >{{ t('TUIConversation.Group Type') }}</label>
        <ConversationGroupTypeInfo
          id="group-type"
          :group-type="groupInfo.type"
          :set-group-type="(type: GroupType) => groupInfoChange(type, GroupLabelTypes.TYPE)"
        />
      </div>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { ref } from 'vue';
import { TUIInput, useUIKit } from '@tencentcloud/uikit-base-component-vue3';
import { PageStateTypes, GroupLabelTypes } from '../../../../types';
import { isH5 } from '../../../../utils/env';
import { Avatar } from '../../../Avatar';
import { useConversationCreate } from '../../hooks/useConversationCreate';
import { ConversationGroupTypeInfo } from '../ConversationGroupTypeInfo';
import type {
  ConversationCreateGroupDetailProps,
  ConversationModel,
  CreateGroupInfo,
  CreateGroupParams,
  GroupType,
} from '../../../../types';

const props = defineProps<ConversationCreateGroupDetailProps>();

const emit = defineEmits<{
  'update:page-state': [state: PageStateTypes];
  'beforeCreateConversation': [params: CreateGroupParams];
  'conversationCreated': [conversation: ConversationModel];
  'update-group-info': [groupInfo: CreateGroupInfo];
}>();

const { t } = useUIKit();
const { getDefaultAvatar } = useConversationCreate();

const groupInfo = ref<CreateGroupInfo>(props.groupInfo);

const groupInfoChange = (value: string, type: string) => {
  switch (type) {
    case GroupLabelTypes.NAME:
      groupInfo.value.name = value;
      break;
    case GroupLabelTypes.GROUP_ID:
      groupInfo.value.groupID = value;
      break;
    case GroupLabelTypes.TYPE:
      groupInfo.value.type = value as GroupType;
      groupInfo.value.avatar = getDefaultAvatar(groupInfo.value.type);
      break;
    default:
      break;
  }
  emit('update-group-info', groupInfo.value);
};
</script>

<style lang="scss" module>
@use './ConversationCreateGroupDetail.scss';
</style>
