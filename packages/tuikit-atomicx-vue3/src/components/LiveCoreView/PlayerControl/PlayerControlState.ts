import type { Ref } from 'vue';
import { computed, ref, watch } from 'vue';
import useRoomEngine from '../../../hooks/useRoomEngine';
import useLiveState from '../../../states/LiveState';
import { useLiveSeatState } from '../../../states/LiveSeatState';
import { TRTCCloud } from '@tencentcloud/tuiroom-engine-js';
// Import utility modules
import { 
  getDeviceType, 
  getCurrentOrientation,
  shouldRotateToLandscapeForFullscreen,
  hadLandscapeRotationToUndo,
} from './utils/deviceDetection';
import { 
  FullscreenManager, 
  FullscreenResult,
  FullscreenMode,
  OrientationManager,
  StyleManager
} from './utils/fullscreenManager';
import { 
  DOMElementGetter, 
  EventListenerManager 
} from './utils/domHelpers';
import { LiveStatus } from '../../../types';

// Player fill mode enum
export enum FillMode {
  CONTAIN = 'contain',
  COVER = 'cover',
  FILL = 'fill',
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

  // Basic control methods
  resume: () => Promise<boolean>;
  pause: () => Promise<boolean>;

  // Fullscreen control methods
  requestFullscreen: () => Promise<FullscreenResult>;
  exitFullscreen: () => Promise<FullscreenResult>;

  // Picture-in-picture control methods
  requestPictureInPicture: () => Promise<boolean>;
  exitPictureInPicture: () => Promise<boolean>;

  // Other control methods
  setVolume: (volume: number) => Promise<boolean>;
  changeFillMode: (fillMode: FillMode) => Promise<boolean>;

  // Cleanup method
  cleanup: () => void;
}

// State management
const isPlaying = ref(true);
const currentFillMode = ref<FillMode>(FillMode.CONTAIN);
const isFullscreen = ref(false);
const isLandscapeStyleMode = ref(false);
const isPictureInPicture = ref(false);
const currentVolume = ref(1.0); // Default volume is 1.0 (100%)
const roomEngine = useRoomEngine();

/**
 * Player control state management hook
 */
