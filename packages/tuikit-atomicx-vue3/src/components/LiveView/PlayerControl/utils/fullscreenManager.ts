/**
 * Fullscreen management utility module
 */

import { DeviceType } from './deviceDetection';

// Screen orientation type
export type ScreenOrientation = 'landscape' | 'portrait';

// Fullscreen mode type
export enum FullscreenMode {
  STANDARD = 'standard',    // Standard API fullscreen
  CSS_SIMULATED = 'simulated'  // CSS simulated fullscreen
}

// CSS class name constants
export const CSS_CLASSES = {
  FULLSCREEN: 'fullscreen-mode',
  FULLSCREEN_PORTRAIT: 'fullscreen-mode-portrait',
  LANDSCAPE: 'landscape-mode',
} as const;

// Fullscreen operation result
export interface FullscreenResult {
  success: boolean;
  mode: FullscreenMode;
  shouldRotateToLandscape: boolean;
  error?: Error;
}

/**
 * Style management class
 */
export class StyleManager {
  /**
   * Apply fullscreen styles
   */
  static applyFullscreenStyles(element: HTMLElement, isPortrait = false): void {
    const className = isPortrait ? CSS_CLASSES.FULLSCREEN_PORTRAIT : CSS_CLASSES.FULLSCREEN;
    element.classList.add(className);
  }

  /**
   * Remove fullscreen styles
   */
  static removeFullscreenStyles(element: HTMLElement): void {
    element.classList.remove(CSS_CLASSES.FULLSCREEN);
    element.classList.remove(CSS_CLASSES.FULLSCREEN_PORTRAIT);
  }

  /**
   * Apply landscape styles
   */
  static applyLandscapeStyles(element: HTMLElement): void {
    element.classList.add(CSS_CLASSES.LANDSCAPE);
  }

  /**
   * Remove landscape styles
   */
  static removeLandscapeStyles(element: HTMLElement): void {
    element.classList.remove(CSS_CLASSES.LANDSCAPE);
  }

  /**
   * Smart landscape style adjustment - determine if CSS rotation is needed based on current device orientation
   */
  static smartApplyLandscapeStyles(element: HTMLElement, currentOrientation: 'portrait' | 'landscape' | 'unknown'): void {
    // If device is already in landscape orientation, no need to apply CSS rotation
    if (currentOrientation === 'landscape') {
      this.removeLandscapeStyles(element);
    } else {
      // When device is in portrait, need CSS rotation to display landscape content
      this.applyLandscapeStyles(element);
    }
  }
}

/**
 * Screen orientation management class
 */
export class OrientationManager {
  private static orientationListeners: Map<string, (orientation: 'portrait' | 'landscape' | 'unknown') => void> = new Map();

  /**
   * Request screen orientation
   */
  static async requestOrientation(orientation: ScreenOrientation): Promise<boolean> {
    try {
      // Prioritize Screen Orientation API
      if (screen.orientation && (screen.orientation as any).lock) {
        await (screen.orientation as any).lock(orientation);
        return true;
      }

      // Use webkit prefixed API as fallback
      if ((screen.orientation as any).webkitLockOrientation) {
        const result = (screen.orientation as any).webkitLockOrientation(orientation);
        return !!result;
      }

      return false;
    } catch (error) {
      console.warn(`Screen orientation setting failed (${orientation}):`, error);
      return false;
    }
  }

  /**
   * Unlock screen orientation
   */
  static async unlockOrientation(): Promise<boolean> {
    try {
      if (screen.orientation && (screen.orientation as any).unlock) {
        (screen.orientation as any).unlock();
        return true;
      }
      return false;
    } catch (error) {
      console.warn('Failed to unlock screen orientation:', error);
      return false;
    }
  }

