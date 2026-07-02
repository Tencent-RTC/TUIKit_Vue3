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
      :currentLiveOrientation="currentLiveOrientation"
      @confirm="handleSettingConfirm"
    />
  </TUIDialog>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import { useUIKit, TUIDialog, IconClose, IconLiveSetting } from '@tencentcloud/uikit-base-component-vue3';
import { useBattleState } from '../../states/BattleState';
import { useCoHostState } from '../../states/CoHostState';
import { useLiveListState } from '../../states/LiveListState';
import { useLoginState } from '../../states/LoginState';
import { CoHostStatus, CoHostLayoutTemplate, LiveOrientation } from '../../types';
import BattlePanel from './BattlePanel.vue';
import ConfigSettingPanel from './ConfigSettingPanel.vue';
import ConnectionPanel from './ConnectionPanel.vue';

const { t } = useUIKit();
const props = defineProps<{
  visible: boolean;
}>();
const { loginUserInfo } = useLoginState();
const { coHostStatus, connected, getCoHostCandidates } = useCoHostState();
const { battleUsers } = useBattleState();
const { currentLive } = useLiveListState();
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

// Determine the current live orientation based on layoutTemplate range.
// Landscape templates fall within [200, 599]; portrait otherwise.
// Mirrors `uikit-component-vue3-electron/.../CoHostPanel.vue` so the three
// kits compute orientation identically.
const currentLiveOrientation = computed(() => {
  const layout = currentLive.value?.layoutTemplate;
  if (typeof layout === 'number' && layout >= 200 && layout <= 599) {
    return LiveOrientation.Landscape;
  }
  return LiveOrientation.Portrait;
});

// Keep `configForm.coHostLayoutTemplate` in sync with the current live
// orientation so that:
//   1) Opening the settings dialog always shows a default option highlighted
//      (otherwise the form would be stuck on `HostDynamicGrid` while a
//      landscape live only offers `HostVideoLandscapeFixed2Seats`, leaving
//      nothing selected).
//   2) The actual `requestHostConnection` / battle requests use a template
//      that is valid for the running live's orientation.
// We only override the template when the current value is not legal for the
// new orientation; in portrait this preserves the user's choice between the
// 9-grid and 1v6 layouts across re-opens of the dialog.
watch(currentLiveOrientation, (orientation) => {
  if (orientation === LiveOrientation.Landscape) {
    if (configForm.value.coHostLayoutTemplate !== CoHostLayoutTemplate.HostVideoLandscapeFixed2Seats) {
      configForm.value.coHostLayoutTemplate = CoHostLayoutTemplate.HostVideoLandscapeFixed2Seats;
    }
  } else if (configForm.value.coHostLayoutTemplate === CoHostLayoutTemplate.HostVideoLandscapeFixed2Seats) {
    // Coming back to a portrait live after using the landscape-only template:
    // fall back to the portrait default so the dialog has a valid selection.
    configForm.value.coHostLayoutTemplate = CoHostLayoutTemplate.HostDynamicGrid;
  }
}, { immediate: true });

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

// Refresh the candidate host list whenever the panel transitions to visible.
// Without this, reopening the panel keeps a stale snapshot — for example, a
// host whose connection was just ended would not reappear in "Recommend
// hosts" until the user manually pulled to refresh. We swallow errors here
// because RecommendHostList already surfaces a toast when the user explicitly
// refreshes; this best-effort sync on open should never block the dialog.
//
// Side-effect note: passing '' resets the candidates pagination cursor in
// the kit store. If the user had paged past the first screen before closing
// the panel, that scroll position is discarded on reopen — we trade scroll
// retention for "just-disconnected host shows up at the top", which is the
// higher-priority UX here.
watch(() => props.visible, (newVisible) => {
  if (!newVisible) return;
  getCoHostCandidates('').catch((error) => {
    console.warn('[CoHostPanel] refresh candidates on open failed', error);
  });
});

// Refresh candidates whenever the connected list shrinks (i.e. someone just
// disconnected). The kit's `handleConnectionUserListChanged` only removes
// joiners from candidates; it does NOT add disconnected hosts back. Pulling
// a fresh page here makes the host who just left reappear so they can be
// re-invited, without the user having to close/reopen the panel or hit the
// refresh icon. Gated on `props.visible` so we don't burn rate-limit budget
// while the panel is closed.
//
// Edge case: this only fires on a net length decrease. A same-tick join+leave
// (e.g. SDK batches `connectionUserListChanged` with both add and remove in
// one event) leaves `connected.length` unchanged and the watcher is silent.
// Acceptable trade-off — RecommendHostList's manual refresh button is the
// fallback for this rare case. If misses become noticeable in production,
// switch to `watch(connected, …, { deep: true })` with a Set diff against
// previous user ids to detect leavers regardless of net length.
watch(() => connected.value.length, (newCount, oldCount) => {
  if (!props.visible) return;
  if (newCount >= oldCount) return;
  getCoHostCandidates('').catch((error) => {
    console.warn('[CoHostPanel] refresh candidates after disconnect failed', error);
  });
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
