/**
 * @module BattleType
 * @description Battle type definitions for Vue3 package
 *
 * Re-exports all battle types from uikit-core for framework-agnostic compatibility.
 * Use these types for live PK battle functionality.
 */

// Re-export all battle types from core
export {
  BattleEndedReason,
  BattleEvent,
} from '@uikit-core/types/battle';

export type {
  BattleConfig,
  BattleInfo,
  BattleStartedEventInfo,
  BattleEndedEventInfo,
  UserJoinBattleEventInfo,
  UserExitBattleEventInfo,
  BattleRequestReceivedEventInfo,
  BattleRequestCancelledEventInfo,
  BattleRequestTimeoutEventInfo,
  BattleRequestAcceptEventInfo,
  BattleRequestRejectEventInfo,
  BattleEventInfoMap,
  BattleEventCallback,
  RequestBattleParams,
  IBattleStateReturn,
} from '@uikit-core/types/battle';
