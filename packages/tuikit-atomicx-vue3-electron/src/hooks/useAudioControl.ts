import { ref, onMounted, onUnmounted } from 'vue';

// Global audio instance management
const audioInstances = new Map<string, HTMLAudioElement>();
let currentPlayingId: string | null = null;

// Define audio play event name
const AUDIO_PLAY_EVENT = 'AUDIO_PLAY_EVENT';

// Create custom event
const createAudioPlayEvent = (audioId: string) => new CustomEvent(AUDIO_PLAY_EVENT, {
  detail: { audioId },
});

interface UseAudioControlProps {
  url: string;
  audioId?: string;
}

interface UseAudioControlReturn {
  isPlaying: ReturnType<typeof ref<boolean>>;
  progress: ReturnType<typeof ref<number>>;
  duration: ReturnType<typeof ref<number | undefined>>;
  isLoading: ReturnType<typeof ref<boolean>>;
  play: () => void;
  pause: () => void;
  stop: () => void;
  setProgress: (newProgress: number) => void;
}

/**
 * Vue 3 Hook for audio control
 *
 * This Hook encapsulates audio control functionality, providing reactive state and methods
 *
 * @param props Configuration parameters
 * @returns Audio control related states and methods
 */
export function useAudioControl(props: UseAudioControlProps): UseAudioControlReturn {
  const { url } = props;

  // Generate a unique ID if audioId is not provided
  const audioId = props.audioId || `audio-${url}`;

  // Create reactive states
  const isPlaying = ref(false);
  const progress = ref(0);
  const duration = ref<number | undefined>(undefined);
  const isLoading = ref(true);
  const audio = ref<HTMLAudioElement | null>(null);

  // Play method
  const play = () => {
    if (!audio.value) {
      return;
    }

    // Trigger global event to notify other audio to stop playing
    window.dispatchEvent(createAudioPlayEvent(audioId));

    // Play current audio
    audio.value.play();
    isPlaying.value = true;
    currentPlayingId = audioId;
  };

  // Pause method
  const pause = () => {
    if (!audio.value) {
      return;
    }

    audio.value.pause();
    isPlaying.value = false;

    if (currentPlayingId === audioId) {
      currentPlayingId = null;
    }
  };

  // Stop method
  const stop = () => {
    if (!audio.value) {
      return;
    }

    audio.value.pause();
    audio.value.currentTime = 0;
    isPlaying.value = false;
    progress.value = 0;

    if (currentPlayingId === audioId) {
      currentPlayingId = null;
    }
  };

  // Set progress method
  const setProgress = (newProgress: number) => {
    if (!audio.value || duration.value === undefined) {
      return;
    }

    // Ensure progress value is in valid range
    const validProgress = Math.max(0, Math.min(1, newProgress));

    audio.value.currentTime = duration.value * validProgress;
    progress.value = validProgress;
  };

  // Handle time update event
  const handleTimeUpdate = () => {
    if (!audio.value || !duration.value) {
      return;
    }
    progress.value = audio.value.currentTime / duration.value;
  };

  // Handle audio end event
  const handleEnded = () => {
    isPlaying.value = false;
    progress.value = 0;

    if (currentPlayingId === audioId) {
      currentPlayingId = null;
    }
  };

  // Listen for other audio play events
  const handleAudioPlay = (e: Event) => {
    const event = e as CustomEvent<{ audioId: string }>;
    if (event.detail.audioId !== audioId && isPlaying.value) {
      // Pause current audio if another audio starts playing
      pause();
    }
  };

  // Initialize audio instance when component mounts
  onMounted(() => {
    // Listen for global audio play events
    window.addEventListener(AUDIO_PLAY_EVENT, handleAudioPlay);

    // Check if audio instance already exists
    let audioInstance = audioInstances.get(audioId);

    // Handle metadata load event
    const handleLoadedMetadata = () => {
      if (!audioInstance) {
        return;
      }
      if (audioInstance.duration === Infinity) {
        // Jump to a large time
        audioInstance.currentTime = 1e101;
        audioInstance.ontimeupdate = () => {
          if (!audioInstance) {
            return;
          }
          duration.value = audioInstance.duration;
          audioInstance.ontimeupdate = null;
          audioInstance.currentTime = 0;
        };
      } else {
        duration.value = audioInstance.duration;
      }
      isLoading.value = false;
    };

    // Error handling
    const handleError = () => {
      console.error('Audio load error:', url);
      isLoading.value = false;
    };

    // Create new instance if it doesn't exist or URL has changed
    if (!audioInstance || audioInstance.src !== url) {
      isLoading.value = true;
      duration.value = undefined;

      // Clean up old instance if it exists
      if (audioInstance) {
        audioInstance.pause();
        audioInstance.src = '';
        audioInstance.load();
        audioInstance.removeEventListener('loadedmetadata', handleLoadedMetadata);
        audioInstance.removeEventListener('error', handleError);
        audioInstance.removeEventListener('timeupdate', handleTimeUpdate);
        audioInstance.removeEventListener('ended', handleEnded);
      }

      // Create new instance
      audioInstance = new Audio(url);
      audioInstance.addEventListener('loadedmetadata', handleLoadedMetadata);
      audioInstance.addEventListener('error', handleError);
      audioInstance.addEventListener('timeupdate', handleTimeUpdate);
      audioInstance.addEventListener('ended', handleEnded);

      audioInstances.set(audioId, audioInstance);
      audio.value = audioInstance;
      isPlaying.value = false;
      progress.value = 0;
    } else {
      // Use existing instance
      audio.value = audioInstance;

      // Ensure event listeners are added
      audioInstance.removeEventListener('timeupdate', handleTimeUpdate);
      audioInstance.removeEventListener('ended', handleEnded);
      audioInstance.addEventListener('timeupdate', handleTimeUpdate);
      audioInstance.addEventListener('ended', handleEnded);

      if (audioInstance.duration) {
        duration.value = audioInstance.duration;
        isLoading.value = false;
      }
    }
  });

  // Clean up resources when component unmounts
  onUnmounted(() => {
    // Remove global event listener
    window.removeEventListener(AUDIO_PLAY_EVENT, handleAudioPlay);

    // Clean up audio instance
    if (audioInstances.has(audioId)) {
      const instance = audioInstances.get(audioId)!;
      instance.removeEventListener('timeupdate', handleTimeUpdate);
      instance.removeEventListener('ended', handleEnded);
      instance.pause();
      instance.src = '';
      instance.load();
      audioInstances.delete(audioId);
    }
  });

  return {
    isPlaying,
    progress,
    duration,
    isLoading,
    play,
    pause,
    stop,
    setProgress,
  };
}
