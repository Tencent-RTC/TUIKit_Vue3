<template>
  <div class="gift-item" :style="{ width: itemSize }">
    <div
      :class="['gift-interactive', { 'gift-interactive-active': isActive }]"
      @click.stop="handleSendClick"
    >
      <div class="gift-image-wrapper">
        <img
          :src="gift.iconUrl"
          :alt="gift.name"
          :draggable="false"
          :class="{ 'gift-image--pulse': isActive && comboCount > 0 }"
          :style="{ animationName: pulseKey }"
        />
        <!-- Combo count badge (top-right of icon). The `:key` bumps on every
             click so the punch animation replays for each combo hit. -->
        <transition name="gift-combo-pop">
          <span
            v-if="isActive && comboCount >= 1"
            :key="comboPulse"
            class="gift-combo-badge"
          >
            <span class="gift-combo-badge__x">x</span>{{ comboCount }}
          </span>
        </transition>
      </div>
      <span class="gift-name" :style="{ fontSize: giftNameFontSize }">
        <span v-if="isActive" class="send-text">{{ t("LiveGift.Send") }}</span>
        <span v-else>{{ gift.name }}</span>
      </span>
      <!-- Combo countdown progress (inside item, below name) -->
      <div v-if="isActive && comboCount > 0" class="gift-combo-progress">
        <div
          class="gift-combo-progress__bar"
          :style="{ width: `${comboProgress}%` }"
        />
      </div>
    </div>
    <span class="gift-price" :style="{ fontSize: giftCoinsFontSize }">{{
      gift.coins
    }}</span>
  </div>
</template>

<script setup lang="ts">
import { computed } from "vue";
import { useUIKit } from "@tencentcloud/uikit-base-component-vue3";
import type { GiftInfo } from "@tencentcloud/tuiroom-engine-js";

interface GiftItemProps {
  gift: GiftInfo;
  isActive: boolean;
  comboCount?: number;
  comboProgress?: number;
  comboPulse?: number;
  size?: string | number;
  giftNameSize?: string | number;
  giftCoinsSize?: string | number;
}

const props = withDefaults(defineProps<GiftItemProps>(), {
  comboCount: 0,
  comboProgress: 0,
  comboPulse: 0,
  size: "100%",
  giftNameSize: 14,
  giftCoinsSize: 12,
});

interface GiftItemEmits {
  (e: "interact", giftId: string, currentState: boolean): void;
}

const emit = defineEmits<GiftItemEmits>();

const { t } = useUIKit();

// Toggle between two identical keyframes on each combo hit to force the icon
// pulse animation to restart (CSS won't replay the same animation-name).
const pulseKey = computed(() =>
  (props.comboPulse % 2 === 0 ? "gift-icon-pulse-a" : "gift-icon-pulse-b")
);

// Convert size to string with px unit if it's a number
const itemSize = computed(() => {
  return typeof props.size === "number" ? `${props.size}px` : props.size;
});

const giftNameFontSize = computed(() =>
  typeof props.giftNameSize === "number"
    ? `${props.giftNameSize}px`
    : props.giftNameSize
);

const giftCoinsFontSize = computed(() =>
  typeof props.giftCoinsSize === "number"
    ? `${props.giftCoinsSize}px`
    : props.giftCoinsSize
);

const handleSendClick = () => {
  emit("interact", props.gift.giftID, props.isActive);
};
</script>

<style scoped lang="scss">
.gift-item {
  display: flex;
  flex-direction: column;
  justify-content: flex-start;
  align-items: center;
  box-sizing: border-box;
  cursor: pointer;
  -webkit-tap-highlight-color: transparent;
  user-select: none;
}

