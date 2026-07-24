import { reactive } from 'vue';
import type { EventAction } from '../event-log/actions';

/**
 * Lightweight toast notifications surfaced when SDK events arrive.
 *
 * The site already streams every event into EventLog, but the log alone is
 * easy to miss when the operator is focused on a card. A right-edge sliding
 * toast gives passive notification without forcing focus changes.
 *
 * Kept independent of EventLog so retention rules (auto-dismiss) and rendering
 * concerns stay separate.
 *
 * All exports are gathered at the bottom of the file for a single, easy-to-scan
 * public surface.
 */
interface ToastEntry {
  id: number;
  title: string;
  description?: string;
  /** Group slug; controls accent color (live-list / co-guest / ...). */
  source: string;
  role: string;
  ts: number;
  /**
   * Raw SDK event name (when this toast was produced by an SDK event). Lets
   * the UI resolve a suggested follow-up action via `eventActions.ts` without
   * parsing the title. May be omitted for non-event toasts.
   */
  event?: string;
  /**
   * Explicit follow-up action (used by manually-triggered toasts like
   * "startLive succeeded → go enable camera"). Overrides the `event`-based
   * lookup. Keeps action-completion guidance out of `eventActions.ts`, which
   * is reserved for inbound SDK events.
   */
  action?: EventAction;
  /** Visual variant. `success` = green accent. Defaults to neutral blue. */
  level?: 'info' | 'success';
}

const MAX_VISIBLE = 6;
const AUTO_DISMISS_MS = 4500;
// Guidance toasts (carry an explicit `action`) get a longer dwell
// time so the operator has time to read and click the follow-up button.
const GUIDANCE_DISMISS_MS = 7000;

const store = reactive<{ items: ToastEntry[] }>({ items: [] });
let seq = 0;

/**
 * Per-toast timer state kept outside the reactive store. Stored separately so
 * a `setTimeout` handle never becomes part of Vue's reactive tracking, which
 * also avoids any chance of the handle being cloned or proxied.
 */
interface TimerState {
  /** Active setTimeout handle, or null while paused (hover). */
  handle: number | null;
  /** Remaining time to dismiss when the next timer fires (ms). */
  remaining: number;
  /** Wall-clock ts when the current handle was started; used to compute remaining on pause. */
  startedAt: number;
}
const timers = new Map<number, TimerState>();

function scheduleDismiss(id: number, ms: number): void {
  const handle = window.setTimeout(() => dismissToast(id), ms);
  const state = timers.get(id);
  if (state) {
    state.handle = handle;
    state.remaining = ms;
    state.startedAt = Date.now();
  } else {
    timers.set(id, { handle, remaining: ms, startedAt: Date.now() });
  }
}

function pushToast(entry: Omit<ToastEntry, 'id' | 'ts'>): void {
  const item: ToastEntry = { ...entry, id: ++seq, ts: Date.now() };
  
  // All toasts go to the top of the list in insertion order for smooth
  // animations. The CSS flexbox order property will visually reorder
  // actionables to the bottom without DOM thrashing.
  store.items.unshift(item);
  
  // When exceeding MAX_VISIBLE, drop the OLDEST toast that is NOT
  // actionable, so actionable toasts (like the startLive → open camera
  // guidance) always survive. If ALL toasts are actionable, drop the
  // OLDEST actionable one (index = length - 1) — the newest is at
  // index 0 and carries the most recent operator intent.
  if (store.items.length > MAX_VISIBLE) {
    let dropIndex = -1;
    for (let i = store.items.length - 1; i >= 0; i--) {
      const t = store.items[i];
      if (!t.action && !t.event) {
        dropIndex = i;
        break;
      }
    }

    if (dropIndex >= 0) {
      const dropped = store.items.splice(dropIndex, 1)[0];
      clearTimer(dropped.id);
    } else {
      // All remaining are actionable; drop the oldest one (last in the
      // array, since `unshift` puts newest first). The newest actionable
      // toast at index 0 is preserved so the operator's most recent
      // guidance is always visible.
      const dropped = store.items.pop();
      if (dropped) clearTimer(dropped.id);
    }
  }
  
  // Guidance toasts (carry an explicit `action`) get a longer dwell
  // time so the operator can read the guidance and click the follow-up.
  // Only `action` counts — `event` alone does NOT, because `pushLog`
  // fans out every SDK event as a toast with `event` set, and those
  // are passive notifications, not actionable guidance.
  const isGuidance = !!item.action;
  scheduleDismiss(item.id, isGuidance ? GUIDANCE_DISMISS_MS : AUTO_DISMISS_MS);
}

function dismissToast(id: number): void {
  clearTimer(id);
  const idx = store.items.findIndex(t => t.id === id);
  if (idx >= 0) {
    store.items.splice(idx, 1);
  }
}

/**
 * Pause auto-dismiss for a hovered toast. Stays visible until `resumeToast`
 * is called (mouse-leave). Idempotent.
 */
function pauseToast(id: number): void {
  const state = timers.get(id);
  if (!state || state.handle === null) {
    return;
  }
  window.clearTimeout(state.handle);
  state.remaining = Math.max(0, state.remaining - (Date.now() - state.startedAt));
  state.handle = null;
}

/**
 * Resume auto-dismiss with whatever time was left when paused. If the toast
 * was hovered past its remaining budget, give it a small grace window so it
 * doesn't vanish the instant the cursor leaves.
 */
function resumeToast(id: number): void {
  const state = timers.get(id);
  if (!state || state.handle !== null) {
    return;
  }
  const ms = state.remaining > 0 ? state.remaining : 800;
  scheduleDismiss(id, ms);
}

function clearTimer(id: number): void {
  const state = timers.get(id);
  if (!state) {
    return;
  }
  if (state.handle !== null) {
    window.clearTimeout(state.handle);
  }
  timers.delete(id);
}

const toastStore = store;

// ---------------------------------------------------------------------------
// Public surface (single re-export point per project convention).
// ---------------------------------------------------------------------------

export { dismissToast, pauseToast, pushToast, resumeToast, toastStore };
export type { ToastEntry };
