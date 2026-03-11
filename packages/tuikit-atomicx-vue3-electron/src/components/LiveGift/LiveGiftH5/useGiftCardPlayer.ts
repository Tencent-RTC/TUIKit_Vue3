/**
 * Gift card player hook for H5
 * @description Manages multiple gift cards display with auto-hide
 */
import { ref, onMounted, onUnmounted } from 'vue';
import { useLiveGiftState } from '../../../states/LiveGiftState';
import { LiveGiftEvents } from '../../../types/gift';
import type { Gift } from '../../../types';

interface GiftCardItem {
  id: string;
  gift: Gift;
  timer?: ReturnType<typeof setTimeout>;
}

interface UseGiftCardPlayerOptions {
  displayDuration?: number; // Duration to display each card (ms)
  maxDisplayCount?: number; // Maximum cards to display at once
}

function useGiftCardPlayer(options: UseGiftCardPlayerOptions = {}) {
  const { displayDuration = 3000, maxDisplayCount = 3 } = options;
  const { subscribeEvent, unsubscribeEvent } = useLiveGiftState();

  // Currently displaying gift cards
  const displayList = ref<GiftCardItem[]>([]);

  /**
   * Add gift to display list
   */
  const addGiftToDisplay = (gift: Gift) => {
    if (maxDisplayCount <= 0) return;
    // Remove oldest card if exceeds max count
    if (displayList.value.length >= maxDisplayCount) {
      const oldestItem = displayList.value[0];
      removeGiftCard(oldestItem.id);
    }

    // Create new gift card item
    const item: GiftCardItem = {
      id: `${gift.sender.userId}-${Date.now()}`,
      gift,
    };

    // Only set timer if displayDuration is not Infinity
    if (displayDuration !== Infinity && isFinite(displayDuration)) {
      item.timer = setTimeout(() => {
        removeGiftCard(item.id);
      }, displayDuration);
    }

    displayList.value.push(item);
  };

  /**
   * Remove gift card by id
   */
  const removeGiftCard = (id: string) => {
    const index = displayList.value.findIndex(item => item.id === id);
    if (index !== -1) {
      const item = displayList.value[index];
      if (item.timer) {
        clearTimeout(item.timer);
      }
      displayList.value.splice(index, 1);
    }
  };

  /**
   * Handle receive gift message event
   */
  const onReceiveGift = (gift: Gift) => {
    addGiftToDisplay(gift);
  };

  // Subscribe to gift events on mount
  onMounted(() => {
    subscribeEvent(LiveGiftEvents.ON_RECEIVE_GIFT_MESSAGE, onReceiveGift);
  });

  // Cleanup on unmount
  onUnmounted(() => {
    unsubscribeEvent(LiveGiftEvents.ON_RECEIVE_GIFT_MESSAGE, onReceiveGift);
    // Clear all timers
    displayList.value.forEach(item => {
      if (item.timer) {
        clearTimeout(item.timer);
      }
    });
    displayList.value = [];
  });

  return {
    displayList,
  };
}

export { useGiftCardPlayer };
