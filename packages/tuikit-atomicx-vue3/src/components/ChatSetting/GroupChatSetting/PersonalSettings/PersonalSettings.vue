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
    <Divider
      v-if="isMuted !== undefined && isPinned !== undefined"
      variant="line"
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
import { computed, inject } from 'vue';
import { ReceiveMessageOption } from '@atomicxcore/core';
import { useUIKit } from '@tencentcloud/uikit-base-component-vue3';
import { useChatContext } from '../../../../chat-store';
import { Divider } from '../../Divider';
import { SettingItem } from '../../SettingItem';

const { t } = useUIKit();
const channel = inject('channel', 'default') as string;
const { activeConversation, setReceiveMessageOpt, pinConversation } = useChatContext(channel);

const isMuted = computed(() => {
  const opt = activeConversation.value?.receiveOption;
  if (opt === undefined) {
    return undefined;
  }
  return opt !== ReceiveMessageOption.Receive;
});

const isPinned = computed(() => activeConversation.value?.isPinned);

const setChatMuted = async (mute: boolean) => {
  const id = activeConversation.value?.conversationID;
  if (!id) return;
  const opt = mute ? ReceiveMessageOption.NotNotify : ReceiveMessageOption.Receive;
  await setReceiveMessageOpt(id, opt);
};

const setChatPinned = async (pin: boolean) => {
  const id = activeConversation.value?.conversationID;
  if (!id) return;
  await pinConversation(id, pin);
};
</script>

<style lang="scss" scoped>
.personal-settings {
  display: flex;
  flex-direction: column;
  gap: 0;
}
</style>
