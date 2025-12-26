import { TUIFriendService, TUIUserService, TUIChatEngine } from '@tencentcloud/chat-uikit-engine';
import TUICore, { TUIConstants } from '@tencentcloud/tui-core';
import { safeJSONParse } from './json';
import { showChatErrorModalById, ChatErrorModalId } from '../components/UIKitModal/chatErrorModal';
import type { StartCallParams, CallMessagePayload } from '../types/call';
import type { MessageModel } from '../types/engine';

function isCallMessage(message: MessageModel) {
  try {
    const payloadData = safeJSONParse(message.payload.data, {} as any);
    if (payloadData.businessID === 1 && payloadData.data) {
      const payloadDataData = safeJSONParse(payloadData.data, {} as any);
      if (payloadDataData.businessID === 'av_call' || payloadDataData.businessID === 'rtc_call') {
        return true;
      }
    }
  } catch {
    return false;
  }
  return false;
}

function startCall(params: StartCallParams) {
  const result = TUICore.getService(TUIConstants.TUICalling.SERVICE.NAME);

  if (!result) {
    showChatErrorModalById(ChatErrorModalId.CALL_KIT_NOT_INTEGRATED);
    return;
  }

  TUICore.callService({
    serviceName: TUIConstants.TUICalling.SERVICE.NAME,
    method: TUIConstants.TUICalling.SERVICE.METHOD.START_CALL,
    params: {
      ...params,
      version: 'v3',
    },
  });
  // offlinePushInfo doc: https://cloud.tencent.com/document/product/269/105713
}

function parseCallMessage(message: MessageModel): CallMessagePayload | undefined {
  const dataContent = safeJSONParse<any>(message.payload.data, undefined);

  if (!dataContent) {
    return undefined;
  }

  const callInfo = safeJSONParse<any>(dataContent.data, undefined as any);

  if (!callInfo) {
    return undefined;
  }

  const result: CallMessagePayload = {
    description: message.payload.description,
    extension: message.payload.extension,
    data: {
      businessID: dataContent.businessID,
      timeout: dataContent.timeout,
      data: {
        businessID: callInfo.businessID,
        call_end: callInfo.call_end,
        call_type: callInfo.call_type,
        data: {
          cmd: callInfo.data.cmd,
          inviter: callInfo.data.inviter,
          message: callInfo.data.message,
          room_id: callInfo.data.room_id,
          str_room_id: callInfo.data.str_room_id,
        },
        platform: callInfo.platform,
        room_id: callInfo.room_id,
        userData: callInfo.userData,
        version: callInfo.version,
      },
      inviteID: dataContent.inviteID,
      groupID: dataContent.groupID,
      actionType: dataContent.actionType,
      inviter: dataContent.inviter,
      inviteeList: dataContent.inviteeList,
    },
  };

  return result;
}

