<template>
  <div
    :class="[
      'personal-settings',
    ]"
  >
    <!-- Mute conversation setting - available to all users -->
    <SettingItem
      v-if="isMuted !== undefined"
      class="personal-settings__mute-switch"
      :label="t('ChatSetting.mute_conversation')"
      type="switch"
      :value="isMuted"
      @change="(value: boolean) => setChatMuted(Boolean(value))"
    />

    <!-- Pin conversation setting - available to all users -->
    <SettingItem
      v-if="isPinned !== undefined"
      class="personal-settings__pin-switch"
      :label="t('ChatSetting.pin_conversation')"
      type="switch"
      :value="isPinned"
      @change="(value: boolean) => setChatPinned(Boolean(value))"
    />
  </div>
</template>

<script lang="ts" setup>
import { useUIKit } from '@tencentcloud/uikit-base-component-vue3';
import { useGroupSettingState } from '../../../../states/GroupSettingState';
import { SettingItem } from '../../SettingItem';

const { t } = useUIKit();

const {
  isMuted,
  isPinned,
  setChatMuted,
  setChatPinned,
} = useGroupSettingState();
</script>

<style lang="scss" scoped>
.personal-settings {
  display: flex;
  flex-direction: column;
  gap: 0;
}
</style>
