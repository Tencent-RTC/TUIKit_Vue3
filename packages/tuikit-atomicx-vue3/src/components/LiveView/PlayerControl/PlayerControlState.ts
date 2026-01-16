import type { Ref } from 'vue';
import { computed, ref, watch } from 'vue';
import { TUIVideoQuality } from '@tencentcloud/tuiroom-engine-js';
import { TUIMessageBox, useUIKit } from '@tencentcloud/uikit-base-component-vue3';
import useRoomEngine from '../../../hooks/useRoomEngine';
import { useLiveListState } from '../../../states/LiveListState';
import { useLiveSeatState } from '../../../states/LiveSeatState';
import {
  getDeviceType,
  shouldRotateToLandscapeForFullscreen,
  hadLandscapeRotationToUndo,
  isSafariBrowser,
} from './utils/deviceDetection';
import {
  DOMElementGetter,
  EventListenerManager,
  waitForVideoMounted,
} from './utils/domHelpers';
import {
  FullscreenManager,
  FullscreenMode,
  OrientationManager,
  StyleManager,
} from './utils/fullscreenManager';
import type {
  FullscreenResult,
} from './utils/fullscreenManager';

// Player fill mode enum
export enum FillMode {
  CONTAIN = 'contain',
  COVER = 'cover',
  FILL = 'fill',
}

// Resolution enum
export enum Resolution {
  R360P = TUIVideoQuality.kVideoQuality_360p,
  R540P = TUIVideoQuality.kVideoQuality_540p,
  R720P = TUIVideoQuality.kVideoQuality_720p,
  R1080P = TUIVideoQuality.kVideoQuality_1080p,
}

// Player control state interface
export interface PlayerControlState {
  // State properties
  isPlaying: Ref<boolean>;
  currentFillMode: Ref<FillMode>;
  isFullscreen: Ref<boolean>;
  isLandscapeStyleMode: Ref<boolean>;
  isPictureInPicture: Ref<boolean>;
  currentVolume: Ref<number>;
  isMuted: Ref<boolean>;
  isSafari: Ref<boolean>;
  isTcPlayer: Ref<boolean>;

  // Resolution state properties
  resolutionList: Ref<Resolution[]>;
  currentResolution: Ref<Resolution | undefined>;

  // Basic control methods
  resume: () => Promise<boolean>;
  pause: () => Promise<boolean>;

  // Fullscreen control methods
  requestFullscreen: () => Promise<FullscreenResult>;
  exitFullscreen: () => Promise<FullscreenResult>;

  // Picture-in-picture control methods
  requestPictureInPicture: () => Promise<boolean>;
  exitPictureInPicture: () => Promise<boolean>;

  // Resolution control methods
  switchResolution: (resolution: Resolution) => Promise<boolean>;

  // Other control methods
  setVolume: (volume: number) => Promise<boolean>; // Volume range: 0-100
  setMute: (muted: boolean) => Promise<boolean>;
  changeFillMode: (fillMode: FillMode) => Promise<boolean>;
  // Cleanup method
  cleanup: () => void;
}

// Constants
const VOLUME_CONSTANTS = {
  // Default volume level when component initializes (100% volume)
  DEFAULT_VOLUME: 100,
  // Minimum allowed volume level (silent)
  MIN_VOLUME: 0,
  // Maximum allowed volume level (full volume)
  MAX_VOLUME: 100,
  // Volume level when muted (silent)
  MUTE_VOLUME: 0,
};

const ARRAY_CONSTANTS = {
  // Index of the first element in an array
  FIRST_INDEX: 0,
};

// State management
const isPlaying = ref(false);
const currentFillMode = ref<FillMode>(FillMode.CONTAIN);
const isFullscreen = ref(false);
const isLandscapeStyleMode = ref(false);
const isPictureInPicture = ref(false);
const currentVolume = ref(VOLUME_CONSTANTS.DEFAULT_VOLUME);
const isMuted = ref(false); // Mute state - synced across all rooms
const isSafari = ref(isSafariBrowser());
const isTcPlayer = ref(false);

// Internal storage for volume restoration (not reactive)
let restoreVolume = VOLUME_CONSTANTS.DEFAULT_VOLUME;

// Resolution state management
const resolutionList = ref<Resolution[]>([]);
const currentResolution = ref<Resolution | undefined>();

const roomEngine = useRoomEngine();
const { t } = useUIKit();

/**
 * Player control state management hook
 */