  /**
   * Get current orientation
   */
  static getCurrentOrientation(): 'portrait' | 'landscape' | 'unknown' {
    // First try the standard Screen Orientation API
    if (screen.orientation) {
      const angle = screen.orientation.angle;
      const type = screen.orientation.type;
      
      // Check orientation type first (more reliable)
      if (type.includes('portrait')) {
        return 'portrait';
      } else if (type.includes('landscape')) {
        return 'landscape';
      }
      
      // Fallback to angle-based detection
      if (angle === 0 || angle === 180) {
        return 'portrait';
      } else if (angle === 90 || angle === 270) {
        return 'landscape';
      }
    }
    
    // Fallback to window dimensions
    if (window.innerHeight > window.innerWidth) {
      return 'portrait';
    } else if (window.innerWidth > window.innerHeight) {
      return 'landscape';
    }
    
    return 'unknown';
  }

  /**
   * Add orientation change listener
   */
  static addOrientationListener(id: string, callback: (orientation: 'portrait' | 'landscape' | 'unknown') => void): void {
    this.orientationListeners.set(id, callback);
    
    // If this is the first listener, set up global listening
    if (this.orientationListeners.size === 1) {
      this.setupGlobalOrientationListener();
    }
  }

  /**
   * Remove orientation change listener
   */
  static removeOrientationListener(id: string): void {
    this.orientationListeners.delete(id);
    
    // If no more listeners, clean up global listening
    if (this.orientationListeners.size === 0) {
      this.cleanupGlobalOrientationListener();
    }
  }

  /**
   * Setup global orientation listening
   */
  private static setupGlobalOrientationListener(): void {
    const handleOrientationChange = () => {
      const currentOrientation = this.getCurrentOrientation();
      console.log('Orientation change detected:', currentOrientation);
      
      // Notify all listeners
      this.orientationListeners.forEach((callback) => {
        try {
          callback(currentOrientation);
        } catch (error) {
          console.error('Orientation change callback execution failed:', error);
        }
      });
    };

    // Listen to multiple orientation change events
    window.addEventListener('orientationchange', handleOrientationChange);
    window.addEventListener('resize', handleOrientationChange);
    
    // Also listen to Screen Orientation API if supported
    if (screen.orientation) {
      screen.orientation.addEventListener('change', handleOrientationChange);
    }

    // Save cleanup function reference
    (this as any)._cleanupOrientationListeners = () => {
      window.removeEventListener('orientationchange', handleOrientationChange);
      window.removeEventListener('resize', handleOrientationChange);
      if (screen.orientation) {
        screen.orientation.removeEventListener('change', handleOrientationChange);
      }
    };
  }

  /**
   * Cleanup global orientation listening
   */
  private static cleanupGlobalOrientationListener(): void {
    if ((this as any)._cleanupOrientationListeners) {
      (this as any)._cleanupOrientationListeners();
      delete (this as any)._cleanupOrientationListeners;
    }
  }
}

/**
 * Fullscreen API management class
 */
export class FullscreenAPI {
  /**
   * Request standard fullscreen
   */
  static async requestFullscreen(element: HTMLElement): Promise<boolean> {
    try {
      if (element.requestFullscreen) {
        await element.requestFullscreen();
      } else if ((element as any).webkitRequestFullscreen) {
        await (element as any).webkitRequestFullscreen();
      } else if ((element as any).mozRequestFullScreen) {
        await (element as any).mozRequestFullScreen();
      } else if ((element as any).msRequestFullscreen) {
        await (element as any).msRequestFullscreen();
      } else {
        return false;
      }
      return true;
    } catch (error) {
      console.error('Standard fullscreen request failed:', error);
      return false;
    }
  }

  /**
   * Exit standard fullscreen
   */
  static async exitFullscreen(): Promise<boolean> {
    try {
      if (document.exitFullscreen) {
        await document.exitFullscreen();
      } else if ((document as any).webkitExitFullscreen) {
        await (document as any).webkitExitFullscreen();
      } else if ((document as any).mozCancelFullScreen) {
        await (document as any).mozCancelFullScreen();
      } else if ((document as any).msExitFullscreen) {
        await (document as any).msExitFullscreen();
      } else {
        return false;
      }
      return true;
    } catch (error) {
      console.error('Exit standard fullscreen failed:', error);
      return false;
    }
  }

  /**
   * Check if currently in fullscreen state
   */
  static isCurrentlyFullscreen(): boolean {
    return !!document.fullscreenElement;
  }
}

