import { ref, computed, watch } from 'vue';
import type { Ref } from 'vue';
import { useLiveListState } from '../../states/LiveListState';
import { useLiveSeatState } from '../../states/LiveSeatState';
import { useLoginState } from '../../states/LoginState';
import { observeVideoReady } from './PlayerControl/utils/videoReadyObserver';
import type { VideoReadyHandle } from './PlayerControl/utils/videoReadyObserver';
import { usePlayerControlState } from './PlayerControl/PlayerControlState';

/** Default loading timeout in milliseconds. */
const DEFAULT_LOADING_TIMEOUT_MS = 5000;

interface OverlayStateOptions {
  /** The view container ID for video ready detection. */
  viewId: string;
  /**
   * Grace period (ms) for the loading state. After this timeout, if seatList
   * is still empty and no video has rendered, we assume the anchor is not
   * present and switch from "loading" to "anchor away".
   * @default 5000
   */
  loadingTimeoutMs?: number;
}

interface OverlayState {
  /** Whether the video has rendered its first frame. */
  isFirstFrameRendered: Ref<boolean>;
  /** Whether the current user is the anchor (room owner). */
  isAnchor: Ref<boolean>;
  /** Whether the room is a voice-chat room (web unsupported). */
  isVoiceChatRoom: Ref<boolean>;
  /** Whether the anchor-away overlay should be shown. */
  isAnchorAway: Ref<boolean>;
  /** Whether the stream is in loading state. */
  isLoading: Ref<boolean>;
  /**
   * Start observing video ready state. Call this after the stream has started playing.
   * This should be called from the parent component's onMounted hook after startPlayStream.
   */
  startObserving: () => void;
  /**
   * Stop observing and clean up resources. Call this in onBeforeUnmount before stopPlayStream.
   */
  stopObserving: () => void;
}

/**
 * Manage overlay display states for the LiveView component.
 *
 * This composable is **purely for state management** — it does NOT handle
 * stream playback lifecycle (startPlayStream/stopPlayStream). The caller is
 * responsible for:
 * 1. Starting the stream (e.g., in onMounted)
 * 2. Calling `startObserving()` after the stream has started
 * 3. Calling `stopObserving()` in onBeforeUnmount before stopping the stream
 * 4. Stopping the stream (e.g., in onBeforeUnmount)
 *
 * Handles:
 * - Loading state: true until the first video frame is rendered.
 * - Anchor-away overlay: visible when the anchor leaves after having been
 *   online (seatList was populated then became empty).
 * - Voice-chat room overlay: visible for voice-only rooms that web does not
 *   support.
 *
 * @param options - Configuration options including the view container ID.
 */
