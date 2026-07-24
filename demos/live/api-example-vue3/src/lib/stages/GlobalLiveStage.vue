<template>
  <!--
    Globally-persistent LiveView stage.

    PRD §7 mandates a single LiveView instance per app (it renders the fixed
    `#atomicx-live-stream-content` container and binds the global player
    singleton). Mounting it inside each card meant the picture vanished the
    moment the operator switched to another card — defeating the purpose of
    multi-card flows (e.g. host runs `acceptApplication` on co-guest while
    still observing the audience pull-stream).

    Solution: hoist a single LiveView to App level so it survives card
    switches. The component itself is now room-aware (it gates
    `startPlayStream` / `startObserving` on `currentLive.liveId`), so we
    no longer need to defer mounting until joining a room. The
    `v-if="hasJoinedLive"` here is purely a UX choice — there is nothing
    meaningful to display before a room is joined, so we collapse the
    floating widget away. The `:key="currentLiveId"` is preserved so room
    switches still produce a visually clean re-render, even though the
    component would also handle the switch internally without it.

    Draggable: the title bar is the drag handle. After the first drag
    the widget's right/bottom anchor is replaced by inline top/left so
    the position survives across card switches and SDK events.
  -->
  <transition name="stage">
    <div
      ref="rootEl"
      v-if="visible && hasJoinedLive"
      :class="['global-stage', { 'global-stage--collapsed': collapsed }]"
      :style="containerStyle"
      @pointerdown="onPointerDown"
    >
      <div class="global-stage__bar">
        <span class="global-stage__title">
          {{ t('Stage.LiveTitle') }} · <code>{{ currentLiveId }}</code>
        </span>
        <button type="button" class="global-stage__btn" @click="collapsed = !collapsed">
          {{ collapsed ? t('Common.Expand') : t('Common.Collapse') }}
        </button>
        <button type="button" class="global-stage__btn" @click="visible = false">{{ t('Common.Hide') }}</button>
      </div>
      <div v-show="!collapsed" class="global-stage__body">
        <div class="global-stage__liveview">
          <LiveView :key="currentLiveId" />
        </div>
      </div>
    </div>
  </transition>

  <button
    v-if="!visible && hasJoinedLive"
    type="button"
    class="global-stage__restore"
    @click="visible = true"
  >
    {{ t('Stage.ShowLive') }}
  </button>
</template>

<script setup lang="ts">
import { computed, nextTick, ref, watch } from 'vue';
import { LiveView, useLiveListState } from 'tuikit-atomicx-vue3';
import { useUIKit } from '@tencentcloud/uikit-base-component-vue3';
import { useDraggable } from '../composables/useDraggable';

const { currentLive } = useLiveListState();
const currentLiveId = computed(() => currentLive.value?.liveId || '');
const hasJoinedLive = computed(() => !!currentLiveId.value);
const { t } = useUIKit();

// Local UI state — survives across card switches because the component is
// mounted at App level rather than per-card.
const visible = ref(true);
const collapsed = ref(false);
const rootEl = ref<HTMLElement | null>(null);

const { binding, reclamp } = useDraggable({
  handleSelector: '.global-stage__bar',
});
const { style: dragStyle, onPointerDown } = binding;

// Re-clamp position after expand/collapse so the widget never overflows
// the viewport (drag-time clamp uses the pre-toggle dimensions).
watch(collapsed, () => {
  nextTick(() => {
    if (rootEl.value) {
      reclamp(rootEl.value.offsetWidth, rootEl.value.offsetHeight);
    }
  });
});

const containerStyle = computed(() => {
  if (dragStyle.top && dragStyle.left) {
    return { top: dragStyle.top, left: dragStyle.left, right: 'auto', bottom: 'auto' };
  }
  return { right: '16px', bottom: '16px' };
});
</script>

<style scoped lang="scss">
.global-stage {
  position: fixed;
  z-index: 60;
  display: flex;
  flex-direction: column;
  width: 360px;
  background: #0b0d12;
  border: 1px solid #1f2937;
  border-radius: 10px;
  box-shadow: 0 12px 30px rgba(0, 0, 0, 0.25);
  overflow: hidden;
  user-select: none;

  &--collapsed { width: 240px; }

  &__bar {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 6px 10px;
    font-size: 12px;
    color: #d1d5db;
    background: #111827;
    cursor: grab;

    &:active { cursor: grabbing; }

    code {
      padding: 0 4px;
      color: #93c5fd;
      background: #1f2937;
      border-radius: 3px;
    }
  }

  &__title {
    flex: 1;
    overflow: hidden;
    white-space: nowrap;
    text-overflow: ellipsis;
  }

  &__btn {
    padding: 2px 8px;
    font-size: 11px;
    color: #cbd5e1;
    cursor: pointer;
    background: #1f2937;
    border: 1px solid #374151;
    border-radius: 4px;

    &:hover { color: #fff; background: #374151; }
  }

  &__body {
    position: relative;
    width: 100%;
    aspect-ratio: 16 / 9;
    background: #000;
    overflow: hidden;
  }

  &__liveview {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
  }

  &__restore {
    position: fixed;
    // Sit above the GlobalEventLogDock's 32px collapsed strip so the
    // button stays clickable when the dock is collapsed (and avoids
    // overlap with the strip's "点击展开 / 查看全部" affordance).
    right: 16px;
    bottom: 48px;
    // One level above the dock's z-index: 50, so even if the dock
    // grows in height in the future, the button stays on top.
    z-index: 60;
    padding: 6px 14px;
    font-size: 12px;
    color: #fff;
    cursor: pointer;
    background: #1c66e5;
    border: none;
    border-radius: 6px;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
  }
}

.stage-enter-active,
.stage-leave-active {
  transition: opacity 0.2s ease, transform 0.2s ease;
}
.stage-enter-from,
.stage-leave-to {
  opacity: 0;
  transform: translateY(8px);
}
</style>
