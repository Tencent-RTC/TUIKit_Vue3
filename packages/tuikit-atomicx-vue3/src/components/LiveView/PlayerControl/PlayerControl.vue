<template>
  <Transition name="player-control">
    <div
      v-show="controlBarVisible"
      ref="playerControlRef"
      :class="[
        'playback-controls',
        isMobile ? 'mobile-mode' : 'pc-mode',
        { 'mobile-landscape-mode': props.isLandscapeStyleMode },
      ]"
    >
      <div class="control-buttons">
        <div class="left-controls">
          <ControlBarItem
            v-for="item in leftControlItems"
            :key="item.key"
            :item="item"
          />
        </div>
        <div class="center-controls">
          <ControlBarItem
            v-for="item in centerControlItems"
            :key="item.key"
            :item="item"
          />
        </div>
        <div class="right-controls">
          <ControlBarItem
            v-for="item in rightControlItems"
            :key="item.key"
            :item="item"
          />
        </div>
      </div>
    </div>
  </Transition>
</template>

<script setup lang="ts">
import {
  computed,
  onMounted,
  ref,
  onBeforeUnmount,
} from 'vue';
import { isMobile } from '../../../utils';
import ControlBarItem from './ControlBarItem.vue';
import { usePlayerControlState } from './PlayerControlState';
import { PlayerControlButton } from '../../../types/player';
import type { CustomButton } from '../../../types/player';
import type { ControlItem } from './types';

const {
  controlBarVisible,
  buttons,
  customButtons,
  cleanup,
  setControlBarVisible,
  startAutoHide,
  stopAutoHide,
} = usePlayerControlState();

const props = defineProps<{
  isLandscapeStyleMode?: boolean;
}>();

const playerControlRef = ref<HTMLElement>();

type ControlZone = 'left' | 'center' | 'right';
type CustomButtonPlacement = 'prepend' | 'append' | 'before' | 'after';

type NormalizedCustomButton = {
  key: string;
  button: CustomButton;
  zone: ControlZone;
  placement: CustomButtonPlacement;
  anchor?: PlayerControlButton;
};

const BUILTIN_CONTROL_LAYOUT: Record<ControlZone, PlayerControlButton[]> = {
  left: [PlayerControlButton.Play],
  center: [],
  right: [
    PlayerControlButton.Resolution,
    PlayerControlButton.Volume,
    PlayerControlButton.PictureInPicture,
    PlayerControlButton.Fullscreen,
  ],
};

const BUILTIN_CONTROL_ZONE_MAP: Record<PlayerControlButton, ControlZone> = {
  [PlayerControlButton.Play]: 'left',
  [PlayerControlButton.Resolution]: 'right',
  [PlayerControlButton.Volume]: 'right',
  [PlayerControlButton.PictureInPicture]: 'right',
  [PlayerControlButton.Fullscreen]: 'right',
};

const toCustomControlItem = (button: NormalizedCustomButton): ControlItem => ({
  kind: 'custom',
  key: button.key,
  button: button.button,
});

const normalizeCustomButton = (button: CustomButton): NormalizedCustomButton => {
  const position = button.position ?? 'end';
  const key = `custom-${button.id}`;

  if (position === 'start') {
    return {
      key,
      button,
      zone: 'left',
      placement: 'prepend',
    };
  }

  if (position === 'end') {
    return {
      key,
      button,
      zone: 'right',
      placement: 'append',
    };
  }

  if ('slot' in position) {
    return {
      key,
      button,
      zone: position.slot,
      placement: 'append',
    };
  }

  return {
    key,
    button,
    zone: BUILTIN_CONTROL_ZONE_MAP[position.anchor],
    placement: position.position,
    anchor: position.anchor,
  };
};

const normalizedCustomButtons = computed<NormalizedCustomButton[]>(() =>
  customButtons.value
    .filter((button: CustomButton) => button.visible !== false)
    .map(normalizeCustomButton),
);

