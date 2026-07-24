<template>
  <header class="topbar">
    <div class="topbar__brand">
      <button
        type="button"
        class="topbar__brand-link"
        :title="t('Topbar.GoHome')"
        @click="$emit('go-home')"
      >
        <img
          class="topbar__brand-logo"
          src="https://qcloudimg.tencent-cloud.cn/raw/f7f05bb4fd230ebc847e8412681dd587.png"
          alt="logo"
        />
        <span class="topbar__brand-text">
          <strong>{{ t('Topbar.Brand') }}</strong>
          <span class="topbar__sub">{{ t('Topbar.Subtitle') }}</span>
        </span>
      </button>
      <span class="topbar__brand-sep" aria-hidden="true" />
      <SdkSourcePicker />
    </div>

    <div class="topbar__center">
      <RoleSwitcher :model-value="role" :reason="roleReason" />

      <div v-if="hasJoinedLive" class="topbar__liveid topbar__liveid--active">
        <span class="topbar__liveid-label">{{ t('Topbar.CurrentLive') }}</span>
        <code class="topbar__liveid-value">{{ currentLiveId }}</code>
        <button
          type="button"
          class="topbar__liveid-copy"
          :title="t('Topbar.CopyLiveId')"
          @click="$emit('copy-live-id')"
        >{{ t('Common.Copy') }}</button>
      </div>
      <div v-else-if="isLoggedIn" class="topbar__liveid-hint">
        <button
          type="button"
          class="topbar__liveid-hint-btn"
          @click="$emit('select', 'live-list', 'startLive')"
        >{{ t('Topbar.StartLive') }}</button>
        <button
          type="button"
          class="topbar__liveid-hint-btn topbar__liveid-hint-btn--alt"
          @click="$emit('select', 'live-list', 'joinLive')"
        >{{ t('Topbar.JoinLive') }}</button>
      </div>
    </div>

    <div class="topbar__login">
      <button
        type="button"
        class="topbar__lang-toggle"
        :title="t('Lang.SwitchLanguage')"
        @click="$emit('toggle-lang')"
      >
        <IconLanguage class="topbar__lang-icon" />
        <span>{{ lang === 'zh-CN' ? '中' : 'En' }}</span>
      </button>
      <template v-if="!isLoggedIn">
        <div class="topbar__userid-wrap">
          <input
            :value="userIdInput"
            type="text"
            class="topbar__userid-input"
            :class="{ 'topbar__userid-input--error': hasChineseInput }"
            :placeholder="t('Topbar.UserIdPlaceholder')"
            @input="onUserIdInput"
          />
          <span v-if="hasChineseInput" class="topbar__userid-error">{{ t('Topbar.UserIdNoChinese') }}</span>
        </div>
        <button
          class="topbar__btn topbar__btn--primary"
          :disabled="loggingIn || !userIdInput.trim() || hasChineseInput"
          :title="hasChineseInput ? t('Topbar.UserIdNoChinese') : !userIdInput.trim() ? t('Topbar.LoginDisabledHint') : undefined"
          @click="$emit('login')"
        >
          {{ loggingIn ? t('Common.LoggingIn') : t('Common.Login') }}
        </button>
      </template>
      <template v-else>
        <div
          class="topbar__user"
          @mouseenter="showUserCard = true"
          @mouseleave="showUserCard = false"
        >
          <img
            v-if="userAvatar"
            :src="userAvatar"
            class="topbar__user-avatar"
            alt=""
          />
          <span v-else class="topbar__user-avatar topbar__user-avatar--placeholder">
            {{ userInitial }}
          </span>
          <div class="topbar__user-info">
            <span class="topbar__user-name">{{ userDisplayName }}</span>
            <code class="topbar__user-id">{{ userId }}</code>
          </div>
          <UserMenuCard
            :visible="showUserCard"
            :user-id="userId"
            :user-name="userDisplayName"
            :avatar-url="userAvatar"
            :user-initial="userInitial"
            :display-name="userDisplayName"
            :saving="savingProfile"
            @save="onSaveProfile"
          />
        </div>
        <button class="topbar__btn" @click="$emit('logout')">{{ t('Common.Logout') }}</button>
      </template>
    </div>
  </header>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { useUIKit, IconLanguage } from '@tencentcloud/uikit-base-component-vue3';
import { Role } from '../../lib/types';
import RoleSwitcher from '../../services/session/RoleSwitcher.vue';
import SdkSourcePicker from '../../services/sdk-source/SdkSourcePicker.vue';
import UserMenuCard from './UserMenuCard.vue';

defineProps<{
  role: Role;
  roleReason?: string;
  isLoggedIn: boolean;
  loggingIn: boolean;
  hasJoinedLive: boolean;
  currentLiveId: string;
  lang: string;
  userIdInput: string;
  userId: string;
  userDisplayName: string;
  userAvatar: string;
  userInitial: string;
}>();

