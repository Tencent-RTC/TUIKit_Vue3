import type { Component } from 'vue';
import { computed } from 'vue';
import {
  IconCopy,
  IconMsgRevoke,
  IconMsgQuote,
  IconMsgForward,
  IconMsgDel,
  TUIToast,
  i18next,
} from '@tencentcloud/uikit-base-component-vue3';
import { useMessageActionStore } from '../chat-store';
import { MessageStatus, MessageType } from '@atomicxcore/core';
import type { MessageInfo } from '@atomicxcore/core';
import { useChatUIState } from '../context/useChatUIState';
import { isCallMessage } from '../utils/call';
import { isRoomMessage } from '../utils/room';
import { copyTextToClipboard } from '../utils/copyText';
import { transformTextWithEmojiKeyToName } from '../utils';

/**
 * Message action interface
 */
interface MessageAction {
  /** Unique action identifier */
  key: string;
  /** Action display label */
  label: string;
  /** Action icon component */
  icon?: Component | string;
  /** Action click handler function */
  onClick?: (message: MessageInfo) => void;
  /** Action visibility control */
  visible?: boolean | ((message: MessageInfo) => boolean);
  /** Custom component */
  component?: Component;
  /** Custom class name */
  className?: string;
  /** Custom style */
  style?: Record<string, any>;
}

/**
 * Default message action configuration
 */
const DEFAULT_ACTIONS: Record<string, MessageAction> = {
  copy: {
    key: 'copy',
    label: 'copy',
    visible: (message: MessageInfo) => message.messageType === MessageType.Text,
    icon: IconCopy,
  },
  recall: {
    key: 'recall',
    label: 'recall',
    visible: (message: MessageInfo) =>
      !isCallMessage(message) && message.isSentBySelf
      && message.status === MessageStatus.SendSuccess
      && Date.now() - (message.timestamp?.getTime() ?? 0) < 60 * 2 * 1000,
    icon: IconMsgRevoke,
  },
  quote: {
    key: 'quote',
    label: 'quote',
    visible: (message: MessageInfo) => !isCallMessage(message) && !isRoomMessage(message) && message.status === MessageStatus.SendSuccess,
    icon: IconMsgQuote,
  },
  forward: {
    key: 'forward',
    label: 'forward',
    visible: (message: MessageInfo) => !isCallMessage(message) && !isRoomMessage(message) && message.status === MessageStatus.SendSuccess,
    icon: IconMsgForward,
  },
  delete: {
    key: 'delete',
    label: 'delete',
    icon: IconMsgDel,
    visible: (message: MessageInfo) => message.status === MessageStatus.SendSuccess,
    style: {
      color: 'var(--text-color-error)',
    },
  },
};

/**
 * Default action order
 */
const DEFAULT_ACTION_ORDER: Array<MessageAction['key']> = ['copy', 'recall', 'quote', 'forward', 'delete'];

/**
 * Message Actions Hook
 * Used to get message action list, supports custom actions
 * @param propsActionList - Custom action list, can be an array of action keys or action objects
 * @returns Processed message action list
 */
function useMessageActions(propsActionList?: Array<MessageAction['key'] | MessageAction>, channel = 'default'): MessageAction[] {
  const { openForwardModal, setQuotedMessage, focusInput } = useChatUIState(channel);

  // Default action handlers
  const defaultActionHandlers: Record<string, (message: MessageInfo) => void> = {
    copy: (message) => {
      const text = (message.messagePayload as any)?.text ?? '';
      copyTextToClipboard(transformTextWithEmojiKeyToName(text))
        .then(() => TUIToast.success({
          message: i18next.t('MessageList.copy_success'),
        }))
        .catch(() => TUIToast.error({
          message: i18next.t('MessageList.copy_failed'),
        }));
    },
    recall: (message) => {
      const actionStore = useMessageActionStore(message);
      actionStore.revoke()
        .then(() => {
          TUIToast.success({ message: i18next.t('MessageList.recall_success') });
        })
        .catch(err => TUIToast.error({
          message: err.code === 20016 ? i18next.t('MessageList.recall_time_limit_exceeded') : i18next.t('MessageList.recall_failed'),
        }))
        .finally(() => actionStore.destroy());
    },
    quote: (message) => {
      setQuotedMessage(message);
      focusInput();
    },
    forward: (message) => {
      openForwardModal([message]);
    },
    delete: (message) => {
      const actionStore = useMessageActionStore(message);
      actionStore.delete()
        .then(() => {
          TUIToast.success({ message: i18next.t('MessageList.delete_success') });
        })
        .catch(() => TUIToast.error({
          message: i18next.t('MessageList.delete_failed'),
        }))
        .finally(() => actionStore.destroy());
    },
  };

  // Parse props list
  const resolvedActions = (propsActionList || DEFAULT_ACTION_ORDER).map((propsAction): MessageAction => {
    // If props is a string, use default configuration
    if (typeof propsAction === 'string') {
      const defaultConfig = DEFAULT_ACTIONS[propsAction];
      return {
        ...defaultConfig,
        onClick: defaultActionHandlers[propsAction],
      };
    }

    // If props is an object, override default configuration
    const defaultActionConfig = DEFAULT_ACTIONS[propsAction.key] || {};
    return {
      ...defaultActionConfig,
      ...propsAction,
      onClick: propsAction.onClick || defaultActionHandlers[propsAction.key],
    };
  });

  // Use computed instead of useMemo to achieve the same optimization effect
  return computed(() => resolvedActions).value;
}

export {
  useMessageActions,
};

export type {
  MessageAction,
};
