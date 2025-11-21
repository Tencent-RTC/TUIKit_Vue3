import ChatEngine from '@tencentcloud/chat-uikit-engine';
import type { IConversationModel, IMessageModel } from '@tencentcloud/chat-uikit-engine';

enum ConversationType {
  C2C = ChatEngine.TYPES.CONV_C2C,
  GROUP = ChatEngine.TYPES.CONV_GROUP,
  SYSTEM = ChatEngine.TYPES.CONV_SYSTEM,
}

enum MessageType {
  TEXT = ChatEngine.TYPES.MSG_TEXT,
  IMAGE = ChatEngine.TYPES.MSG_IMAGE,
  AUDIO = ChatEngine.TYPES.MSG_AUDIO,
  VIDEO = ChatEngine.TYPES.MSG_VIDEO,
  FILE = ChatEngine.TYPES.MSG_FILE,
  FACE = ChatEngine.TYPES.MSG_FACE,
  LOCATION = ChatEngine.TYPES.MSG_LOCATION,
  GRP_TIP = ChatEngine.TYPES.MSG_GRP_TIP,
  CUSTOM = ChatEngine.TYPES.MSG_CUSTOM,
  MERGER = ChatEngine.TYPES.MSG_MERGER,
}

enum SearchType {
  MESSAGE = 'message',
  CHAT_MESSAGE = 'chat_message',
  USER = 'user',
  GROUP = 'group',
}
interface ConversationModel extends Omit<IConversationModel, 'type'> {
  type: ConversationType;
}

interface MessageModel extends Omit<IMessageModel, 'type' | 'conversationType'> {
  type: MessageType;
  conversationType: ConversationType;
}

export type {
  ISearchResult as SearchResult,
  ISearchParamsMap as SearchParamsMap,
  IGroupModel as GroupModel,
  ISearchCloudMessagesResultItem as SearchCloudMessagesResultItem,
  ISearchCloudUsersResultItem as SearchCloudUsersResultItem,
  ISearchCloudGroupsResultItem as SearchCloudGroupsResultItem,
  CreateGroupParams,
} from '@tencentcloud/chat-uikit-engine';

export type {
  ConversationModel,
  MessageModel,
};

export {
  ConversationType,
  MessageType,
  SearchType,
};
