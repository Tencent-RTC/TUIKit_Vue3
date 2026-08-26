<template>
  <div class="live-gift-container" v-if="giftList.length">
    <div ref="giftRef" class="gift-item-container">
      <GiftItem
        v-for="item in displayGiftList"
        :key="item.giftID"
        :gift="item"
        :is-active="selectedGiftId === item.giftID"
        :combo-count="selectedGiftId === item.giftID ? comboCount : 0"
        :combo-progress="selectedGiftId === item.giftID ? comboProgress : 0"
        :combo-pulse="selectedGiftId === item.giftID ? comboPulse : 0"
        :size="88"
        @interact="handleGiftInteract"
      />
    </div>
    <Teleport to="body">
      <div
        ref="popupRef"
        class="popup-container"
        v-if="moreGiftVisible"
        :style="{
          bottom: `${popupPosition.bottom}px`,
          left: `${popupPosition.left}px`,
        }"
      >
        <LiveGiftPopupList :gift-category-list="giftInfoList" />
      </div>
    </Teleport>
    <div ref="moreRef" class="more-gift">
      <div class="icon">
        <IconGift :size="30" />
      </div>
      <span class="more-text">
        {{ t("LiveGift.More") }}
        <IconRightArrow class="arrow-icon" :size="12" />
      </span>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, watch, Teleport, nextTick } from "vue";
import {
  useUIKit,
  IconGift,
  IconRightArrow,
  TUIToast,
  TOAST_TYPE,
} from "@tencentcloud/uikit-base-component-vue3";
import { useLiveGiftState } from "../../../states/LiveGiftState";
import { useLiveListState } from "../../../states/LiveListState";
import LiveGiftPopupList from "./LiveGiftPopupList.vue";
import GiftItem from "../GiftItem.vue";

const { giftInfoList, sendGift, refreshGiftList } = useLiveGiftState();
const { currentLive } = useLiveListState();
const { t } = useUIKit();

// Constants
const GIFT_ITEM_WIDTH = 96; // Single gift item width including gap
const MORE_BUTTON_WIDTH = 100; // More button width
const CONTAINER_PADDING = 10; // Gap between items

const selectedGiftId = ref("");
const moreGiftVisible = ref(false);
const popupPosition = ref({ bottom: 0, left: 0 });
const maxDisplayGifts = ref(12); // Dynamic max display count

const giftRef = ref<HTMLDivElement>();
const popupRef = ref<HTMLDivElement>();
const moreRef = ref<HTMLDivElement>();

const giftList = computed(() => giftInfoList.value.flatMap((category) => category.giftList));

const displayGiftList = computed(() => {
  return giftList.value.slice(0, maxDisplayGifts.value);
});

// ── Combo engine ─────────────────────────────────────────
// Click a gift to accumulate combo; within COMBO_WINDOW_MS the count keeps
// increasing on each click, and the countdown progress (shown inside the item)
// keeps refilling. When the window expires (or a different gift is picked),
// the accumulated gifts are sent in one batch.
const COMBO_WINDOW_MS = 1500;
// Throttle: at most one gift send (and combo increment) per
// COMBO_SEND_INTERVAL_MS, so mashing the button within a second collapses
// into a single combo hit instead of one per tap.
const COMBO_SEND_INTERVAL_MS = 400;
// Idle reset window. Kept slightly longer than the 0.3s send cadence so a
// continuous tap never races with the reset timer — otherwise a valid hit
// landing on the 0.4s boundary could be cleared right before it counts.
// Matches COMBO_WINDOW_MS so the countdown bar hits empty exactly as the
// combo ends.
const COMBO_IDLE_RESET_MS = 1500;
const comboCount = ref(0);
const comboProgress = ref(0); // 100 → 0 over the window
let comboTimer: ReturnType<typeof setTimeout> | null = null;
let rafId: number | null = null;
let windowStart = 0;
let lastSendTs = 0;

function startProgress(duration: number) {
  windowStart = performance.now();
  const tick = (now: number) => {
    const remain = Math.max(0, 100 - ((now - windowStart) / duration) * 100);
    comboProgress.value = remain;
    if (remain > 0) {
      rafId = requestAnimationFrame(tick);
    }
  };
  rafId = requestAnimationFrame(tick);
}