function useOverlayState(options: OverlayStateOptions): OverlayState {
  const { viewId, loadingTimeoutMs = DEFAULT_LOADING_TIMEOUT_MS } = options;
  const { seatList } = useLiveSeatState();
  const { currentLive } = useLiveListState();
  const { loginUserInfo } = useLoginState();
  const { isRefreshing } = usePlayerControlState();

  const isFirstFrameRendered = ref(false);

  // Track whether seatList has ever been populated (non-empty) during this
  // component's lifecycle. This distinguishes "initially empty" from
  // "anchor left after streaming" so the anchor-away overlay only appears
  // in the latter case.
  const hasSeatListBeenPopulated = ref(false);

  const isLoadingTimedOut = ref(false);
  let loadingTimer: ReturnType<typeof setTimeout> | null = null;

  const isAnchor = computed(
    () => loginUserInfo.value?.userId === currentLive.value?.liveOwner.userId,
  );

  // Voice chat rooms use "voice_" prefix in liveId, while live rooms use "live_" prefix.
  const isVoiceChatRoom = computed(
    () => currentLive.value?.liveId?.startsWith('voice_') ?? false,
  );

  // Show anchor-away overlay when:
  // Case A (classic): seatList was populated then became empty → anchor left.
  // Case B (timeout): seatList was never populated and loading timed out
  //   → the room had no anchor from the start.
  // Both cases require: viewer is not the anchor, and it's a live room.
  const isAnchorAway = computed(
    () =>
      !isAnchor.value
      && seatList.value.length === 0
      && (currentLive.value?.liveId?.startsWith('live_') ?? false)
      && (hasSeatListBeenPopulated.value || isLoadingTimedOut.value),
  );

  // Pure loading state: true when the stream is still loading, regardless of
  // whether a custom center-overlay slot is provided. This is injected into
  // the slot so consumers can react to the loading state.
  const isLoading = computed(
    () =>
      !isFirstFrameRendered.value
      && !isAnchor.value
      && !isLoadingTimedOut.value
      && currentLive.value?.liveId,
  );

  // Once seatList has data for the first time, mark it as "has been populated".
  // This is a one-way latch: once true, it stays true for the component lifetime.
  // Also cancel the loading timeout since the anchor is clearly present.
  watch(
    () => seatList.value.length,
    (len) => {
      if (len > 0) {
        hasSeatListBeenPopulated.value = true;
        if (loadingTimer !== null) {
          clearTimeout(loadingTimer);
          loadingTimer = null;
        }
      }
    },
  );

  // Watch for refresh events from LivePlayerState.
  // When isRefreshing becomes true, reset isFirstFrameRendered to trigger loading state,
  // and restart the video observer to detect the new stream's first frame.
  watch(isRefreshing, (refreshing) => {
    if (refreshing) {
      // Stop current observer
      videoReadyHandle?.stop();
      videoReadyHandle = null;

      // Reset video state to trigger loading
      isFirstFrameRendered.value = false;
      // Note: isLoadingTimedOut is NOT reset because during refresh the anchor
      // should still be present (hasSeatListBeenPopulated remains true)

      // Start observing again for the refreshed stream
      videoReadyHandle = observeVideoReady(viewId, () => {
        isFirstFrameRendered.value = true;
      });
    }
  });

  // Observe the stream container for the first rendered video frame.
  // Unlike a fixed-timeout Promise, this observer runs for the entire component
  // lifecycle and fires `onReady` only when a <video> element inside the
  // container actually has its first frame rendered (readyState >= 3).
  let videoReadyHandle: VideoReadyHandle | null = null;

  /**
   * Start observing video ready state and loading timeout.
   * Call this after the stream has started playing (e.g., after startPlayStream).
   */
  function startObserving() {
    // Start observing; the callback fires once, then auto-cleans up.
    videoReadyHandle = observeVideoReady(viewId, () => {
      isFirstFrameRendered.value = true;
      // Video is playing — no need for the timeout fallback any more.
      if (loadingTimer !== null) {
        clearTimeout(loadingTimer);
        loadingTimer = null;
      }
    });
    // Start the loading grace-period timer. If neither seatList data nor a
    // video frame arrives within the timeout, we assume the anchor is absent.
    loadingTimer = setTimeout(() => {
      loadingTimer = null;
      if (!isFirstFrameRendered.value && !hasSeatListBeenPopulated.value) {
        isLoadingTimedOut.value = true;
      }
    }, loadingTimeoutMs);
  }

  /**
   * Stop observing and clean up resources.
   * Call this before stopping the stream (e.g., in onBeforeUnmount before stopPlayStream).
   */
  function stopObserving() {
    videoReadyHandle?.stop();
    videoReadyHandle = null;
    if (loadingTimer !== null) {
      clearTimeout(loadingTimer);
      loadingTimer = null;
    }
    isFirstFrameRendered.value = false;
  }

  return {
    isFirstFrameRendered,
    isAnchor,
    isVoiceChatRoom,
    isAnchorAway,
    isLoading,
    startObserving,
    stopObserving,
  };
}

export { useOverlayState, DEFAULT_LOADING_TIMEOUT_MS };
export type { OverlayState, OverlayStateOptions };
