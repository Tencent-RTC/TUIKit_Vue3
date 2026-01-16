/**
 * @module TranscriberLanguage
 * @description **Transcriber Language**
 *
 * The language of the transcriber.
 *
 * @example
 * import { TranscriberLanguage } from '@tuikit-atomicx-vue3';
 *
 * const language: TranscriberLanguage = 'zh';
 */
export type TranscriberLanguage = 'zh' | 'en' | string;

/**
 * @module TranscriberMessage
 * @description **Transcriber Message**
 *
 * The message of the transcriber.
 *
 * @example
 * import { TranscriberMessage } from '@tuikit-atomicx-vue3';
 *
 * const message: TranscriberMessage = {
 *   segmentId: '123456789',
 *   speakerUserId: 'user123',
 *   sourceText: 'Hello, world!',
 *   translationTexts: new Map([
 *     ['zh', '你好，世界！'],
 *     ['en', 'Hello, world!'],
 *   ]),
 *   timestamp: 1640995200000,
 *   isCompleted: true,
 * };
 */
export interface TranscriberMessage {
  segmentId: string;
  speakerUserId: string;
  sourceText: string;
  translationTexts?: Map<TranscriberLanguage, string>;
  timestamp: number;
  isCompleted: boolean;
}

/**
 * @module RealtimeTranscriberEvent
 * @description **Realtime Transcriber Event List**
 *
 * Subscribe to these events to handle realtime transcriber-related state changes.
 *
 * @example
 * import { RealtimeTranscriberEvent } from '@tuikit-atomicx-vue3';
 * import { useAITranscriberState } from '@tuikit-atomicx-vue3';
 *
 * const { subscribeEvent, unsubscribeEvent } = useAITranscriberState();
 *
 * subscribeEvent(RealtimeTranscriberEvent.TRANSCRIPT_RECEIVED, (message: Transcript) => {
 *   console.log('Transcript received:', message);
 * });
 *
 * unsubscribeEvent(RealtimeTranscriberEvent.TRANSCRIPT_RECEIVED);
 */
export enum RealtimeTranscriberEvent {
  onReceiveTranscriberMessage = 'onReceiveTranscriberMessage',
  onRealtimeTranscriberStarted = 'onRealtimeTranscriberStarted',
  onRealtimeTranscriberStopped = 'onRealtimeTranscriberStopped',
  onRealtimeTranscriberError = 'onRealtimeTranscriberError',
}

/**
 * @module RealtimeTranscriberEventInfoMap
 * @description **Realtime Transcriber Event Info Map**
 *
 * The event info map of the realtime transcriber.
 *
 * @example
 * import { RealtimeTranscriberEventInfoMap } from 'tuikit-atomicx-vue3';
 *
 * const eventInfo: RealtimeTranscriberEventInfoMap[RealtimeTranscriberEvent.onReceiveTranscriberMessage] = {
 *   roomId: '123456789',
 *   message: {
 *     segmentId: '123456789',
 *     speakerUserId: 'user123',
 *     sourceText: 'Hello, world!',
 *     translationTexts: new Map([
 *       ['zh', '你好，世界！'],
 *       ['en', 'Hello, world!'],
 *     ]),
 *     timestamp: 1640995200000,
 *     isCompleted: true,
 *   },
 * };
 */
export type RealtimeTranscriberEventInfoMap = {
  [RealtimeTranscriberEvent.onReceiveTranscriberMessage]: {
    roomId: string | number;
    message: TranscriberMessage;
  };
  [RealtimeTranscriberEvent.onRealtimeTranscriberStarted]: {
    roomId: string | number;
    transcriberRobotId: string;
    sourceLanguage: TranscriberLanguage;
  };
  [RealtimeTranscriberEvent.onRealtimeTranscriberStopped]: {
    roomId: string | number;
    transcriberRobotId: string;
  };
  [RealtimeTranscriberEvent.onRealtimeTranscriberError]: {
    roomId: string | number;
    transcriberRobotId: string;
    error: number;
    errorMessage: string;
  };
};

/**
 * @module RealtimeTranscriberEventCallback
 * @description **Realtime Transcriber Event Callback**
 *
 * The callback of the realtime transcriber event.
 *
 * @example
 * import { RealtimeTranscriberEventCallback } from 'tuikit-atomicx-vue3';
 *
 * const callback: RealtimeTranscriberEventCallback = (eventInfo) => {
 *   console.log('Realtime transcriber event received:', eventInfo);
 * };
 */
export type RealtimeTranscriberEventCallback = <T extends RealtimeTranscriberEvent>(eventInfo: RealtimeTranscriberEventInfoMap[T]) => void;
