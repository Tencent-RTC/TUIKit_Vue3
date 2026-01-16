<template>
  <!-- Scroll container: handles content overflow and scrollbar styling -->
  <div class="gift-scroll-container">
    <!-- Grid layout container: defines 5-column grid layout for gift items -->
    <div class="gift-grid">
      <GiftItem
        v-for="item in giftList"
        :key="item.giftID"
        :gift="item"
        :is-active="selectedGiftId === item.giftID"
        :size="88"
        @interact="handleGiftInteract"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from "vue";
import {
  useUIKit,
  TUIToast,
  TOAST_TYPE,
} from "@tencentcloud/uikit-base-component-vue3";
import type { GiftInfo } from "@tencentcloud/tuiroom-engine-js";
import { useLiveGiftState } from "../../../states/LiveGiftState";
import GiftItem from "../GiftItem.vue";

interface LiveGiftPopupListProps {
  giftList: GiftInfo[];
}

defineProps<LiveGiftPopupListProps>();

const selectedGiftId = ref("");
const { sendGift } = useLiveGiftState();
const { t } = useUIKit();

const handleGiftInteract = async (
  giftId: string,
  isCurrentlyActive: boolean
) => {
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
</script>

<style scoped lang="scss">
.gift-scroll-container {
  width: 100%;
  height: 100%;
  padding: 10px 4px;
  overflow-x: hidden;
  overflow-y: auto;
  user-select: none;
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