const buildControlItems = (zone: ControlZone): ControlItem[] => {
  const builtinButtons = BUILTIN_CONTROL_LAYOUT[zone];
  const builtinButtonSet = new Set(builtinButtons);
  const prependItems: ControlItem[] = [];
  const appendItems: ControlItem[] = [];
  const beforeAnchorItems = new Map<PlayerControlButton, ControlItem[]>();
  const afterAnchorItems = new Map<PlayerControlButton, ControlItem[]>();

  normalizedCustomButtons.value.forEach((button) => {
    if (button.zone !== zone) {
      return;
    }

    if (button.placement === 'prepend') {
      prependItems.push(toCustomControlItem(button));
      return;
    }

    if (button.placement === 'append') {
      appendItems.push(toCustomControlItem(button));
      return;
    }

    if (!button.anchor || !builtinButtonSet.has(button.anchor)) {
      appendItems.push(toCustomControlItem(button));
      return;
    }

    const targetMap = button.placement === 'before' ? beforeAnchorItems : afterAnchorItems;
    const targetList = targetMap.get(button.anchor) ?? [];
    targetList.push(toCustomControlItem(button));
    targetMap.set(button.anchor, targetList);
  });

  const items: ControlItem[] = [...prependItems];

  builtinButtons.forEach((buttonId) => {
    items.push(...(beforeAnchorItems.get(buttonId) ?? []));

    if (buttons[buttonId].visible) {
      items.push({
        kind: 'default',
        key: `default-${buttonId}`,
        id: buttonId,
      });
    }

    items.push(...(afterAnchorItems.get(buttonId) ?? []));
  });

  items.push(...appendItems);

  return items;
};

const leftControlItems = computed(() => buildControlItems('left'));
const centerControlItems = computed(() => buildControlItems('center'));
const rightControlItems = computed(() => buildControlItems('right'));

const onMouseOver = () => {
  stopAutoHide();
  setControlBarVisible(true);
};

const onMouseOut = () => {
  startAutoHide();
};

const setupParentMouseListener = () => {
  if (!isMobile && playerControlRef.value) {
    const { parentElement } = playerControlRef.value;
    if (parentElement) {
      parentElement.addEventListener('mouseover', onMouseOver);
      parentElement.addEventListener('mouseout', onMouseOut);
    }
  }
};

const removeParentMouseListener = () => {
  if (!isMobile && playerControlRef.value) {
    const { parentElement } = playerControlRef.value;
    if (parentElement) {
      parentElement.removeEventListener('mouseover', onMouseOver);
      parentElement.removeEventListener('mouseout', onMouseOut);
    }
  }
};

const touchStartCoords = ref<{ x: number; y: number } | null>(null);

// Touch distance calculation
const calculateTouchDistance = (start: { x: number; y: number }, end: Touch) => Math.sqrt((end.clientX - start.x) ** 2 + (end.clientY - start.y) ** 2);

const isPlayerControlTarget = (target: Node) => playerControlRef.value?.contains(target) || false;

const isLiveCoreViewTarget = (target: Node) => {
  const container = document.getElementById('live-core-view-container');
  return container?.contains(target) || false;
};

// Handle the touch in the player control area
const handlePlayerControlTouch = () => {
  stopAutoHide();
  startAutoHide();
};

// Handle the touch in the core view area of the live broadcast
const handleLiveCoreViewTouch = () => {
  if (controlBarVisible.value) {
    setControlBarVisible(false);
  } else {
    setControlBarVisible(true);
    startAutoHide();
  }
};

const handleScreenTouchStart = (event: TouchEvent) => {
  if (event.touches.length === 1) {
    const touch = event.touches[0];
    touchStartCoords.value = {
      x: touch.clientX,
      y: touch.clientY,
    };
  }
};

const handleScreenTouchMove = (event: TouchEvent) => {
  if (playerControlRef.value && playerControlRef.value.contains(event.target as Node)) {
    stopAutoHide();
  }
};

