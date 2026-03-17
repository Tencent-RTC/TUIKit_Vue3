import type { Ref } from 'vue';
import { computed, reactive, ref, watch } from 'vue';
import { TRTCCloud, TUIVideoQuality } from '@tencentcloud/tuiroom-engine-js';
import { TUIMessageBox, useUIKit } from '@tencentcloud/uikit-base-component-vue3';
import useRoomEngine from '../../../hooks/useRoomEngine';
import { useLiveListState } from '../../../states/LiveListState';
import { useLiveSeatState } from '../../../states/LiveSeatState';
import { useLoginState } from '../../../states/LoginState';
import { PlayerControlButton } from '../../../types/player';
import type { ButtonState, PlayerControlButtons, CustomButton } from '../../../types/player';
import {
  getDeviceType,
  shouldRotateToLandscapeForFullscreen,
  hadLandscapeRotationToUndo,
  isSafariBrowser,
} from './utils/deviceDetection';
import {
  DOMElementGetter,
  EventListenerManager,
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
  controlBarVisible: Ref<boolean>;

  // Built-in button states
  buttons: PlayerControlButtons;
  customButtons: Ref<CustomButton[]>;

  // Player type detection methods
  hasTCPlayer: () => boolean;
  hasLEBPlayer: () => boolean;

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

  // Control bar visibility methods
  setAutoHideDelay: (delay: number) => void;
  setControlBarVisible: (visible: boolean) => void;
  startAutoHide: () => void;
  stopAutoHide: () => void;
  upsertCustomButtons: (buttons: CustomButton[]) => void;

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
const controlBarVisible = ref(false);

// User overrides: tracks properties explicitly set by external consumers.
// When resetButtonDefaults() runs, it re-applies these overrides after computing
// environment defaults, so consumers can configure buttons at any time (including
// during setup) without worrying about internal reset timing.
// The map key is "buttonKey.property" (e.g. "play.visible"), and the value can be
// any ButtonState property type (boolean, string, Component, etc.).
const buttonUserOverrides = new Map<string, unknown>();

// Internal flag: suppresses user-override recording while resetButtonDefaults() runs.
let isResettingButtons = false;

/**
 * Create a Proxy-wrapped ButtonState that intercepts property assignments.
 * When an external consumer sets any property on a button (e.g. visible, disabled,
 * icon, activeIcon, tooltip), the proxy records it as a user override so it
 * survives resetButtonDefaults() calls.
 *
 * NOTE: The returned Proxy is wrapped inside Vue's `reactive()`, forming a
 * dual-layer Proxy (Vue reactive outer → tracking Proxy inner). This works
 * correctly in Vue 3 because Vue's reactive system preserves custom Proxy
 * traps when wrapping nested objects. However, this relies on Vue 3's
 * internal Proxy handling behavior — keep this in mind when upgrading Vue.
 */
function createTrackedButtonState(buttonKey: PlayerControlButton, initial: ButtonState) {
  return new Proxy(initial, {
    set(target, prop, value) {
      if (!isResettingButtons && typeof prop === 'string') {
        buttonUserOverrides.set(`${buttonKey}.${prop}`, value);
      }
      (target as any)[prop] = value;
      return true;
    },
  });
}

// Built-in button states (reactive so external consumers can modify them).
// Each ButtonState is wrapped in a tracking proxy to capture user overrides.
const buttons: PlayerControlButtons = reactive({
  [PlayerControlButton.Play]: createTrackedButtonState(PlayerControlButton.Play, { visible: true, disabled: false }),
  [PlayerControlButton.Volume]: createTrackedButtonState(PlayerControlButton.Volume, { visible: true, disabled: false }),
  [PlayerControlButton.Resolution]: createTrackedButtonState(PlayerControlButton.Resolution, { visible: true, disabled: false }),
  [PlayerControlButton.PictureInPicture]: createTrackedButtonState(PlayerControlButton.PictureInPicture, { visible: true, disabled: false }),
  [PlayerControlButton.Fullscreen]: createTrackedButtonState(PlayerControlButton.Fullscreen, { visible: true, disabled: false }),
});
const customButtons = ref<CustomButton[]>([]);

const upsertCustomButtons = (incomingButtons: CustomButton[]): void => {
  incomingButtons.forEach((incomingButton) => {
    const existingIndex = customButtons.value.findIndex(button => button.id === incomingButton.id);

    if (existingIndex >= 0) {
      customButtons.value[existingIndex] = incomingButton;
      return;
    }

    customButtons.value.push(incomingButton);
  });
};

/**
 * Recalculate default visibility for buttons based on current environment.
 * Safari + TCPlayer does not support programmatic play/volume control,
 * so we hide these buttons in that scenario.
 *
 * After computing environment defaults, any user overrides (set via
 * `buttons[key].visible = ...` / `buttons[key].disabled = ...`) are
 * re-applied so that consumer configuration always takes precedence.
 */
const resetButtonDefaults = (): void => {
  isResettingButtons = true;
  try {
    const safariTCPlayerRestricted = isSafari.value && DOMElementGetter.hasTCPlayerElement();
    buttons[PlayerControlButton.Play].visible = !safariTCPlayerRestricted;
    buttons[PlayerControlButton.Volume].visible = !safariTCPlayerRestricted;
    buttons[PlayerControlButton.Resolution].visible = true;
    buttons[PlayerControlButton.PictureInPicture].visible = true;
    buttons[PlayerControlButton.Fullscreen].visible = true;

    // Reset disabled states
    buttons[PlayerControlButton.Play].disabled = false;
    buttons[PlayerControlButton.Volume].disabled = false;
    buttons[PlayerControlButton.Resolution].disabled = false;
    buttons[PlayerControlButton.PictureInPicture].disabled = false;
    buttons[PlayerControlButton.Fullscreen].disabled = false;
  } finally {
    isResettingButtons = false;
  }

  // Re-apply user overrides so consumer configuration survives the reset.
  // Overrides may include any ButtonState property (visible, disabled, icon, activeIcon, tooltip).
  // NOTE: isResettingButtons is already false here, so the Proxy set trap will
  // re-record these assignments into buttonUserOverrides. This is intentional and
  // harmless — Map.set() is idempotent when key and value are identical.
  for (const [key, value] of buttonUserOverrides) {
    const dotIndex = key.indexOf('.');
    const buttonKey = key.slice(0, dotIndex) as PlayerControlButton;
    const prop = key.slice(dotIndex + 1);
    (buttons[buttonKey] as any)[prop] = value;
  }
};

// Internal storage for volume restoration (not reactive)
let restoreVolume = VOLUME_CONSTANTS.DEFAULT_VOLUME;

// Resolution state management
const resolutionList = ref<Resolution[]>([]);
const currentResolution = ref<Resolution | undefined>();

const roomEngine = useRoomEngine();
const { t } = useUIKit();
const { loginUserInfo } = useLoginState();
const { seatList } = useLiveSeatState();

// Cloud control configuration for webrtc media control
let enableWebrtcMediaControl = false;

// Setup webrtc video event listeners for picture-in-picture state changes
const setupWebrtcVideoEventListeners = (): void => {
  const handleOnPictureInPictureStateChanged = (event: { isPictureInPicture: boolean }) => {
    isPictureInPicture.value = event.isPictureInPicture;
  };
  roomEngine.instance?.getTRTCCloud()?.on('onPictureInPictureStateChanged', handleOnPictureInPictureStateChanged);
};

// Fetch cloud control configuration after login
let webrtcListenersSetup = false;
watch(loginUserInfo, (userInfo) => {
  if (userInfo) {
    enableWebrtcMediaControl = Boolean(roomEngine.instance?.getTIM()?.callExperimentalAPI('getServerConfig', 'enable_webrtc_media_control'));
    if (!webrtcListenersSetup) {
      setupWebrtcVideoEventListeners();
      webrtcListenersSetup = true;
    }
  }
}, { immediate: true });

const isLocalUserOnSeat = computed(() => seatList.value.some(seat => seat.userInfo?.userId === loginUserInfo.value?.userId));

// Guard flag to prevent duplicate side effect registration across multiple calls
let isListenersRegistered = false;

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
   * Check if TcPlayer element exists in DOM
   */
  const hasTCPlayer = (): boolean => DOMElementGetter.hasTCPlayerElement();

  /**
   * Check if LEBPlayer element exists in DOM
   */
  const hasLEBPlayer = (): boolean => DOMElementGetter.hasLEBPlayerElement();

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
   *
   * Note: Safari requires PiP requests to be in the synchronous context of user activation.
   * When in fullscreen mode, we must request PiP BEFORE exiting fullscreen to preserve
   * the user activation state. Awaiting exitFullscreen() would cause the user activation
   * to expire, resulting in NotAllowedError.
   */
  const requestPictureInPicture = async (): Promise<boolean> => withErrorHandling(async () => {
    const isTCPlayer = hasTCPlayer();
    const isLEBPlayer = hasLEBPlayer();
    console.log(`requestPictureInPicture: enableWebrtcMediaControl: [${enableWebrtcMediaControl}] [${isTCPlayer}] [${isLEBPlayer}]`);

    if (enableWebrtcMediaControl && !isTCPlayer && !isLEBPlayer) {
      const subClouds: TRTCCloud[] = Array.from(TRTCCloud.subCloudMap.values());
      const results = await Promise.allSettled(
        subClouds.map(subCloud =>
          subCloud.callExperimentalAPI(JSON.stringify({
            api: 'requestPictureInPicture',
            params: {},
          }))
        )
      );

      // Check if at least one succeeded, throw last error if all failed
      const hasSuccess = results.some(r => r.status === 'fulfilled');
      if (!hasSuccess) {
        const rejected = results.filter((r): r is PromiseRejectedResult => r.status === 'rejected');
        if (rejected.length > 0) {
          throw rejected[rejected.length - 1].reason;
        }
      }

      // Exit fullscreen after PiP request to preserve user activation
      if (isFullscreen.value) {
        exitFullscreen();
      }
      return true;
    }

    const video = DOMElementGetter.getVideoElement();
    if (!video) {
      throw new Error('Video element not found');
    }

    if (!video.requestPictureInPicture) {
      throw new Error('Picture-in-picture not supported in current environment');
    }

    setupVideoEventListeners();
    // Request PiP first to preserve user activation, then exit fullscreen
    // Safari loses user activation after async exitFullscreen(), causing NotAllowedError
    await video.requestPictureInPicture();

    // Exit fullscreen after PiP is successfully activated
    if (isFullscreen.value) {
      exitFullscreen();
    }
    return true;
  }, 'Request picture-in-picture', false);

  const exitPictureInPicture = async (): Promise<boolean> => withErrorHandling(async () => {
    const isTCPlayer = hasTCPlayer();
    const isLEBPlayer = hasLEBPlayer();
    console.log(`exitPictureInPicture: enableWebrtcMediaControl: [${enableWebrtcMediaControl}] [${isTCPlayer}] [${isLEBPlayer}].`);
    if (enableWebrtcMediaControl && !isTCPlayer && !isLEBPlayer) {
      const subClouds: TRTCCloud[] = Array.from(TRTCCloud.subCloudMap.values());
      const results = await Promise.allSettled(
        subClouds.map(subCloud =>
          subCloud.callExperimentalAPI(JSON.stringify({
            api: 'exitPictureInPicture',
            params: {},
          }))
        )
      );

      // Check if at least one succeeded, throw last error if all failed
      const hasSuccess = results.some(r => r.status === 'fulfilled');
      if (!hasSuccess) {
        const rejected = results.filter((r): r is PromiseRejectedResult => r.status === 'rejected');
        if (rejected.length > 0) {
          throw rejected[rejected.length - 1].reason;
        }
      }

      isPictureInPicture.value = false;
      return true;
    }

    if (!document.exitPictureInPicture) {
      throw new Error('Exit picture-in-picture not supported in current environment');
    }

    await document.exitPictureInPicture();
    isPictureInPicture.value = false;
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
   * Control bar visibility management
   */
  let AUTO_HIDE_DELAY = 1500;
  let hideTimeout: number | null = null;

  const setAutoHideDelay = (delay: number): void => {
    AUTO_HIDE_DELAY = delay;
  };

  const setControlBarVisible = (visible: boolean): void => {
    controlBarVisible.value = visible;
  };

  const stopAutoHide = (): void => {
    if (hideTimeout) {
      clearTimeout(hideTimeout);
      hideTimeout = null;
    }
  };

  const startAutoHide = (): void => {
    stopAutoHide();
    hideTimeout = window.setTimeout(() => {
      controlBarVisible.value = false;
      hideTimeout = null;
    }, AUTO_HIDE_DELAY);
  };

  /**
   * Cleanup method
   */
  const cleanup = (): void => {
    stopAutoHide();
    OrientationManager.removeOrientationListener(orientationListenerId);
    eventManager.removeAllListeners();
    isListenersRegistered = false;
  };

  // Only install event listeners, watchers, and orientation listeners on the first call.
  // Subsequent calls reuse the same side effects to avoid duplicate registrations.
  if (!isListenersRegistered) {
    isListenersRegistered = true;

    setupFullscreenEventListeners();
    setupVideoEventListeners();
    OrientationManager.addOrientationListener(orientationListenerId, handleOrientationChange);

    watch(
      () => currentLive.value?.liveId,
      async (newLiveId) => {
        if (newLiveId) {
          isPlaying.value = true;
          isPictureInPicture.value = false;
          isFullscreen.value = false;
          resolutionList.value = [];
          currentResolution.value = undefined;
          // Recalculate button default visibility based on current player type
          resetButtonDefaults();
          // When pulling a TRTC stream, this interface has a cache, but when using TCPlayer, there is no cache
          await setVolume(currentVolume.value);
          await initializeResolution(newLiveId, false);

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

    // Reset playback state when local user takes seat
    watch(isLocalUserOnSeat, (isOnSeat) => {
      if (isOnSeat) {
        if (!isPlaying.value) {
          resume();
        }
        if (currentVolume.value !== VOLUME_CONSTANTS.DEFAULT_VOLUME) {
          setVolume(VOLUME_CONSTANTS.DEFAULT_VOLUME);
        }
        if (isPictureInPicture.value) {
          exitPictureInPicture();
          isPictureInPicture.value = false;
        }
        if (isFullscreen.value) {
          exitFullscreen();
        }
      }
    });
  }

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
    controlBarVisible,
    buttons,
    customButtons,
    hasTCPlayer,
    hasLEBPlayer,
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
    setAutoHideDelay,
    setControlBarVisible,
    startAutoHide,
    stopAutoHide,
    upsertCustomButtons,
    cleanup,
  };
}
