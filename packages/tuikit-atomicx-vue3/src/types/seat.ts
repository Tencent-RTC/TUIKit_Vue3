/**
 * @module SeatType
 * @description Vue3 seat type definitions
 *
 * Re-exports framework-agnostic types from @uikit-core and defines Vue3-specific types.
 */

// ============ Re-exports from core ============
// Note: DeviceStatus is exported from ./device.ts for backward compatibility
export {
  SuspendStatus,
  Role,
  MoveSeatPolicy,
  DeviceControlPolicy,
  LiveSeatEvent,
} from '@uikit-core/types/seat';

export type {
  AVStatistics,
  SeatUserInfoBase,
  SeatUserInfo,
  RegionInfo,
  SeatInfo,
  LiveCanvas,
} from '@uikit-core/types/seat';
