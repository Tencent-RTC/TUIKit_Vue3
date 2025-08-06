import type { IMessageModel, SendForwardMessageOptions } from '@tencentcloud/chat-uikit-engine';

/**
 * three type for origin text to be translated
 * 1. image: small face text
 * 2. text: plain text
 * 3. mention: mention '@'
 */
interface ITextFace {
  type: 'face';
  value: string;
}

interface ITextPlain {
  type: 'text';
  value: string;
}

interface ITextAt {
  type: 'mention';
  value: string;
}

type ITranslationTextType = ITextFace | ITextPlain | ITextAt;

interface IQuotedNotification {
  message: IMessageModel;
  text: string;
}

interface ICloudCustomData {
  messageReply: Partial<IQuotedContent>;
}

interface IQuotedContent {
  messageAbstract: string;
  messageID: string;
  messageSender: string;
  messageSequence: number;
  messageTime: number;
  messageType: number;
  version: number;
}

interface IReturnQuotedContent {
  isRevoked: boolean;
  isDeleted: boolean;
  text: string;
  sender: string;
}

interface ITranslationResult {
  status: TranslationStatusEnum;
  translationTextList: ITranslationTextType[];
}

interface IVoiceToTextResult {
  status: VoiceToTextStatusEnum;
  text: string;
}

interface IForwardMessageParams {
  conversationIDList: string[];
  forwardMessageOptions?: SendForwardMessageOptions;
}

enum QuoteTypeEnum {
  /**
   * none message
   */
  TYPE_NONE = 0,
  /**
   * text message
   */
  TYPE_TEXT = 1,
  /**
   * custom message
   */
  TYPE_CUSTOM = 2,
  /**
   * image message
   */
  TYPE_IMAGE = 3,
  /**
   * voice message
   */
  TYPE_SOUND = 4,
  /**
   * video message
   */
  TYPE_VIDEO = 5,
  /**
   * file message
   */
  TYPE_FILE = 6,
  /**
   * location message
   */
  TYPE_LOCATION = 7,
  /**
   * animation face message
   */
  TYPE_FACE = 8,
  /**
   * group tips message (save in message list)
   */
  TYPE_GROUP_TIPS = 9,
  /**
   * merge forward message
   */
  TYPE_MERGER = 10,
}

enum TranslationStatusEnum {
  Pending,
  Finished,
  Failed,
}

enum VoiceToTextStatusEnum {
  Pending,
  Finished,
  Failed,
}

export {
  QuoteTypeEnum,
  TranslationStatusEnum,
  VoiceToTextStatusEnum,
};

export type {
  ICloudCustomData,
  ITranslationTextType,
  IQuotedNotification,
  IQuotedContent,
  IReturnQuotedContent,
  ITranslationResult,
  IVoiceToTextResult,
  IForwardMessageParams,
};