export function usePlayerControlState(): PlayerControlState {
  // Dependency injection
  const { currentLive } = useLiveListState();
  const { canvas } = useLiveSeatState();

  // Event listener management
  const eventManager = new EventListenerManager();

  // Orientation listener ID for cleanup
  const orientationListenerId = `player-control-${Date.now()}`;

  // Computed properties
  const isLandscapeStream = computed(() =>
    canvas.value ? canvas.value.width > canvas.value.height : false,
  );
  const isPortraitStream = computed(() =>
    canvas.value ? canvas.value.width < canvas.value.height : false,
  );

  // Device information
  const deviceType = getDeviceType();

  /**
   * Error handling wrapper
   */
  const withErrorHandling = async <T>(
    operation: () => Promise<T>,
    operationName: string,
    fallbackValue: T,
  ): Promise<T> => {
    try {
      return await operation();
    } catch (error) {
      console.error(`${operationName} operation failed:`, error);
      return fallbackValue;
    }
  };

  const resume = async (): Promise<boolean> => withErrorHandling(async () => {
    try {
      await roomEngine.instance?.callExperimentalAPI(JSON.stringify({
        api: 'resume',
        params: {},
      }));
      isPlaying.value = true;
      return true;
    } catch (error: any) {
      // Handle browser autoplay policy restriction
      if (error?.name === 'NotAllowedError' && (error?.message?.includes('user agent') || error?.message?.includes('denied permission'))) {
        TUIMessageBox.alert({
          content: t('LiveView.ContentReady'),
          confirmText: t('LiveView.Play'),
          callback: async () => {
            await roomEngine.instance?.callExperimentalAPI(JSON.stringify({
              api: 'resume',
              params: {},
            }));
            isPlaying.value = true;
          },
        });
        return false;
      }
      throw error;
    }
  }, 'Resume playback', false);

  const pause = async (): Promise<boolean> => withErrorHandling(async () => {
    await roomEngine.instance?.callExperimentalAPI(JSON.stringify({
      api: 'pause',
      params: {},
    }));
    isPlaying.value = false;
    return true;
  }, 'Pause playback', false);

  /**
   * Handle orientation change
   */
  const handleOrientationChange = (newOrientation: 'portrait' | 'landscape' | 'unknown'): void => {
    if (!isFullscreen.value || !isLandscapeStream.value) {
      return;
    }

    const elements = DOMElementGetter.getAllElements();
    if (!elements.view) {
      console.warn('live-core-view element not found for orientation change handling');
      return;
    }

    StyleManager.smartApplyLandscapeStyles(elements.view, newOrientation);
  };

  /**
   * Fullscreen control methods
   */
  const requestFullscreen = async (): Promise<FullscreenResult> => withErrorHandling(async () => {
    const elements = DOMElementGetter.getAllElements();
    const validation = DOMElementGetter.validateElements(elements);

    if (!validation.isValid) {
      throw new Error(`Missing required DOM elements: ${validation.missingElements.join(', ')}`);
    }

    const shouldRotateToLandscape = shouldRotateToLandscapeForFullscreen(deviceType, isLandscapeStream.value);

    const result: FullscreenResult = await FullscreenManager.requestFullscreen(
      elements.container!,
      elements.view!,
      deviceType,
      isPortraitStream.value,
      shouldRotateToLandscape,
    );

    if (result.success) {
      isFullscreen.value = true;
    } else {
      console.error('Fullscreen request failed:', result.error);
    }
    isLandscapeStyleMode.value = result.shouldRotateToLandscape;
    return result;
  }, 'Request fullscreen', { success: false, mode: FullscreenMode.CSS_SIMULATED, shouldRotateToLandscape: false });

  const exitFullscreen = async (): Promise<FullscreenResult> => withErrorHandling(async () => {
    const elements = DOMElementGetter.getAllElements();
    if (!elements.view) {
      throw new Error('live-core-view element not found');
    }

    const hadLandscapeRotation = hadLandscapeRotationToUndo(deviceType, isLandscapeStream.value);

    const result: FullscreenResult = await FullscreenManager.exitFullscreen(
      elements.view,
      deviceType,
      hadLandscapeRotation,
    );

    if (result.mode === FullscreenMode.CSS_SIMULATED) {
      isFullscreen.value = false;
    }

    if (!result.success) {
      console.error('Fullscreen exit failed:', result.error);
    }
    isLandscapeStyleMode.value = false;
    return result;
  }, 'Exit fullscreen', { success: false, mode: FullscreenMode.CSS_SIMULATED, shouldRotateToLandscape: false });

  /**
   * Picture-in-picture control methods
   */
  const requestPictureInPicture = async (): Promise<boolean> => withErrorHandling(async () => {
    const video = DOMElementGetter.getVideoElement();
    if (!video) {
      throw new Error('Video element not found');
    }

    if (!video.requestPictureInPicture) {
      throw new Error('Picture-in-picture not supported in current environment');
    }

    setupVideoEventListeners();
    await video.requestPictureInPicture();
    return true;
  }, 'Request picture-in-picture', false);

  const exitPictureInPicture = async (): Promise<boolean> => withErrorHandling(async () => {
    if (!document.exitPictureInPicture) {
      throw new Error('Exit picture-in-picture not supported in current environment');
    }

    await document.exitPictureInPicture();
    return true;
  }, 'Exit picture-in-picture', false);

  /**
   * Resolution control methods
   */
  const switchResolution = async (resolution: Resolution): Promise<boolean> => withErrorHandling(async () => {
    if (!roomEngine.instance) {
      throw new Error('Room engine instance not available');
    }
    console.debug('Switching to resolution:', resolution);
    await roomEngine.instance.callExperimentalAPI(
      JSON.stringify({
        api: 'switchPlaybackQuality',
        params: {
          quality: resolution,
          autoSwitch: false,
        },
      }),
    );
    if (!isPlaying.value) {
      isPlaying.value = true;
    }
    currentResolution.value = resolution;
    return true;
  }, 'Switch resolution', false);

  const getResolutionList = async (roomId: string): Promise<Resolution[]> => withErrorHandling(async () => {
    if (!roomEngine.instance) {
      throw new Error('Room engine instance not available');
    }

    const resolutions = await roomEngine.instance.callExperimentalAPI(
      JSON.stringify({
        api: 'queryPlaybackQualityList',
        params: {
          roomId,
        },
      }),
    );

    return (resolutions || []) as Resolution[];
  }, 'Get resolution list', []);

  const initializeResolution = async (roomId: string, applyResolution = true): Promise<void> => {
    try {
      const availableResolutions = await getResolutionList(roomId);
      resolutionList.value = availableResolutions;

      if (availableResolutions.length === ARRAY_CONSTANTS.FIRST_INDEX) {
        console.warn('[Resolution] No resolutions available for room:', roomId);
        currentResolution.value = undefined;
        return;
      }

      // Always set to the first available resolution when entering a room
      const targetResolution = availableResolutions[ARRAY_CONSTANTS.FIRST_INDEX];
      currentResolution.value = targetResolution;
      if (applyResolution) {
        await switchResolution(targetResolution);
      }
    } catch (error) {
      console.error('[Resolution] Failed to initialize resolution:', error);
    }
  };

  /**
   * Other control methods
   */
  const setVolume = async (volume: number): Promise<boolean> => withErrorHandling(async () => {
    if (volume < VOLUME_CONSTANTS.MIN_VOLUME || volume > VOLUME_CONSTANTS.MAX_VOLUME) {
      throw new Error(`Volume value must be between ${VOLUME_CONSTANTS.MIN_VOLUME}-${VOLUME_CONSTANTS.MAX_VOLUME}`);
    }
    await roomEngine.instance?.setAudioPlayoutVolume({ volume });
    currentVolume.value = volume;
    restoreVolume = volume;
    isMuted.value = volume == VOLUME_CONSTANTS.MUTE_VOLUME;
    return true;
  }, 'Set volume', false);

  const setMute = async (muted: boolean): Promise<boolean> => withErrorHandling(async () => {
    let volume;
    if (muted) {
      restoreVolume = currentVolume.value;
      volume = VOLUME_CONSTANTS.MUTE_VOLUME;
    } else {
      volume = restoreVolume || VOLUME_CONSTANTS.DEFAULT_VOLUME;
    }
    await roomEngine.instance?.setAudioPlayoutVolume({ volume });
    currentVolume.value = volume;
    isMuted.value = muted;
    return true;
  }, 'Set mute', false);

  const changeFillMode = async (fillMode: FillMode): Promise<boolean> => withErrorHandling(async () => {
    currentFillMode.value = fillMode;
    return true;
  }, 'Change fill mode', false);

  /**
   * Handle style cleanup when exiting fullscreen
   */
  const handleFullscreenExit = (): void => {
    try {
      const elements = DOMElementGetter.getAllElements();
      if (!elements.view) {
        console.warn('View element not found for fullscreen exit cleanup');
        return;
      }

      StyleManager.removeFullscreenStyles(elements.view);
      StyleManager.removeLandscapeStyles(elements.view);

      if (deviceType !== 'desktop') {
        OrientationManager.unlockOrientation().catch(() => {
          // Ignore orientation unlock errors in non-desktop environments
        });
      }
      isLandscapeStyleMode.value = false;
    } catch (error) {
      console.error('Fullscreen exit cleanup failed:', error);
    }
  };

  /**
   * Event listener setup for fullscreen state changes
   * Handles fullscreen API events across different browsers and visibility changes
   */
  const setupFullscreenEventListeners = (): void => {
    const handleFullscreenChange = () => {
      const isCurrentlyFullscreen = !!document.fullscreenElement;
      const wasFullscreen = isFullscreen.value;

      isFullscreen.value = isCurrentlyFullscreen;
      if (wasFullscreen && !isCurrentlyFullscreen) {
        handleFullscreenExit();
      }
    };

    // Add fullscreen event listeners for various browsers
    eventManager.addListener('fullscreenchange', document, 'fullscreenchange', handleFullscreenChange);
    eventManager.addListener('webkitfullscreenchange', document, 'webkitfullscreenchange', handleFullscreenChange);
    eventManager.addListener('mozfullscreenchange', document, 'mozfullscreenchange', handleFullscreenChange);
    eventManager.addListener('MSFullscreenChange', document, 'MSFullscreenChange', handleFullscreenChange);

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible' && isFullscreen.value) {
        const actuallyFullscreen = !!document.fullscreenElement;
        if (!actuallyFullscreen) {
          isFullscreen.value = false;
          handleFullscreenExit();
        }
      }
    };

    eventManager.addListener('visibilitychange', document, 'visibilitychange', handleVisibilityChange);
  };

  const setupVideoEventListeners = (): void => {
    const video = DOMElementGetter.getVideoElement();
    if (!video) {
      console.warn('Video element not found for setting up event listeners');
      return;
    }

    const handleEnterPictureInPicture = () => {
      isPictureInPicture.value = true;
    };

    const handleLeavePictureInPicture = () => {
      isPictureInPicture.value = false;
    };

    eventManager.addListener('enterpictureinpicture', video, 'enterpictureinpicture', handleEnterPictureInPicture);
    eventManager.addListener('leavepictureinpicture', video, 'leavepictureinpicture', handleLeavePictureInPicture);
  };

  /**
   * Cleanup method
   */
  const cleanup = (): void => {
    OrientationManager.removeOrientationListener(orientationListenerId);
    eventManager.removeAllListeners();
  };

  setupFullscreenEventListeners();
  setupVideoEventListeners();
  OrientationManager.addOrientationListener(orientationListenerId, handleOrientationChange);

  const updateIsTcPlayer = async () => {
    try {
      await waitForVideoMounted();
    } finally {
      const hasTcPlayer = DOMElementGetter.hasTcPlayerElement();
      if (hasTcPlayer !== isTcPlayer.value) {
        isTcPlayer.value = hasTcPlayer;
        console.log('[PlayerControl] isTcPlayer:', isTcPlayer.value);
      }
    }
  };

  watch(
    () => currentLive.value?.liveId,
    async (newLiveId) => {
      if (newLiveId) {
        isPlaying.value = true;
        isPictureInPicture.value = false;
        isFullscreen.value = false;
        resolutionList.value = [];
        currentResolution.value = undefined;
        // When pulling a TRTC stream, this interface has a cache, but when using TCPlayer, there is no cache
        await setVolume(currentVolume.value);
        await initializeResolution(newLiveId, false);
        updateIsTcPlayer();

        // Print player control state after entering room
        console.log('[PlayerControl] State after entering room:', JSON.stringify({
          isPlaying: isPlaying.value,
          currentFillMode: currentFillMode.value,
          isFullscreen: isFullscreen.value,
          isLandscapeStyleMode: isLandscapeStyleMode.value,
          isPictureInPicture: isPictureInPicture.value,
          currentVolume: currentVolume.value,
          resolutionList: resolutionList.value,
          currentResolution: currentResolution.value,
        }));
      }
    },
  );

  watch(() => isPlaying.value, (newIsPlaying) => {
    if (newIsPlaying) {
      updateIsTcPlayer();
    }
  }, { immediate: true });

  // Return interface implementation
  return {
    isPlaying,
    currentFillMode,
    isFullscreen,
    isLandscapeStyleMode,
    isPictureInPicture,
    currentVolume,
    isMuted,
    resolutionList,
    currentResolution,
    isSafari,
    isTcPlayer,
    resume,
    pause,
    requestFullscreen,
    exitFullscreen,
    requestPictureInPicture,
    exitPictureInPicture,
    switchResolution,
    setVolume,
    setMute,
    changeFillMode,
    cleanup,
  };
}
