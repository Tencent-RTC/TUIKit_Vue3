<template>
  <div class="gift-card-player-container">
    <TransitionGroup name="gift-card">
      <div
        v-for="item in displayList"
        :key="item.id"
        class="gift-card-item"
      >
        <GiftCard
          :sender="item.gift.sender"
          :giftInfo="item.gift.giftInfo"
          :giftCount="item.gift.giftCount"
        />
      </div>
    </TransitionGroup>
  </div>
</template>

<script setup lang="ts">
import { useGiftCardPlayer } from "./useGiftCardPlayer";
import GiftCard from "./GiftCard.vue";

const { displayList } = useGiftCardPlayer({
  displayDuration: 1500, // Never auto hide
  maxDisplayCount: 3, // Maximum cards to display at once
});
</script>

<style scoped lang="scss">
.gift-card-player-container {
  display: flex;
  flex-direction: column;
  gap: 12px;
  position: relative;

  .gift-card-item {
    transition: opacity 0.3s ease, transform 0.3s ease;
  }
}

// Gift card transition styles
.gift-card-enter-active {
  transition: opacity 0.4s ease-out, transform 0.4s ease-out;
}

.gift-card-leave-active {
  transition: opacity 0.4s ease-in, transform 0.4s ease-in;
  position: absolute;
  width: 100%;
}

.gift-card-enter-from {
  opacity: 0;
  transform: translateX(-100%);
}

.gift-card-enter-to {
  opacity: 1;
  transform: translateX(0);
}

.gift-card-leave-from {
  opacity: 1;
  transform: translateY(0);
}

.gift-card-leave-to {
  opacity: 0;
  transform: translateY(-40px);
}

.gift-card-move {
  transition: transform 0.3s ease;
}
</style>
