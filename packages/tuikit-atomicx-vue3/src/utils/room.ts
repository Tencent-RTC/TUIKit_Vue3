import type { CustomMessageInfo, MessageInfo } from '@atomicxcore/core';
import { safeJSONParse } from './json';

interface RoomMessageData {
  businessID: string;
  [key: string]: any;
}

export const isRoomMessage = (message: MessageInfo): boolean => {
  try {
    const payloadData = safeJSONParse((message as CustomMessageInfo).messagePayload?.customData, {} as RoomMessageData);
    return payloadData.businessID === 'group_room_message';
  } catch {
    return false;
  }
};