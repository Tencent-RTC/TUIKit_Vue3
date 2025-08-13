<template>
  <div :class="$style.conversationCreateGroupDetail">
    <div
      v-if="pageState !== PageStateTypes.GROUP_TYPE"
      :class="$style.conversationCreateGroupDetail__main"
    >
      <div :class="[$style.conversationCreateGroupDetail__box, $style.conversationCreateGroupDetail__name]">
        <TUIInput
          v-model="groupName"
          :class="$style.conversationCreateGroupDetail__inputText"
          :max-length="15"
          :border="false"
          :placeholder="t('TUIConversation.Group Name')"
          @update:model-value="(value) => groupInfoChange(String(value), 'name')"
        />
      </div>

      <div :class="$style.conversationCreateGroupDetail__box">
        <TUIInput
          v-model="groupID"
          :class="$style.conversationCreateGroupDetail__inputText"
          :border="false"
          :placeholder="t('TUIConversation.Group ID')"
          @update:model-value="(value) => groupInfoChange(String(value), 'id')"
        />
      </div>

      <div :class="$style.conversationCreateGroupDetail__box">
        <div
          :class="$style.conversationCreateGroupDetail__inputReadonly"
          @click.self="setPageState(PageStateTypes.GROUP_TYPE)"
        />
        <TUIInput
          :class="$style.conversationCreateGroupDetail__inputText"
          readonly
          :border="false"
          :prefix="h('div', { class: $style.conversationCreateGroupDetail__inputTitle }, t('TUIConversation.Group Type'))"
          :suffix="IconChevronRight"
          :model-value="t(`TUIConversation.${groupType}`)"
        />
      </div>

      <div :class="$style.conversationCreateGroupDetail__illustrate">
        {{ t(`TUIConversation.${getDes()}`) }}
      </div>

      <div :class="$style.conversationCreateGroupDetail__portrait">
        <div :class="$style.conversationCreateGroupDetail__portraitTitle">
          {{ t('TUIConversation.Participants') }}
        </div>
        <div :class="$style.conversationCreateGroupDetail__portraitInfoContainer">
          <div
            v-for="{ avatar, userID, nick } in profileList"
            :key="userID"
            :class="$style.conversationCreateGroupDetail__portraitInfo"
          >
            <Avatar :src="avatar || DEFAULT_USER_AVATAR" />
            <div :class="$style.conversationCreateGroupDetail__portraitInfoNick">
              {{ nick || userID }}
            </div>
          </div>
        </div>
      </div>
    </div>

    <div
      v-if="pageState !== PageStateTypes.GROUP_TYPE"
      :class="$style.conversationCreateGroupDetail__nextContainer"
    >
      <TUIButton @click="next">
        {{ t('TUIConversation.Create') }}
      </TUIButton>
    </div>

    <ConversationGroupTypeInfo
      v-else
      :group-type="groupType"
      :set-group-type="setGroupType"
      :set-page-state="setPageState"
    />
  </div>
</template>

<script lang="ts" setup>
import { ref, computed, h } from 'vue';
import { StoreName, TUIStore } from '@tencentcloud/chat-uikit-engine';
import { TUIButton, TUIInput, IconChevronRight, TUIToast, useUIKit } from '@tencentcloud/uikit-base-component-vue3';
import { useConversationListState } from '../../../../states/ConversationListState';
import {
  Avatar,
  DEFAULT_GROUP_AVATAR_WORK,
  DEFAULT_GROUP_AVATAR_AVCHATROOM,
  DEFAULT_GROUP_AVATAR_MEETING,
  DEFAULT_GROUP_AVATAR_PUBLIC,
  DEFAULT_USER_AVATAR,
} from '../../../Avatar';
import { ConversationGroupTypeInfo, GroupType, typeInfoList } from '../ConversationGroupTypeInfo';
import type { PageStateTypes, ConversationCreateGroupDetailProps } from '../../../../types';
import type { CreateGroupParams, IConversationModel } from '@tencentcloud/chat-uikit-engine';

const props = defineProps<ConversationCreateGroupDetailProps>();

const emit = defineEmits<{
  'update:page-state': [state: PageStateTypes];
  'beforeCreateConversation': [params: CreateGroupParams];
  'conversationCreated': [conversation: IConversationModel];
}>();

const { t } = useUIKit();
const { createGroupConversation } = useConversationListState();

const myProfile = computed(() => TUIStore.getData(StoreName.USER, 'userProfile'));
const temp = computed(() => [myProfile.value, ...props.profileList]);
const name = computed(() => temp.value.map(item => item?.nick || item?.userID).toString());

const groupName = ref(name.value.length >= 15 ? `${name.value.slice(0, 12)}...` : name.value);
const groupID = ref('');
const groupType = ref<GroupType>(GroupType.WORK);

const groupInfoChange = (value: string, type: string) => {
  switch (type) {
    case 'name':
      groupName.value = value;
      break;
    case 'id':
      groupID.value = value;
      break;
    case 'type':
      groupType.value = value as GroupType;
      break;
    default:
      break;
  }
};

const getDefaultAvatar = (type: GroupType) => {
  switch (type) {
    case GroupType.WORK:
      return DEFAULT_GROUP_AVATAR_WORK;
    case GroupType.PUBLIC:
      return DEFAULT_GROUP_AVATAR_PUBLIC;
    case GroupType.MEETING:
      return DEFAULT_GROUP_AVATAR_MEETING;
    case GroupType.AVCHATROOM:
      return DEFAULT_GROUP_AVATAR_AVCHATROOM;
    default:
      return '';
  }
};

const getDes = () => typeInfoList?.find((item: any) => item.type === groupType.value)?.des || '';

const setGroupType = (type: GroupType) => {
  groupType.value = type;
};

const setPageState = (state: PageStateTypes) => {
  emit('update:page-state', state);
  props?.setPageState?.(state);
};

const next = async () => {
  const memberList = props.profileList.map(item => ({
    userID: item.userID,
  }));

  const avatar = getDefaultAvatar(groupType.value);
  const options: CreateGroupParams = {
    name: groupName.value,
    type: groupType.value,
    groupID: groupID.value,
    avatar,
    memberList,
  };

  emit('beforeCreateConversation', options);
  const _options = props.onBeforeCreateConversation?.(options) || options;

  try {
    const conversation = await createGroupConversation(_options);
    emit('conversationCreated', conversation);
    props.onConversationCreated?.(conversation);
  } catch (error: any) {
    TUIToast.error({ message: error.message });
  }
};
</script>

<style lang="scss" module>
@import './ConversationCreateGroupDetail.scss';
</style>
