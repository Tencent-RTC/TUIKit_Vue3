/**
 * Scroll related hook
 * Provides functions to scroll to bottom and scroll to specific messages
 */

/**
 * Scroll options interface
 * @interface ScrollOptions
 * @property {('auto' | 'smooth' | 'instant')} [behavior] - Scroll behavior, auto for immediate scroll, smooth for smooth scroll, instant as alias for immediate scroll
 * @property {('start' | 'center' | 'end' | 'nearest')} [block] - Scroll alignment
 */
interface ScrollOptions {
  behavior?: 'auto' | 'smooth' | 'instant';
  block?: 'start' | 'center' | 'end' | 'nearest';
}

/**
 * Options for scrolling to specific message, extends ScrollOptions
 * @interface ScrollToMessageOptions
 * @extends ScrollOptions
 * @property {boolean} [skipIfVisible] - Skip scrolling if message is already visible in viewport
 */
interface ScrollToMessageOptions extends ScrollOptions {
  skipIfVisible?: boolean; // Skip scrolling if message is already visible in viewport
}

/**
 * Check if element is visible in viewport
 * @param {Element} element - Target element
 * @param {Element} container - Scroll container
 * @returns {boolean} - Whether element is visible
 */
const isElementVisible = (element: Element, container: Element): boolean => {
  const elementRect = element.getBoundingClientRect();
  const containerRect = container.getBoundingClientRect();

  // Element top is within container visible area
  const topVisible = elementRect.top >= containerRect.top && elementRect.top <= containerRect.bottom;

  // Element bottom is within container visible area
  const bottomVisible = elementRect.bottom >= containerRect.top && elementRect.bottom <= containerRect.bottom;

  // Element completely contains container visible area
  const elementContainsContainer = elementRect.top <= containerRect.top && elementRect.bottom >= containerRect.bottom;

  return topVisible || bottomVisible || elementContainsContainer;
};

/**
 * Scroll related hook
 * @returns {Object} Scroll related methods
 * @property {Function} scrollToBottom - Method to scroll to bottom
 * @property {Function} scrollToMessage - Method to scroll to specific message
 */
export const useScroll = () => {
  /**
   * Scroll to bottom
   * @param {ScrollOptions} [options={}] - Scroll options
   * @returns {Promise<void>} Promise that resolves when scrolling is complete
   */
  const scrollToBottom = (options: ScrollOptions = {}): Promise<void> => new Promise((resolve) => {
    const scrollableContainer = document.querySelector('#messageScrollList');

    if (!scrollableContainer) {
      resolve();
      return;
    }

    const defaultOptions: ScrollOptions = {
      behavior: 'instant',
      block: 'end',
    };

    const mergedOptions = { ...defaultOptions, ...options };

    // Handle instant scroll effect (immediate scroll without animation)
    const behavior = mergedOptions.behavior === 'instant' ? 'auto' : mergedOptions.behavior || 'auto';

    requestAnimationFrame(() => {
      scrollableContainer.scrollTo({
        top: scrollableContainer.scrollHeight,
        behavior,
      });

      // Monitor scroll end
      if (behavior === 'smooth') {
        const onScrollEnd = () => {
          scrollableContainer.removeEventListener('scrollend', onScrollEnd);

          // Double check scroll position to ensure scrolled to bottom
          setTimeout(() => {
            scrollableContainer.scrollTo({
              top: scrollableContainer.scrollHeight,
              behavior: 'auto',
            });
            resolve();
          }, 100);
        };

        // If browser supports scrollend event
        if ('onscrollend' in window) {
          scrollableContainer.addEventListener('scrollend', onScrollEnd);
        } else {
          // Compatibility for browsers that don't support scrollend event
          setTimeout(() => {
            scrollableContainer.scrollTo({
              top: scrollableContainer.scrollHeight,
              behavior: 'auto',
            });
            resolve();
          }, 500);
        }
      } else {
        // Immediate scroll doesn't need to wait
        resolve();
      }
    });
  });

  /**
   * Scroll to specific message
   * @param {string} messageID - Message ID
   * @param {ScrollToMessageOptions} [options={}] - Scroll options
   * @returns {Promise<void>} Promise that resolves when scrolling is complete
   */
  const scrollToMessage = (messageID: string, options: ScrollToMessageOptions = {}): Promise<void> => new Promise((resolve, reject) => {
    const targetMessageDom = document.querySelector(`[data-message-id="${messageID}"]`);
    const scrollableContainer = document.querySelector('#messageScrollList');

    if (!targetMessageDom || !scrollableContainer) {
      reject(new Error('Target message or scrollable container not found'));
      return;
    }

    // Check if scrolling should be skipped
    if (options.skipIfVisible && isElementVisible(targetMessageDom, scrollableContainer as Element)) {
      resolve();
      return;
    }

    const defaultOptions: ScrollToMessageOptions = {
      behavior: 'smooth',
      block: 'center',
    };

    const mergedOptions = { ...defaultOptions, ...options };

    // Handle instant scroll effect (immediate scroll without animation)
    const behavior = mergedOptions.behavior === 'instant' ? 'auto' : mergedOptions.behavior;

    // Calculate target element position relative to scroll container
    const targetTop = (targetMessageDom as HTMLElement).offsetTop;

    // Calculate final scroll position based on block option
    let scrollTop = targetTop;

    if (mergedOptions.block === 'center') {
      // Center display: target element top position - (container height - target element height) / 2
      scrollTop = targetTop - ((scrollableContainer as HTMLElement).clientHeight - (targetMessageDom as HTMLElement).clientHeight) / 2;
    } else if (mergedOptions.block === 'end') {
      // Bottom alignment: target element bottom aligns with container bottom
      scrollTop = targetTop + (targetMessageDom as HTMLElement).clientHeight - (scrollableContainer as HTMLElement).clientHeight;
    }

    // Ensure scroll position is within valid range
    scrollTop = Math.max(0, Math.min(scrollTop, (scrollableContainer as HTMLElement).scrollHeight - (scrollableContainer as HTMLElement).clientHeight));

    requestAnimationFrame(() => {
      // Use scrollTo instead of scrollIntoView
      scrollableContainer.scrollTo({
        top: scrollTop,
        behavior,
      });

      // Monitor scroll end
      if (behavior === 'smooth') {
        const onScrollEnd = () => {
          scrollableContainer.removeEventListener('scrollend', onScrollEnd);
          resolve();
        };

        // If browser supports scrollend event
        if ('onscrollend' in window) {
          scrollableContainer.addEventListener('scrollend', onScrollEnd);
        } else {
          // Compatibility for browsers that don't support scrollend event
          setTimeout(() => {
            resolve();
          }, 500);
        }
      } else {
        // Immediate scroll doesn't need to wait
        resolve();
      }
    });
  });

  return {
    scrollToBottom,
    scrollToMessage,
  };
};
