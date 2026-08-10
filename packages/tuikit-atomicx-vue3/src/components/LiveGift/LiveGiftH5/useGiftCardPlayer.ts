/**
 * Gift card player hook for H5
 * @description Manages multiple gift cards display with auto-hide. Consecutive
 * gifts from the same sender + same gift within `comboWindow` fold into a single
 * card whose `giftCount` grows live, so a tap combo reads as one ×N bubble.
 */
import { ref, onMounted, onUnmounted } from 'vue';
import { useLiveGiftState } from '../../../states/LiveGiftState';
import { LiveGiftEvents } from '../../../types/gift';
import type { Gift } from '../../../types';

export interface GiftCardItem {
  id: string;
  gift: Gift;
  lastUpdateTs: number;
  timer?: ReturnType<typeof setTimeout>;
}

interface UseGiftCardPlayerOptions {
  displayDuration?: number; // Duration to display each card (ms)
  maxDisplayCount?: number; // Maximum cards to display at once
  comboWindow?: number; // Same sender+gift within this window folds into combo (ms)
}

function useGiftCardPlayer(options: UseGiftCardPlayerOptions = {}) {
  const {
    displayDuration = 3000,
    maxDisplayCount = 3,
    comboWindow = 2000,
  } = options;
  const { subscribeEvent, unsubscribeEvent } = useLiveGiftState();

  // Currently displaying gift cards
  const displayList = ref<GiftCardItem[]>([]);

  const removeGiftCard = (id: string) => {
    const index = displayList.value.findIndex(item => item.id === id);
    if (index === -1) return;
    const item = displayList.value[index];
    if (item.timer) clearTimeout(item.timer);
    displayList.value.splice(index, 1);
  };

  const scheduleHide = (item: GiftCardItem) => {
    if (item.timer) clearTimeout(item.timer);
    if (Number.isFinite(displayDuration)) {
      item.timer = setTimeout(() => removeGiftCard(item.id), displayDuration);
    }
  };

  // Locate an existing card still within the combo window for the same
  // sender + same gift, so successive taps fold into one growing bubble.
  const findComboCard = (gift: Gift): GiftCardItem | undefined => {
    const now = Date.now();
    return displayList.value.find(item =>
      item.gift.sender.userId === gift.sender.userId &&
      item.gift.giftInfo.giftID === gift.giftInfo.giftID &&
      now - item.lastUpdateTs <= comboWindow,
    );
  };

  /**
   * Add gift to display list (folding into a combo card when applicable)
   */
  const addGiftToDisplay = (gift: Gift) => {
    if (maxDisplayCount <= 0) return;

    const combo = findComboCard(gift);
    if (combo) {
      // Fold into the existing combo: grow count and refresh the hide timer.
      combo.gift = { ...combo.gift, giftCount: combo.gift.giftCount + (gift.giftCount || 1) };
      combo.lastUpdateTs = Date.now();
      scheduleHide(combo);
      return;
    }

    // Remove oldest card if exceeds max count
    if (displayList.value.length >= maxDisplayCount) {
      removeGiftCard(displayList.value[0].id);
    }

    // Create new gift card item
    const item: GiftCardItem = {
      id: `${gift.sender.userId}-${gift.giftInfo.giftID}-${Date.now()}`,
      gift,
      lastUpdateTs: Date.now(),
    };

    scheduleHide(item);
    displayList.value.push(item);
  };

  /**
   * Remove gift card by id
   */
  const removeGiftCardById = (id: string) => removeGiftCard(id);

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
    removeGiftCard: removeGiftCardById,
  };
}

export { useGiftCardPlayer };
