<template>
  <!-- Column layout: a category tab bar on top, then the scrollable gift grid -->
  <div class="gift-popup">
    <!-- Category tabs: switch which gift group is shown in the grid below -->
    <div class="gift-category-tabs">
      <div
        v-for="category in giftCategories"
        :key="category.categoryID"
        class="gift-category-tab"
        :class="{ active: activeCategoryId === category.categoryID }"
        @click="handleTabClick(category.categoryID)"
      >
        {{ category.name }}
      </div>
    </div>

    <!-- Scroll container: handles content overflow and scrollbar styling -->
    <div class="gift-scroll-container">
      <!-- Grid layout container: defines 5-column grid layout for gift items -->
      <div class="gift-grid">
        <GiftItem
          v-for="item in currentGiftList"
          :key="item.giftID"
          :gift="item"
          :is-active="selectedGiftId === item.giftID"
          :combo-count="selectedGiftId === item.giftID ? comboCount : 0"
          :combo-progress="selectedGiftId === item.giftID ? comboProgress : 0"
          :combo-pulse="selectedGiftId === item.giftID ? comboPulse : 0"
          :size="80"
          @interact="handleGiftInteract"
        />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onUnmounted } from "vue";
import {
  useUIKit,
  TUIToast,
  TOAST_TYPE,
} from "@tencentcloud/uikit-base-component-vue3";
import type { GiftCategory } from "@tencentcloud/tuiroom-engine-js";
import { useLiveGiftState } from "../../../states/LiveGiftState";
import GiftItem from "../GiftItem.vue";

interface LiveGiftPopupListProps {
  giftCategoryList: GiftCategory[];
}

const props = defineProps<LiveGiftPopupListProps>();

// ── Category grouping ─────────────────────────────────────
// Gifts arrive pre-grouped by category; show one group at a time behind a tab
// bar so the panel stays compact instead of one long flat list.
const giftCategories = computed(() => props.giftCategoryList);
const activeCategoryId = ref("");

// Default to the first category once data loads.
watch(
  giftCategories,
  (categories) => {
    if (categories.length > 0 && !activeCategoryId.value) {
      activeCategoryId.value = categories[0].categoryID;
    }
  },
  { immediate: true },
);

// Gifts of the currently selected category.
const currentGiftList = computed(() => {
  const category = giftCategories.value.find(
    (c) => c.categoryID === activeCategoryId.value,
  );
  return category?.giftList || [];
});

// Switching category drops the current selection/combo so a gift from another
// group is never left highlighted.
function handleTabClick(categoryId: string) {
  if (activeCategoryId.value === categoryId) return;
  activeCategoryId.value = categoryId;
  if (comboTimer) {
    clearTimeout(comboTimer);
    comboTimer = null;
  }
  stopProgress();
  selectedGiftId.value = "";
  comboCount.value = 0;
}

const { sendGift } = useLiveGiftState();
const { t } = useUIKit();

// ── Independent combo engine ─────────────────────────────
// The popup keeps its OWN selection/combo state, fully isolated from the
// always-on shelf panel, so selecting a gift here never highlights an item
// on the docked panel and vice versa.
const COMBO_WINDOW_MS = 1000;
const selectedGiftId = ref("");
const comboCount = ref(0);
const comboProgress = ref(0);
const comboPulse = ref(0);
let comboTimer: ReturnType<typeof setTimeout> | null = null;
let rafId: number | null = null;
let windowStart = 0;

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

// Fire-and-forget send that does not mutate the current selection state.
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

function flushCombo() {
  // Each tap already sent its own gift (count: 1) immediately, so there is
  // nothing buffered to flush — just clear the combo/selection state.
  if (comboTimer) {
    clearTimeout(comboTimer);
    comboTimer = null;
  }
  stopProgress();
  selectedGiftId.value = "";
  comboCount.value = 0;
}

// Two-stage interaction: 1st click selects (shows "Send"), clicking the
// selected gift again confirms sending and starts the combo countdown.
const handleGiftInteract = (giftId: string) => {
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
    return;
  }

  // Clicking the already-selected gift → confirm send / accumulate combo.
  // Send one gift immediately (count: 1) so the barrage grows its ×N live.
  comboCount.value += 1;
  comboPulse.value += 1;
  sendGiftBatch(giftId, 1);
  if (comboTimer) {
    clearTimeout(comboTimer);
  }
  stopProgress();
  startProgress(COMBO_WINDOW_MS);
  comboTimer = setTimeout(() => {
    flushCombo();
  }, COMBO_WINDOW_MS);
};

onUnmounted(() => {
  if (comboTimer) {
    clearTimeout(comboTimer);
  }
  stopProgress();
});
</script>

<style scoped lang="scss">
.gift-popup {
  display: flex;
  flex-direction: column;
  width: 100%;
  height: 100%;
  user-select: none;
  box-sizing: border-box;
}

// Category tab bar — horizontally scrollable if many categories exist.
.gift-category-tabs {
  display: flex;
  align-items: center;
  gap: 20px;
  flex-shrink: 0;
  padding: 6px 12px;
  overflow-x: auto;
  border-bottom: 1px solid var(--stroke-color-primary);
  scrollbar-width: none;

  &::-webkit-scrollbar {
    display: none;
  }
}

.gift-category-tab {
  position: relative;
  flex-shrink: 0;
  font-size: 14px;
  font-weight: 400;
  line-height: 28px;
  color: var(--text-color-secondary);
  cursor: pointer;
  white-space: nowrap;
  transition: color 0.2s ease;

  &.active {
    font-weight: 500;
    color: var(--text-color-primary);

    &::after {
      content: "";
      position: absolute;
      bottom: -1px;
      left: 50%;
      transform: translateX(-50%);
      width: 36px;
      height: 2px;
      background: var(--text-color-primary);
      border-radius: 1px;
    }
  }
}

.gift-scroll-container {
  flex: 1;
  min-height: 0;
  width: 100%;
  padding: 10px 4px;
  overflow-x: hidden;
  overflow-y: auto;
  box-sizing: border-box;

  &::-webkit-scrollbar {
    width: 4px;
  }

  &::-webkit-scrollbar-track {
    background: transparent;
  }

  &::-webkit-scrollbar-thumb {
    background-color: var(--scroll-bar-color-default);
    border-radius: 3px;
  }
}

.gift-grid {
  display: grid;
  grid-template-columns: repeat(5, 88px);
  grid-auto-rows: auto;
  justify-content: space-evenly;
  gap: 10px;
}
</style>
