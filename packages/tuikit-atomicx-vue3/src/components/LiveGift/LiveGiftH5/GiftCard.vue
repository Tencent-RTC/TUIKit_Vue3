<template>
  <div class="gift-card">
    <div class="gift-card__capsule">
      <div class="gift-card__avatar">
        <img :src="sender.avatarUrl || DEFAULT_AVATAR_URL" :alt="sender.userName" />
      </div>
      <div class="gift-card__info">
        <div class="gift-card__name">{{ displayName }}</div>
        <div class="gift-card__action">{{ `${t('LiveGift.Send')} ${giftInfo.name}` }}</div>
      </div>
      <div class="gift-card__icon">
        <img :src="giftInfo.iconUrl" :alt="giftInfo.name" />
      </div>
    </div>
    <!-- Douyin-style combo: large white number placed OUTSIDE the capsule, to
         its right (not inside the dark pill). The number rolls up one by one
         (displayCount) and each step replays the bump via :key. -->
    <span v-if="displayCount > 1" :key="displayCount" class="gift-card__combo">
      <span class="gift-card__combo-x" :style="comboStyle">×</span><span class="gift-card__combo-num" :style="comboStyle">{{ displayCount }}</span>
    </span>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, watch, onUnmounted } from "vue";
import { useUIKit } from "@tencentcloud/uikit-base-component-vue3";
import type { GiftInfo, TUIUserInfo } from "@tencentcloud/tuiroom-engine-js";
import { useLoginState } from "../../../states/LoginState";

interface GiftCardProps {
  sender: TUIUserInfo;
  giftInfo: GiftInfo;
  giftCount: number;
}

const props = defineProps<GiftCardProps>();

const { t, theme } = useUIKit();
const { loginUserInfo } = useLoginState();

const DEFAULT_AVATAR_URL = "https://qcloudimg.tencent-cloud.cn/raw/7e7e51d4692c95e965538d7f65e0faf1.jpg";

// Display "Me" if sender is current user, otherwise display sender's name.
const displayName = computed(() => {
  const isMe = props.sender.userId === loginUserInfo.value?.userId;
  return isMe ? t("LiveGift.Me") : (props.sender.userName || props.sender.userId);
});

// Rolling counter: when the target giftCount jumps (e.g. 8 -> 13 from a burst
// of events in one render tick), animate the displayed number up one digit at
// a time so the combo reads as a continuous climb instead of a sudden jump.
const displayCount = ref(props.giftCount);
const STEP_MS = 55; // Per-digit climb speed (lower = snappier, less latency).
let rafId: number | null = null;
let lastStepTs = 0;

function tick(ts: number) {
  if (ts - lastStepTs >= STEP_MS) {
    lastStepTs = ts;
    displayCount.value += 1;
  }
  rafId = displayCount.value < props.giftCount
    ? requestAnimationFrame(tick)
    : null;
}

watch(
  () => props.giftCount,
  (target) => {
    if (target <= displayCount.value) {
      // New card or a reset — snap immediately.
      displayCount.value = target;
      return;
    }
    if (rafId === null) {
      lastStepTs = performance.now();
      rafId = requestAnimationFrame(tick);
    }
  },
  { immediate: true },
);

// Combo style driven by UIKit's reactive theme ref — no CSS selectors needed.
// Dark theme: crisp white with a soft shadow (matches original look).
// Light theme: a warm gold→orange gradient with a soft glow, reading as a
// premium "gift combo" instead of flat, harsh orange text.
const COMBO_STYLE_DARK: Record<string, string> = {
  color: '#FFFFFF',
  textShadow: '0 1px 3px rgba(0, 0, 0, 0.35)',
};
const COMBO_STYLE_LIGHT: Record<string, string> = {
  backgroundImage: 'linear-gradient(180deg, #FFE7A3 0%, #FFC24B 50%, #FF8A1F 100%)',
  WebkitBackgroundClip: 'text',
  backgroundClip: 'text',
  WebkitTextFillColor: 'transparent',
  color: 'transparent',
  filter: 'drop-shadow(0 1px 2px rgba(255, 138, 0, 0.3))',
};
const comboStyle = computed(() =>
  theme.value === 'dark' ? COMBO_STYLE_DARK : COMBO_STYLE_LIGHT,
);

onUnmounted(() => {
  if (rafId !== null) cancelAnimationFrame(rafId);
});
</script>

<style lang="scss" scoped>
// Capsule dimensions aligned with the PC bullet-head. border-radius is measured
// from the OUTER box, so the radius must equal half of (content height + vertical
// padding) — not just half the content height. We use content-box so the outer
// height = height + 2 * padding-y.
$capsule-height: 40px;
$capsule-padding-y: 5px;
$capsule-width: 184px;
$capsule-radius: ($capsule-height + $capsule-padding-y * 2) * 0.5;

.gift-card {
  display: inline-flex;
  position: relative;
  align-items: center;

  // Light, clean semi-transparent pill (no heavy frosted glass). The combo
  // number lives OUTSIDE this capsule (as a sibling) to mimic Douyin's layout,
  // matching the PC bullet-head.
  &__capsule {
    display: inline-flex;
    box-sizing: content-box;
    position: relative;
    align-items: center;
    flex-shrink: 0;
    width: $capsule-width;
    height: $capsule-height;
    padding: $capsule-padding-y 16px $capsule-padding-y 8px;
    border-radius: $capsule-radius;
    background: rgba(0, 0, 0, 0.35);
    border: none;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.18);
    user-select: none;
  }

  &__avatar {
    flex-shrink: 0;
    width: 30px;
    height: 30px;
    border-radius: 50%;
    overflow: hidden;
    border: 1.5px solid rgba(255, 255, 255, 0.6);

    img {
      width: 100%;
      height: 100%;
      object-fit: cover;
    }
  }

  &__info {
    display: flex;
    flex: 1;
    min-width: 0;
    flex-direction: column;
    gap: 2px;
    margin-left: 8px;
    margin-right: 7px;
  }

  &__name {
    max-width: 95px;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    font-size: 11px;
    font-weight: 600;
    color: #fff;
  }

  &__action {
    overflow: hidden;
    white-space: nowrap;
    text-overflow: ellipsis;
    font-size: 10px;
    color: rgba(255, 255, 255, 0.72);
  }

  // Gift icon just left of the combo number, inside the capsule.
  &__icon {
    flex-shrink: 0;
    width: 36px;
    height: 36px;
    margin-right: 2px;

    img {
      width: 100%;
      height: 100%;
      object-fit: contain;
      filter: drop-shadow(0 2px 4px rgba(0, 0, 0, 0.35));
    }
  }

  // Douyin-style combo number: clean white digits (no gradient pill, no glow),
  // pinned to the far right of the bullet-head, outside the capsule. Each step
  // replays a snappy bump for strong combo feedback.
  &__combo {
    display: inline-flex;
    align-items: baseline;
    margin-left: 5px;
    margin-top: 4px;
    font-style: italic;
    font-weight: 900;
    line-height: 1;
    transform-origin: left center;
    animation: gift-card-combo-pop 0.2s cubic-bezier(0.34, 1.7, 0.5, 1);
  }

  &__combo-x {
    font-size: 16px;
    margin-right: -1px;
    padding-right: 2px;
  }

  &__combo-num {
    font-size: 26px;
    padding-right: 6px;
  }
}

@keyframes gift-card-combo-pop {
  0% { transform: scale(1); }
  35% { transform: scale(1.4); }
  100% { transform: scale(1); }
}
</style>
