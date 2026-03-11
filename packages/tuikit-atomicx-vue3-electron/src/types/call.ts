enum CallMediaType {
  UNKNOWN = 0,
  AUDIO = 1,
  VIDEO = 2,
}

interface OfflinePushInfo {
  title?: string;
  description?: string;
  androidOPPOChannelID?: string;
  extension: string;
  [key: string]: any;
}

type StartCallParams = {
  type: CallMediaType;
  userIDList: string[];
  timeout?: number;
  chatGroupID?: string;
  offlinePushInfo?: OfflinePushInfo;
  [key: string]: any;
};

interface CallData {
  cmd: string;
  inviter: string;
  message: string;
  room_id: number;
  str_room_id: string;
}

interface CallInfo {
  businessID: string;
  call_end: number;
  call_type: number;
  data: CallData;
  platform: string;
  room_id: number;
  userData: string;
  version: number;
  line_busy?: string | undefined;
}

interface DataContent {
  actionType: number;
  businessID: number;
  data: CallInfo;
  inviteID: string;
  groupID: string;
  inviter: string;
  inviteeList: string[];
  timeout: number;
}

interface CallMessagePayload {
  data: DataContent;
  description: string;
  extension: string;
}

export { CallMediaType };
export type { StartCallParams, OfflinePushInfo, CallMessagePayload };
