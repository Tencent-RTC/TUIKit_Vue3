// Side-effect-free constants for LiveView.
// Extracted to break the cyclic dependency between `./index.vue` and `./index.ts`,
// which can cause cross-chunk TDZ errors after demo bundlers re-split the library output.
export const LIVE_STREAM_CONTENT_VIEW = 'atomicx-live-stream-content';
