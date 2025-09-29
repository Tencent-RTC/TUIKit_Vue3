import TUIChatEngine from '@tencentcloud/chat-uikit-engine';

export type {
  IConversationModel as ConversationModel,
  ISearchResult as SearchResult,
  ISearchParamsMap as SearchParamsMap,
  IMessageModel as MessageModel,
  IGroupModel as GroupModel,
  ISearchCloudMessagesResultItem as SearchCloudMessagesResultItem,
  ISearchCloudUsersResultItem as SearchCloudUsersResultItem,
  ISearchCloudGroupsResultItem as SearchCloudGroupsResultItem,
  CreateGroupParams,
} from '@tencentcloud/chat-uikit-engine';

export enum SearchType {
  MESSAGE = 'message',
  CHAT_MESSAGE = 'chat_message',
  USER = 'user',
  GROUP = 'group',
}

export enum MessageType {
  TEXT = TUIChatEngine.TYPES.MSG_TEXT,
  IMAGE = TUIChatEngine.TYPES.MSG_IMAGE,
  AUDIO = TUIChatEngine.TYPES.MSG_AUDIO,
  VIDEO = TUIChatEngine.TYPES.MSG_VIDEO,
  FILE = TUIChatEngine.TYPES.MSG_FILE,
  FACE = TUIChatEngine.TYPES.MSG_FACE,
  LOCATION = TUIChatEngine.TYPES.MSG_LOCATION,
  GRP_TIP = TUIChatEngine.TYPES.MSG_GRP_TIP,
  CUSTOM = TUIChatEngine.TYPES.MSG_CUSTOM,
  MERGER = TUIChatEngine.TYPES.MSG_MERGER,
}
