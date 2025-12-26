import { onMounted, onUnmounted, watch } from 'vue';
import { TUIChatService, TUIStore } from '@tencentcloud/chat-uikit-engine';
import { handleChatErrorWithModal } from '../../components/UIKitModal/chatErrorModal';
import { throttle } from '../../utils/lodash';
import type { IMessageModel } from '@tencentcloud/chat-uikit-engine';

interface UseReadReceiptOptions {
  /**
   * Whether to enable read receipt feature
   */
  enabled: boolean;

  /**
   * Selector or DOM reference for the message list container
   */
  containerSelector: string | HTMLElement;

  /**
   * Selector for message elements, default is '[data-message-id]'
   */
  messageSelector?: string;

  /**
   * Intersection ratio threshold, default is 0.5 (50%)
   */
  intersectionThreshold?: number;

  /**
   * Throttle delay for batch sending, default is 300ms
   */
  delay?: number;

  /**
   * Function to extract message ID from DOM element
   */
  getMessageIDFromDom: (dom: Element) => string;

  /**
   * Function to decide if a message should send read receipt
   */
  shouldSendReadReceipt?: (message: IMessageModel) => boolean;
}

export function useReadReceipt({
  enabled,
  containerSelector,
  messageSelector = '[data-message-id]',
  getMessageIDFromDom,
  shouldSendReadReceipt = message => message.flow === 'in',
  intersectionThreshold = 0.5,
  delay = 1000,
}: UseReadReceiptOptions) {
  // IntersectionObserver instance - 使用普通变量，不需要响应式
  let observer: IntersectionObserver | null = null;
  // Message objects pending to send read receipt - 使用普通变量，不需要响应式
  const pendingReadReceiptMessages = new Map<string, IMessageModel>();
  // Message IDs that have already been processed - 使用普通变量，不需要响应式
  const processedMessageIds = new Set<string>();

  // Throttled function to batch send read receipts
  const sendBatchReadReceipts = throttle(() => {
    if (pendingReadReceiptMessages.size === 0) {
      return;
    }
    const messagesToSend = Array.from(pendingReadReceiptMessages.values());
    TUIChatService.sendMessageReadReceipt(messagesToSend)
      .then(() => {
        // Successfully sent read receipts
      })
      .catch((error) => {
        handleChatErrorWithModal(error as unknown as any);
      });
    pendingReadReceiptMessages.clear();
  }, delay, { leading: false, trailing: true });

  // Core logic to check and process a message for read receipt
  const checkMessageAndSendReadReceipt = (messageID: string) => {
    if (processedMessageIds.has(messageID)) {
      return false;
    }
    const message = TUIStore.getMessageModel(messageID);
    if (!message) {
      return false;
    }
    if (shouldSendReadReceipt(message)) {
      pendingReadReceiptMessages.set(messageID, message);
      processedMessageIds.add(messageID);
      sendBatchReadReceipts();
      return true;
    }
    return false;
  };

  // Initialize IntersectionObserver
  const initializeObserver = () => {
    if (!enabled) {
      return;
    }
    observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting && entry.intersectionRatio >= intersectionThreshold) {
            const messageID = getMessageIDFromDom(entry.target as HTMLElement);
            if (messageID) {
              checkMessageAndSendReadReceipt(messageID);
            }
            observer?.unobserve(entry.target);
          }
        });
      },
      {
        threshold: intersectionThreshold,
        root: typeof containerSelector === 'string'
          ? document.querySelector(containerSelector)
          : containerSelector,
      },
    );
  };

  // Cleanup observer
  const cleanupObserver = () => {
    observer?.disconnect();
    // ensure all pending read receipts are sent
    sendBatchReadReceipts.flush();
  };

  // Watch for changes in dependencies and reinitialize observer
  watch(
    [() => enabled, () => containerSelector, () => intersectionThreshold],
    () => {
      cleanupObserver();
      initializeObserver();
    },
    { immediate: true },
  );

  // Observe new messages in the container
  const observeMessageList = () => {
    if (!observer || !enabled) {
      return;
    }
    const container = typeof containerSelector === 'string'
      ? document.querySelector(containerSelector)
      : containerSelector;
    if (!container) {
      return;
    }
    const messageElements = container.querySelectorAll(messageSelector) as unknown as HTMLElement[];
    messageElements.forEach((element) => {
      const messageID = getMessageIDFromDom(element);
      if (!messageID) {
        return;
      }
      if (processedMessageIds.has(messageID)) {
        return;
      }
      const message = TUIStore.getMessageModel(messageID);
      if (message && shouldSendReadReceipt(message)) {
        observer?.observe(element);
      }
    });
  };

  // Manually mark visible messages as read (for initial load, etc.)
  const manuallyMarkVisibleMessagesAsRead = () => {
    if (!enabled) {
      return;
    }
    const container = typeof containerSelector === 'string'
      ? document.querySelector(containerSelector)
      : containerSelector;
    if (!container) {
      return;
    }
    const containerRect = container.getBoundingClientRect();
    const messageElements = container.querySelectorAll(messageSelector);
    messageElements.forEach((element) => {
      const messageID = getMessageIDFromDom(element);
      if (!messageID) {
        return;
      }
      if (processedMessageIds.has(messageID)) {
        return;
      }
      const elementRect = element.getBoundingClientRect();
      const isVisible
        = elementRect.top < containerRect.bottom
          && elementRect.bottom > containerRect.top
          && elementRect.height > 0;
      if (isVisible) {
        checkMessageAndSendReadReceipt(messageID);
      }
    });
  };

  // Initialize observer on mount
  onMounted(() => {
    initializeObserver();
  });

  // Cleanup on unmount
  onUnmounted(() => {
    cleanupObserver();
  });

  // Public API
  return {
    /**
     * Observe new messages, should be called when message list updates
     */
    observeMessageList,
    /**
     * Manually mark visible messages as read, e.g. after initial load
     */
    manuallyMarkVisibleMessagesAsRead,
    /**
     * Reset processed message records, e.g. when switching conversation
     */
    resetProcessedMessages: () => {
      processedMessageIds.clear();
      pendingReadReceiptMessages.clear();
    },
  };
}
