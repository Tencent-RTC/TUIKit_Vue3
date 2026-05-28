/**
 * Scroll related hook
 */

interface ScrollOptions {
  behavior?: 'auto' | 'smooth' | 'instant';
  block?: 'start' | 'center' | 'end' | 'nearest';
}

interface ScrollToMessageOptions extends ScrollOptions {
  skipIfVisible?: boolean;
}

const isElementVisible = (element: Element, container: Element): boolean => {
  const elementRect = element.getBoundingClientRect();
  const containerRect = container.getBoundingClientRect();
  const topVisible = elementRect.top >= containerRect.top && elementRect.top <= containerRect.bottom;
  const bottomVisible = elementRect.bottom >= containerRect.top && elementRect.bottom <= containerRect.bottom;
  const elementContainsContainer = elementRect.top <= containerRect.top && elementRect.bottom >= containerRect.bottom;
  return topVisible || bottomVisible || elementContainsContainer;
};

export const useScroll = () => {
  const scrollToBottom = (container: HTMLElement | null, behavior: ScrollBehavior = 'auto'): Promise<void> => new Promise((resolve) => {
    if (!container) {
      resolve();
      return;
    }

    requestAnimationFrame(() => {
      container.scrollTo({
        top: container.scrollHeight,
        behavior,
      });

      if (behavior === 'smooth') {
        const onScrollEnd = () => {
          container.removeEventListener('scrollend', onScrollEnd);
          setTimeout(() => {
            container.scrollTo({ top: container.scrollHeight, behavior: 'auto' });
            resolve();
          }, 100);
        };

        if ('onscrollend' in window) {
          container.addEventListener('scrollend', onScrollEnd);
        } else {
          setTimeout(() => {
            container.scrollTo({ top: container.scrollHeight, behavior: 'auto' });
            resolve();
          }, 500);
        }
      } else {
        resolve();
      }
    });
  });

  const scrollToMessage = (container: HTMLElement | null, messageID: string, options: ScrollToMessageOptions = {}): Promise<void> => new Promise((resolve, reject) => {
    const targetMessageDom = container?.querySelector(`[data-message-id="${messageID}"]`);

    if (!targetMessageDom || !container) {
      reject(new Error('Target message or scrollable container not found'));
      return;
    }

    if (options.skipIfVisible && isElementVisible(targetMessageDom, container)) {
      resolve();
      return;
    }

    const defaultOptions: ScrollToMessageOptions = { behavior: 'smooth', block: 'center' };
    const mergedOptions = { ...defaultOptions, ...options };
    const behavior = mergedOptions.behavior === 'instant' ? 'auto' : mergedOptions.behavior || 'auto';

    const targetTop = (targetMessageDom as HTMLElement).offsetTop;
    let scrollTop = targetTop;

    if (mergedOptions.block === 'center') {
      scrollTop = targetTop - (container.clientHeight - (targetMessageDom as HTMLElement).clientHeight) / 2;
    } else if (mergedOptions.block === 'end') {
      scrollTop = targetTop + (targetMessageDom as HTMLElement).clientHeight - container.clientHeight;
    }

    scrollTop = Math.max(0, Math.min(scrollTop, container.scrollHeight - container.clientHeight));

    requestAnimationFrame(() => {
      container.scrollTo({ top: scrollTop, behavior });

      if (behavior === 'smooth') {
        const onScrollEnd = () => {
          container.removeEventListener('scrollend', onScrollEnd);
          resolve();
        };
        if ('onscrollend' in window) {
          container.addEventListener('scrollend', onScrollEnd);
        } else {
          setTimeout(resolve, 500);
        }
      } else {
        resolve();
      }
    });
  });

  return {
    scrollToBottom,
    scrollToMessage,
  };
};
