import { safeJSONParse } from './json';
import type { IMessageModel as MessageModel } from '@tencentcloud/chat-uikit-engine';

function isCallMessage(message: MessageModel) {
  try {
    const payloadData = safeJSONParse(message.payload.data, {} as any);
    if (payloadData.businessID === 1 && payloadData.data) {
      const payloadDataData = safeJSONParse(payloadData.data, {} as any);
      if (payloadDataData.businessID === 'av_call') {
        return true;
      }
    }
  } catch {
    return false;
  }
  return false;
}

export {
  isCallMessage,
};
