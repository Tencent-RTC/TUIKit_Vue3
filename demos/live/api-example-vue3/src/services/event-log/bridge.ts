/**
 * Tiny pub/sub for cross-component side effects driven by SDK events.
 *
 * Why a separate bus instead of reading EventLog directly:
 * - EventLog is a UI-facing reactive list. Subscribing components to its
 *   mutations would couple every consumer to log retention/ordering.
 * - We need a synchronous fan-out the moment an event arrives so things like
 *   "auto-fill the next form" / "show a toast" stay in lockstep with the log.
 *
 * The bus carries the same `(source, event, payload, role)` tuple that
 * `pushLog` writes, plus a monotonically increasing id so consumers can reset
 * (e.g. "only react to events that arrived after I mounted").
 *
 * All exports are gathered at the bottom of the file for a single, easy-to-scan
 * public surface.
 */

/** One event delivery. Mirrors `pushLog`'s arguments. */
interface BridgeEvent {
  id: number;
  source: string;
  event: string;
  payload?: unknown;
  role: string;
}

type Listener = (e: BridgeEvent) => void;

const listeners = new Set<Listener>();
let seq = 0;

/**
 * Latest snapshot per `event` name. Lets cards that mount AFTER an event has
 * fired still get the last known payload (e.g. host receives an application
 * while on another card, then switches to `acceptApplication` — input should
 * still be pre-filled).
 *
 * Keyed by event name only (not `source:event`) because event names within
 * this demo are unique across groups; if that ever changes, switch to a
 * composite key.
 */
const latestByEvent = new Map<string, BridgeEvent>();

/** Subscribe; returns an unsubscribe function. */
function onBridgeEvent(listener: Listener): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

/** Internal: dispatch an event to all subscribers. */
function emitBridgeEvent(
  source: string,
  event: string,
  payload: unknown,
  role: string,
): void {
  const e: BridgeEvent = { id: ++seq, source, event, payload, role };
  latestByEvent.set(event, e);
  listeners.forEach((fn) => {
    try {
      fn(e);
    } catch {
      /* listener errors must not break the dispatch loop */
    }
  });
}

/**
 * Look up the most recent emitted event whose name is in `eventNames`.
 *
 * Used by `ExampleCard` on mount to back-fill auto-fill fields with payloads
 * that arrived while the card was not mounted.
 */
function getLatestEvent(eventNames: string[]): BridgeEvent | undefined {
  let best: BridgeEvent | undefined;
  for (const name of eventNames) {
    const hit = latestByEvent.get(name);
    if (hit && (!best || hit.id > best.id)) {
      best = hit;
    }
  }
  return best;
}

/**
 * Clear cached events. Call on logout / live-room switch so a stale payload
 * from a previous session doesn't auto-fill the next one.
 */
function clearBridgeCache(): void {
  latestByEvent.clear();
}

/**
 * Read a dot-path from an arbitrary payload object. Used by auto-fill rules
 * to pluck e.g. `guestUser.userId` from an event info.
 */
function readPath(payload: unknown, path: string): unknown {
  if (!path) {
    return payload;
  }
  return path.split('.').reduce<unknown>((acc, key) => {
    if (acc == null || typeof acc !== 'object') {
      return undefined;
    }
    return (acc as Record<string, unknown>)[key];
  }, payload);
}

// ---------------------------------------------------------------------------
// Public surface (single re-export point per project convention).
// ---------------------------------------------------------------------------

export { clearBridgeCache, emitBridgeEvent, getLatestEvent, onBridgeEvent, readPath };
export type { BridgeEvent };