export function usePlayerControlState(): PlayerControlState {
  // Dependency injection
  const { localLiveStatus } = useLiveState();
  const { canvas } = useLiveSeatState();

  // Event listener management
  const eventManager = new EventListenerManager();

  // Orientation listener ID for cleanup
  const orientationListenerId = `player-control-${Date.now()}`;

  // Computed properties
  const isLandscapeStream = computed(() => 
    canvas.value ? canvas.value.width > canvas.value.height : false
  );
  const isPortraitStream = computed(() => 
    canvas.value ? canvas.value.width < canvas.value.height : false
  );

  // Device information
  const deviceType = getDeviceType();

  /**
   * Error handling wrapper
   */
  const withErrorHandling = async <T>(
    operation: () => Promise<T>,
    operationName: string,
    fallbackValue: T
  ): Promise<T> => {
    try {
      return await operation();
    } catch (error) {
      console.error(`${operationName} operation failed:`, error);
      return fallbackValue;
    }
  };

  /**
   * Video control methods
   */

  const syncVolumeState = (): void => {
    const video = DOMElementGetter.getVideoElement();
    if (video) {
      const actualVolume = video.volume;
      if (Math.abs(currentVolume.value - actualVolume) > 0.01) { // Use small tolerance for floating point comparison
        console.log(`Syncing volume state: ${currentVolume.value} -> ${actualVolume}`);
        currentVolume.value = actualVolume;
      }
    }
  };

  const syncPlayingState = (): void => {
    const video = DOMElementGetter.getVideoElement();
    if (video) {
      const actualPlayingState = !video.paused && !video.ended;
      if (isPlaying.value !== actualPlayingState) {
        console.log(`Syncing playing state: ${isPlaying.value} -> ${actualPlayingState}`);
        isPlaying.value = actualPlayingState;
      }
    }
  };

  const resume = async (): Promise<boolean> => {
    return withErrorHandling(async () => {
      const video = DOMElementGetter.getVideoElement();
      if (!video) {
        throw new Error('Video element not found');
      }
      if (DOMElementGetter.hasTcPlayerElement()) {
        await video.play();
      } else {
        const trtcCloudMap = TRTCCloud.subCloudMap;
        trtcCloudMap.forEach((trtcCloud: TRTCCloud) => {
          const trtc = trtcCloud?._trtc;
          trtc?.callExperimentalAPI('resumeRemotePlayer', { userId: '*'})
        })
      }
      isPlaying.value = true;
      console.log('Video playback resumed');
      return true;
    }, 'Resume playback', false);
  };

  const pause = async (): Promise<boolean> => {
    return withErrorHandling(async () => {
      const video = DOMElementGetter.getVideoElement();
      if (!video) {
        throw new Error('Video element not found');
      }
      if (DOMElementGetter.hasTcPlayerElement()) {
        await video.pause();
      } else {
        const trtcCloudMap = TRTCCloud.subCloudMap;
        trtcCloudMap.forEach((trtcCloud: TRTCCloud) => {
          const trtc = trtcCloud?._trtc;
          trtc?.callExperimentalAPI('pauseRemotePlayer', { userId: '*'})
        })
      }
      isPlaying.value = false;
      console.log('Video playback paused');
      return true;
    }, 'Pause playback', false);
  };

  /**
   * Handle orientation change
   */
  const handleOrientationChange = (newOrientation: 'portrait' | 'landscape' | 'unknown'): void => {
    // Only handle orientation changes in fullscreen mode
    if (!isFullscreen.value) {
      return;
    }

    // Only handle for landscape streams
    if (!isLandscapeStream.value) {
      return;
    }

    const elements = DOMElementGetter.getAllElements();
    if (!elements.view) {
      console.warn('live-core-view element not found for orientation change handling');
      return;
    }

    console.log('Handling orientation change:', {
      newOrientation,
      deviceType,
      isLandscapeStream: isLandscapeStream.value,
      isFullscreen: isFullscreen.value
    });

    // Smart adjustment of landscape styles
    StyleManager.smartApplyLandscapeStyles(elements.view, newOrientation);
  };

  /**
   * Fullscreen control methods
   */
  const requestFullscreen = async (): Promise<FullscreenResult> => {
    return withErrorHandling(async () => {
      const elements = DOMElementGetter.getAllElements();
      const validation = DOMElementGetter.validateElements(elements);
      
      if (!validation.isValid) {
        throw new Error(`Missing required DOM elements: ${validation.missingElements.join(', ')}`);
      }

      const currentOrientation = getCurrentOrientation();
      const shouldRotateToLandscape = shouldRotateToLandscapeForFullscreen(deviceType, isLandscapeStream.value);

      console.log('Request fullscreen:', {
        deviceType,
        currentOrientation,
        streamType: isLandscapeStream.value ? 'landscape stream' : isPortraitStream.value ? 'portrait stream' : 'unknown',
        shouldRotate: shouldRotateToLandscape,
        reason: shouldRotateToLandscape ? 'Mobile device in portrait with landscape stream' : 
                currentOrientation === 'landscape' ? 'Already in landscape orientation' : 
                !isLandscapeStream.value ? 'Not a landscape stream' :
                'Desktop device or other reason'
      });

      const result: FullscreenResult = await FullscreenManager.requestFullscreen(
        elements.container!,
        elements.view!,
        deviceType,
        isPortraitStream.value,
        shouldRotateToLandscape
      );

      if (result.success) {
        isFullscreen.value = true;
        console.log(`Fullscreen request successful (${result.mode})`);
      } else {
        console.error('Fullscreen request failed:', result.error);
      }
      isLandscapeStyleMode.value = result.shouldRotateToLandscape;
      return result;
    }, 'Request fullscreen', { success: false, mode: FullscreenMode.CSS_SIMULATED, shouldRotateToLandscape: false });
  };

  const exitFullscreen = async (): Promise<FullscreenResult> => {
    return withErrorHandling(async () => {
      const elements = DOMElementGetter.getAllElements();
      if (!elements.view) {
        throw new Error('live-core-view element not found');
      }

      const currentOrientation = getCurrentOrientation();
      const hadLandscapeRotation = hadLandscapeRotationToUndo(deviceType, isLandscapeStream.value);

      console.log('Exit fullscreen:', {
        deviceType,
        currentOrientation,
        streamType: isLandscapeStream.value ? 'landscape stream' : isPortraitStream.value ? 'portrait stream' : 'unknown',
        hadLandscapeRotation,
        reason: hadLandscapeRotation ? 'Mobile device with landscape stream in landscape mode' : 
                currentOrientation === 'portrait' ? 'Already in portrait orientation' : 
                !isLandscapeStream.value ? 'Not a landscape stream' :
                'Desktop device or other reason'
      });

      const result: FullscreenResult = await FullscreenManager.exitFullscreen(
        elements.view,
        deviceType,
        hadLandscapeRotation
      );

      // For standard fullscreen, state is updated by event listeners
      // For CSS simulated fullscreen, update state directly
      if (result.mode === FullscreenMode.CSS_SIMULATED) {
        isFullscreen.value = false;
      }

      if (result.success) {
        console.log(`Fullscreen exit successful (${result.mode})`);
      } else {
        console.error('Fullscreen exit failed:', result.error);
      }
      isLandscapeStyleMode.value = false;
      return result;
    }, 'Exit fullscreen', { success: false, mode: FullscreenMode.CSS_SIMULATED, shouldRotateToLandscape: false });
  };

  /**
   * Picture-in-picture control methods
   */
  const requestPictureInPicture = async (): Promise<boolean> => {
    return withErrorHandling(async () => {
      const video = DOMElementGetter.getVideoElement();
      if (!video) {
        throw new Error('Video element not found');
      }

      if (!video.requestPictureInPicture) {
        throw new Error('Picture-in-picture not supported in current environment');
      }

      // Ensure event listeners are set
      setupVideoEventListeners();
      await video.requestPictureInPicture();
      
      console.log('Picture-in-picture request successful');
      return true;
    }, 'Request picture-in-picture', false);
  };

  const exitPictureInPicture = async (): Promise<boolean> => {
    return withErrorHandling(async () => {
      if (!document.exitPictureInPicture) {
        throw new Error('Exit picture-in-picture not supported in current environment');
      }

      await document.exitPictureInPicture();
      console.log('Picture-in-picture exit successful');
      return true;
    }, 'Exit picture-in-picture', false);
  };

  /**
   * Other control methods
   */
  const setVolume = async (volume: number): Promise<boolean> => {
    return withErrorHandling(async () => {
      if (volume < 0 || volume > 1) {
        throw new Error('Volume value must be between 0-1');
      }
      const trtcCloudMap = TRTCCloud.subCloudMap;
      if(volume === 0) {
        trtcCloudMap.forEach((trtcCloud: TRTCCloud) => {
          const trtc = trtcCloud?._trtc;
          trtc?.muteRemoteAudio('*', true)
        })
      } else {
        trtcCloudMap.forEach((trtcCloud: TRTCCloud) => {
          const trtc = trtcCloud?._trtc;
          trtc?.muteRemoteAudio('*', false)
        })
      }
      roomEngine.instance?.setAudioPlayoutVolume({ volume: volume * 100 });
      currentVolume.value = volume;
      console.log(`Video volume set to: ${volume}`);
      return true;
    }, 'Set volume', false);
  };

  const changeFillMode = async (fillMode: FillMode): Promise<boolean> => {
    return withErrorHandling(async () => {
      currentFillMode.value = fillMode;
      console.log(`Fill mode changed to: ${fillMode}`);
      // TODO: Implement actual fill mode logic
      return true;
    }, 'Change fill mode', false);
  };

  /**
   * Handle style cleanup when exiting fullscreen
   */
  const handleFullscreenExit = (): void => {
    try {
      const elements = DOMElementGetter.getAllElements();
      if (!elements.view) {
        console.warn('live-core-view element not found for fullscreen exit cleanup');
        return;
      }

      console.log('Executing fullscreen exit style cleanup:', {
        deviceType,
        hasLandscapeStream: isLandscapeStream.value,
        currentOrientation: getCurrentOrientation()
      });

      // Remove all fullscreen related styles
      StyleManager.removeFullscreenStyles(elements.view);
      StyleManager.removeLandscapeStyles(elements.view);

      // If mobile device, try to unlock screen orientation
      if (deviceType !== 'desktop') {
        OrientationManager.unlockOrientation().catch(error => {
          console.warn('Failed to unlock orientation during cleanup:', error);
        });
      }
      
      isLandscapeStyleMode.value = false;
      console.log('Fullscreen exit style cleanup completed');
    } catch (error) {
      console.error('Fullscreen exit style cleanup failed:', error);
    }
  };

  /**
   * Event listener setup
   */
  const setupFullscreenEventListeners = (): void => {
    const handleFullscreenChange = () => {
      const isCurrentlyFullscreen = !!document.fullscreenElement;
      const wasFullscreen = isFullscreen.value;
      
      console.log('Fullscreen state change:', {
        fullscreenElement: document.fullscreenElement,
        isCurrentlyFullscreen,
        previousValue: wasFullscreen,
        deviceType,
        changeType: isCurrentlyFullscreen ? 'entered' : 'exited'
      });

      // Update state
      isFullscreen.value = isCurrentlyFullscreen;
      // If exiting fullscreen, need to cleanup styles
      if (wasFullscreen && !isCurrentlyFullscreen) {
        console.log('Detected passive fullscreen exit, executing style cleanup');
        handleFullscreenExit();
      }
    };

    // Add fullscreen event listeners for various browsers
    eventManager.addListener('fullscreenchange', document, 'fullscreenchange', handleFullscreenChange);
    eventManager.addListener('webkitfullscreenchange', document, 'webkitfullscreenchange', handleFullscreenChange);
    eventManager.addListener('mozfullscreenchange', document, 'mozfullscreenchange', handleFullscreenChange);
    eventManager.addListener('MSFullscreenChange', document, 'MSFullscreenChange', handleFullscreenChange);

    // Add additional detection mechanisms for non-standard fullscreen exits (like Android back button)
    const handleVisibilityChange = () => {
      // When page visibility changes, check if fullscreen state is consistent
      if (document.visibilityState === 'visible' && isFullscreen.value) {
        const actuallyFullscreen = !!document.fullscreenElement;
        if (!actuallyFullscreen) {
          console.log('Detected fullscreen state inconsistency via visibilitychange, executing cleanup');
          isFullscreen.value = false;
          handleFullscreenExit();
        }
      }
    };

    // Listen to page visibility changes (Android back button scenarios)
    eventManager.addListener('visibilitychange', document, 'visibilitychange', handleVisibilityChange);
  };

  const setupVideoEventListeners = (): void => {
    const video = DOMElementGetter.getVideoElement();
    if (!video) return;

    const handleEnterPictureInPicture = () => {
      console.log('Entered picture-in-picture mode');
      isPictureInPicture.value = true;
    };

    const handleLeavePictureInPicture = () => {
      console.log('Left picture-in-picture mode');
      isPictureInPicture.value = false;
      setTimeout(resume, 300);
    };

    // Video playback state change handlers
    const handlePlay = () => {
      console.log('Video play event detected');
      isPlaying.value = true;
    };

    const handlePause = () => {
      console.log('Video pause event detected');
      isPlaying.value = false;
    };

    const handleEnded = () => {
      console.log('Video ended event detected');
      isPlaying.value = false;
    };

    const handleLoadStart = () => {
      console.log('Video load start event detected');
      // Sync initial state when video loads
      isPlaying.value = !video.paused;
    };

    const handleCanPlay = () => {
      console.log('Video can play event detected');
      // Sync state when video becomes playable
      isPlaying.value = !video.paused;
    };

    const handleSeeking = () => {
      console.log('Video seeking event detected');
      // Sync state during seeking
      syncPlayingState();
    };

    const handleSeeked = () => {
      console.log('Video seeked event detected');
      // Sync state after seeking
      syncPlayingState();
    };

    const handleTimeUpdate = () => {
      // Only sync occasionally during time updates to avoid too many calls
      if (Math.random() < 0.1) { // 10% chance per timeupdate event
        syncPlayingState();
      }
    };

    const handleVolumeChange = () => {
      console.log('Video volume change event detected');
      // Sync state when volume changes (might indicate user interaction)
      syncPlayingState();
      syncVolumeState();
    };

    // Add picture-in-picture event listeners
    eventManager.addListener('enterpictureinpicture', video, 'enterpictureinpicture', handleEnterPictureInPicture);
    eventManager.addListener('leavepictureinpicture', video, 'leavepictureinpicture', handleLeavePictureInPicture);

    // Add video playback state event listeners
    eventManager.addListener('play', video, 'play', handlePlay);
    eventManager.addListener('pause', video, 'pause', handlePause);
    eventManager.addListener('ended', video, 'ended', handleEnded);
    eventManager.addListener('loadstart', video, 'loadstart', handleLoadStart);
    eventManager.addListener('canplay', video, 'canplay', handleCanPlay);
    
    // Add additional state sync events
    eventManager.addListener('seeking', video, 'seeking', handleSeeking);
    eventManager.addListener('seeked', video, 'seeked', handleSeeked);
    eventManager.addListener('timeupdate', video, 'timeupdate', handleTimeUpdate);
    eventManager.addListener('volumechange', video, 'volumechange', handleVolumeChange);

  };

  /**
   * Cleanup method
   */
  const cleanup = (): void => {
    console.log('Cleaning up player control state...');
    
    // Remove orientation listener
    OrientationManager.removeOrientationListener(orientationListenerId);
    
    // Remove all event listeners
    eventManager.removeAllListeners();
    console.log(`Cleaned up ${eventManager.getListenerCount()} event listeners`);
  };

  // Initialize
  setupFullscreenEventListeners();
  setupVideoEventListeners();
  
  // Setup orientation listener for dynamic style adjustment
  OrientationManager.addOrientationListener(orientationListenerId, handleOrientationChange);
  
  // Initial state sync
  syncPlayingState();
  syncVolumeState();

  watch(localLiveStatus, (newStatus) => {
    if(newStatus === LiveStatus.Ended) {
      exitFullscreen();
      exitPictureInPicture();
      isPlaying.value = true;
      isFullscreen.value = false;
      isPictureInPicture.value = false;
      currentVolume.value = 1.0;
    }
  })

  // Return interface implementation
  return {
    // State
    isPlaying,
    currentFillMode,
    isFullscreen,
    isLandscapeStyleMode,
    isPictureInPicture,
    currentVolume,

    // Methods
    resume,
    pause,
    requestFullscreen,
    exitFullscreen,
    requestPictureInPicture,
    exitPictureInPicture,
    setVolume,
    changeFillMode,
    
    // Cleanup
    cleanup,
  };
}
