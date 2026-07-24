import { onMounted, onUnmounted, reactive } from 'vue';
import { pushLog } from './store';
import { session } from '../session/session';

/**
 * Per-event demo subscription toggle for the `subscribeEvent` /
 * `unsubscribeEvent` API pair.
 *
 * Design intent:
 *   Every state hook contract pairs `subscribeEvent` and `unsubscribeEvent`,
 *   but only one of them carries the "real" demo value (toggling produces
 *   visible side effects in EventLog). Surfacing them as two cards in
 *   isolation is awkward — subscribing is the default state from the
 *   moment the group mounts (the always-on log subscription already does
 *   this for the operator), and a standalone "subscribe" press has nothing
 *   to show.
 *
 *   This helper takes the opposite stance:
 *     - **All events are subscribed by default** when the group mounts.
 *       The Operator sees `[demo] <eventName>` lines in EventLog from t=0,
 *       sitting alongside the regular event rows produced by the always-on
 *       log subscription.
 *     - `unsubscribeEvent` is the **primary action** — it can cancel
 *       a single event (per-event granularity) or all events at once.
 *       After cancellation, the corresponding `[demo] *` rows stop
 *       appearing while the regular event rows continue, making the
 *       contract visible.
 *     - `subscribeEvent` is then a **recovery action** — it re-subscribes
 *       events that were previously cancelled (or is a no-op when the
 *       event is already subscribed). This matches real-world usage:
 *       business code typically subscribes once, then later may cancel
 *       and re-subscribe on view transitions.
 *
 * Why the demo handlers use a `[demo] ` event-name prefix:
 *   EventLog already shows the regular event rows produced by the
 *   always-on log subscription installed via `useEventLogSubscription`.
 *   The demo handlers are a SEPARATE pair of subscriptions, so when both
 *   are active the operator sees TWO rows per event ('onX' + '[demo] onX').
 *   When the demo handler for X is cancelled, only 'onX' remains. This
 *   side-by-side delta is what makes the API pair feel real.
 */
interface DemoHandlerHook {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  subscribeEvent: (event: any, callback: any) => void;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  unsubscribeEvent: (event: any, callback: any) => void;
}

interface DemoHandlerToggle {
  /**
   * Reactive subscription state per event name. Read by `state`-style
   * cards' Output panels for a live view of which events are currently
   * subscribed in the demo handler set.
   */
  readonly state: { subscribed: Record<string, boolean> };
  /**
   * Re-subscribe a single event (no-op when already subscribed).
   * Throws when `event` is not in the hook's event enum.
   */
  subscribeOne: (event: string) => { event: string; subscribed: true };
  /**
   * Unsubscribe a single event (no-op when already unsubscribed).
   * Throws when `event` is not in the hook's event enum.
   */
  unsubscribeOne: (event: string) => { event: string; subscribed: false };
  /** Re-subscribe every event in the enum. */
  subscribeAll: () => { events: string[] };
  /** Unsubscribe every event in the enum. */
  unsubscribeAll: () => { events: string[] };
  /** All event names this toggle manages, in enum-declaration order. */
  events: string[];
}

function useDemoHandlerToggle(
  source: string,
  hook: DemoHandlerHook,
  eventEnum: Record<string, string>,
): DemoHandlerToggle {
  const events = Object.values(eventEnum);
  const eventSet = new Set(events);
  // Keeps the EXACT handler reference per event so unsubscribeEvent matches
  // identity (the SDK uses `Array.indexOf` to find the listener, so passing
  // a fresh function would silently fail).
  const handlers = new Map<string, (info: unknown) => void>();

  const state = reactive<{ subscribed: Record<string, boolean> }>({
    subscribed: Object.fromEntries(events.map(e => [e, false])),
  });

  function makeHandler(event: string): (info: unknown) => void {
    return (info: unknown) =>
      pushLog(source, `[demo] ${event}`, info, session.role, 'event');
  }

  function assertKnown(event: string): void {
    if (!eventSet.has(event)) {
      throw new Error(
        `unknown event "${event}" for group "${source}". Valid: ${events.join(', ')}`,
      );
    }
  }

  function subscribeOne(event: string) {
    assertKnown(event);
    if (state.subscribed[event]) {
      return { event, subscribed: true as const };
    }
    const handler = makeHandler(event);
    handlers.set(event, handler);
    hook.subscribeEvent(event, handler);
    state.subscribed[event] = true;
    return { event, subscribed: true as const };
  }

  function unsubscribeOne(event: string) {
    assertKnown(event);
    if (!state.subscribed[event]) {
      return { event, subscribed: false as const };
    }
    const handler = handlers.get(event);
    if (handler) {
      hook.unsubscribeEvent(event, handler);
      handlers.delete(event);
    }
    state.subscribed[event] = false;
    return { event, subscribed: false as const };
  }

  function subscribeAll() {
    events.forEach(subscribeOne);
    return { events };
  }

  function unsubscribeAll() {
    events.forEach(unsubscribeOne);
    return { events };
  }

  // All events subscribed by default — see module doc-comment for rationale.
  onMounted(() => subscribeAll());

  // Clean up on unmount; otherwise navigating away with handlers ON leaks
  // listeners on the singleton state hook.
  onUnmounted(() => unsubscribeAll());

  return { state, subscribeOne, unsubscribeOne, subscribeAll, unsubscribeAll, events };
}

// ---------------------------------------------------------------------------
// Public surface (single re-export point per project convention).
// ---------------------------------------------------------------------------

export { useDemoHandlerToggle };
export type { DemoHandlerToggle };
