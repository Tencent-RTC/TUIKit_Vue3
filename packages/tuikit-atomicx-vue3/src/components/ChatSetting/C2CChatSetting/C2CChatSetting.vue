<script lang="ts" setup>
import { IconCopy, TUIToast, useUIKit } from '@tencentcloud/uikit-base-component-vue3';
import { useC2CSettingState } from '../../../states/C2CSettingState';
import { copyTextToClipboard } from '../../../utils';
import { Divider } from '../Divider';
import { SettingItem } from '../SettingItem';

const { t } = useUIKit();

const {
  userID,
  nick,
  signature,
  remark,
  isMuted,
  isPinned,
  isContact,
  setChatPinned,
  setChatMuted,
  setUserRemark,
} = useC2CSettingState();

function handlePinnedChange(value: boolean) {
  setChatPinned(value);
}

function handleMutedChange(value: boolean) {
  setChatMuted(value);
}

function handleRemarkConfirm(value: string) {
  setUserRemark(value).then(() => {
    TUIToast.success({
      message: t('ChatSetting.remark_update_success'),
    });
  }).catch((err) => {
    TUIToast.error({
      message: err.code === 2700 ? t('ChatSetting.you_are_not_friend') : t('ChatSetting.remark_update_failed'),
    });
  });
}

function handleCopyUserID() {
  if (userID.value) {
    copyTextToClipboard(userID.value).then(() => {
      TUIToast.success({
        message: t('ChatSetting.copied'),
      });
    });
  }
}
</script>

<template>
  <Divider variant="line" :full-width="true" />
  <div
    v-if="userID"
    class="c2c-chat-setting"
  >
    <!-- User Info Section -->
    <div class="c2c-chat-setting__info-section">
      <!-- <div class="c2c-chat-setting__avatar-section">
        <Avatar
          :src="avatar || ''"
          size="xxl"
          class="c2c-chat-setting__avatar"
        />
      </div> -->

      <!-- User ID -->
      <div class="c2c-chat-setting__item">
        <div class="c2c-chat-setting__label">
          {{ t('ChatSetting.user_id') }}
        </div>
        <div class="c2c-chat-setting__content">
          <div class="c2c-chat-setting__value">
            {{ userID }}
          </div>
          <IconCopy
            class="c2c-chat-setting__copy-btn"
            @click="handleCopyUserID"
          />
        </div>
      </div>

      <Divider variant="line" />

      <!-- Nick Name -->
      <SettingItem
        type="display"
        :is-wrap="true"
        :label="t('ChatSetting.nickname')"
        :value="nick || ''"
        :placeholder="t('ChatSetting.nickname_placeholder')"
      />

      <Divider v-if="signature && signature.trim()" variant="line" />

      <!-- Signature -->
      <SettingItem
        v-if="signature && signature.trim()"
        type="display"
        :is-wrap="true"
        :label="t('ChatSetting.signature')"
        :value="signature"
      />
    </div>

    <Divider v-if="isContact" variant="line" />

    <!-- Remark Section -->
    <div v-if="isContact" class="c2c-chat-setting__remark-section">
      <SettingItem
        type="input"
        :label="t('ChatSetting.remark')"
        :value="remark ?? ''"
        :placeholder="t('ChatSetting.remark_placeholder')"
        :editable="true"
        @confirm="handleRemarkConfirm"
      />
    </div>

    <Divider variant="section" />

    <!-- Settings Section -->
    <div class="c2c-chat-setting__settings-section">
      <!-- Pin Setting -->
      <SettingItem
        v-if="isPinned !== undefined"
        type="switch"
        :label="t('ChatSetting.pin_conversation')"
        :value="isPinned"
        @change="handlePinnedChange"
      />

      <Divider variant="line" />

      <!-- Mute Setting -->
      <SettingItem
        v-if="isMuted !== undefined"
        type="switch"
        :label="t('ChatSetting.mute_conversation')"
        :value="isMuted"
        @change="handleMutedChange"
      />
    </div>
  </div>
</template>

<style lang="scss" scoped>
.c2c-chat-setting {
  display: flex;
  flex-direction: column;
  background-color: transparent;

  color: var(--text-color-primary);

  &__info-section {
    display: flex;
    flex-direction: column;
    background-color: transparent;
  }

  // &__avatar-section {
  //   display: flex;
  //   justify-content: center;
  //   align-items: center;
  // }

  &__item {
    display: flex;
    flex-direction: column;
    padding: 14px 20px 11px;
    gap: 4px;

    &:last-child {
      border-bottom: none;
    }
  }

  &__label {
    font-size: 14px;
    // margin-bottom: 8px;
    color: var(--text-color-primary);
  }

  &__content {
    display: flex;
    flex-direction: row;
    align-items: center;
    justify-content: space-between;
    gap: 12px;
  }

  &__value {
    flex: 1;
    font-size: 14px;
    word-break: break-word;
    white-space: pre-wrap;

    color: var(--text-color-secondary);
  }

  &__copy-btn {
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 4px;
    width: 24px;
    height: 24px;
    cursor: pointer;
    border-radius: 6px;
    transition: all 0.2s ease;
    flex-shrink: 0;

    color: var(--text-color-secondary);
    &:hover {
      background-color: var(--button-color-secondary-hover);
    }
    &:active {
      background-color: var(--button-color-secondary-active);
    }
  }

  &__remark-section {
    display: flex;
    flex-direction: column;
    background-color: transparent;
  }

  &__settings-section {
    display: flex;
    flex-direction: column;
    gap: 0;
  }
}
</style>
