import type { Component, CSSProperties } from 'vue';
import type { Friend } from './contact';
import type { ConversationModel } from './engine';
import type { AvatarProps } from '../components/Avatar';
import type { CreateGroupParams } from '@tencentcloud/chat-uikit-engine-lite';

export interface ConversationListProps {
  /** Determines whether the conversation search input appears on the conversation list view. */
  enableSearch?: boolean;
  /** Determines whether the conversation creation button appears on the conversation list view. */
  enableCreate?: boolean;
  /** Determines whether the conversation action button appears on the conversation list view. */
  enableActions?: boolean;
  /** Specifies the prop to customize action on the conversation list item. */
  actionsConfig?: ConversationActionsConfig;
  /** Specifies a vue component to customize the header of the conversation list. */
  Header?: Component<ConversationListHeaderProps>;
  /** Specifies a vue component to customize the conversation list component. */
  List?: Component<ConversationListContentProps>;
  /** Specifies a vue component to customize the conversation preview. */
  Preview?: Component<ConversationPreviewUIProps>;
  /** Specifies a vue component to customize the conversation create component. */
  ConversationCreate?: Component<ConversationCreateProps>;
  /** Specifies a vue component to customize the conversation search. */
  ConversationSearch?: Component;
  /** Specifies a vue component to customize the conversation actions in conversation preview. */
  ConversationActions?: Component<ConversationActionsProps>;
  /** Specifies a vue component to display when the chat list is empty. */
  PlaceholderEmptyList?: Component;
  /** Specifies a vue component to display while the chat list is loading. */
  PlaceholderLoading?: Component;
  /** Specifies a vue component to display when there is an error loading the chat list. */
  PlaceholderLoadError?: Component;
  /** Specifies a vue component to customize the avatar in list. */
  Avatar?: Component<AvatarProps>;
  /** Specifies a function to filter conversations in the conversation list. */
  filter?: ((conversationList: ConversationModel[]) => ConversationModel[]);
  /** Specifies a function to sort conversations in the conversation list. */
  sort?: ((conversationList: ConversationModel[]) => ConversationModel[]);
  /** Specifies the prop to receive callback when a user clicks a conversation. */
  onSelectConversation?: ((conversation: ConversationModel) => void);
  /** Specifies the prop to execute custom operations before creating a channel. */
  onBeforeCreateConversation?: (
    (params: string | CreateGroupParams) => string | CreateGroupParams
  );
  /** Specifies the prop to receive callback when a conversation is created. */
  onConversationCreated?: ((conversation: ConversationModel) => void);
  /** The custom class name */
  className?: string;
  /** The custom css style */
  style?: CSSProperties;
}

export interface ConversationListHeaderProps {
  /** The main of the conversation list header */
  children?: any;
  /** A custom component to display in the left area of header */
  left?: any;
  /** A custom component to display in the right area of header */
  right?: any;
  /** The custom class name */
  className?: string;
  /** The custom css style */
  style?: CSSProperties;
}

export interface ConversationListContentProps {
  /** Renders a customized component in the conversation list main. */
  children?: any;
  /** Indicates whether the chat list is empty */
  empty?: boolean;
  /** Indicates whether the chat list is currently loading */
  loading?: boolean;
  /** Indicates whether there was an error loading the chat list */
  error?: boolean;
  /** A custom component to display when the chat list is empty */
  PlaceholderEmptyList?: Component;
  /** A custom component to display while the chat list is loading */
  PlaceholderLoading?: Component;
  /** A custom component to display when there is an error loading the chat list */
  PlaceholderLoadError?: Component;
  /** The custom class name */
  className?: string;
  /** The custom class style */
  style?: CSSProperties;
}

export interface ConversationPreviewUIProps {
  /** The conversation to be displayed */
  conversation: ConversationModel;
  /** If the component's Conversation is the active (selected) Conversation */
  isSelected?: boolean;
  /** Whether to show the ConversationActions */
  enableActions?: boolean;
  /** The custom Avatar component */
  Avatar?: Component<AvatarProps>;
  /** The custom Title component */
  Title?: string | Component;
  /** The custom last message abstract component */
  LastMessageAbstract?: string | Component;
  /** The custom last message abstract component */
  LastMessageTimestamp?: string | Component;
  /** The custom Unread component */
  Unread?: string | Component;
  /** The custom ConversationActions component */
  ConversationActions?: Component<ConversationActionsProps>;
  /** Callback when the user click a conversation from conversation list */
  onSelectConversation?: ((conversation: ConversationModel) => void);
  /** The custom ConversationActions config */
  actionsConfig?: ConversationActionsConfig;
  /** The custom class name */
  className?: string;
  /** The custom class style */
  style?: CSSProperties;
  /** The custom children node to override UI */
  children?: any;
}

