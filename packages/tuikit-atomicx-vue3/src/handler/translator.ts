import TUIChatEngine, {
  TUIChatService,
  TUIStore,
  TUIUserService,
} from '@tencentcloud/chat-uikit-engine-lite';
import type { ITranslationTextType } from '../types/message';
import type { IMessageModel } from '@tencentcloud/chat-uikit-engine-lite';

class Translator {
  static instance: Translator | undefined = undefined;
  private translationCache = new Map<string, ITranslationTextType[]>();

  constructor() {
    if (Translator.instance) {
      return Translator.instance;
    }
    Translator.instance = this;
  }

  async get(messageID: string): Promise<ITranslationTextType[]> {
    // step1: check in cache if translation exist
    const cache = this.translationCache.get(messageID);
    if (cache !== undefined) {
      return cache;
    }

    // step2: get message model with prototype methods
    const currentMessage: IMessageModel = TUIStore.getMessageModel(messageID);
    if (!currentMessage) {
      return Promise.reject('message not found');
    }

    const { text } = currentMessage.getMessageContent() || {};
    const textList: ITranslationTextType[] = [];
    const splittingList = await this.getNickList(currentMessage);
    // step3: Categorize origin messages to 'plain text', 'face', 'mention'
    for (let i = 0; i < text.length; ++i) {
      const item = text[i];
      if (item.name === 'img') {
        textList.push({ type: 'face', value: item.src });
        continue;
      }
      const { transSplittingList, atNickList } = this.getSplitResult(item.text, splittingList);
      for (let j = 0; j < transSplittingList.length; ++j) {
        textList.push({ type: 'text', value: transSplittingList[j] });
        if (j < atNickList.length) {
          textList.push({ type: 'mention', value: atNickList[j] });
        }
      }
    }

    // step4: filter plain text to be translated
    const needTranslateTextIndex: number[] = [];
    const needTranslateText = textList.filter((item, index) => {
      if (item.type === 'text' && item.value.trim() !== '') {
        needTranslateTextIndex.push(index);
        return true;
      }
      return false;
    }).map(item => item.value);

    if (needTranslateText.length === 0) {
      this.translationCache.set(currentMessage.ID, textList);
      return textList;
    }
    // step5: get final translation result
    const translationResult = await this.getTranslationStandard(needTranslateText) as string[];
    translationResult.forEach((item, index) => {
      textList[needTranslateTextIndex[index]].value = item;
    });

    // step6: cache translation result
    this.translationCache.set(currentMessage.ID, textList);
    return textList;
  }

  private getTranslationStandard(originTextList: string[]): Promise<string[]> {
    return new Promise((resolve, reject) => {
      TUIChatService.translateText({
        sourceTextList: originTextList,
        sourceLanguage: 'auto',
      })
        .then((response: Record<string, any>) => {
          const {
            data: { translatedTextList },
          } = response;
          resolve(translatedTextList);
        })
        .catch((error) => {
          reject(error);
        });
    });
  }

  /**
   * the nick list is used to split the text by @ + {nick or userID}
   * @param message
   * @returns e.g. ['@james', '@john']
   */
  private async getNickList(message: IMessageModel): Promise<string[]> {
    const splittingList: string[] = [];
    const { atUserList = [] } = message;
    const atAllID: string = TUIChatEngine.TYPES.MSG_AT_ALL;
    if (atUserList.includes(atAllID)) {
      splittingList.push('@所有人');
    }
    if (atUserList.length > 0) {
      const { data: userProfileList } = await TUIUserService.getUserProfile({ userIDList: atUserList });
      userProfileList.forEach((user: any) => {
        const atNick = `@${user.nick || user.userID}`;
        splittingList.push(atNick);
      });
    }
    return Array.from(new Set(splittingList));
  }

  /**
   * Splits the given text into substrings based on the provided splitString array.
   *
   * @param {string} text - The text to be split.
   * @param {string[]} splitString - The array of strings to split the text by.
   * @return {{ transSplittingList: string[]; atNickList: string[] }} - An object containing two arrays:
   *   - transSplittingList: An array of substrings extracted from the text.
   *   - atNickList: An array of split strings that were found in the text.
   */
  private getSplitResult(text: string, splitString: string[]): { transSplittingList: string[]; atNickList: string[] } {
    let searchStartPos = 0;
    const transSplittingList: string[] = [];
    const atNickList: string[] = [];
    while (searchStartPos < text.length) {
      const nextAtCharPos = text.indexOf('@', searchStartPos);
      if (nextAtCharPos === -1) {
        transSplittingList.push(text.substring(searchStartPos));
        break;
      }
      let found = false;
      for (let i = 0; i < splitString.length; ++i) {
        const pos = text.indexOf(splitString[i], nextAtCharPos);
        if (pos !== -1 && pos === nextAtCharPos) {
          transSplittingList.push(text.substring(searchStartPos, pos));
          atNickList.push(splitString[i]);
          searchStartPos = pos + splitString[i].length;
          found = true;
          break;
        }
      }
      if (!found) {
        transSplittingList.push(text.substring(searchStartPos));
        break;
      }
    }
    return {
      transSplittingList,
      atNickList,
    };
  }
}

export const translator = new Translator();