const handleScreenTouchEnd = (event: TouchEvent) => {
  if (!touchStartCoords.value) {
    return;
  }

  const touchEnd = event.changedTouches[0];
  const distance = calculateTouchDistance(touchStartCoords.value, touchEnd);

  const MAX_CLICK_DISTANCE = 20;
  if (distance > MAX_CLICK_DISTANCE) {
    touchStartCoords.value = null;
    return;
  }

  const target = event.target as Node;

  if (isPlayerControlTarget(target)) {
    handlePlayerControlTouch();
  } else if (isLiveCoreViewTarget(target)) {
    handleLiveCoreViewTouch();
  } else {
    setControlBarVisible(false);
  }

  touchStartCoords.value = null;
};

const setupTouchEventListeners = () => {
  if (isMobile) {
    document.addEventListener('touchstart', handleScreenTouchStart, true);
    document.addEventListener('touchmove', handleScreenTouchMove, true);
    document.addEventListener('touchend', handleScreenTouchEnd, true);
  }
};

const removeTouchEventListeners = () => {
  if (isMobile) {
    document.removeEventListener('touchstart', handleScreenTouchStart, true);
    document.removeEventListener('touchmove', handleScreenTouchMove, true);
    document.removeEventListener('touchend', handleScreenTouchEnd, true);
  }
};

const cleanupEventListeners = () => {
  removeTouchEventListeners();
  removeParentMouseListener();
  stopAutoHide();
};

onMounted(() => {
  setupTouchEventListeners();
  setupParentMouseListener();
});

onBeforeUnmount(() => {
  cleanupEventListeners();
  cleanup();
});
</script>

<style scoped lang="scss">
.playback-controls {
  background: #000000;
  padding: 12px 0;
  display: flex;
  width: calc(100% + 1px); // Solve the problem of 1px deviation during absolute positioning
  align-items: center;
  box-sizing: border-box;
}

.pc-mode {
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  z-index: 10;

  .control-buttons {
    display: flex;
    justify-content: space-between;
    padding: 0 32px;
  }
}

.mobile-mode {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  z-index: 999999;
  pointer-events: auto;
}

@media screen and (orientation: portrait) {
  .mobile-landscape-mode {
    position: fixed;
    bottom: unset;
    transform: rotate(90deg);
    transform-origin: left bottom;
    top: -60px;
    bottom: unset;
    width: 100vh;
    padding-right: 16px;
  }

  .mobile-landscape-mode {
    &.player-control-enter-active,
    &.player-control-leave-active {
      transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
      will-change: transform, opacity;
    }

    &.player-control-enter-from {
      opacity: 0;
      transform: rotate(90deg) translateY(60px);
    }

    &.player-control-enter-to {
      opacity: 1;
      transform: rotate(90deg) translateY(0);
    }

    &.player-control-leave-from {
      opacity: 1;
      transform: rotate(90deg) translateY(0);
    }

    &.player-control-leave-to {
      opacity: 0;
      transform: rotate(90deg) translateY(60px);
    }
  }
}

.control-buttons {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  width: 100%;
  pointer-events: all;
}

.left-controls,
.center-controls,
.right-controls {
  display: flex;
  align-items: center;
  gap: 16px;
}

.left-controls,
.right-controls {
  min-width: 0;
}

.center-controls {
  flex: 1;
  justify-content: center;
  min-width: 0;
}

.right-controls {
  justify-content: flex-end;
}

.player-control-enter-active,
.player-control-leave-active {
  transition: all 0.5s cubic-bezier(0.4, 0, 0.2, 1);
  will-change: transform, opacity;
}

.player-control-enter-from {
  opacity: 0;
  transform: translateY(100%);
}

.player-control-enter-to {
  opacity: 1;
  transform: translateY(0);
}

.player-control-leave-from {
  opacity: 1;
  transform: translateY(0);
}

.player-control-leave-to {
  opacity: 0;
  transform: translateY(100%);
}
</style>

<style lang="scss">
@import './PlayerControl.module.scss';
</style>
