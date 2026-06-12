import { MessageContentType } from '../types/messageInput';
import { trimInputContent } from './messageInput';
import type { EmojiContent, InputContent, MentionContent } from '../types/messageInput';

const CONVERSATION_DRAFT_VERSION = 1;

type RestorableDraftContent =
  | { type: MessageContentType.TEXT; content: string }
  | { type: MessageContentType.IMAGE; content: string }
  | { type: MessageContentType.EMOJI; content: EmojiContent }
  | { type: MessageContentType.MENTION; content: MentionContent };

interface ConversationDraftPayload {
  version: typeof CONVERSATION_DRAFT_VERSION;
  abstract: string;
  content: RestorableDraftContent[];
}

interface ConversationDraftSerializeOptions {
  imageText?: string;
  emojiText?: (content: EmojiContent) => string;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

function isString(value: unknown): value is string {
  return typeof value === 'string';
}

function isValidEmojiContent(value: unknown): value is EmojiContent {
  return isRecord(value)
    && isString(value.url)
    && isString(value.key)
    && isString(value.text);
}

function isValidMentionContent(value: unknown): value is MentionContent {
  return isRecord(value)
    && isString(value.id)
    && isString(value.label)
    && isString(value.mentionSuggestionChar);
}

function isRestorableImageContent(value: unknown): value is string {
  return isString(value) && value.length > 0;
}

function toRestorableDraftContent(content: InputContent[]): RestorableDraftContent[] {
  return trimInputContent(content).flatMap((item): RestorableDraftContent[] => {
    switch (item.type) {
      case MessageContentType.TEXT:
        return [{ type: MessageContentType.TEXT, content: item.content }];
      case MessageContentType.IMAGE:
        return isRestorableImageContent(item.content)
          ? [{ type: MessageContentType.IMAGE, content: item.content }]
          : [];
      case MessageContentType.EMOJI:
        return [item];
      case MessageContentType.MENTION:
        return [item];
      default:
        return [];
    }
  });
}

function isRestorableDraftContent(value: unknown): value is RestorableDraftContent {
  if (!isRecord(value) || !isString(value.type)) {
    return false;
  }

  switch (value.type) {
    case MessageContentType.TEXT:
      return isString(value.content);
    case MessageContentType.IMAGE:
      return isRestorableImageContent(value.content);
    case MessageContentType.EMOJI:
      return isValidEmojiContent(value.content);
    case MessageContentType.MENTION:
      return isValidMentionContent(value.content);
    default:
      return false;
  }
}

function createDraftAbstract(
  content: RestorableDraftContent[],
  options: ConversationDraftSerializeOptions = {},
): string {
  return content
    .map((item) => {
      switch (item.type) {
        case MessageContentType.TEXT:
          return item.content;
        case MessageContentType.IMAGE:
          return options.imageText ?? '[Image]';
        case MessageContentType.EMOJI:
          return options.emojiText?.(item.content) || item.content.text || item.content.key;
        case MessageContentType.MENTION:
          return `${item.content.mentionSuggestionChar}${item.content.label}`;
        default:
          return '';
      }
    })
    .join('')
    .trim();
}

function parseDraftPayload(draft: string | undefined): ConversationDraftPayload | undefined {
  if (!draft) {
    return undefined;
  }

  try {
    const payload = JSON.parse(draft);
    if (
      !isRecord(payload)
      || payload.version !== CONVERSATION_DRAFT_VERSION
      || !isString(payload.abstract)
      || !Array.isArray(payload.content)
    ) {
      return undefined;
    }

    const content = payload.content.filter(isRestorableDraftContent);
    return {
      version: CONVERSATION_DRAFT_VERSION,
      abstract: payload.abstract,
      content,
    };
  } catch {
    return undefined;
  }
}

function serializeConversationDraftContent(
  content: InputContent[],
  options: ConversationDraftSerializeOptions = {},
): string {
  const restorableContent = toRestorableDraftContent(content);
  if (restorableContent.length === 0) {
    return '';
  }

  const abstract = createDraftAbstract(restorableContent, options);
  if (!abstract) {
    return '';
  }

  return JSON.stringify({
    version: CONVERSATION_DRAFT_VERSION,
    abstract,
    content: restorableContent,
  } satisfies ConversationDraftPayload);
}

function parseConversationDraftContent(draft: string | undefined): string | InputContent[] | undefined {
  if (!draft) {
    return undefined;
  }

  const payload = parseDraftPayload(draft);
  if (payload) {
    return payload.content;
  }

  return draft;
}

function getConversationDraftAbstract(draft: string | undefined): string {
  if (!draft) {
    return '';
  }

  const payload = parseDraftPayload(draft);
  if (payload) {
    return payload.abstract;
  }

  return draft;
}

export {
  getConversationDraftAbstract,
  parseConversationDraftContent,
  serializeConversationDraftContent,
};
