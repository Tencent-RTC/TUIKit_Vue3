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
