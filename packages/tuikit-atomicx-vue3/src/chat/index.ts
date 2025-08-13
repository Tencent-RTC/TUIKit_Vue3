// Chat related exports
import { View as ViewComponent } from '../baseComp/View';
import { ChatSetting as ChatSettingComponent } from '../components/ChatSetting';
import {
  ConversationList as ConversationListComponent,
  ConversationActions as ConversationActionsComponent,
  ConversationListHeader as ConversationListHeaderComponent,
  ConversationListContent as ConversationListContentComponent,
  ConversationPreview as ConversationPreviewComponent,
} from '../components/ConversationList';
import {
  MessageInput as MessageInputComponent,
  EmojiPicker as EmojiPickerComponent,
} from '../components/MessageInput';
import { MessageList as MessageListComponent } from '../components/MessageList';
import {
  Search as SearchComponent,
  SearchAdvanced as SearchAdvancedComponent,
  MessageAdvanced as MessageAdvancedComponent,
  UserAdvanced as UserAdvancedComponent,
  SearchResultItem as SearchResultItemComponent,
  SearchBar as SearchBarComponent,
  SearchResults as SearchResultsComponent,
} from '../components/Search';
import { useMessageActions as useMessageActionsHook } from '../hooks/useMessageActions';
import { useConversationListState as conversationListState } from '../states/ConversationListState';
import { useMessageActionState as messageActionState } from '../states/MessageActionState';
import { useMessageInputState as messageInputState } from '../states/MessageInputState';
import { useMessageListState as messageListState } from '../states/MessageListState';
import { useSearchState as searchState } from '../states/SearchState';
import { useUIOpenControlState as uiOpenControlState } from '../states/UIOpenControlState';

import ChatLoginServer from './server';

ChatLoginServer.getInstance().init();

// component
const Search = SearchComponent;
const SearchAdvanced = SearchAdvancedComponent;
const MessageAdvanced = MessageAdvancedComponent;
const UserAdvanced = UserAdvancedComponent;
const SearchBar = SearchBarComponent;
const SearchResults = SearchResultsComponent;
const SearchResultItem = SearchResultItemComponent;
const ConversationList = ConversationListComponent;
const ConversationActions = ConversationActionsComponent;
const ConversationListHeader = ConversationListHeaderComponent;
const ConversationListContent = ConversationListContentComponent;
const ConversationPreview = ConversationPreviewComponent;

const MessageList = MessageListComponent;
const MessageInput = MessageInputComponent;
const EmojiPicker = EmojiPickerComponent;
const ChatSetting = ChatSettingComponent;
const View = ViewComponent;

// Hooks
const useMessageActions = useMessageActionsHook;

// States
const useConversationListState = conversationListState;
const useMessageActionState = messageActionState;
const useMessageInputState = messageInputState;
const useMessageListState = messageListState;
const useSearchState = searchState;
const useUIOpenControlState = uiOpenControlState;

export {
  // component
  Search,
  SearchAdvanced,
  UserAdvanced,
  MessageAdvanced,
  SearchResults,
  SearchResultItem,
  SearchBar,
  ConversationList,
  ConversationActions,
  ConversationListHeader,
  ConversationListContent,
  ConversationPreview,
  MessageList,
  MessageInput,
  EmojiPicker,
  ChatSetting,
  View,

  // Hooks
  useMessageActions,

  // States
  useMessageListState,
  useMessageInputState,
  useMessageActionState,
  useConversationListState,
  useSearchState,
  useUIOpenControlState,
};