const emit = defineEmits<{
  'go-home': [];
  'copy-live-id': [];
  'select': [state: string, api: string];
  'toggle-lang': [];
  'login': [];
  'logout': [];
  'update:userIdInput': [value: string];
  'save-profile': [payload: { userName: string; avatarUrl: string }];
}>();

const { t } = useUIKit();
const showUserCard = ref(false);
const savingProfile = ref(false);

// TRTC UserID doesn't support Chinese/CJK characters. Underscore, hyphen,
// etc. are fine — surface a small inline error message below the input
// (the common UX pattern for field-level validation) rather than a toast.
const CJK_PATTERN = /[\u4e00-\u9fff\u3400-\u4dbf\uf900-\ufaff]/;
const hasChineseInput = ref(false);
function onUserIdInput(event: Event): void {
  const value = (event.target as HTMLInputElement).value;
  hasChineseInput.value = CJK_PATTERN.test(value);
  emit('update:userIdInput', value);
}

function onSaveProfile(payload: { userName: string; avatarUrl: string }): void {
  savingProfile.value = true;
  emit('save-profile', payload);
  // The parent's onSaveProfile is async (calls setSelfInfo). Since
  // Vue emits are fire-and-forget, we can't await the parent's
  // promise directly. Instead, close the card immediately and
  // release the saving flag after a short delay — setSelfInfo
  // typically resolves within ~500ms; if it fails the error is
  // non-fatal (App.vue swallows it) and the card is already closed.
  showUserCard.value = false;
  setTimeout(() => { savingProfile.value = false; }, 500);
}
</script>

<!--
  Non-scoped style: `UserMenuCard.vue` renders `.topbar__user-card*`
  elements inside its own template but relies on the styles defined
  here. If this block is ever changed to `scoped`, UserMenuCard's
  card / inputs / buttons will lose all styling. Either keep this
  non-scoped or move the shared styles to a separate CSS file imported
  by both components.
