import { onMounted, onUnmounted } from 'vue';
import { pushLog } from './store';
import { session } from '../session/session';

/**
 * One-liner helper to subscribe every event of a state hook into EventLog.
 *
 * All exports are gathered at the bottom of the file for a single, easy-to-scan
 * public surface.
 */

/**
 * Minimal shape of an event-capable state hook.
 *
 * The concrete event/callback types differ per hook, so the helper accepts the
 * loose `subscribeEvent` / `unsubscribeEvent` pair and casts internally. Each
 * example group passes its own typed event enum.
 */
interface EventfulHook {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  subscribeEvent: (event: any, callback: any) => void;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  unsubscribeEvent: (event: any, callback: any) => void;
}

/**
 * Subscribe every member of an event enum to the shared EventLog and clean up
 * on unmount.
 *
 * Replaces the per-file `onMounted`/`onUnmounted` boilerplate so a newly added
 * state group gets "all events streamed to the log" in one line. Returns the
 * full event-name list so cards can reuse it for `events:` (log filtering).
 *
 * MUST be called inside a component `setup` (relies on lifecycle hooks).
 *
 * @param source Group slug used as the log source, e.g. `live-seat`.
 * @param hook   The state hook instance exposing subscribe/unsubscribe.
 * @param eventEnum The hook's event enum object (string-valued).
 */
function useEventLogSubscription(
  source: string,
  hook: EventfulHook,
  eventEnum: Record<string, string>,
): string[] {
  const events = Object.values(eventEnum);
  const handlers = new Map<string, (info: unknown) => void>();

  onMounted(() => {
    events.forEach((event) => {
      const handler = (info: unknown) => pushLog(source, event, info, session.role, 'event');
      handlers.set(event, handler);
      hook.subscribeEvent(event, handler);
    });
  });

  onUnmounted(() => {
    handlers.forEach((handler, event) => hook.unsubscribeEvent(event, handler));
    handlers.clear();
  });

  return events;
}

// ---------------------------------------------------------------------------
// Public surface (single re-export point per project convention).
// ---------------------------------------------------------------------------

export { useEventLogSubscription };
export type { EventfulHook };
