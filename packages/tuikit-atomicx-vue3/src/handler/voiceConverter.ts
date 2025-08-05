import {
  TUIChatService,
  TUIStore,
} from '@tencentcloud/chat-uikit-engine';
import type { IMessageModel } from '@tencentcloud/chat-uikit-engine';

class VoiceConverter {
  static instance: VoiceConverter | undefined = undefined;
  private convertCache = new Map<string, string>();

  constructor() {
    if (VoiceConverter.instance) {
      return;
    }
    VoiceConverter.instance = this;
  }

  async get(messageID: string): Promise<string> {
    // step1: check in cache if convert result exist
    const cache = this.convertCache.get(messageID);
    if (cache !== undefined) {
      return cache;
    }

    // step2: get message model with prototype methods
    const currentMessage: IMessageModel = TUIStore.getMessageModel(messageID);
    if (!currentMessage) {
      return Promise.reject('message not found');
    }
    // step3: get response from api
    const response: Record<string, any> = await TUIChatService.convertVoiceToText({
      message: currentMessage,
    });
    const { data: { result = '' } = {} } = response;
    if (result) {
      this.convertCache.set(currentMessage.ID, result);
    }
    return result;
  }
}

export const voiceConverter = new VoiceConverter();
