import type { Component } from 'vue';
import type { CSSProperties } from 'vue';
import type { CreateGroupParams } from '@tencentcloud/chat-uikit-engine';
import type { ConversationModel } from './engine';
import type { AvatarProps } from '../components/Avatar';
import type { Friend, UserProfile } from './contact';

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
  PlaceholderEmptyList?: any;
  /** Specifies a vue component to display while the chat list is loading. */
  PlaceholderLoading?: any;
  /** Specifies a vue component to display when there is an error loading the chat list. */
  PlaceholderLoadError?: any;
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
  PlaceholderEmptyList?: any;
  /** A custom component to display while the chat list is loading */
  PlaceholderLoading?: any;
  /** A custom component to display when there is an error loading the chat list */
  PlaceholderLoadError?: any;
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
  /** The string to be highlighted in the title */
  highlightMatchString?: string;
  /** The custom Avatar component */
  Avatar?: Component<AvatarProps>;
  /** The custom Title component */
  Title?: string | any;
  /** The custom last message abstract component */
  LastMessageAbstract?: string | any;
  /** The custom last message abstract component */
  LastMessageTimestamp?: string | any;
  /** The custom Unread component */
  Unread?: string | any;
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
  PopupIcon?: any;
  /** An array of vue elements to be displayed in the action popup. */
  PopupElements?: any[];
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
  visible?: boolean;
  className?: string;
  style?: CSSProperties;
  onBeforeCreateConversation?: (
    (params: string | CreateGroupParams) => string | CreateGroupParams
  );
  onConversationCreated?: ((conversation: ConversationModel) => void);
  'onUpdate:visible'?: ((visible: boolean) => void);
  conversationList?: ConversationModel[];
}

export interface ConversationCreateButtonProps {
  visible?: boolean;
  onClick?: (event: Event) => void;
  height?: number;
  width?: number;
  className?: string;
}

export enum PageStateTypes {
  USER_SELECT = 'Next',
  CREATE_DETAIL = 'Create',
  GROUP_TYPE = 'GroupType',
}

export interface ConversationCreateGroupDetailProps {
  profileList: UserProfile[];
  pageState: PageStateTypes;
  setPageState: (state: PageStateTypes) => void;
  onBeforeCreateConversation?: ((params: CreateGroupParams) => void);
  onConversationCreated?: ((conversation: ConversationModel) => void);
}

export interface ConversationCreateSelectViewProps {
  selectList: UserProfile[];
  setSelectList: (list: UserProfile[]) => void;
}

export interface ConversationCreateUsers {
  [key: string]: Friend[] | UserProfile[];
}

export interface ConversationCreateUserSelectListProps extends ConversationCreateSelectViewProps {
  isCreateGroup: boolean;
  setIsCreateGroup: (value: boolean) => void;
  conversationList: ConversationModel[];
  setPageState: (state: PageStateTypes) => void;
  onBeforeCreateConversation?: ((userID: string) => void);
  onConversationCreated?: ((conversation: ConversationModel) => void);
  className?: string;
}

export enum PlaceHolderTypes {
  LOADING = 'LOADING',
  NO_CONVERSATIONS = 'NO_CONVERSATIONS',
  WRONG = 'WRONG',
};

export interface ConversationPlaceHolderProps {
  type: PlaceHolderTypes;
  className?: string;
  iconSize?: number;
  searchString?: string;
  retry?: () => void;
}
