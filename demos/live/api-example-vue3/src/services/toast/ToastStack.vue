<template>
  <!--
    Right-edge sliding toast stack. Mounted once at the App level so every
    SDK event observed by EventLog also gets a passive visual cue without
    coupling example files to UI concerns.

    Toasts that map to a recommended follow-up API (see `eventActions.ts`)
    become click-to-jump: clicking the body routes to that example card, while
    the explicit × button still dismisses without navigation.
  -->
  <transition-group name="toast" tag="div" class="toast-stack">
    <div
      v-for="t in items"
      :key="t.id"
      :class="[
        'toast',
        `toast--${t.source}`,
        `toast--role-${t.role}`,
        `toast--${t.level || 'info'}`,
        { 'toast--actionable': actionFor(t) },
      ]"
      role="status"
      @click="onToastClick(t)"
      @mouseenter="pauseToast(t.id)"
      @mouseleave="resumeToast(t.id)"
      @focusin="pauseToast(t.id)"
      @focusout="resumeToast(t.id)"
    >
      <div class="toast__head">
        <span :class="['toast__role', `role-${t.role}`]">{{ roleLabel(t.role) }}</span>
        <span class="toast__source">{{ t.source }}</span>
        <button
          type="button"
          class="toast__close"
          :aria-label="i18nT('Toast.Dismiss', '关闭')"
          @click.stop="dismissToast(t.id)"
        >×</button>
      </div>
      <div class="toast__title">{{ t.title }}</div>
      <div v-if="t.description" class="toast__desc">{{ t.description }}</div>
      <div v-if="actionFor(t)" class="toast__cta">
        → {{ i18nT('Toast.CtaPrefix', '跳转到') }} <code>{{ actionFor(t)!.apiId }}</code> · {{ actionFor(t)!.label }}
      </div>
    </div>
  </transition-group>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { useRouter } from 'vue-router';
import { useUIKit } from '@tencentcloud/uikit-base-component-vue3';
import { toastStore, dismissToast, pauseToast, resumeToast, type ToastEntry } from './store';
import { ROLE_LABEL, Role, roleI18nKey } from '../../lib/types';
import { resolveEventAction, type EventAction } from '../event-log/actions';

const items = computed(() => toastStore.items);
const router = useRouter();
const { t: i18nT } = useUIKit();

function roleLabel(role: string): string {
  return i18nT(roleI18nKey(role as Role), ROLE_LABEL[role as Role]) || role;
}

/**
 * Resolve a follow-up action for this toast under the role that produced it.
 * Returning a value also flips the toast styling to `actionable` (cursor +
 * hover hint), so this acts as both predicate and getter.
 *
 * Precedence: explicit `action` (manual flow toasts like "startLive
 * succeeded → enable camera") wins over event-name lookup. Role gating is
 * applied uniformly so an action with `roles:['host']` isn't surfaced to
 * audience-side toasts even when set explicitly.
 */
function actionFor(t: ToastEntry): EventAction | undefined {
  if (t.action) {
    if (t.action.roles && !t.action.roles.includes(t.role as Role)) {
      return undefined;
    }
    return t.action;
  }
  if (!t.event) {
    return undefined;
  }
  return resolveEventAction(t.event, t.role as Role);
}

function onToastClick(t: ToastEntry): void {
  const action = actionFor(t);
  if (!action) {
    // Informational toast — keep legacy click-to-dismiss for these.
    dismissToast(t.id);
    return;
  }
  router.push({ name: 'example', params: { state: action.state, apiId: action.apiId } });
  dismissToast(t.id);
}
</script>

<style scoped lang="scss">
.toast-stack {
  position: fixed;
  top: 70px;
  right: 16px;
  z-index: 9999;
  display: flex;
  flex-direction: column;
  gap: 10px;
  pointer-events: none;
}

.toast {
  width: 320px;
  padding: 10px 14px;
  background: #ffffff;
  border: 1px solid #e5e7eb;
  border-left: 4px solid #1c66e5;
  border-radius: 8px;
  box-shadow: 0 6px 18px rgba(0, 0, 0, 0.12);
  cursor: default;
  pointer-events: auto;
  transition: transform 0.2s ease, box-shadow 0.2s ease;
  
  // Default order for regular toasts. Higher order pushes them down.
  order: 1;

  &--actionable {
    cursor: pointer;
    background: #f0f4ff;
    border: 2px solid #1c66e5;
    border-left-width: 4px;
    box-shadow: 0 8px 24px rgba(28, 102, 229, 0.24);
    
    // Actionable toasts (with follow-up actions) appear at the top visually.
    // Lower order value keeps them at the top of the stack.
    order: 0;

    &:hover {
      transform: translateX(-4px);
      box-shadow: 0 12px 32px rgba(28, 102, 229, 0.32);
      background: #e8f0ff;
    }
  }

  // Source-specific accents map to the matrix categories.
  &--live-list { border-left-color: #5b3bdb; }
  &--live-audience { border-left-color: #2563eb; }
  &--live-seat { border-left-color: #d97706; }
  &--co-guest { border-left-color: #db2777; }
  &--co-host { border-left-color: #0ea5e9; }
  &--battle { border-left-color: #dc2626; }
  &--barrage { border-left-color: #16a34a; }
  &--live-gift { border-left-color: #f59e0b; }
  &--live-player { border-left-color: #6366f1; }
  &--live-monitor { border-left-color: #475569; }

  // Level variants — declared AFTER source accents so `success` (green)
  // wins regardless of which group fired the toast.
  &--success { border-left-color: #10b981; }

  &__head {
    display: flex;
    align-items: center;
    gap: 6px;
    margin-bottom: 4px;
    font-size: 11px;
    color: #6b7280;
  }

  &__role {
    padding: 0 6px;
    font-size: 10px;
    color: #fff;
    background: #6b7280;
    border-radius: 8px;

    &.role-host { background: #5b3bdb; }
    &.role-audience { background: #2563eb; }
    &.role-admin { background: #d97706; }
  }

  &__source {
    font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
  }

  &__close {
    margin-left: auto;
    padding: 0 6px;
    font-size: 14px;
    line-height: 1;
    color: #9ca3af;
    cursor: pointer;
    background: transparent;
    border: none;
    border-radius: 4px;

    &:hover { color: #1f2937; background: #f3f4f6; }
  }

  &__title {
    font-size: 13px;
    font-weight: 600;
    color: #1f2937;
    font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
    word-break: break-all;
  }

  &__desc {
    margin-top: 2px;
    font-size: 12px;
    color: #4b5563;
    word-break: break-all;
  }

  &__cta {
    margin-top: 6px;
    padding-top: 6px;
    font-size: 12px;
    color: #1c66e5;
    border-top: 1px dashed #e5e7eb;

    code {
      padding: 0 4px;
      margin: 0 2px;
      font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
      color: #1c66e5;
      background: #eef4ff;
      border-radius: 3px;
    }
  }
}

// Slide-in-from-right / slide-out-to-right.
.toast-enter-active,
.toast-leave-active {
  transition: transform 0.28s cubic-bezier(0.2, 0.8, 0.2, 1), opacity 0.28s ease;
}
.toast-enter-from {
  transform: translateX(110%);
  opacity: 0;
}
.toast-leave-to {
  transform: translateX(110%);
  opacity: 0;
}
.toast-move {
  transition: transform 0.28s ease;
}
</style>
