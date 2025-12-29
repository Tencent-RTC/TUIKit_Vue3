/**
 * DOM operation helper utility module
 */

// DOM selector constants
export const DOM_SELECTORS = {
  LIVE_CORE_VIEW_CONTAINER: '.live-core-view-container',
  LIVE_CORE_VIEW: '.live-core-view',
  VIDEO_ELEMENT: '#atomicx-live-stream-content video',
  TCPLAYER_ELEMENT: '.tcplayer',
};

/**
 * DOM element getter
 */
export class DOMElementGetter {
  /**
   * Get live-core-view-container element
   */
  static getLiveCoreViewContainer(): HTMLElement | null {
    return document.querySelector(DOM_SELECTORS.LIVE_CORE_VIEW_CONTAINER);
  }

  /**
   * Get live-core-view element
   */
  static getLiveCoreView(): HTMLElement | null {
    return document.querySelector(DOM_SELECTORS.LIVE_CORE_VIEW);
  }

  /**
   * Get video element
   */
  static getVideoElement(): HTMLVideoElement | null {
    return document.querySelector(DOM_SELECTORS.VIDEO_ELEMENT);
  }

  /**
   * Get all required DOM elements
   */
  static getAllElements(): {
    container: HTMLElement | null;
    view: HTMLElement | null;
    video: HTMLVideoElement | null;
  } {
    return {
      container: DOMElementGetter.getLiveCoreViewContainer(),
      view: DOMElementGetter.getLiveCoreView(),
      video: DOMElementGetter.getVideoElement(),
    };
  }

  /**
   * Check if tcplayer element exists in live-core-view-container
   */
  static hasTcPlayerElement(): boolean {
    const container = DOMElementGetter.getLiveCoreViewContainer();
    if (!container) {
      return false;
    }
    return container.querySelector(DOM_SELECTORS.TCPLAYER_ELEMENT) !== null;
  }

  /**
   * Get tcplayer element from live-core-view-container
   */
  static getTcPlayerElement(): HTMLElement | null {
    const container = DOMElementGetter.getLiveCoreViewContainer();
    if (!container) {
      return null;
    }
    return container.querySelector(DOM_SELECTORS.TCPLAYER_ELEMENT);
  }

  /**
   * Validate if required elements exist for fullscreen
   * Note: video element is optional because canvas rendering (TRTC SDK) doesn't use video
   */
  static validateElements(elements: { container?: HTMLElement | null; view?: HTMLElement | null; video?: HTMLVideoElement | null }): {
    isValid: boolean;
    missingElements: string[];
  } {
    const missingElements: string[] = [];
    
    if (elements.container === null) {
      missingElements.push('live-core-view-container');
    }
    if (elements.view === null) {
      missingElements.push('live-core-view');
    }
    // Video element is not required for fullscreen (canvas rendering works without it)
    // Only required for picture-in-picture feature

    return {
      isValid: missingElements.length === 0,
      missingElements,
    };
  }
}

/**
 * Event listener manager
 */
export class EventListenerManager {
  private listeners: Map<string, { element: EventTarget; event: string; handler: EventListener }> = new Map();

  /**
   * Add event listener
   */
  addListener(id: string, element: EventTarget, event: string, handler: EventListener): void {
    // Remove possible existing old listener
    this.removeListener(id);
    
    // Add new listener
    element.addEventListener(event, handler);
    this.listeners.set(id, { element, event, handler });
  }

  /**
   * Remove specified event listener
   */
  removeListener(id: string): void {
    const listener = this.listeners.get(id);
    if (listener) {
      listener.element.removeEventListener(listener.event, listener.handler);
      this.listeners.delete(id);
    }
  }

  /**
   * Remove all event listeners
   */
  removeAllListeners(): void {
    for (const [id] of this.listeners) {
      this.removeListener(id);
    }
  }

  /**
   * Get current listener count
   */
  getListenerCount(): number {
    return this.listeners.size;
  }
}

/**
 * Wait for video element to be mounted in DOM
 * @param timeout Maximum wait time in milliseconds
 * @returns Promise that resolves with video element or null if timeout
 */
export const waitForVideoMounted = (timeout = 3000): Promise<HTMLVideoElement | null> => {
  return new Promise((resolve) => {
    const container = document.querySelector('#atomicx-live-stream-content');
    if (!container) {
      resolve(null);
      return;
    }

    let timeoutId: number | null = null;
    
    const observer = new MutationObserver((mutations) => {
      for (const mutation of mutations) {
        if (mutation.type === 'childList') {
          mutation.addedNodes.forEach((node) => {
            if (node.nodeName === 'VIDEO') {
              const video = node as HTMLVideoElement;
              
              // Temporarily remove volumechange listener to prevent syncVolumeState interference
              const originalVolumeHandler = (video as any).onvolumechange;
              (video as any).onvolumechange = null;
              
              const handleLoadedData = () => {
                if (timeoutId) clearTimeout(timeoutId);
                observer.disconnect();
                video.removeEventListener('loadeddata', handleLoadedData);
                setTimeout(() => {
                  (video as any).onvolumechange = originalVolumeHandler;
                }, 100);
                resolve(video);
              };
              
              if (video.readyState >= 2) {
                if (timeoutId) clearTimeout(timeoutId);
                observer.disconnect();
                setTimeout(() => {
                  (video as any).onvolumechange = originalVolumeHandler;
                }, 100);
                resolve(video);
              } else {
                video.addEventListener('loadeddata', handleLoadedData, { once: true });
              }
            }
          });
        }
      }
    });

    observer.observe(container, {
      childList: true,
      subtree: true,
    });

    timeoutId = window.setTimeout(() => {
      observer.disconnect();
      resolve(null);
    }, timeout);
  });
};