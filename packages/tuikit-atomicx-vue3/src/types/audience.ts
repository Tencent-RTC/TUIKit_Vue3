import { TUIRole } from '@tencentcloud/tuiroom-engine-js';

export interface AudienceInfo {
  userId: string;
  userName: string;
  avatarUrl: string;
  customInfo: Record<string, any>;
  userRole: TUIRole;
  isMessageDisabled: boolean;
  joinedTimestamp?: number;
}
