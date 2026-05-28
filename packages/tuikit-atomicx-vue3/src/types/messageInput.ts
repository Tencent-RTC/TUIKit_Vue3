// Editor input content types — pure TS enums/interfaces with no engine dependency.
// These are shared by MessageInput components, UIContext, and any future store adapters.

enum MessageContentType {
  TEXT = 'text',
  IMAGE = 'image',
  VIDEO = 'video',
  FILE = 'file',
  MENTION = 'mention',
  EMOJI = 'emoji',
}

interface MentionContent {
  id: string;
  label: string;
  mentionSuggestionChar: string;
}

interface EmojiContent {
  url: string;
  key: string;
  text: string;
}

type ContentTypeMap = {
  [MessageContentType.TEXT]: string;
  [MessageContentType.IMAGE]: File;
  [MessageContentType.VIDEO]: File;
  [MessageContentType.FILE]: File;
  [MessageContentType.MENTION]: MentionContent;
  [MessageContentType.EMOJI]: EmojiContent;
};

type InputContent =
  | { type: MessageContentType.TEXT; content: string }
  | { type: MessageContentType.IMAGE; content: File }
  | { type: MessageContentType.VIDEO; content: File }
  | { type: MessageContentType.FILE; content: File }
  | { type: MessageContentType.MENTION; content: MentionContent }
  | { type: MessageContentType.EMOJI; content: EmojiContent };

export { MessageContentType };
export type { ContentTypeMap, InputContent, MentionContent, EmojiContent };
