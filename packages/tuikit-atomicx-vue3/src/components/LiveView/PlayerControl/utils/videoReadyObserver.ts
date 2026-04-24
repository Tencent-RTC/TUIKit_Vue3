/**
 * Interval (ms) for probing the <video> element inside the stream container.
 */
const VIDEO_READY_PROBE_INTERVAL_MS = 200;

/**
 * Check whether a <video> element has actually rendered its first frame.
 */
function isVideoReady(videoEl: HTMLVideoElement): boolean {
  return videoEl.readyState >= 3 && videoEl.videoWidth > 0 && videoEl.videoHeight > 0;
}

/**
 * Handle returned by {@link observeVideoReady}. Call `stop()` to release
 * all timers, listeners and observers (e.g. in `onBeforeUnmount`).
 */
interface VideoReadyHandle {
  stop: () => void;
}

/**
 * Observe the stream container identified by `viewId` and invoke `onReady`
 * the first time a `<video>` element inside it renders its first frame.
 *
 * Unlike a one-shot Promise with a fixed timeout, this keeps watching for
 * the entire component lifecycle. The caller must invoke `handle.stop()` in
 * `onBeforeUnmount` to release resources.
 *
 * It combines a MutationObserver (instant notification when `<video>` is
 * inserted) with a periodic probe as fallback.
 */
function observeVideoReady(viewId: string, onReady: () => void): VideoReadyHandle {
  let stopped = false;
  let probeTimer: ReturnType<typeof setInterval> | null = null;
  let observer: MutationObserver | null = null;
  let observedVideoEl: HTMLVideoElement | null = null;

  const cleanup = () => {
    stopped = true;
    if (probeTimer) { clearInterval(probeTimer); probeTimer = null; }
    if (observer) { observer.disconnect(); observer = null; }
    unbindVideoListeners();
  };

  const finish = () => {
    if (stopped) return;
    cleanup();
    onReady();
  };

  const tryFinish = () => {
    if (observedVideoEl && isVideoReady(observedVideoEl)) {
      finish();
    }
  };

  const bindVideoListeners = (videoEl: HTMLVideoElement) => {
    if (observedVideoEl === videoEl) return;
    unbindVideoListeners();
    observedVideoEl = videoEl;
    videoEl.addEventListener('loadeddata', tryFinish);
    videoEl.addEventListener('canplay', tryFinish);
    videoEl.addEventListener('playing', tryFinish);
  };

  const unbindVideoListeners = () => {
    if (!observedVideoEl) return;
    observedVideoEl.removeEventListener('loadeddata', tryFinish);
    observedVideoEl.removeEventListener('canplay', tryFinish);
    observedVideoEl.removeEventListener('playing', tryFinish);
    observedVideoEl = null;
  };

  const checkContainer = () => {
    if (stopped) return;
    const container = document.getElementById(viewId);
    if (!container) return;
    const videoEl = container.querySelector('video');
    if (videoEl instanceof HTMLVideoElement) {
      bindVideoListeners(videoEl);
      if (isVideoReady(videoEl)) {
        finish();
      }
    }
  };

  // MutationObserver: react immediately when <video> is added to the DOM.
  const setupObserver = () => {
    const container = document.getElementById(viewId);
    if (!container) return;
    observer = new MutationObserver(() => checkContainer());
    observer.observe(container, { childList: true, subtree: true });
  };

  // Initial check + start observer + periodic fallback probe.
  checkContainer();
  if (!stopped) {
    setupObserver();
    probeTimer = setInterval(checkContainer, VIDEO_READY_PROBE_INTERVAL_MS);
  }

  return { stop: cleanup };
}

export { observeVideoReady };
export type { VideoReadyHandle };