/**
 * Main fullscreen manager class
 */
export class FullscreenManager {
  /**
   * Smart fullscreen request
   * Choose the best fullscreen method based on device type and support
   */
  static async requestFullscreen(
    containerElement: HTMLElement,
    viewElement: HTMLElement,
    deviceType: DeviceType,
    isPortraitStream: boolean,
    shouldRotateToLandscape: boolean
  ): Promise<FullscreenResult> {
    // iOS devices or devices that don't support standard fullscreen use CSS simulation
    if (!this.isFullscreenSupported(containerElement)) {
      return this.requestCSSFullscreen(viewElement, isPortraitStream, shouldRotateToLandscape);
    }

    // Other devices try standard fullscreen
    return this.requestStandardFullscreen(containerElement, viewElement, shouldRotateToLandscape);
  }

  /**
   * Smart fullscreen exit
   */
  static async exitFullscreen(
    viewElement: HTMLElement,
    deviceType: DeviceType,
    hadLandscapeRotation: boolean
  ): Promise<FullscreenResult> {
    // Remove CSS styles
    StyleManager.removeFullscreenStyles(viewElement);
    StyleManager.removeLandscapeStyles(viewElement);

    // Other devices try to exit standard fullscreen
    const success = await FullscreenAPI.exitFullscreen();
    if (hadLandscapeRotation) {
      await OrientationManager.unlockOrientation();
    }

    return {
      success,
      mode: success ? FullscreenMode.STANDARD : FullscreenMode.CSS_SIMULATED,
      shouldRotateToLandscape: hadLandscapeRotation
    };
  }

  /**
   * CSS simulated fullscreen
   */
  private static async requestCSSFullscreen(
    element: HTMLElement,
    isPortraitStream: boolean,
    shouldRotateToLandscape: boolean
  ): Promise<FullscreenResult> {
    try {
      // Apply fullscreen styles
      StyleManager.applyFullscreenStyles(element, isPortraitStream);

      // Handle landscape rotation
      if (shouldRotateToLandscape) {
        const orientationSuccess = await OrientationManager.requestOrientation('landscape');
        if (!orientationSuccess) {
          // Use smart style adjustment based on current device orientation
          const currentOrientation = OrientationManager.getCurrentOrientation();
          StyleManager.smartApplyLandscapeStyles(element, currentOrientation);
        }
      }

      return { success: true, mode: FullscreenMode.CSS_SIMULATED, shouldRotateToLandscape };
    } catch (error) {
      return {
        success: false,
        mode: FullscreenMode.CSS_SIMULATED,
        shouldRotateToLandscape,
        error: error as Error
      };
    }
  }

  /**
   * Standard API fullscreen
   */
  private static async requestStandardFullscreen(
    containerElement: HTMLElement,
    viewElement: HTMLElement,
    shouldRotateToLandscape: boolean
  ): Promise<FullscreenResult> {
    try {
      const success = await FullscreenAPI.requestFullscreen(containerElement);
      if (!success) {
        return { success: false, mode: FullscreenMode.STANDARD, shouldRotateToLandscape };
      }

      // Handle landscape rotation
      if (shouldRotateToLandscape) {
        const orientationSuccess = await OrientationManager.requestOrientation('landscape');
        if (!orientationSuccess) {
          // Use smart style adjustment based on current device orientation
          const currentOrientation = OrientationManager.getCurrentOrientation();
          StyleManager.smartApplyLandscapeStyles(viewElement, currentOrientation);
        }
      }

      return { success: true, mode: FullscreenMode.STANDARD, shouldRotateToLandscape };
    } catch (error) {
      return {
        success: false,
        mode: FullscreenMode.STANDARD,
        shouldRotateToLandscape,
        error: error as Error
      };
    }
  }

  /**
   * Check if fullscreen is supported
   */
  private static isFullscreenSupported(element: HTMLElement): boolean {
    return !!(
      element.requestFullscreen ||
      (element as any).webkitRequestFullscreen ||
      (element as any).mozRequestFullScreen ||
      (element as any).msRequestFullscreen
    );
  }
}
