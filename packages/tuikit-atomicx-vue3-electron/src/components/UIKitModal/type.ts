import type { VNode } from 'vue';

export type ButtonType = 'primary' | 'default' | 'text';
export type Action = 'cancel' | 'confirm' | 'close' | 'mask';

export interface UIKitModalEvents {
  onConfirm?: () => void;
  onCancel?: () => void;
}

export interface UIKitModalOptions extends UIKitModalEvents {
  id: number;
  title: string;
  content: string | VNode;
  type: 'info' | 'warning' | 'error' | 'success';
}

export interface IUIKitModalBtn {
  type?: ButtonType;
  text?: string;
  customClasses?: string[];
  action?: () => void;
  disabled?: boolean;
}
