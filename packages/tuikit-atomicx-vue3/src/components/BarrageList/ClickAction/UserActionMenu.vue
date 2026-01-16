<template>
  <div class="user-action-menu" @click.stop ref="actionMenuRef">
    <div class="action-menu-content">
      <div class="action-menu-header">
        <div class="user-info-simple">
          <Avatar :src="avatarUrl" :size="26" />
          <span class="user-name-simple">{{ userName || userId }}</span>
        </div>
      </div>

      <div class="action-menu-list" v-if="actions.length > 0">
        <template v-for="action in actions" :key="action.label">
          <button class="action-menu-item" @click="handleAction(action)">
            {{ action.label }}
          </button>
        </template>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, onMounted, onUnmounted } from 'vue';
import { useLiveAudienceState } from '../../../states/LiveAudienceState';
import { useUIKit, TUIToast } from '@tencentcloud/uikit-base-component-vue3';
import { Avatar } from '../../Avatar';

const { t } = useUIKit();
const { disableSendMessage, audienceList } = useLiveAudienceState();
const actionMenuRef = ref<HTMLDivElement>();

interface Props {
  userId: string;
  userName: string;
  avatarUrl?: string;
  clickTarget: HTMLElement | null;
}

interface Emits {
  (e: 'close'): void;
}

const emit = defineEmits<Emits>();
const props = defineProps<Props>();

const actions = computed(() => {
  const targetUserInfo = audienceList.value.find(item => item.userId === props.userId);
  if (!targetUserInfo) {
    return [];
  }

  const actionList: Array<{ label: string; action: string; actionFn: () => Promise<void> }> = [];

  if (!targetUserInfo.isMessageDisabled) {
    actionList.push({
      label: t('BarrageList.Mute'),
      action: 'disableSendMessage',
      actionFn: () => disableSendMessage({ userId: props.userId, isDisable: true }),
    });
  } else {
    actionList.push({
      label: t('BarrageList.Unmute'),
      action: 'disableSendMessage',
      actionFn: () => disableSendMessage({ userId: props.userId, isDisable: false }),
    });
  }

  return actionList;
});

const handleAction = async (action: { actionFn: () => Promise<void>; label: string }) => {
  try {
    await action.actionFn();
    TUIToast.success({
      message: t(action.label === t('BarrageList.Mute') ? 'BarrageList.MuteSuccess' : 'BarrageList.UnmuteSuccess'),
    });
  } catch (error) {
    console.error('Action failed:', error);
    TUIToast.error({
      message: t('BarrageList.OperationFailed'),
    });
  }
  emit('close');
};

const handleClickOutside = (event: MouseEvent) => {
  const target = event.target as HTMLElement;
  if (!actionMenuRef.value?.contains(target) && !props.clickTarget?.contains(target)) {
    emit('close');
  }
};

onMounted(() => {
  document.addEventListener('click', handleClickOutside);
});

onUnmounted(() => {
  document.removeEventListener('click', handleClickOutside);
});
</script>

<style lang="scss" scoped>
.user-action-menu {
  position: fixed;
  width: 200px;
  background: var(--bg-color-operate);
  border-radius: 8px;
  overflow: hidden;
  box-shadow: 0 8px 32px var(--shadow-color-primary);
  border: 1px solid var(--stroke-color-module);
  z-index: 1001;
}

.action-menu-content {
  position: relative;
  z-index: 1;
}

.action-menu-header {
  display: flex;
  align-items: center;
  padding: 12px;
  border-bottom: 1px solid var(--stroke-color-module);

  &:last-child {
    border-bottom: none;
  }

  .user-info-simple {
    display: flex;
    align-items: center;
    gap: 8px;

    .user-name-simple {
      font-size: 13px;
      font-weight: 500;
      color: var(--text-color-primary);
    }
  }
}

.action-menu-list {
  padding: 8px;

  .action-menu-item {
    display: block;
    width: 100%;
    padding: 12px 16px;
    border: none;
    border-radius: 6px;
    background: var(--uikit-color-gray-3);
    border: none;
    color: var(--text-color-primary);
    font-size: 14px;
    cursor: pointer;
    transition: background 0.2s ease;
    text-align: left;

    &:hover {
      background: var(--uikit-color-gray-4);
    }
  }
}
</style>