function stopProgress() {
  if (rafId != null) {
    cancelAnimationFrame(rafId);
    rafId = null;
  }
  comboProgress.value = 0;
}

// Returns true when the send failure is purely a server-side frequency limit
// (error_code:3, "exceed frequency limit"). These happen under rapid tapping
// and are expected, so we intentionally do NOT surface them as a toast.
function isGiftFrequencyLimitError(error: unknown): boolean {
  if (!error) {
    return false;
  }
  const typedError = error as { message?: string; error_code?: number; code?: number };
  const message = typedError.message ?? String(error);
  return (
    /exceed frequency limit/i.test(message) ||
    typedError.error_code === 3 ||
    typedError.code === 3
  );
}

// Fire-and-forget send of a specific gift batch. This does NOT touch the
// current selection state, so switching gifts mid-combo won't clear the newly
// focused item (which previously required a second click to re-focus).
function sendGiftBatch(giftId: string, count: number) {
  if (!giftId || count <= 0) {
    return;
  }
  sendGift({ giftId, count }).catch((error) => {
    console.error("Send gift failed: ", error);
    // Swallow the toast for frequency-limit rejections — they are expected
    // under rapid tapping and would otherwise spam the user with noise.
    if (isGiftFrequencyLimitError(error)) {
      return;
    }
    TUIToast({
      type: TOAST_TYPE.ERROR,
      message: t("LiveGift.SendGiftFailed"),
    });
  });
}

// Combo pulse trigger: bump this key on every click so the count badge can
// replay its scale animation for a punchy "xN" feedback.
const comboPulse = ref(0);

// Two-stage interaction:
//   1st click on a gift  → only select it (show the "Send" button below).
//                           No countdown, no combo, nothing is sent yet.
//   click the selected   → confirm & send ONE gift immediately (count: 1) and
//     gift again            start/refresh the combo countdown. Each tap sends
//                           its own gift, so the barrage list can grow the
//                           "×N" combo live instead of one burst at the end.
const handleGiftInteract = (giftId: string) => {
  // Selecting a different gift than the current one.
  if (selectedGiftId.value !== giftId) {
    // The previously selected gift was already sent one-by-one on each tap,
    // so there is no buffered batch to flush — just switch selection.
    if (comboTimer) {
      clearTimeout(comboTimer);
      comboTimer = null;
    }
    stopProgress();
    selectedGiftId.value = giftId;
    comboCount.value = 0;
    lastSendTs = 0;
    return;
  }

  // Clicking the already-selected gift → confirm send / accumulate combo.
  // Send one gift immediately (count: 1) so the barrage grows its ×N live.
  const now = Date.now();
  if (now - lastSendTs < COMBO_SEND_INTERVAL_MS) {
    // Too soon after the previous hit — ignore this tap so rapid clicks within
    // one second only count as a single combo hit.
    return;
  }
  lastSendTs = now;
  comboCount.value += 1;
  comboPulse.value += 1;
  sendGiftBatch(giftId, 1);
  if (comboTimer) {
    clearTimeout(comboTimer);
  }
  stopProgress();
  startProgress(COMBO_WINDOW_MS);
  comboTimer = setTimeout(() => {
    resetCombo();
  }, COMBO_IDLE_RESET_MS);
};

function resetCombo() {
  if (comboTimer) {
    clearTimeout(comboTimer);
    comboTimer = null;
  }
  stopProgress();
  selectedGiftId.value = "";
  comboCount.value = 0;
}

// Calculate how many gift items can fit based on container width
const calculateMaxDisplayGifts = () => {
  if (!giftRef.value) return;

  const container = giftRef.value.parentElement as HTMLDivElement;
  if (!container) return;

  const containerWidth = container.offsetWidth;
  const availableWidth = containerWidth - MORE_BUTTON_WIDTH - CONTAINER_PADDING;

  // Calculate how many items can fit
  const itemsCanFit = Math.floor(availableWidth / GIFT_ITEM_WIDTH);

  // Ensure at least 1 item and max 12 items
  maxDisplayGifts.value = Math.max(1, Math.min(12, itemsCanFit));
};

/**
 * Calculate popup position based on "More" button position
 * Position the popup above the button, centered horizontally
 */
