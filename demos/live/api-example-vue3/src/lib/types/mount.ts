/**
 * Optional render carrier a card needs to actually show video.
 *
 * State-layer APIs only control playback/devices; the **rendering carrier** is a
 * real UI component:
 * - `live-view`: embeds `<LiveView />` (audience pull-stream / player stage).
 *   NOTE: LiveView is **single-instance** — it renders the fixed container
 *   `#atomicx-live-stream-content` and binds the global player singleton, so at
 *   most one `live-view` card may be active at a time, even in a multi-card
 *   layout (see PRD §7). The host enforces this at runtime.
 * - `camera-preview`: a global floating `<div>` (id `global-camera-preview`)
 *   hosted by GlobalCameraStage at App level. The local camera stream renders
 *   into this single container and persists across card switches.
 */
interface MountSpec {
  kind: 'live-view' | 'camera-preview';
  /** Override the camera-preview container id (rarely needed; defaults to global). */
  viewId?: string;
  /** Short hint shown above the stage. */
  note?: string;
}

export type { MountSpec };
