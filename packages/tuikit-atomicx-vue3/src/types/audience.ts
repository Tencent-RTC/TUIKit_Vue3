/**
 * @module AudienceType
 * @description Audience-related type definitions for Vue3
 *
 * Re-exports framework-agnostic types from uikit-core and provides Vue3-specific type aliases.
 */
import type { TUIRole } from '@tencentcloud/tuiroom-engine-js';

// ============ Re-exports from uikit-core ============
export { LiveAudienceEvent } from '@uikit-core/types/liveAudience';

export type {
  LiveUserInfo,
  AudienceInfoBase,
  OwnerJoinedEventInfo,
  OwnerLeftEventInfo,
  AdminJoinedEventInfo,
  AdminLeftEventInfo,
  AudienceJoinedEventInfo,
  AudienceLeftEventInfo,
  AudienceMessageDisabledEventInfo,
  LiveAudienceEventInfo,
  LiveAudienceEventCallback,
  DisableSendMessageParams,
  UserIdParams,
  ILiveAudienceStateReturn,
} from '@uikit-core/types/liveAudience';

// Import base types for extension
import type { AudienceInfo as AudienceInfoGeneric } from '@uikit-core/types/liveAudience';
import type { AudienceItemSlotProps as AudienceItemSlotPropsGeneric } from '@uikit-core/types/liveAudience';

// ============ Vue3-specific Types ============

/**
 * Audience information interface (Vue3-specific with TUIRole)
 * @interface AudienceInfo
 * @description Audience info with SDK-specific TUIRole type.
 * @example
 * const audience: AudienceInfo = {
 *   userId: 'user_001',
 *   userName: 'Audience A',
 *   avatarUrl: 'https://example.com/avatar.png',
 *   customInfo: {},
 *   userRole: TUIRole.kGeneralUser,
 *   isMessageDisabled: false,
 *   joinedTimestamp: 1640995200,
 * };
 */
export interface AudienceInfo extends Omit<AudienceInfoGeneric<TUIRole>, 'userRole'> {
  /** User role */
  userRole: TUIRole;
}

/**
 * Audience item slot props (Vue3-specific)
 * @interface AudienceItemSlotProps
 * @description Props passed to LiveAudienceList component's audience-item scoped slot.
 * @example
 * <LiveAudienceList>
 *   <template #audience-item="{ index, audience }">
 *     <div class="custom-audience-item">
 *       <img v-if="index < 3" :src="getMedalIcon(index + 1)" class="rank-medal" />
 *       <span v-else class="rank-number">{{ index + 1 }}</span>
 *       <img :src="audience.avatarUrl" class="avatar" />
 *       <span class="name">{{ audience.userName }}</span>
 *     </div>
 *   </template>
 * </LiveAudienceList>
 */
export interface AudienceItemSlotProps {
  /** List item index (starting from 0) */
  index: number;
  /** Audience information */
  audience: AudienceInfo;
}
