<template>
  <div class="live-gift-h5-container" v-if="hasGifts">
    <!-- Only show "More Gift" button -->
    <div class="more-gift-button" @click="handleOpenDrawer">
      <div class="icon">
        <IconGift :size="20" />
      </div>
    </div>

    <!-- Gift card player -->
    <Teleport to="#app">
      <div class="gift-card-player-overlay">
        <GiftCardPlayer />
      </div>
    </Teleport>

    <!-- Gift drawer modal -->
    <Teleport to="#app">
      <Transition name="drawer">
        <div v-if="drawerVisible" class="live-gift-drawer-mask" @click="handleCloseDrawer">
          <div class="live-gift-drawer-wrapper" @click.stop>
            <LiveGiftDrawer />
          </div>
        </div>
      </Transition>
    </Teleport>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, Teleport } from "vue";
import { IconGift } from "@tencentcloud/uikit-base-component-vue3";
import { useLiveGiftState } from "../../../states/LiveGiftState";
import { useLiveListState } from "../../../states/LiveListState";
import LiveGiftDrawer from "./LiveGiftDrawer.vue";
import GiftCardPlayer from "./GiftCardPlayer.vue";

const { giftInfoList, getGiftList } = useLiveGiftState();
const { currentLive } = useLiveListState();

const drawerVisible = ref(false);

// Check if there are any gifts available
const hasGifts = computed(() => giftInfoList.value.length > 0);

const handleOpenDrawer = () => {
  drawerVisible.value = true;
};

const handleCloseDrawer = () => {
  drawerVisible.value = false;
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
</script>

<style scoped lang="scss">
.live-gift-h5-container {
  --gift-more-button-color: #7a65fa;

  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  height: 100%;
  padding: 8px;
  user-select: none;
  box-sizing: border-box;
}

.more-gift-button {
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: transform 0.2s ease;

  &:active {
    transform: scale(0.95);
  }

  .icon {
    display: flex;
    width: 32px;
    height: 32px;
    align-items: center;
    justify-content: center;
    border-radius: 50%;
    background: var(--gift-more-button-color);
  }
}

.live-gift-drawer-mask {
  display: flex;
  flex-direction: column;
  justify-content: flex-end;
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: var(--uikit-color-black-6);
  z-index: 99;

  @media screen and (orientation: landscape) {
    justify-content: flex-start;
    align-items: flex-end;
  }
}

.live-gift-drawer-wrapper {
  position: absolute;
  bottom: 0;
  width: 100%;
  height: 50%;

  @media screen and (orientation: landscape) {
    right: 0;
    bottom: unset;
    width: 50%;
    height: 100%;
  }
}

.gift-card-player-overlay {
  position: fixed;
  top: 40vh;
  left: 8px;
  z-index: 9998;
  pointer-events: none;
}

// Drawer transition styles
.drawer-enter-active,
.drawer-leave-active {
  transition: opacity 0.3s ease;

  .live-gift-drawer-wrapper {
    transition: transform 0.3s ease;
  }
}

.drawer-enter-from,
.drawer-leave-to {
  opacity: 0;

  .live-gift-drawer-wrapper {
    transform: translateY(100%);

    // Landscape mode: slide from right
    @media screen and (orientation: landscape) {
      transform: translateX(100%);
    }
  }
}

.drawer-enter-to,
.drawer-leave-from {
  opacity: 1;

  .live-gift-drawer-wrapper {
    transform: translateY(0);

    @media screen and (orientation: landscape) {
      transform: translateX(0);
    }
  }
}
</style>
