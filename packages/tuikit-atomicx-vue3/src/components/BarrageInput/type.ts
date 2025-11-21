enum MessageContentType {
  TEXT = 'text',
  EMOJI = 'emoji',
}

type ContentTypeMap = {
  [key in MessageContentType]: key extends MessageContentType.TEXT
  ? string
  : key extends MessageContentType.EMOJI
  ? { url: string; key: string; text: string }
  : never;
};

interface InputContent<T extends MessageContentType = MessageContentType> {
  type: T;
  content: ContentTypeMap[T];
}

export {
  MessageContentType,
};

export type {
  ContentTypeMap,
  InputContent,
};
