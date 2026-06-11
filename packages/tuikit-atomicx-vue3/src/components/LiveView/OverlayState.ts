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
/**
 * Debounce window (ms) before treating an empty seatList (after the list had
 * once been populated) as "anchor away". This guards against transient empty
 * seatLayout snapshots emitted by some SDK builds / mobile browsers during
 * stream switching, reconnecting, or layout updates — situations where the
 * <video> element keeps playing audio/video but the layout briefly reports
 * zero regions, which previously caused a false "anchor away" overlay even
 * though the stream was perfectly fine.
 */
const ANCHOR_AWAY_DEBOUNCE_MS = 2000;

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
  /**
   * Debounce window (ms) for confirming the anchor is away after the
   * seatList becomes empty. Must be long enough to absorb transient empty
   * seatLayout snapshots from the SDK on flaky mobile networks.
   * @default 2000
   */
  anchorAwayDebounceMs?: number;
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
  const {
    viewId,
    loadingTimeoutMs = DEFAULT_LOADING_TIMEOUT_MS,
    anchorAwayDebounceMs = ANCHOR_AWAY_DEBOUNCE_MS,
  } = options;
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

  // Debounced "anchor confirmed away" flag. We only set it after the
  // seatList has stayed empty for `anchorAwayDebounceMs` following a prior
  // populated state. Using a debounced flag (instead of reading
  // `seatList.length` directly inside `isAnchorAway`) is what protects us
  // from transient empty seatLayout snapshots that some H5 builds emit
  // mid-stream while audio/video keeps flowing.
  const isAnchorConfirmedAway = ref(false);
  let anchorAwayTimer: ReturnType<typeof setTimeout> | null = null;

  const isAnchor = computed(
    () => loginUserInfo.value?.userId === currentLive.value?.liveOwner.userId,
  );

  // Voice chat rooms use "voice_" prefix in liveId, while live rooms use "live_" prefix.
  const isVoiceChatRoom = computed(
    () => currentLive.value?.liveId?.startsWith('voice_') ?? false,
  );

  // Show anchor-away overlay when:
  // Case A (classic): seatList was populated, then stayed empty long enough
  //   to be confirmed away (debounced via `isAnchorConfirmedAway`).
  // Case B (timeout): seatList was never populated and loading timed out
  //   → the room had no anchor from the start.
  // Both cases require: viewer is not the anchor, it's a live room, and the
  // current seatList is empty at this moment. We additionally suppress the
  // overlay while the first frame is still rendering for the very first
  // time (Case B handles the never-populated path explicitly via timeout).
  const isAnchorAway = computed(
    () =>
      !isAnchor.value
      && seatList.value.length === 0
      && (currentLive.value?.liveId?.startsWith('live_') ?? false)
      && (isAnchorConfirmedAway.value || isLoadingTimedOut.value),
  );

  // Pure loading state: true when the stream is still loading, regardless of
  // whether a custom center-overlay slot is provided. This is injected into
  // the slot so consumers can react to the loading state.
  const isLoading = computed(
    () =>
      !isFirstFrameRendered.value
      && !isAnchor.value
      && !isLoadingTimedOut.value
      && !!currentLive.value?.liveId,
  );

  // Track seatList transitions so we can:
  //   - latch `hasSeatListBeenPopulated` (one-way) on the first non-empty list
  //   - cancel the loading timeout once the anchor has clearly arrived
  //   - debounce the "anchor away" confirmation so transient empty layouts
  //     do not flash the overlay while the stream is still playing
  watch(
    () => seatList.value.length,
    (len) => {
      if (len > 0) {
        hasSeatListBeenPopulated.value = true;
        if (loadingTimer !== null) {
          clearTimeout(loadingTimer);
          loadingTimer = null;
        }
        // SeatList came back: cancel any pending away confirmation and
        // clear the confirmed flag so we leave the overlay state.
        if (anchorAwayTimer !== null) {
          clearTimeout(anchorAwayTimer);
          anchorAwayTimer = null;
        }
        isAnchorConfirmedAway.value = false;
        return;
      }
      // SeatList dropped to empty. Only schedule the away confirmation if
      // it had been populated before (i.e. an anchor really was here).
      // Otherwise the loadingTimer / isLoadingTimedOut path handles
      // "never had an anchor" rooms.
      if (!hasSeatListBeenPopulated.value) {
        return;
      }
      if (anchorAwayTimer !== null) {
        return;
      }
      anchorAwayTimer = setTimeout(() => {
        anchorAwayTimer = null;
        // Re-check at the moment the timer fires: if seatList has come
        // back in the meantime, do nothing.
        if (seatList.value.length === 0) {
          isAnchorConfirmedAway.value = true;
        }
      }, anchorAwayDebounceMs);
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
    if (anchorAwayTimer !== null) {
      clearTimeout(anchorAwayTimer);
      anchorAwayTimer = null;
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

export { useOverlayState, DEFAULT_LOADING_TIMEOUT_MS, ANCHOR_AWAY_DEBOUNCE_MS };
export type { OverlayState, OverlayStateOptions };
