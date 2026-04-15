import { MessageModel } from "../types";

interface RoomMessageData {
  businessID: string;
  [key: string]: any;
}

interface RoomMessagePayload {
  data: string;
  description: string;
  extension: string;
}

export const isRoomMessage = (message: MessageModel) => {
  try {
    const payload = message.payload as unknown as RoomMessagePayload;
    const payloadData = JSON.parse(payload?.data || '{}') as RoomMessageData;
    return payloadData.businessID === 'group_room_message';
  } catch {
    return false;
  }
}