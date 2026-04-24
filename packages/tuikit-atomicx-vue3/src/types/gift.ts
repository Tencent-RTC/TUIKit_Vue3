/**
 * @module GiftType
 * @description 礼物相关类型定义
 *
 * 提供直播礼物模块的类型定义，包括礼物信息、礼物数量变更信息、点赞消息和礼物事件。
 */
import type { GiftInfo, TUIUserInfo } from '@tencentcloud/tuiroom-engine-js';

/**
 * 礼物消息接口
 * @interface Gift
 * @description 定义收到礼物消息时的信息，包括直播间 ID、礼物数量、发送者信息和礼物详情。
 * @example
 * const gift: Gift = {
 *   liveId: 'live_001',
 *   giftCount: 1,
 *   sender: { userId: 'user_001', userName: '用户A', avatarUrl: '' },
 *   giftInfo: { giftId: 'gift_001', giftName: '火箭', giftPrice: 100 },
 * };
 */
interface Gift {
	/** 直播间 ID */
	liveId: string;
	/** 礼物数量 */
	giftCount: number;
	/** 发送礼物的用户信息 */
	sender: TUIUserInfo;
	/** 礼物详情 */
	giftInfo: GiftInfo;
}

/**
 * 礼物数量变更接口
 * @interface GiftCountChanged
 * @description 定义礼物统计数量变化时的信息，包括已发送的总礼物数、总礼物金币数和独立送礼人数。
 * @example
 * const giftCount: GiftCountChanged = {
 *   liveId: 'live_001',
 *   totalGiftsSent: 100,
 *   totalGiftCoins: 5000,
 *   totalUniqueGiftSenders: 20,
 * };
 */
interface GiftCountChanged {
	/** 直播间 ID */
	liveId: string;
	/** 已发送的总礼物数 */
	totalGiftsSent: number;
	/** 总礼物金币数 */
	totalGiftCoins: number;
	/** 独立送礼人数 */
	totalUniqueGiftSenders: number;
}

/**
 * 点赞消息接口
 * @interface LikesMessage
 * @description 定义收到点赞消息时的信息，包括总点赞数和发送者信息。
 * @example
 * const likes: LikesMessage = {
 *   liveId: 'live_001',
 *   totalLikesReceived: 1000,
 *   sender: { userId: 'user_001', userName: '用户A', avatarUrl: '' },
 * };
 */
interface LikesMessage {
	/** 直播间 ID */
	liveId: string;
	/** 已收到的总点赞数 */
	totalLikesReceived: number;
	/** 点赞的用户信息 */
	sender: TUIUserInfo;
}

/**
 * @module LiveGiftEvent
 * @description **礼物事件列表**
 *
 * 直播礼物模块的事件定义，通过 subscribeEvent/unsubscribeEvent 订阅/取消订阅礼物事件。
 * 您可以通过这些事件处理收到礼物、礼物数量变化和收到点赞消息等变化。
 *
 * > **注意：**
 * > 事件需要在事件触发之前监听，这样才能收到相应的事件通知。
 * > 建议在进入直播间前完成事件监听，这样才能确保不会漏掉事件通知。
 *
 * @example
 * import { LiveGiftEvents, useLiveGiftState } from 'tuikit-atomicx-vue3';
 * const { subscribeEvent, unsubscribeEvent } = useLiveGiftState();
 *
 * const onReceiveGift = (eventInfo) => {
 *   console.log('收到礼物:', eventInfo.giftInfo.giftName, '数量:', eventInfo.giftCount);
 * };
 * subscribeEvent(LiveGiftEvents.ON_RECEIVE_GIFT_MESSAGE, onReceiveGift);
 * unsubscribeEvent(LiveGiftEvents.ON_RECEIVE_GIFT_MESSAGE, onReceiveGift);
 */
