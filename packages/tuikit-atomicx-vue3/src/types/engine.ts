import ChatEngine from '@tencentcloud/chat-uikit-engine-lite';
import type { ChatOfflinePushInfo } from '../hooks/useOfflinePushInfo';
import type { IConversationModel, IMessageModel, MessageControlInfo } from '@tencentcloud/chat-uikit-engine-lite';

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

enum MessagePriority {
  LOWEST = ChatEngine.TYPES.MSG_PRIORITY_LOWEST,
  LOW = ChatEngine.TYPES.MSG_PRIORITY_LOW,
  NORMAL = ChatEngine.TYPES.MSG_PRIORITY_NORMAL,
  HIGH = ChatEngine.TYPES.MSG_PRIORITY_HIGH,
}
interface ConversationModel extends Omit<IConversationModel, 'type'> {
  type: ConversationType;
}

interface MessageModel extends Omit<IMessageModel, 'type' | 'conversationType'> {
  type: MessageType;
  conversationType: ConversationType;
}

interface SendMessageParams {
  priority?: MessagePriority;
  to?: string;
  conversationType?: ConversationType.C2C | ConversationType.GROUP;
  payload: any;
  cloudCustomData?: string;
  needReadReceipt?: boolean;
  receiverList?: string[];
}

interface SendMessageOptions {
  onlineUserOnly?: boolean;
  offlinePushInfo?: ChatOfflinePushInfo;
  messageControlInfo?: MessageControlInfo;
}

export type {
  ISearchResult as SearchResult,
  ISearchParamsMap as SearchParamsMap,
  IGroupModel as GroupModel,
  ISearchCloudMessagesResultItem as SearchCloudMessagesResultItem,
  ISearchCloudUsersResultItem as SearchCloudUsersResultItem,
  ISearchCloudGroupsResultItem as SearchCloudGroupsResultItem,
  CreateGroupParams,
} from '@tencentcloud/chat-uikit-engine-lite';

export type {
  ConversationModel,
  MessageModel,
  SendMessageParams,
  SendMessageOptions,
};

export {
  ConversationType,
  MessageType,
  SearchType,
};
