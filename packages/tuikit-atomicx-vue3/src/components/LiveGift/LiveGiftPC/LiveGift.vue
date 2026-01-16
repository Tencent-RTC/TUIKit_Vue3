<template>
  <div class="live-gift-container">
    <div ref="giftRef" class="gift-item-container">
      <GiftItem
        v-for="item in displayGiftList"
        :key="item.giftID"
        :gift="item"
        :is-active="selectedGiftId === item.giftID"
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
        <LiveGiftPopupList :giftList="giftList" />
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

const { giftInfoList, sendGift, getGiftList } = useLiveGiftState();
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

const handleGiftInteract = async (giftId: string, isCurrentlyActive: boolean) => {
  if (isCurrentlyActive) {
    // Send gift if already selected
    console.log("Sending gift:", giftId);
    try {
      await sendGift({
        giftId,
        count: 1,
      });
    } catch (error) {
      console.error("Send gift failed: ", error);
      TUIToast({
        type: TOAST_TYPE.ERROR,
        message: t("LiveGift.SendGiftFailed"),
      });
    } finally {
      selectedGiftId.value = "";
    }
  } else {
    // Select gift if not currently active
    selectedGiftId.value = giftId;
  }
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
    selectedGiftId.value = "";
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

  // Check if clicking outside gift items area
  if (giftRef.value && !giftRef.value.contains(target)) {
    selectedGiftId.value = "";
  }
};

// Watch liveId and load gift list when it's available
watch(
  () => currentLive.value?.liveId,
  (liveId) => {
    if (liveId) {
      getGiftList();
    }
  },
  { immediate: true }
);

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
});
</script>

<style scoped lang="scss">
.live-gift-container {
  --gift-more-button-color: #7a65fa;

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
  overflow: hidden;
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
    border-radius: 50%;
    background: var(--gift-more-button-color);
    cursor: pointer;
  }

  span {
    cursor: pointer;
    font-size: 14px;
    color: var(--text-color-primary);
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
  padding: 12px;
  overflow: hidden;
  box-sizing: border-box;
  border: 1px solid var(--stroke-color-module);
  border-radius: 10px;
  background-color: var(--bg-color-operate);
}
</style>