function formatTime(seconds: number): string {
  if (!seconds || seconds <= 0) {
    return '00:00';
  }

  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = Math.floor(seconds % 60);

  if (hours > 0) {
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  }
  return `${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
}

function substringByLength(str: string, maxLength = 12): string {
  if (!str || str.length <= maxLength) {
    return str;
  }
  return `${str.substring(0, maxLength)}...`;
}

function getUserRemarkByUserID(userID: string): string {
  const remarkMap = TUIFriendService.getFriendRemark([userID]);
  return remarkMap[userID] || '';
}

/**
 * userID - showName
 */
const userShowNameMap = new Map<string, string>();
/**
 * userID - 1
 */
const requestedUserMap = new Map<string, number>();

function parseCallMessageText(message: MessageModel, t: any): string {
  const callMessagePayload = parseCallMessage(message);

  if (!callMessagePayload || callMessagePayload.data.businessID !== 1) {
    return '';
  }

  const { data } = callMessagePayload;
  const objectData = data.data;
  const userID: string = (message as any).fromAccount || message.from;
  const remark = getUserRemarkByUserID(userID);
  const myUserID = TUIChatEngine.getMyUserID();

  let messageSender = remark || message.nameCard || message.nick || userID;
  messageSender = substringByLength(messageSender);

  switch (data.actionType) {
    case 1: {
      if (objectData?.data?.cmd === 'audioCall' || objectData?.data?.cmd === 'videoCall') {
        if (data.groupID) {
          return t('CallMessage.start_call', { messageSender });
        }
      }
      if (objectData?.data?.cmd === 'hangup') {
        if (data.groupID) {
          return t('CallMessage.call_ended');
        }
        return `${t('CallMessage.call_duration')}: ${formatTime(objectData?.call_end)}`;
      }
      if (objectData?.data?.cmd === 'switchToAudio') {
        return t('CallMessage.switch_to_audio_call');
      }
      if (objectData?.data?.cmd === 'switchToVideo') {
        return t('CallMessage.switch_to_video_call');
      }
      // when CDM is abnormal, the default return value is start call
      return t('CallMessage.start_call', { messageSender: '' });
    }
    case 2:
      if (data.groupID) {
        return `${messageSender} ${t('CallMessage.cancel_call')}`;
      }
      if (data.inviter === myUserID) {
        return t('CallMessage.canceled');
      }
      return t('CallMessage.canceled_by_recipient');
    case 3:
      if (objectData?.data?.cmd === 'switchToAudio') {
        return t('CallMessage.switch_to_audio_call');
      }
      if (objectData?.data?.cmd === 'switchToVideo') {
        return t('CallMessage.switch_to_video_call');
      }
      if (data.groupID) {
        return `${messageSender} ${t('CallMessage.answered')}`;
      }
      return t('CallMessage.answered');
    case 4:
      if (data.groupID) {
        return `${messageSender} ${t('CallMessage.decline_call')}`;
      }
      if (objectData?.line_busy === 'line_busy' || objectData?.data?.message === 'lineBusy') {
        if (data.inviter === myUserID) {
          return t('CallMessage.line_busy');
        }
        return t('CallMessage.missed_due_to_busy');
      }
      if (data.inviter === myUserID) {
        return t('CallMessage.declined_by_recipient');
      }
      return t('CallMessage.declined');
    case 5:
      if (objectData?.data?.cmd === 'switchToAudio') {
        return t('CallMessage.switch_to_audio_call');
      }
      if (objectData?.data?.cmd === 'switchToVideo') {
        return t('CallMessage.switch_to_video_call');
      }
      if (data.groupID) {
        // group call initiator timeout
        if (userID === data.inviter) {
          handleCallKitTimeoutSignaling(data.inviteeList);
          let inviteeList = '';
          data.inviteeList?.forEach((inviteeUserID: string) => {
            const showName = userShowNameMap.get(inviteeUserID) || inviteeUserID;
            inviteeList += `${substringByLength(showName)}、`;
          });
          inviteeList = inviteeList.substring(0, inviteeList.lastIndexOf('、'));
          return `${inviteeList} ${t('CallMessage.no_answer')}`;
        }
        // group call recipient timeout
        return `${messageSender} ${t('CallMessage.no_answer')}`;
      }
      if (data.inviter === myUserID) {
        return t('CallMessage.no_answer_from_recipient');
      }
      return t('CallMessage.no_answer_timeout');
    default:
      return '';
  }
}

function handleCallKitTimeoutSignaling(inviteeList: string[] = []) {
  if (inviteeList.length === 0) {
    return;
  }
  const friendRemarkResult = TUIFriendService.getFriendRemark(inviteeList);
  const userIDList: string[] = [];
  inviteeList.forEach((userID: string) => {
    const showName = friendRemarkResult[userID];
    if (showName) {
      userShowNameMap.set(userID, showName);
    } else if (!requestedUserMap.has(userID)) {
      userIDList.push(userID);
      requestedUserMap.set(userID, 1);
    }
  });
  // note: request once for each callKit timeout signaling, do not use rate limiting processing for now
  if (userIDList.length > 0) {
    TUIUserService.getUserProfile({ userIDList }).then((imResponse: any) => {
      const profileList = imResponse.data || [];
      profileList.forEach((profile: any) => {
        const { userID, nick } = profile;
        const showName = nick || userID;
        userShowNameMap.set(userID, showName);
      });
    }).catch(() => {
      // capture exceptions when requests fail to avoid blocking code execution process
    });
  }
}

export { startCall, isCallMessage, parseCallMessage, parseCallMessageText };
