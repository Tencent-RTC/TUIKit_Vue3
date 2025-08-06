// Debounce utility function
const createDebounce = <T extends (...args: any[]) => any>(
  func: T,
  delay: number
): ((...args: Parameters<T>) => void) => {
  let timeoutId: number | null = null;

  return (...args: Parameters<T>) => {
    if (timeoutId !== null) {
      clearTimeout(timeoutId);
    }

    timeoutId = window.setTimeout(() => {
      func(...args);
      timeoutId = null;
    }, delay);
  };
};

/**
 * Make the dom element fullscreen
 * @param {dom} element dom element
 * @example
 * setFullscreen(document.documentElement) // The entire page goes full screen
 * setFullscreen(document.getElementById("id")) // An element goes full screen
 */
const setFullScreen = (element: HTMLElement, options: FullscreenOptions = {}) => {
  const fullScreenElement = element as HTMLElement & {
    mozRequestFullScreen(options: FullscreenOptions): Promise<void>;
    msRequestFullscreen(options: FullscreenOptions): Promise<void>;
    webkitRequestFullScreen(options: FullscreenOptions): Promise<void>;
  };
  if (fullScreenElement?.requestFullscreen) {
    fullScreenElement?.requestFullscreen(options);
  } else if (fullScreenElement?.mozRequestFullScreen) {
    fullScreenElement?.mozRequestFullScreen(options);
  } else if (fullScreenElement?.webkitRequestFullScreen) {
    fullScreenElement?.webkitRequestFullScreen(options);
  } else if (fullScreenElement?.msRequestFullscreen) {
    fullScreenElement?.msRequestFullscreen(options);
  }
};

/**
 * exitFullscreen
 * @example
 * exitFullscreen();
 */
const exitFullScreen = () => {
  if (
    !document?.fullscreenElement &&
    !(document as any)?.webkitFullscreenElement &&
    !(document as any)?.mozFullScreenElement
  ) {
    return;
  }
  const exitFullScreenDocument = document as Document & {
    mozCancelFullScreen(): Promise<void>;
    msExitFullscreen(): Promise<void>;
    webkitExitFullscreen(): Promise<void>;
  };
  if (exitFullScreenDocument?.exitFullscreen) {
    exitFullScreenDocument?.exitFullscreen();
  } else if (exitFullScreenDocument?.msExitFullscreen) {
    exitFullScreenDocument?.msExitFullscreen();
  } else if (exitFullScreenDocument?.mozCancelFullScreen) {
    exitFullScreenDocument?.mozCancelFullScreen();
  } else if (exitFullScreenDocument?.webkitExitFullscreen) {
    exitFullScreenDocument?.webkitExitFullscreen();
  }
};

const safelyParse = (data: string) => {
  if (typeof data !== 'string') {
    return data;
  }
  let result;
  try {
    const tempData = JSON.parse(data);
    if (typeof tempData === 'object' && tempData) {
      result = tempData;
    } else {
      result = data;
    }
  } catch (error) {
    result = data;
  }
  return result;
}

export { createDebounce, setFullScreen, exitFullScreen, safelyParse };
