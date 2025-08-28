import type { Component } from 'vue';
import { computed } from 'vue';
import ChatEngine from '@tencentcloud/chat-uikit-engine';
import {
  IconCopy,
  IconMsgRevoke,
  IconMsgQuote,
  IconMsgForward,
  IconMsgDel,
  TUIToast,
  i18next,
} from '@tencentcloud/uikit-base-component-vue3';
import { useMessageActionState } from '../states/MessageActionState';
import { isCallMessage } from '../utils/call';
import type { IMessageModel as MessageModel } from '@tencentcloud/chat-uikit-engine';

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
  onClick?: (message: MessageModel) => void;
  /** Action visibility control */
  visible?: boolean | ((message: MessageModel) => boolean);
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
    visible: (message: MessageModel) => message.type === ChatEngine.TYPES.MSG_TEXT,
    icon: IconCopy,
  },
  recall: {
    key: 'recall',
    label: 'recall',
    visible: (message: MessageModel) =>
      !isCallMessage(message) && message.flow === 'out'
      && message.status === 'success'
      && Date.now() - message.time * 1000 < 60 * 2 * 1000,
    icon: IconMsgRevoke,
  },
  quote: {
    key: 'quote',
    label: 'quote',
    visible: (message: MessageModel) => !isCallMessage(message),
    icon: IconMsgQuote,
  },
  forward: {
    key: 'forward',
    label: 'forward',
    visible: (message: MessageModel) => !isCallMessage(message),
    icon: IconMsgForward,
  },
  delete: {
    key: 'delete',
    label: 'delete',
    icon: IconMsgDel,
    visible: true,
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
function useMessageActions(propsActionList?: Array<MessageAction['key'] | MessageAction>): MessageAction[] {
  const state = useMessageActionState();

  // Default action handlers
  const defaultActionHandlers: Record<string, (message: MessageModel) => void> = {
    copy: (message) => {
      state.copyTextMessage(message)
        .then(() => TUIToast.success({
          message: i18next.t('TUIChat.Copied'),
        }))
        .catch(() => TUIToast.error({
          message: i18next.t('TUIChat.Copy Failed'),
        }));
    },
    recall: (message) => {
      state.recallMessage(message)
        .then(() => TUIToast.success({
          message: i18next.t('TUIChat.Recall Succeed'),
        }))
        .catch(err => TUIToast.error({
          message: err.code === 20016 ? i18next.t('TUIChat.Recall Time Limit Exceeded') : i18next.t('TUIChat.Recall Failed'),
        }));
    },
    quote: state.quoteMessage,
    forward: (message) => {
      state.setForwardMessageIDList([message.ID]);
      state.setIsForwardMessageSelectionDone(true);
    },
    delete: (message) => {
      state.deleteMessage(message)
        .then(() => TUIToast.success({
          message: i18next.t('TUIChat.Deleted'),
        }))
        .catch(() => TUIToast.error({
          message: i18next.t('TUIChat.Delete Failed'),
        }));
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