const calculatePopupPosition = () => {
  if (!moreRef.value || !popupRef.value) return;

  const moreRect = moreRef.value.getBoundingClientRect();
  const popupElement = popupRef.value;
  if (!popupElement) return;

  const popupRect = popupElement.getBoundingClientRect();
  const viewportWidth = window.innerWidth;
  const viewportHeight = window.innerHeight;

  // Calculate horizontal position: center of popup aligns with center of "More" button
  const moreCenterX = moreRect.left + moreRect.width / 2;
  const popupLeft = moreCenterX - popupRect.width / 2;

  // Calculate vertical position: popup appears above "More" button with some gap
  const gap = 20;
  const popupBottom = viewportHeight - moreRect.top + gap;

  // Adjust if popup would overflow viewport on the left or right
  const left = Math.max(
    10,
    Math.min(popupLeft, viewportWidth - popupRect.width - 10)
  );

  popupPosition.value = { bottom: popupBottom, left };
};

const handleClickOutside = (event: MouseEvent) => {
  const target = event.target as Node;

  // Check if clicking on "More" button - toggle the popup
  if (moreRef.value && moreRef.value.contains(target)) {
    resetCombo();
    moreGiftVisible.value = !moreGiftVisible.value;
    return;
  }

  // Check if clicking outside popup (when popup is visible)
  if (moreGiftVisible.value && popupRef.value) {
    const popupElement = popupRef.value;
    if (popupElement && !popupElement.contains(target)) {
      moreGiftVisible.value = false;
    }
  }

  // Check if clicking outside gift items area → reset any pending combo
  // (each tap was already sent immediately, so nothing else to flush).
  if (giftRef.value && !giftRef.value.contains(target)) {
    resetCombo();
  }
};

// Watch liveId and load gift list when it's available
watch(
  () => currentLive.value?.liveId,
  (liveId) => {
    if (liveId) {
      refreshGiftList();
    }
  },
  { immediate: true }
);

// Recalculate max display gifts when gift list changes
watch(giftList, (newList) => {
  if (newList.length > 0) {
    nextTick(() => {
      calculateMaxDisplayGifts();
    });
  }
});

// Watch popup visibility to recalculate position
watch(moreGiftVisible, async (visible) => {
  if (visible) {
    await nextTick();
    calculatePopupPosition();
  }
});

// Recalculate position on window resize and scroll
const handleResize = () => {
  calculateMaxDisplayGifts();
  if (moreGiftVisible.value) {
    calculatePopupPosition();
  }
};

onMounted(() => {
  document.addEventListener("mousedown", handleClickOutside);
  window.addEventListener("resize", handleResize);
  window.addEventListener("scroll", handleResize, true);

  // Initial calculation
  nextTick(() => {
    calculateMaxDisplayGifts();
  });
});

onUnmounted(() => {
  document.removeEventListener("mousedown", handleClickOutside);
  window.removeEventListener("resize", handleResize);
  window.removeEventListener("scroll", handleResize, true);
  if (comboTimer) {
    clearTimeout(comboTimer);
  }
  stopProgress();
});
</script>

<style scoped lang="scss">
.live-gift-container {
  position: relative;
  display: flex;
  flex-direction: row;
  width: 100%;
  height: 100%;
  gap: 10px;
  user-select: none;
  background-color: var(--bg-color-operate);
}

.gift-item-container {
  display: flex;
  flex-direction: row;
  align-items: center;
  justify-content: space-around;
  gap: 0;
  // The displayed gift count is computed to fit the container width, so no
  // horizontal overflow occurs. Allow overflow so the combo badge, which sits
  // above each item, is never clipped by the footer container.
  overflow: visible;
  width: 100%;
  height: 100%;
}

.more-gift {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  width: 100px;
  gap: 10px;

  .icon {
    display: flex;
    width: 50px;
    height: 50px;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    color: var(--text-color-primary);
  }

  span {
    cursor: pointer;
    font-size: 14px;
    white-space: nowrap;
  }

  .more-text {
    display: flex;
    align-items: center;
    gap: 4px;

    .arrow-icon {
      flex-shrink: 0;
    }
  }
}

.popup-container {
  position: fixed;
  z-index: 9999;
  width: 568px;
  height: 398px;
  padding: 4px;
  overflow: hidden;
  box-sizing: border-box;
  border: 1px solid var(--stroke-color-module);
  border-radius: 10px;
  background-color: var(--bg-color-operate);
}
</style>
