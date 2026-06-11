/**
 * @module CoHostType
 * @description Vue3 co-host type definitions
 *
 * Re-exports framework-agnostic types from @uikit-core and defines Vue3-specific types.
 */

// ============ Re-exports from core ============
export {
  CoHostStatus,
  CoHostEvent,
  CoHostLayoutTemplate,
} from '@uikit-core/types/coHost';

export type {
  CoHostEventInfoMap,
  CoHostEventCallback,
  RequestHostConnectionParams,
  ICoHostStateReturn,
} from '@uikit-core/types/coHost';
