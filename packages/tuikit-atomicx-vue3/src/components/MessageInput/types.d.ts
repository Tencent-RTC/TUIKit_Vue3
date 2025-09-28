import type { Component, CSSProperties } from 'vue';

type BuiltInAction =
  | 'EmojiPicker'
  | 'ImagePicker'
  | 'FilePicker'
  | 'VideoPicker'
  | 'AttachmentPicker'
  | 'AudioCallPicker'
  | 'VideoCallPicker';

export type CustomAction = {
  key: string;
  label?: string | undefined;
  component?: Component | undefined;
  className?: string | undefined;
  style?: CSSProperties | undefined;
  iconSize?: number | undefined;
};

export type MessageInputActions = Array<BuiltInAction | CustomAction>;

export type MessageInputAttachmentPickerMode = 'collapsed' | 'expanded';

export interface MessageInputProps {
  autoFocus?: boolean;
  disabled?: boolean;
  hideSendButton?: boolean;
  placeholder?: string;
  attachmentPickerMode?: MessageInputAttachmentPickerMode;
  actions?: MessageInputActions;
  slots?: MessageInputSlots;
}

export interface MessageInputSlots {
  headerToolbar?: () => VNode[];
  footerToolbar?: () => VNode[];
  leftInline?: () => VNode[];
  rightInline?: () => VNode[];
  inputPrefix?: () => VNode[];
  inputSuffix?: () => VNode[];
  textEditor?: () => VNode[];
}
