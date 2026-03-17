/**
 * Live gift type definitions
 * @module GiftTypes
 */
import type { GiftInfo, TUIUserInfo } from '@tencentcloud/tuiroom-engine-js';

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

export type {
	Gift,
	GiftCountChanged,
	LiveGiftEventCallback,
	LiveGiftEventMap,
}
