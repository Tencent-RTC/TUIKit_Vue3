// Chat related exports (pure components, no initialization)
import { View as ViewComponent } from '../../baseComp/View';
import { ChatSetting as ChatSettingComponent } from '../../components/ChatSetting';
import {
  ContactList as ContactListComponent,
  ContactListItem as ContactListItemComponent,
  ContactInfo as ContactInfoComponent,
} from '../../components/ContactList';
import {
  ConversationList as ConversationListComponent,
  ConversationActions as ConversationActionsComponent,
  ConversationListHeader as ConversationListHeaderComponent,
  ConversationListContent as ConversationListContentComponent,
  ConversationPreview as ConversationPreviewComponent,
  ConversationPreviewUI as ConversationPreviewUIComponent,
  ConversationSearch as ConversationSearchComponent,
} from '../../components/ConversationList';
import {
  MessageInput as MessageInputComponent,
  EmojiPicker as EmojiPickerComponent,
  AttachmentPicker as AttachmentPickerComponent,
  FilePicker as FilePickerComponent,
  ImagePicker as ImagePickerComponent,
  VideoPicker as VideoPickerComponent,
  AudioCallPicker as AudioCallPickerComponent,
  VideoCallPicker as VideoCallPickerComponent,
} from '../../components/MessageInput';
import {
  MessageList as MessageListComponent,
  Message as MessageComponent,
} from '../../components/MessageList';
import {
  Search as SearchComponent,
  SearchAdvanced as SearchAdvancedComponent,
  MessageAdvanced as MessageAdvancedComponent,
  UserAdvanced as UserAdvancedComponent,
  SearchResultItem as SearchResultItemComponent,
  SearchBar as SearchBarComponent,
  SearchResults as SearchResultsComponent,
} from '../../components/Search';
import { useMessageActions as useMessageActionsHook } from '../../hooks/useMessageActions';
import { useConversationListState as conversationListState } from '../../states/ConversationListState';
import { useMessageActionState as messageActionState } from '../../states/MessageActionState';
import { useMessageInputState as messageInputState } from '../../states/MessageInputState';
import { useMessageListState as messageListState } from '../../states/MessageListState';
import { useSearchState as searchState } from '../../states/SearchState';
import { useContactListState as contactListState } from '../../states/ContactListState';
import { useC2CSettingState as c2cSettingState } from '../../states/C2CSettingState';
import { useGroupSettingState as groupSettingState } from '../../states/GroupSettingState';
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
const ConversationPreviewUI = ConversationPreviewUIComponent;
const ConversationSearch = ConversationSearchComponent;
const ContactList = ContactListComponent;
const ContactListItem = ContactListItemComponent;
const ContactInfo = ContactInfoComponent;

const MessageList = MessageListComponent;
const Message = MessageComponent;
const MessageInput = MessageInputComponent;
const EmojiPicker = EmojiPickerComponent;
const AttachmentPicker = AttachmentPickerComponent;
const FilePicker = FilePickerComponent;
const ImagePicker = ImagePickerComponent;
const VideoPicker = VideoPickerComponent;
const AudioCallPicker = AudioCallPickerComponent;
const VideoCallPicker = VideoCallPickerComponent;
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
const useContactListState = contactListState;
const useC2CSettingState = c2cSettingState;
const useGroupSettingState = groupSettingState;

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
  ConversationPreviewUI,
  ConversationSearch,
  MessageList,
  Message,
  MessageInput,
  EmojiPicker,
  AttachmentPicker,
  FilePicker,
  ImagePicker,
  VideoPicker,
  AudioCallPicker,
  VideoCallPicker,
  ChatSetting,
  View,
  ContactList,
  ContactListItem,
  ContactInfo,

  // Hooks
  useMessageActions,

  // States
  useMessageListState,
  useMessageInputState,
  useMessageActionState,
  useConversationListState,
  useSearchState,
  useContactListState,
  useC2CSettingState,
  useGroupSettingState,
};

export * from '../../types/message';
export * from '../../types/search';
export * from '../../types/engine';
export * from '../../types/conversation';
export * from '../../types/contact';
export * from '../../types/call';
export * from '../../types/chatSetting';
