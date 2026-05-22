/**
 * Live gift type definitions
 * @module GiftTypes
 */
import type { Ref } from 'vue';
import type { GiftCategory, GiftInfo, TUIUserInfo } from '@tencentcloud/tuiroom-engine-electron';

interface Gift {
	liveId: string;
	giftCount: number;
	sender: TUIUserInfo;
	giftInfo: GiftInfo;
}

interface GiftCountChanged {
	liveId: string;
	totalGiftsSent: number;
	totalGiftCoins: number;
	totalUniqueGiftSenders: number;
}

enum LiveGiftEvents {
	ON_RECEIVE_GIFT_MESSAGE = 'ON_RECEIVE_GIFT_MESSAGE',
	ON_GIFT_COUNT_CHANGED = 'ON_GIFT_COUNT_CHANGED',
}

// Map event type to corresponding data type
type LiveGiftEventMap = {
	[LiveGiftEvents.ON_RECEIVE_GIFT_MESSAGE]: Gift;
	[LiveGiftEvents.ON_GIFT_COUNT_CHANGED]: GiftCountChanged;
};

// Event callback type that maps event to correct data type
type LiveGiftEventCallback<T extends LiveGiftEvents = LiveGiftEvents> = (
	eventInfo: LiveGiftEventMap[T]
) => void;

export {
	LiveGiftEvents,
}

export interface ILiveGiftState {
  giftInfoList: Ref<GiftCategory[]>;
  sendGift: (params: { giftId: string; count: number }) => Promise<any>;
  getGiftList: () => Promise<GiftCategory[]>;
  subscribeEvent: <T extends LiveGiftEvents>(event: T, callback: LiveGiftEventCallback<T>) => void;
  unsubscribeEvent: <T extends LiveGiftEvents>(event: T, callback: LiveGiftEventCallback<T>) => void;
}

export type {
	Gift,
	GiftCountChanged,
	LiveGiftEventCallback,
	LiveGiftEventMap,
}