export enum LiveGiftEvents {
	/**
	 * 当收到礼物消息时触发。
	 * @event
	 * @param {object} eventInfo - 事件参数对象
	 * @param {string} eventInfo.liveId - 直播间 ID
	 * @param {number} eventInfo.giftCount - 礼物数量
	 * @param {TUIUserInfo} eventInfo.sender - 发送礼物的用户信息
	 * @param {GiftInfo} eventInfo.giftInfo - 礼物详情
	 * @example
	 * import { LiveGiftEvents, useLiveGiftState } from 'tuikit-atomicx-vue3';
	 * const { subscribeEvent } = useLiveGiftState();
	 *
	 * subscribeEvent(LiveGiftEvents.ON_RECEIVE_GIFT_MESSAGE, (eventInfo) => {
	 *   console.log('收到礼物:', eventInfo.giftInfo.giftName);
	 *   console.log('发送者:', eventInfo.sender.userName);
	 *   console.log('数量:', eventInfo.giftCount);
	 * });
	 */
	ON_RECEIVE_GIFT_MESSAGE = 'ON_RECEIVE_GIFT_MESSAGE',
	/**
	 * 当礼物统计数量发生变化时触发。
	 * @event
	 * @param {object} eventInfo - 事件参数对象
	 * @param {string} eventInfo.liveId - 直播间 ID
	 * @param {number} eventInfo.totalGiftsSent - 已发送的总礼物数
	 * @param {number} eventInfo.totalGiftCoins - 总礼物金币数
	 * @param {number} eventInfo.totalUniqueGiftSenders - 独立送礼人数
	 * @example
	 * import { LiveGiftEvents, useLiveGiftState } from 'tuikit-atomicx-vue3';
	 * const { subscribeEvent } = useLiveGiftState();
	 *
	 * subscribeEvent(LiveGiftEvents.ON_GIFT_COUNT_CHANGED, (eventInfo) => {
	 *   console.log('总礼物数:', eventInfo.totalGiftsSent);
	 *   console.log('总金币数:', eventInfo.totalGiftCoins);
	 *   console.log('送礼人数:', eventInfo.totalUniqueGiftSenders);
	 * });
	 */
	ON_GIFT_COUNT_CHANGED = 'ON_GIFT_COUNT_CHANGED',
	/**
	 * 当收到点赞消息时触发。
	 * @event
	 * @param {object} eventInfo - 事件参数对象
	 * @param {string} eventInfo.liveId - 直播间 ID
	 * @param {number} eventInfo.totalLikesReceived - 已收到的总点赞数
	 * @param {TUIUserInfo} eventInfo.sender - 点赞的用户信息
	 * @example
	 * import { LiveGiftEvents, useLiveGiftState } from 'tuikit-atomicx-vue3';
	 * const { subscribeEvent } = useLiveGiftState();
	 *
	 * subscribeEvent(LiveGiftEvents.ON_RECEIVE_LIKES_MESSAGE, (eventInfo) => {
	 *   console.log('点赞者:', eventInfo.sender.userName);
	 *   console.log('总点赞数:', eventInfo.totalLikesReceived);
	 * });
	 */
	ON_RECEIVE_LIKES_MESSAGE = 'ON_RECEIVE_LIKES_MESSAGE',
}

/**
 * 礼物事件映射类型定义
 * @description 将每个 LiveGiftEvents 映射到其对应的回调参数类型。
 * @example
 * type GiftPayload = LiveGiftEventMap[LiveGiftEvents.ON_RECEIVE_GIFT_MESSAGE]; // Gift
 */
type LiveGiftEventMap = {
	[LiveGiftEvents.ON_RECEIVE_GIFT_MESSAGE]: Gift;
	[LiveGiftEvents.ON_GIFT_COUNT_CHANGED]: GiftCountChanged;
	[LiveGiftEvents.ON_RECEIVE_LIKES_MESSAGE]: LikesMessage;
};

/**
 * 礼物事件回调函数类型定义
 * @description 礼物事件的回调函数类型。
 * 回调函数接收与订阅的事件类型对应的事件载荷。
 */
type LiveGiftEventCallback<T extends LiveGiftEvents = LiveGiftEvents> = (
	eventInfo: LiveGiftEventMap[T]
) => void;

export type {
	Gift,
	GiftCountChanged,
	LikesMessage,
	LiveGiftEventCallback,
	LiveGiftEventMap,
}
