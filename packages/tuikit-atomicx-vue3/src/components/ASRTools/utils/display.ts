import { useRoomParticipantState } from '../../../states/RoomParticipantState';
import type { SubtitleDisplayMode, TranscriberLanguage, TranscriberMessage } from '../../../types';

interface TranslationArrayItem {
  language?: string;
  text?: string;
}

const { participantList } = useRoomParticipantState();

const normalizeTextValue = (value: unknown): string => {
  if (typeof value === 'string') {
    return value.trim();
  }

  if (typeof value === 'number' || typeof value === 'boolean') {
    return String(value).trim();
  }

  if (value && typeof value === 'object') {
    const candidate = (value as Record<string, unknown>).text
      ?? (value as Record<string, unknown>).translationText
      ?? (value as Record<string, unknown>).value;

    if (typeof candidate === 'string' || typeof candidate === 'number' || typeof candidate === 'boolean') {
      return String(candidate).trim();
    }
  }

  return '';
};

export const getDisplayName = (userId: string) => {
  const participant = participantList.value.find(p => p.userId === userId);
  return participant?.nameCard || participant?.userName || participant?.userId || userId;
};

export const hasDisplayableText = (value: unknown) => !!normalizeTextValue(value);

const getTranslationCount = (translationTexts: TranscriberMessage['translationTexts']) => {
  if (!translationTexts) {
    return 0;
  }

  if (translationTexts instanceof Map) {
    return translationTexts.size;
  }

  if (Array.isArray(translationTexts)) {
    return translationTexts.length;
  }

  return 0;
};

export const getTranslationText = (
  message: TranscriberMessage,
  targetLanguage: TranscriberLanguage | '',
) => {
  if (!targetLanguage || !message.translationTexts) {
    return '';
  }

  if (message.translationTexts instanceof Map) {
    const normalizedTargetLanguage = String(targetLanguage).toLowerCase();
    const matchedEntry = Array.from(message.translationTexts.entries()).find(
      ([language]) => String(language).toLowerCase() === normalizedTargetLanguage,
    );
    const fallbackText = Array.from(message.translationTexts.values()).find(value => hasDisplayableText(value));

    return normalizeTextValue(matchedEntry?.[1] || fallbackText);
  }

  if (Array.isArray(message.translationTexts)) {
    const translationItems = message.translationTexts as TranslationArrayItem[];
    const normalizedTargetLanguage = String(targetLanguage).toLowerCase();
    const matchedItem = translationItems.find(item => item?.language?.toLowerCase() === normalizedTargetLanguage);
    const fallbackItem = translationItems.find(item => hasDisplayableText(item?.text));

    return normalizeTextValue(
      matchedItem?.text
      || fallbackItem?.text,
    );
  }

  return '';
};

export const hasTranslationText = (message: TranscriberMessage) => getTranslationCount(message.translationTexts) > 0;

export const getMessageDisplayLines = (
  message: TranscriberMessage,
  targetLanguage: TranscriberLanguage | '',
  displayMode: SubtitleDisplayMode,
) => {
  const sourceText = normalizeTextValue(message.sourceText);
  const translationText = normalizeTextValue(getTranslationText(message, targetLanguage));

  if (displayMode === 'translation') {
    return [sourceText || translationText].filter(Boolean);
  }

  return [sourceText, translationText].filter(Boolean);
};
