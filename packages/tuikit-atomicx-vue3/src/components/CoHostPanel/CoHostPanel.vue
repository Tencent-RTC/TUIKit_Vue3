<template>
  <TUIDialog
    :title="title"
    :visible="props.visible"
    :custom-classes="['co-host-dialog']"
    @close="close"
    @confirm="close"
    @cancel="close"
  >
    <template #header>
      <div class="dialog-header">
        <span class="dialog-title">{{ title }}</span>
        <div class="icon-buttons">
          <IconLiveSetting
            v-if="!inPk && !inConnection"
            class="icon-button"
            size="20"
            @click="settingVisible = true"
          />
          <IconClose class="icon-button" @click="close" />
        </div>
      </div>
    </template>
    <div class="panel-content">
      <div v-if="!inConnection && !inPk" class="panel-header">
        <div class="tabs">
          <span :class="['tab-item', { active: activeTab === 'battleTab' }]" @click="activeTab = 'battleTab'">
            {{ t('Host Battle') }}
          </span>
          <span :class="['tab-item', { active: activeTab === 'coHostTab' }]" @click="activeTab = 'coHostTab'">
            {{ t('Host Connection') }}
          </span>
        </div>
      </div>
      <div class="panel-body">
        <div v-show="activeTab === 'battleTab'" class="battle-content">
          <BattlePanel :battle-duration="configForm.battleDuration" :coHostLayoutTemplate="configForm.coHostLayoutTemplate" />
        </div>
        <div v-show="activeTab === 'coHostTab'" class="coHost-content">
          <ConnectionPanel :battleDuration="configForm.battleDuration" :coHostLayoutTemplate="configForm.coHostLayoutTemplate" />
        </div>
      </div>
    </div>
    <template #footer>
      <div />
    </template>
    <ConfigSettingPanel
      v-model:visible="settingVisible"
      :form="configForm"
      @confirm="handleSettingConfirm"
    />
  </TUIDialog>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import { useUIKit, TUIDialog, IconClose, IconLiveSetting } from '@tencentcloud/uikit-base-component-vue3';
import { useBattleState } from '../../states/BattleState';
import { useCoHostState } from '../../states/CoHostState';
import { useLoginState } from '../../states/LoginState';
import { CoHostStatus, CoHostLayoutTemplate } from '../../types';
import BattlePanel from './BattlePanel.vue';
import ConfigSettingPanel from './ConfigSettingPanel.vue';
import ConnectionPanel from './ConnectionPanel.vue';

const { t } = useUIKit();
const props = defineProps<{
  visible: boolean;
}>();
const { loginUserInfo } = useLoginState();
const { coHostStatus } = useCoHostState();
const { battleUsers } = useBattleState();
const emit = defineEmits(['update:visible']);
const close = () => {
  emit('update:visible', false);
};
const activeTab = ref('battleTab');
const settingVisible = ref(false);
const inConnection = computed(() => coHostStatus.value === CoHostStatus.Connected);
const inPk = computed(() => battleUsers.value.some(user => user.userId === loginUserInfo.value?.userId));

const title = computed(() => {
  if (inPk.value) {
    return t('Anchor battling...');
  }

  if (inConnection.value) {
    return t('Anchor connecting...');
  }
  return t('CoHost');
});

const configForm = ref({
  battleDuration: 5 * 60,
  coHostLayoutTemplate: CoHostLayoutTemplate.HostDynamicGrid,
});

const handleSettingConfirm = (form: {
  battleDuration: number;
  coHostLayoutTemplate: CoHostLayoutTemplate;
}) => {
  configForm.value = form;
};
watch(inConnection, (newVal) => {
  if (newVal && !inPk.value) {
    activeTab.value = 'coHostTab';
  }
}, {
  immediate: true,
});
watch(inPk, (newVal, oldVal) => {
  if (newVal) {
    emit('update:visible', false);
    activeTab.value = 'battleTab';
  }
  if (newVal !== oldVal && !newVal) {
    activeTab.value = 'coHostTab';
  }
}, {
  immediate: true,
});
</script>

<style lang="scss" scoped>
.dialog-header {
  display: flex;
  align-items: center;
  padding: 0;
  width: 100%;
  justify-content: space-between;

  .dialog-title {
    font-size: 16px;
    line-height: 24px;
    font-weight: 600;
    color: var(--text-color-primary);
  }
  .icon-buttons {
    display: flex;
    align-items: center;
    gap: 8px;
  }
  .icon-button {
    cursor: pointer;
  }
}
.panel-content {
  position: relative;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  width: 100%;
  height: 100%;
  min-height: 200px;
  max-height: 530px;

  .panel-header {
    display: flex;
    align-items: center;

    .tabs {
      display: flex;
      gap: 24px;
      flex-grow: 1;

      .tab-item {
        background: none;
        border: none;
        color: var(--text-color-secondary);
        font-size: 16px;
        padding: 12px 0;
        cursor: pointer;
        position: relative;
        transition: color 0.3s ease;
        user-select: none;

        &.active {
          color: var(--text-color-link);
          font-weight: 500;

          &::after {
            content: '';
            position: absolute;
            bottom: 0;
            left: 0;
            right: 0;
            height: 3px;
            background-color: var(--text-color-link);
            border-radius: 1.5px;
          }
        }
      }
    }
  }

  .panel-body {
    flex: 1;
    display: flex;
    flex-direction: column;
    overflow: auto;

    &::-webkit-scrollbar {
      width: 4px;
    }

    &::-webkit-scrollbar-thumb {
      background: #414756;
      border-radius: 2px;
    }
  }
}

.battle-content,
.coHost-content {
  display: flex;
  flex-direction: column;
  gap: 12px;
  width: 100%;
  height: 100%;
  overflow: hidden;
}

:deep(.co-host-dialog) {
  width: 520px;
}
</style>
