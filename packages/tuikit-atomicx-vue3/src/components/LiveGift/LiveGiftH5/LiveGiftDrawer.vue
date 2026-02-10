<template>
  <div class="live-gift-drawer-container">
    <!-- Header with tabs -->
    <div class="drawer-header">
      <div class="tab-container">
        <div
          v-for="category in giftCategories"
          :key="category.categoryID"
          class="tab-item"
          :class="{ active: activeCategoryId === category.categoryID }"
          @click="handleTabClick(category.categoryID)"
        >
          {{ category.name }}
        </div>
      </div>
    </div>

    <!-- Content -->
    <div ref="contentRef" class="gift-content">
      <div class="gift-list" :style="{ gridTemplateColumns: gridTemplateColumns }">
        <GiftItem
          v-for="item in currentGiftList"
          :key="item.giftID"
          :gift="item"
          :is-active="selectedGiftId === item.giftID"
          :gift-name-size="12"
          :gift-coins-size="10"
          :size="giftItemSize"
          @interact="handleGiftInteract"
        />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, nextTick, watch } from "vue";
import { useUIKit, TUIToast, TOAST_TYPE } from "@tencentcloud/uikit-base-component-vue3";
import { useLiveGiftState } from "../../../states/LiveGiftState";
import GiftItem from "../GiftItem.vue";

const { t } = useUIKit();
const { giftInfoList, sendGift } = useLiveGiftState();

const selectedGiftId = ref("");
const contentRef = ref<HTMLDivElement>();
const gridTemplateColumns = ref("repeat(3, 1fr)");
const giftItemSize = ref(80);
const activeCategoryId = ref("");

// Gift categories from state
const giftCategories = computed(() => giftInfoList.value);

// Current category's gift list
const currentGiftList = computed(() => {
  const category = giftCategories.value.find(c => c.categoryID === activeCategoryId.value);
  return category?.giftList || [];
});

// Initialize active category when categories load
watch(giftCategories, (categories) => {
  if (categories.length > 0 && !activeCategoryId.value) {
    activeCategoryId.value = categories[0].categoryID;
  }
}, { immediate: true });

const handleTabClick = (categoryId: string) => {
  activeCategoryId.value = categoryId;
  selectedGiftId.value = "";
};

// Constants for calculation
const DEFAULT_GIFT_ITEM_SIZE = 96; // Default gift item size
const MIN_COLUMNS = 4; // Minimum columns to display
const HORIZONTAL_PADDING = 24; // Content left + right padding (12px * 2)
const LIST_PADDING = 8; // List left + right padding (4px * 2)
const GAP = 12; // Gap between items

// Calculate columns and item size based on container width
const calculateLayout = () => {
  if (!contentRef.value) return;
  
  const containerWidth = contentRef.value.offsetWidth;
  const availableWidth = containerWidth - HORIZONTAL_PADDING - LIST_PADDING;
  
  // Calculate: (width + gap) * n - gap <= availableWidth
  // Solve for n: n = floor((availableWidth + gap) / (width + gap))
  const columnsCanFit = Math.floor((availableWidth + GAP) / (DEFAULT_GIFT_ITEM_SIZE + GAP));
  
  if (columnsCanFit >= MIN_COLUMNS) {
    // Container can fit minimum columns with default size
    const columns = columnsCanFit;
    gridTemplateColumns.value = `repeat(${columns}, 1fr)`;
    giftItemSize.value = DEFAULT_GIFT_ITEM_SIZE;
  } else {
    // Container cannot fit minimum columns, need to shrink item size
    // Calculate: (itemSize + gap) * MIN_COLUMNS - gap = availableWidth
    // Solve for itemSize: itemSize = (availableWidth + gap) / MIN_COLUMNS - gap
    const shrunkItemSize = Math.floor((availableWidth + GAP) / MIN_COLUMNS - GAP);
    gridTemplateColumns.value = `repeat(${MIN_COLUMNS}, 1fr)`;
    giftItemSize.value = Math.max(60, shrunkItemSize); // Ensure minimum 60px for usability
  }
};

const handleGiftInteract = async (giftId: string, isCurrentlyActive: boolean) => {
  if (isCurrentlyActive) {
    // Send gift if already selected
    try {
      await sendGift({
        giftId,
        count: 1,
      });
    } catch (error) {
      console.error("Send gift failed:", error);
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

const handleResize = () => {
  calculateLayout();
};

onMounted(() => {
  window.addEventListener("resize", handleResize);
  window.addEventListener("orientationchange", handleResize);
  
  // Initial calculation
  nextTick(() => {
    calculateLayout();
  });
});

onUnmounted(() => {
  selectedGiftId.value = "";
  window.removeEventListener("resize", handleResize);
  window.removeEventListener("orientationchange", handleResize);
});
</script>

<style scoped lang="scss">
.live-gift-drawer-container {
  display: flex;
  flex-direction: column;
  width: 100%;
  height: 100%;
  background: var(--bg-color-operate);
  padding-bottom: env(safe-area-inset-bottom);
  border-top-left-radius: 20px;
  box-sizing: border-box;
  -webkit-tap-highlight-color: transparent;

  @media screen and (orientation: portrait){
    border-top-right-radius: 20px;
  }

  @media screen and (orientation: landscape){
    border-bottom-left-radius: 20px;
  }

  .drawer-header {
    position: relative;
    display: flex;
    align-items: center;
    flex-shrink: 0;
    width: 100%;
    height: 48px;
    padding: 8px 20px 0 20px;
    border-bottom: 1px solid var(--stroke-color-primary);
    
    .tab-container {
      display: flex;
      align-items: end;
      justify-content: center;
      height: 100%;
      box-sizing: border-box;

      .tab-item {
        position: relative;
        display: flex;
        align-items: center;
        justify-content: center;
        height: 100%;
        font-size: 14px;
        font-weight: 400;
        margin-right: 20px;
        color: var(--text-color-secondary);
        cursor: pointer;
        transition: color 0.2s ease;
        white-space: nowrap;
        
        &.active {
          font-weight: 500;
          color: var(--text-color-primary);
          
          &::after {
            content: "";
            position: absolute;
            bottom: 0;
            left: 50%;
            transform: translateX(-50%);
            width: 55px;
            height: 2px;
            background: var(--text-color-primary);
            border-radius: 1px;
          }
        }
        
        &:active {
          opacity: 0.7;
        }
      }
    }
  }

  .gift-content {
    flex: 1;
    width: 100%;
    overflow-x: hidden;
    overflow-y: auto;
    padding: 16px 0px;
    
    /* Hide scrollbar */
    scrollbar-width: none;
    -ms-overflow-style: none;
    
    &::-webkit-scrollbar {
      display: none;
    }
  }

  .gift-list {
    display: grid;
    grid-auto-rows: auto;
    gap: 6px;
    width: 100%;
    justify-items: center;
    align-items: center;
    padding: 4px;
  }
}
</style>