.gift-interactive {
  position: relative;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  flex-shrink: 0;
  width: calc(100% - 6px);
  aspect-ratio: 4 / 5;
  border-radius: 10px;
  padding: 2px;
  box-sizing: border-box;
  transition: background-color 0.2s ease;
  -webkit-tap-highlight-color: transparent;
  user-select: none;

  &-active {
    background-color: var(--button-color-primary-default);
  }

  .gift-image-wrapper {
    position: relative;
    display: flex;
    align-items: center;
    justify-content: center;
    width: 100%;
    aspect-ratio: 76 / 74;
    border-radius: 8px;
    background-color: var(--bg-color-operate);

    img {
      width: 73.7%;
      aspect-ratio: 1 / 1;
      border-radius: 10px;
      padding: 4px;
      box-sizing: border-box;
    }

    // Icon pulse on each combo hit — quick scale up then settle
    .gift-image--pulse {
      animation-duration: 0.32s;
      animation-timing-function: cubic-bezier(0.34, 1.56, 0.64, 1);
      transform-origin: center;
    }
  }
}

@keyframes gift-icon-pulse-a {
  0% { transform: scale(1); }
  40% { transform: scale(1.22); }
  70% { transform: scale(0.94); }
  100% { transform: scale(1); }
}

@keyframes gift-icon-pulse-b {
  0% { transform: scale(1); }
  40% { transform: scale(1.22); }
  70% { transform: scale(0.94); }
  100% { transform: scale(1); }
}

// Combo count badge — bold italic "xN" with a punchy pop on every hit.
// Kept inside the icon's top-right corner (no negative offset) so it is never
// clipped by ancestor containers that use `overflow: hidden` (e.g. the footer).
.gift-combo-badge {
  position: absolute;
  top: 0;
  right: 0;
  min-width: 24px;
  height: 24px;
  padding: 0 6px;
  display: flex;
  align-items: baseline;
  justify-content: center;
  gap: 1px;
  border-radius: 999px;
  font-size: 16px;
  font-weight: 900;
  font-style: italic;
  line-height: 1;
  color: #fff;
  background: linear-gradient(135deg, #ffb03a, #ff5533 55%, #fe2c55);
  box-shadow:
    0 2px 10px rgba(254, 44, 85, 0.65),
    0 0 0 2px rgba(0, 0, 0, 0.18);
  text-shadow: 0 1px 2px rgba(0, 0, 0, 0.35);
  pointer-events: none;
  z-index: 2;

  &__x {
    font-size: 11px;
    font-weight: 800;
    align-self: center;
    opacity: 0.9;
  }
}

// Entering (first appearance) — pop in with rotation
.gift-combo-pop-enter-active {
  animation: gift-combo-pop 0.32s cubic-bezier(0.34, 1.56, 0.64, 1);
}

// Each subsequent hit (key change → enter again) reuses the same punch.
// The scale overshoot gives the "放大缩小" feedback the user asked for.
@keyframes gift-combo-pop {
  0% { transform: scale(0.4) rotate(-14deg); opacity: 0; }
  55% { transform: scale(1.45) rotate(6deg); opacity: 1; }
  75% { transform: scale(0.88) rotate(-2deg); }
  100% { transform: scale(1) rotate(0); opacity: 1; }
}

// Combo countdown progress bar — absolutely positioned near the bottom of the
// item so it never affects the item's layout height (no container resizing).
.gift-combo-progress {
  position: absolute;
  left: 8px;
  right: 8px;
  bottom: 5px;
  height: 3px;
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.22);
  overflow: hidden;
  pointer-events: none;

  &__bar {
    height: 100%;
    border-radius: 999px;
    background: linear-gradient(90deg, #ffd76a, #fe2c55);
    transition: width 0.05s linear;
  }
}

.gift-name {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  flex: 1 0 auto;
  padding: 2px 0;
  font-size: 14px;
  line-height: 1.3;
  color: var(--text-color-primary);

  span {
    white-space: nowrap;
    overflow: hidden;
    text-align: center;
    text-overflow: ellipsis;
    max-width: 100%;
  }

  .send-text {
    font-weight: 500;
    color: var(--text-color-button);
  }
}

.gift-price {
  display: flex;
  align-items: center;
  justify-content: center;
  flex: 1 0 auto;
  padding: 2px 0;
  font-size: 12px;
  font-weight: 400;
  line-height: 1.3;
  color: var(--text-color-secondary);
}
</style>
