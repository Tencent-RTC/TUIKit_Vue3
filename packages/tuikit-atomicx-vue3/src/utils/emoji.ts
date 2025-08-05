import { i18next } from '@tencentcloud/uikit-base-component-vue3';
import { emojiUrlMap } from '../constants/emoji';

/**
 * Transforms a text containing emoji keys to a emoji names with i18n
 * Example:
 * 'hello[TUIEmoji_Smile]!' => 'hello[Smile]!''
 * @param {string} text - The text containing emoji keys.
 * @return {string} The transformed text with emoji keys replaced by emoji names.
 */
export function transformTextWithEmojiKeyToName(text: string) {
  if (!text) {
    return '';
  }
  const reg = /(\[.+?\])/g;
  let transformResult: string = text;
  if (reg.test(text)) {
    transformResult = text.replace(reg, match => emojiUrlMap[match] ? i18next.t(`Emoji.${match}`) : match);
  }
  return transformResult;
}

const emojiTranslationMap: Record<string, any> = {};

/**
 * Transforms a text containing emoji names to emoji keys with i18n
 * Example:
 * 'hello[Smile]!' => 'hello[TUIEmoji_Smile]!'
 * @param {string} text - The text containing emoji names.
 * @return {string} The transformed text with emoji names replaced by emoji keys.
 */
export function transformTextWithEmojiNameToKey(text: string) {
  if (!text) {
    return '';
  }
  const reg = /(\[.+?\])/g;
  let transformResult: string = text;
  if (reg.test(text)) {
    const currentLanguage = i18next.language;
    if (!emojiTranslationMap[currentLanguage]) {
      const lngResource = i18next.getDataByLanguage(currentLanguage);
      if (lngResource?.translation?.Emoji) {
        emojiTranslationMap[currentLanguage]
          = Object.fromEntries(Object.entries(lngResource.translation.Emoji).map(([key, value]) => [value, key]));
      }
    }
    transformResult = text.replace(reg, match => emojiTranslationMap[currentLanguage]?.match ?? match);
  }
  return transformResult;
}
