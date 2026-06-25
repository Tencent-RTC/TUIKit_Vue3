<template>
  <div
    v-if="visible"
    ref="panelRef"
    :class="$style['mention-panel-h5']"
    @touchstart="handleTouchStart"
    @touchmove="handleTouchMove"
  >
    <div :class="$style['mention-panel-h5__header']">
      {{ t('MessageInput.select_mention_members') }}
    </div>
    <button
      v-for="member in filteredMembers"
      :key="member.userID"
      type="button"
      :class="$style['mention-panel-h5__item']"
      @mousedown.prevent
      @click="handleSelect(member)"
    >
      <span
        v-if="member.isAtAll"
        :class="[$style['mention-panel-h5__avatar'], $style['mention-panel-h5__avatar--all']]"
      >
        @
      </span>
      <Avatar
        v-else
        :class="$style['mention-panel-h5__avatar']"
        :src="member.avatarURL"
        :alt="member.nickname || member.userID"
        :size="36"
      />
      <span :class="$style['mention-panel-h5__content']">
        <span :class="$style['mention-panel-h5__name']">
          {{ member.nickname || member.userID }}
        </span>
        <span
          v-if="!member.isAtAll && member.nickname && member.nickname !== member.userID"
          :class="$style['mention-panel-h5__id']"
        >
          {{ member.userID }}
        </span>
      </span>
    </button>
    <div
      v-if="filteredMembers.length === 0 && !isLoading"
      :class="$style['mention-panel-h5__empty']"
    >
      {{ t('MessageInput.no_matching_members') }}
    </div>
    <button
      v-if="isLoading"
      type="button"
      :class="$style['mention-panel-h5__load-more']"
      disabled
      @mousedown.prevent
    >
      {{ t('MessageInput.loading') }}
    </button>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import TencentCloudChat from '@tencentcloud/lite-chat';
import { useUIKit } from '@tencentcloud/uikit-base-component-vue3';
import { useChatContext, useLoginStore } from '../../../chat-store';
import { Avatar } from '../../Avatar';
import type { GroupMember } from '@atomicxcore/core';

interface MentionMember {
  userID: string;
  nickname?: string;
  avatarURL?: string;
  isAtAll?: boolean;
}

interface MentionPanelH5Props {
  visible?: boolean;
  query?: string;
  channel?: string;
}

const props = withDefaults(defineProps<MentionPanelH5Props>(), {
  visible: false,
  query: '',
  channel: 'default',
});

const emit = defineEmits<{
  (e: 'select', member: MentionMember): void;
  (e: 'panelTouchStart'): void;
}>();

const { t } = useUIKit();
const { loginUserInfo } = useLoginStore();
const { memberList, loadMembers } = useChatContext(props.channel);
const isLoading = ref(false);
const panelRef = ref<HTMLDivElement | null>(null);
const touchStartY = ref(0);

const mentionMembers = computed<MentionMember[]>(() => {
  const myUserID = loginUserInfo.value?.userID;
  const members = memberList.value;
  if (!members.length) {
    return [];
  }

  const result: MentionMember[] = members
    .filter((member: GroupMember) => member.userID !== myUserID)
    .map((member: GroupMember) => ({
      userID: member.userID,
      nickname: member.nickname,
      avatarURL: member.avatarURL,
    }));

  if (members.length > 2) {
    result.unshift({
      userID: TencentCloudChat.TYPES.MSG_AT_ALL as string,
      nickname: t('MessageInput.at_all_members') || 'all',
      avatarURL: '/at_all_members.png',
      isAtAll: true,
    });
  }

  return result;
});

const filteredMembers = computed(() => {
  const normalizedQuery = props.query.trim().toLowerCase();
  if (!normalizedQuery) {
    return mentionMembers.value;
  }

  return mentionMembers.value.filter(member =>
    (member.nickname || member.userID).toLowerCase().includes(normalizedQuery),
  );
});

watch(() => props.visible, (visible) => {
  if (!visible) {
    return;
  }

  isLoading.value = true;
  Promise.resolve(loadMembers())
    .catch(() => {})
    .finally(() => {
      isLoading.value = false;
    });
}, { immediate: true });

function handleSelect(member: MentionMember): void {
  emit('select', member);
}

function handleTouchStart(event: TouchEvent): void {
  emit('panelTouchStart');
  touchStartY.value = event.touches[0]?.clientY ?? 0;
}

function handleTouchMove(event: TouchEvent): void {
  event.stopPropagation();

  const panel = panelRef.value;
  const currentY = event.touches[0]?.clientY ?? touchStartY.value;
  const deltaY = currentY - touchStartY.value;
  if (!panel) {
    return;
  }

  const canScroll = panel.scrollHeight > panel.clientHeight;
  if (!canScroll) {
    event.preventDefault();
    return;
  }

  const isAtTop = panel.scrollTop <= 0;
  const isAtBottom = panel.scrollTop + panel.clientHeight >= panel.scrollHeight - 1;
  const isPullingDown = deltaY > 0;
  const isPushingUp = deltaY < 0;

  if ((isAtTop && isPullingDown) || (isAtBottom && isPushingUp)) {
    event.preventDefault();
  }
}
</script>

<style lang="scss" module>
.mention-panel-h5 {
  max-height: 280px;
  overflow-y: auto;
  padding: 8px;
  -webkit-overflow-scrolling: touch;
  overscroll-behavior-y: contain;
  touch-action: pan-y;
}

.mention-panel-h5__header {
  padding: 6px 8px 8px;
  color: var(--text-color-secondary);
  font-size: 12px;
  line-height: 18px;
}

.mention-panel-h5__item,
.mention-panel-h5__load-more {
  display: flex;
  align-items: center;
  width: 100%;
  min-height: 52px;
  padding: 8px;
  border: none;
  border-radius: 12px;
  background-color: transparent;
  color: var(--text-color-primary);
  text-align: left;
  appearance: none;
  -webkit-tap-highlight-color: transparent;
}

.mention-panel-h5__item:active,
.mention-panel-h5__load-more:active {
  background-color: var(--bg-color-hover);
}

.mention-panel-h5__avatar {
  flex-shrink: 0;
  width: 36px;
  height: 36px;
  margin-right: 10px;
}

.mention-panel-h5__avatar--all {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  background-color: var(--text-color-link);
  color: #fff;
  font-size: 18px;
  font-weight: 600;
}

.mention-panel-h5__content {
  display: flex;
  flex: 1;
  min-width: 0;
  flex-direction: column;
}

.mention-panel-h5__name {
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  font-size: 15px;
  line-height: 20px;
}

.mention-panel-h5__id {
  min-width: 0;
  margin-top: 2px;
  overflow: hidden;
  color: var(--text-color-secondary);
  text-overflow: ellipsis;
  white-space: nowrap;
  font-size: 12px;
  line-height: 16px;
}

.mention-panel-h5__load-more {
  justify-content: center;
  color: var(--text-color-secondary);
}

.mention-panel-h5__empty {
  padding: 24px 12px;
  color: var(--text-color-secondary);
  text-align: center;
  font-size: 14px;
}
</style>
