/**
 * Device detection utility module
 */

// Device type enum
export enum DeviceType {
  DESKTOP = 'desktop',
  MOBILE = 'mobile',
  IOS = 'ios',
  ANDROID = 'android',
}

// Device capabilities interface
export interface DeviceCapabilities {
  supportsFullscreen: boolean;
  supportsOrientation: boolean;
  supportsPictureInPicture: boolean;
  deviceType: DeviceType;
}

/**
 * Detect if it's a mobile device
 */
export const isMobileDevice = (): boolean => {
  return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
};

/**
 * Detect if it's an iOS device
 */
export const isIOSDevice = (): boolean => {
  return /iPad|iPhone|iPod/.test(navigator.userAgent);
};

/**
 * Detect if it's an Android device
 */
export const isAndroidDevice = (): boolean => {
  return /Android/i.test(navigator.userAgent);
};

/**
 * Detect if it's a Safari browser
 */
export const isSafariBrowser = (): boolean => {
  // Safari has several unique features
  const isSafari = 
      // Check the vendor feature
      navigator.vendor && navigator.vendor.includes('Apple') &&
      // Check specific apis or behaviors unique to Safari
      !navigator.userAgent.includes('CriOS') && // Exclude Chrome iOS
      !navigator.userAgent.includes('FxiOS') && // Exclude Firefox iOS
      // Additional feature checks
      (typeof safari !== 'undefined' || 
       !('netscape' in window) || // Firefox has netscape objects
       document.documentMode === undefined); // Exclude IE

  return !!isSafari;
}

/**
 * Detect if it's a Firefox browser
 */
export const isFirefoxBrowser = (): boolean => {
  // The unique features of Firefox
  return typeof InstallTrigger !== 'undefined' || 
         navigator.userAgent.includes('Firefox') ||
         navigator.userAgent.includes('Gecko/');
}

/**
 * Get device type
 */
export const getDeviceType = (): DeviceType => {
  if (isIOSDevice()) return DeviceType.IOS;
  if (isAndroidDevice()) return DeviceType.ANDROID;
  if (isMobileDevice()) return DeviceType.MOBILE;
  return DeviceType.DESKTOP;
};

/**
 * Detect if device supports screen orientation control
 */
export const isOrientationSupported = (): boolean => {
  return !!(screen.orientation && (screen.orientation as any).lock);
};

/**
 * Get current screen orientation
 */
export const getCurrentOrientation = (): 'portrait' | 'landscape' | 'unknown' => {
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
};

/**
 * Check if device is currently in portrait orientation
 */
export const isCurrentlyPortrait = (): boolean => {
  return getCurrentOrientation() === 'portrait';
};

/**
 * Check if device is currently in landscape orientation
 */
export const isCurrentlyLandscape = (): boolean => {
  return getCurrentOrientation() === 'landscape';
};

/**
 * Determine if device should rotate to landscape for fullscreen
 * @param deviceType - The type of device
 * @param isLandscapeStream - Whether the stream is landscape oriented
 * @returns Whether the device should rotate to landscape
 */
export const shouldRotateToLandscapeForFullscreen = (
  deviceType: DeviceType, 
  isLandscapeStream: boolean
): boolean => {
  // Only mobile devices can/should rotate
  if (deviceType === DeviceType.DESKTOP) {
    return false;
  }
  
  // Only rotate for landscape streams
  if (!isLandscapeStream) {
    return false;
  }
  
  // Only rotate if currently in portrait
  if (!isCurrentlyPortrait()) {
    return false;
  }
  
  return true;
};

/**
 * Determine if device had landscape rotation that should be undone
 * @param deviceType - The type of device  
 * @param isLandscapeStream - Whether the stream is landscape oriented
 * @returns Whether the device had landscape rotation that should be undone
 */
export const hadLandscapeRotationToUndo = (
  deviceType: DeviceType,
  isLandscapeStream: boolean
): boolean => {
  // Only mobile devices can have had rotation
  if (deviceType === DeviceType.DESKTOP) {
    return false;
  }
  
  // Only relevant for landscape streams
  if (!isLandscapeStream) {
    return false;
  }
  
  // Only if currently in landscape (meaning we probably rotated from portrait)
  if (!isCurrentlyLandscape()) {
    return false;
  }
  
  return true;
};

/**
 * Detect if fullscreen API is supported
 */
export const isFullscreenSupported = (element: HTMLElement): boolean => {
  return !!(
    element.requestFullscreen ||
    (element as any).webkitRequestFullscreen ||
    (element as any).mozRequestFullScreen ||
    (element as any).msRequestFullscreen
  );
};

/**
 * Detect if exit fullscreen API is supported
 */
export const isExitFullscreenSupported = (): boolean => {
  return !!(
    document.exitFullscreen ||
    (document as any).webkitExitFullscreen ||
    (document as any).mozCancelFullScreen ||
    (document as any).msExitFullscreen
  );
};

/**
 * Detect if picture-in-picture is supported
 */
export const isPictureInPictureSupported = (video?: HTMLVideoElement): boolean => {
  if (!video) return false;
  return typeof video.requestPictureInPicture === 'function' && typeof document.exitPictureInPicture === 'function';
};

/**
 * Get complete device capabilities information
 */
export const getDeviceCapabilities = (element?: HTMLElement): DeviceCapabilities => {
  return {
    supportsFullscreen: element ? isFullscreenSupported(element) : false,
    supportsOrientation: isOrientationSupported(),
    supportsPictureInPicture: isPictureInPictureSupported(),
    deviceType: getDeviceType(),
  };
};