-->
<style lang="scss">
.topbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 24px;
  height: 56px;
  padding: 0 24px;
  background: #fff;
  border-bottom: 1px solid #e5e7eb;

  // Three explicit columns with consistent flex behaviour:
  //  - left (brand + SDK picker) and right (login) shrink to content
  //  - center (role + hint) is the flex-grow lane so it can absorb
  //    extra width without pushing the brand/login clusters around
  &__brand,
  &__center,
  &__login {
    display: flex;
    align-items: center;
    min-height: 36px;
  }

  &__brand {
    flex: 0 0 auto;
    gap: 16px;
  }
  &__center {
    flex: 1 1 auto;
    justify-content: center;
    gap: 12px;
  }
  &__login {
    flex: 0 0 auto;
    gap: 8px;

    // All buttons in the login cluster share a fixed min-width and
    // center-aligned text so toggling between "登录 / Login" or
    // "退出 / Logout" (different string widths) doesn't cause
    // layout shift.
    button {
      min-width: 72px;
      text-align: center;
      white-space: nowrap;
    }
  }

  &__brand {
    strong { font-size: 16px; line-height: 1.2; }
  }
  &__sub { font-size: 12px; color: #9ca3af; line-height: 1.2; }

  // Brand link: clickable logo block that navigates to the home page.
  // Resetting default button styles (background, border, padding)
  // keeps it looking like plain text but with a hover affordance.
  &__brand-link {
    display: flex;
    flex-direction: row;
    align-items: center;
    gap: 8px;
    padding: 4px 8px;
    margin: -4px -8px;
    color: inherit;
    text-align: left;
    background: transparent;
    border: none;
    border-radius: 6px;
    cursor: pointer;
    transition: background 0.15s ease;

    &:hover { background: #f3f4f6; }
    &:active { background: #e5e7eb; }
    &:focus-visible {
      outline: 2px solid #1c66e5;
      outline-offset: 2px;
    }
  }

  &__brand-logo {
    width: 28px;
    height: 28px;
    object-fit: contain;
    flex-shrink: 0;
  }

  &__brand-text {
    display: flex;
    flex-direction: column;
    align-items: flex-start;
    gap: 2px;
  }

  // Subtle visual separator between the SDK picker and the login
  // cluster on the right. Avoids the previous "everything glued
  // together" feel without resorting to hard dividers between
  // every element.
  &__brand-sep {
    width: 1px;
    height: 20px;
    background: #e5e7eb;
  }

  &__login {
    input {
      height: 32px;
      padding: 0 10px;
      font-size: 13px;
      border: 1px solid #d1d5db;
      border-radius: 6px;
    }
  }

  // Wrapper for the userId input + inline error message. `position:
  // relative` lets the error text be absolutely positioned below the
  // input without affecting the fixed-height topbar's layout/alignment.
  &__userid-wrap {
    position: relative;
  }

  // UserId input — give it a slightly wider min-width so a typical
  // dev userId fits without the input feeling cramped.
  &__userid-input {
    min-width: 180px;

    &--error {
      border-color: #dc2626;

      &:focus {
        outline: none;
        box-shadow: 0 0 0 2px rgba(220, 38, 38, 0.15);
      }
    }
  }

  // Inline field-level validation message, styled as a small tooltip
  // bubble anchored below the input (the conventional pattern for
  // pointing out invalid input without interrupting the user with a
  // toast/modal). A high z-index + box-shadow keeps it legible as it
  // floats over whatever content sits below the fixed-height topbar.
  &__userid-error {
    position: absolute;
    top: calc(100% + 6px);
    left: 0;
    z-index: 20;
    padding: 4px 8px;
    font-size: 12px;
    line-height: 1.3;
    color: #dc2626;
    white-space: nowrap;
    background: #fef2f2;
    border: 1px solid #fecaca;
    border-radius: 4px;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);

    // Small arrow pointing up at the input above.
    &::before {
      position: absolute;
      top: -5px;
      left: 10px;
      width: 8px;
      height: 8px;
      content: '';
      background: #fef2f2;
      border: 1px solid #fecaca;
      border-right: none;
      border-bottom: none;
      transform: rotate(45deg);
    }
  }

  // Shared button base for topbar buttons. `topbar__btn` alone is
  // the secondary (outlined) variant; `--primary` is the filled
  // CTA used for "Login".
  &__btn {
    height: 32px;
    padding: 0 14px;
    font-size: 13px;
    font-weight: 500;
    cursor: pointer;
    border: 1px solid #d1d5db;
    border-radius: 6px;
    transition: all 0.15s ease;

    &--primary {
      color: #fff;
      background: #1c66e5;
      border-color: #1c66e5;

      &:hover:not(:disabled) {
        background: #1a56c4;
        border-color: #1a56c4;
      }
      &:disabled {
        background: #9db8ec;
        border-color: #9db8ec;
        cursor: not-allowed;
        opacity: 0.7;
      }
    }

    &:not(&--primary) {
      color: #dc2626;
      background: #fff;
      border-color: #fecaca;

      &:hover {
        color: #b91c1c;
        border-color: #fca5a5;
        background: #fef2f2;
      }
    }
  }

  // Logged-in user identity block. Avatar (or initial placeholder) +
  // two-line stack of userName + userId so the operator can see both
  // the friendly name and the underlying IM account at a glance.
  &__user {
    display: inline-flex;
    align-items: center;
    gap: 8px;
    height: 36px;
    padding: 0 10px 0 8px;
    background: #f9fafb;
    border: 1px solid #e5e7eb;
    border-radius: 8px;
  }

  &__user-avatar {
    width: 28px;
    height: 28px;
    border-radius: 50%;
    object-fit: cover;
    flex-shrink: 0;
  }

  &__user-avatar--placeholder {
    display: flex;
    align-items: center;
    justify-content: center;
    color: #fff;
    font-size: 12px;
    font-weight: 600;
    background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%);
  }

  &__user-info {
    display: flex;
    flex-direction: column;
    min-width: 0;
    line-height: 1.2;
  }

  &__user-name {
    font-size: 12px;
    font-weight: 500;
    color: #1f2937;
    max-width: 110px;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  &__user-id {
    font-size: 10px;
    color: #9ca3af;
    font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
    max-width: 110px;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  // Hover profile card — absolute positioned dropdown below the
  // user chip. Shows avatar URL + userName + userId with inline edit.
  &__user {
    position: relative;
  }

  &__user-card {
    position: absolute;
    top: calc(100% + 8px);
    right: 0;
    z-index: 100;
    width: 320px;
    padding: 16px;
    background: #fff;
    border: 1px solid #e5e7eb;
    border-radius: 10px;
    box-shadow: 0 8px 24px rgba(0, 0, 0, 0.12);

    // Transparent bridge fills the 8px gap between the trigger and
    // the card so the mouse doesn't briefly leave the hover zone
    // while moving from the chip to the card — prevents flicker.
    &::before {
      content: '';
      position: absolute;
      top: -8px;
      left: 0;
      right: 0;
      height: 8px;
    }
  }

  &__user-card-body {
    display: flex;
    gap: 14px;
    margin-bottom: 14px;
  }

  &__user-card-avatar {
    width: 56px;
    height: 56px;
    border-radius: 50%;
    object-fit: cover;
    flex-shrink: 0;
  }

  &__user-card-avatar--placeholder {
    display: flex;
    align-items: center;
    justify-content: center;
    color: #fff;
    font-size: 20px;
    font-weight: 600;
    background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%);
  }

  &__user-card-fields {
    flex: 1;
    min-width: 0;
    display: flex;
    flex-direction: column;
    gap: 8px;
  }

  &__user-card-field {
    display: flex;
    flex-direction: column;
    gap: 2px;
  }

  &__user-card-label {
    font-size: 10px;
    font-weight: 600;
    color: #6b7280;
    text-transform: uppercase;
    letter-spacing: 0.04em;
  }

  &__user-card-input {
    height: 28px;
    padding: 0 8px;
    font-size: 12px;
    color: #1f2937;
    border: 1px solid #d1d5db;
    border-radius: 4px;

    &:focus {
      outline: none;
      border-color: #1c66e5;
      box-shadow: 0 0 0 2px rgba(28, 102, 229, 0.1);
    }
  }

  &__user-card-row {
    display: flex;
    align-items: center;
    gap: 6px;
  }

  &__user-card-id {
    font-size: 11px;
    color: #6b7280;
    font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
  }

  &__user-card-save {
    width: 100%;
    height: 32px;
    font-size: 13px;
    font-weight: 500;
    color: #fff;
    cursor: pointer;
    background: #1c66e5;
    border: none;
    border-radius: 6px;
    transition: background 0.15s ease;

    &:hover:not(:disabled) { background: #1a56c4; }
    &:disabled { background: #9db8ec; cursor: not-allowed; }
  }

  // userId + copy: single row at the top of the fields column.
  // No label — the bold monospace value is self-explanatory.
  &__user-card-idrow {
    display: flex;
    align-items: center;
    gap: 6px;
    margin-bottom: 2px;
  }

  &__user-card-id {
    flex: 1 1 auto;
    min-width: 0;
    font-size: 14px;
    color: #1f2937;
    font-weight: 600;
    font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  &__user-card-copy {
    flex-shrink: 0;
    padding: 4px 10px;
    font-size: 11px;
    color: #1c66e5;
    cursor: pointer;
    background: #eef4ff;
    border: none;
    border-radius: 4px;
    transition: all 0.15s ease;

    &:hover { background: #dde9ff; }
  }

  &__error {
    font-size: 12px;
    color: #b91c1c;
  }

  // Language toggle — bare text link, no button chrome. Sits in the
  // topbar rhythm as a quiet affordance, not a prominent control.
  &__lang-toggle {
    display: inline-flex;
    align-items: center;
    gap: 4px;
    min-width: unset !important;
    font-size: 13px;
    font-weight: 600;
    color: #6b7280;
    cursor: pointer;
    background: none;
    border: none;
    transition: color 0.15s ease;

    &:hover { color: #1c66e5; }
    &:focus-visible {
      outline: 2px solid #1c66e5;
      outline-offset: 2px;
      border-radius: 3px;
    }
  }

  &__lang-icon {
    width: 16px;
    height: 16px;
    flex-shrink: 0;
  }

  &__liveid {
    display: flex;
    align-items: center;
    gap: 6px;

    &--active {
      padding: 4px 6px 4px 12px;
      background: #f3f4f6;
      border: 1px solid #e5e7eb;
      border-radius: 6px;
    }
  }

  &__liveid-label {
    font-size: 12px;
    color: #6b7280;
    white-space: nowrap;
  }

  &__liveid-value {
    max-width: 200px;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
    font-size: 12px;
    color: #1f2937;
  }

  &__liveid-copy {
    flex-shrink: 0;
    padding: 2px 10px;
    font-size: 11px;
    color: #4b5563;
    cursor: pointer;
    background: #fff;
    border: 1px solid #d1d5db;
    border-radius: 4px;
    transition: all 0.15s ease;

    &:hover {
      color: #fff;
      background: #6b7280;
      border-color: #6b7280;
    }
  }

  &__liveid-hint {
    display: flex;
    align-items: center;
    gap: 8px;
  }

  // Onboarding hint buttons ("Start Live" / "Join Live"). Both use
  // the outlined style so the topbar reads as a coherent row of
  // secondary controls — the primary action (actually starting the
  // live) lives inside the example card, not in the topbar.
  &__liveid-hint-btn {
    height: 32px;
    min-width: 96px;
    padding: 0 14px;
    font-size: 12px;
    font-weight: 500;
    text-align: center;
    color: #1c66e5;
    cursor: pointer;
    background: #fff;
    border: 1px solid #b6d1fb;
    border-radius: 6px;
    transition: all 0.15s ease;

    &:hover {
      color: #fff;
      background: #1c66e5;
      border-color: #1c66e5;
    }

    &--alt {
      color: #4b5563;
      border-color: #d1d5db;

      &:hover {
        color: #1f2937;
        background: #f9fafb;
        border-color: #9ca3af;
      }
    }
  }
}
</style>
