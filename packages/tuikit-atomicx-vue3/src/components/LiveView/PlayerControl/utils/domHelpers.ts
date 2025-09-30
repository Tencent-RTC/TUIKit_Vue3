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
   * Validate if elements exist
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
    if (elements.video === null) {
      missingElements.push('video');
    }

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