export interface ConversationPreviewProps extends ConversationPreviewUIProps {
  /** The custom Preview UI component */
  Preview?: Component<ConversationPreviewUIProps>;
}

export interface ConversationActionItem {
  /** Determines whether the custom action is enabled. (Default: True) */
  enable?: boolean;
  /** label: The label of the custom action. */
  label: string;
  /** onClick: The function to be called when the custom action is clicked. */
  onClick: (conversation: ConversationModel, e?: Event) => void;
}

export interface ConversationActionsBaseConfig {
  /** Determines whether the pin button appears on the conversation actions list view. */
  enablePin?: boolean;
  /** Determines whether the mute button appears on the conversation actions list view. */
  enableMute?: boolean;
  /** Determines whether the delete button appears on the conversation actions list view. */
  enableDelete?: boolean;
  /** Determines whether the mark unread button appears on the conversation actions list view. */
  enableMarkUnread?: boolean;
}

export interface ConversationActionsConfig extends ConversationActionsBaseConfig {
  /** Function to override the default behavior when user mark a conversation as unread. */
  onMarkConversationUnread?: (conversation: ConversationModel, e?: Event) => void;
  /** Function to override the default behavior when user pin or unpin a conversation. */
  onConversationPin?: (conversation: ConversationModel, e?: Event) => void;
  /** Function to override the default behavior when user mute or unmute a conversation. */
  onConversationMute?: (conversation: ConversationModel, e?: Event) => void;
  /** Function to override the default behavior when user delete a conversation. */
  onConversationDelete?: (conversation: ConversationModel, e?: Event) => void;
  /**
   * An object containing custom conversation actions (key) and object (value).
   * Each value is an object with the following properties:
   * enable: Determines whether the custom action is enabled. (Default: True)
   * label: The label of the custom action.
   * onClick: The function to be called when the custom action is clicked.
   * Note: The key of the custom action must be unique.
   */
  customConversationActions?: Record<string, ConversationActionItem>;
  /** The icon vue element to be displayed in the action popup. */
  PopupIcon?: Component;
  /** An array of vue elements to be displayed in the action popup. */
  PopupElements?: Component[];
  /** The function to be called when the action popup is clicked. */
  onClick?: (e: Event, key?: string, conversation?: ConversationModel) => void;
  /** Function to be called when the actions modal is closed (H5 only). */
  onClose?: () => void;
}

export interface ConversationActionsProps extends ConversationActionsConfig {
  /** The conversation model. */
  conversation: ConversationModel;
  /** The class name of the root element. */
  className?: string;
  /** The style of the root element. */
  style?: CSSProperties;
}

export interface ConversationCreateProps {
  onBeforeCreateConversation?: (
    (params: string | CreateGroupParams) => string | CreateGroupParams
  );
  onConversationCreated?: ((conversation: ConversationModel) => void);
  conversationList?: ConversationModel[];
}

export interface ConversationCreateButtonProps {
  onClick?: (value: CreateConvTypes) => void;
  size?: number;
}

export enum PageStateTypes {
  USER_SELECT = 'Next',
  CREATE_DETAIL = 'Create',
  GROUP_TYPE = 'GroupType',
}

export interface ConversationCreateGroupDetailProps {
  profileList: Friend[];
  pageState: PageStateTypes;
  groupInfo: CreateGroupInfo;
  onUpdateGroupInfo: (info: CreateGroupInfo) => void;
  setPageState: (state: PageStateTypes) => void;
}

export interface ConversationCreateUserSelectListProps {
  isCreateGroup: boolean;
  selectList: Friend[];
  setSelectList: (list: Friend[]) => void;
}

export interface ConversationGroupTypeInfoProps {
  groupType: GroupType;
  setGroupType: (type: GroupType) => void;
}

export enum PlaceHolderTypes {
  LOADING = 'LOADING',
  NO_CONVERSATIONS = 'NO_CONVERSATIONS',
  WRONG = 'WRONG',
}

export enum CreateConvTypes {
  C2C = 'createC2C',
  GROUP = 'createGroup',
}

export interface ConversationPlaceHolderProps {
  type: PlaceHolderTypes;
  className?: string;
  iconSize?: number;
  searchString?: string;
  retry?: () => void;
}

export enum GroupLabelTypes {
  NAME = 'name',
  GROUP_ID = 'groupID',
  TYPE = 'type',
}

export enum GroupType {
  WORK = 'Private',
  PUBLIC = 'Public',
  MEETING = 'ChatRoom',
  AVCHATROOM = 'AVChatRoom',
  COMMUNITY = 'Community',
}

export interface CreateGroupInfo {
  avatar?: string;
  name: string;
  groupID: string;
  type: GroupType;
}
