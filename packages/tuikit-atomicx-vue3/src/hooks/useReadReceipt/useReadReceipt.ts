import { inject, onMounted, onUnmounted, watch } from 'vue';
import { throttle } from '../../utils/lodash';
import type { MessageInfo } from '@atomicxcore/core';
import { useChatContext } from '../../chat-store';

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
   * Throttle delay for batch sending, default is 1000ms
   */
  delay?: number;

  /**
   * Function to extract message ID from DOM element
   */
  getMessageIDFromDom: (dom: Element) => string;

  /**
   * Function to decide if a message should send read receipt
   */
  shouldSendReadReceipt?: (message: MessageInfo) => boolean;

  /**
   * Channel id for active conversation context.
   */
  channel?: string;
}

export function useReadReceipt({
  enabled,
  containerSelector,
  messageSelector = '[data-message-id]',
  getMessageIDFromDom,
  shouldSendReadReceipt = message => !message.isSentBySelf,
  intersectionThreshold = 0.5,
  delay = 1000,
  channel,
}: UseReadReceiptOptions) {
  // IntersectionObserver instance
  let observer: IntersectionObserver | null = null;
  // MutationObserver instance — watches for new message elements added to the container subtree
  let mutationObserver: MutationObserver | null = null;
  // Message objects pending to send read receipt
  const pendingReadReceiptMessages = new Map<string, MessageInfo>();
  // Message IDs that have already been processed
  const processedMessageIds = new Set<string>();

  const resolvedChannel = channel ?? (inject('channel', 'default') as string);
  const { messageList, sendMessageReadReceipts } = useChatContext(resolvedChannel);

  // Throttled function to batch send read receipts
  const sendBatchReadReceipts = throttle(() => {
    const messagesToSend = Array.from(pendingReadReceiptMessages.values())
      .filter(message => message.needReadReceipt);
    if (messagesToSend.length === 0) {
      return;
    }
    sendMessageReadReceipts(messagesToSend)
      .catch((error) => {
        console.error('useReadReceipt::sendBatchReadReceipts failed', error);
      });
    pendingReadReceiptMessages.clear();
  }, delay, { leading: false, trailing: true });

  // Core logic to check and process a message for read receipt
  const checkMessageAndSendReadReceipt = (messageID: string) => {
    if (processedMessageIds.has(messageID)) {
      return false;
    }
    const message = messageList.value.find(m => m.msgID === messageID);
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

  // Try to register a single DOM element with the IntersectionObserver.
  // Skips elements that are already processed or do not need a read receipt.
  const tryObserveElement = (element: Element) => {
    if (!observer) {
      return;
    }
    const messageID = getMessageIDFromDom(element);
    if (!messageID || processedMessageIds.has(messageID)) {
      return;
    }
    const message = messageList.value.find(m => m.msgID === messageID);
    if (message && shouldSendReadReceipt(message)) {
      observer.observe(element);
    }
  };

  // Scan the container and register all currently eligible message elements.
  const observeAllExistingElements = () => {
    if (!observer || !enabled) {
      return;
    }
    const container = typeof containerSelector === 'string'
      ? document.querySelector(containerSelector)
      : containerSelector;
    if (!container) {
      return;
    }
    container.querySelectorAll(messageSelector).forEach(tryObserveElement);
  };

  // Initialize IntersectionObserver + MutationObserver
  const initializeObservers = () => {
    if (!enabled) {
      return;
    }

    const container = typeof containerSelector === 'string'
      ? document.querySelector(containerSelector)
      : containerSelector;
    if (!container) {
      return;
    }

    // IntersectionObserver: fires when a registered message element enters the viewport
    observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting && entry.intersectionRatio >= intersectionThreshold) {
            const messageID = getMessageIDFromDom(entry.target as HTMLElement);
            if (messageID) {
              checkMessageAndSendReadReceipt(messageID);
            }
            // Unobserve immediately — each message only needs to be seen once
            observer?.unobserve(entry.target);
          }
        });
      },
      {
        threshold: intersectionThreshold,
        root: container,
      },
    );

    // MutationObserver: fires whenever child nodes are added to the container subtree.
    // This is the single source of truth for "a new message element appeared in the DOM".
    // It covers every scenario — initial load, new messages arriving, back-to-latest — without
    // requiring callers to manually invoke observeMessageList at each of those sites.
    mutationObserver = new MutationObserver((mutations) => {
      for (const mutation of mutations) {
        if (mutation.type !== 'childList') {
          continue;
        }
        mutation.addedNodes.forEach((node) => {
          if (!(node instanceof Element)) {
            return;
          }
          // The added node itself might be a message element
          if (node.matches(messageSelector)) {
            tryObserveElement(node);
          }
          // Or it might be a wrapper that contains message elements
          node.querySelectorAll(messageSelector).forEach(tryObserveElement);
        });
      }
    });

    mutationObserver.observe(container, { childList: true, subtree: true });

    // Also scan whatever is already in the DOM at setup time
    observeAllExistingElements();
  };

  // Cleanup both observers
  const cleanupObservers = () => {
    observer?.disconnect();
    observer = null;
    mutationObserver?.disconnect();
    mutationObserver = null;
    sendBatchReadReceipts.flush();
  };

  // Re-initialize when key options change (e.g. enabled toggled, container changed)
  watch(
    [() => enabled, () => containerSelector, () => intersectionThreshold],
    () => {
      cleanupObservers();
      initializeObservers();
    },
    { immediate: true },
  );

  onMounted(() => {
    // Re-initialize after mount to ensure the container DOM is available.
    // The watch above may run before the container element is rendered.
    cleanupObservers();
    initializeObservers();
  });

  onUnmounted(() => {
    cleanupObservers();
  });

  // Public API — callers only need to call resetProcessedMessages when switching conversations
  return {
    resetProcessedMessages: () => {
      processedMessageIds.clear();
      pendingReadReceiptMessages.clear();
    },
  };
}
