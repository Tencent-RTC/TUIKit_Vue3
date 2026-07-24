import { reactive } from 'vue';
import { emitBridgeEvent } from './bridge';
import { pushToast } from '../toast/store';

/**
 * Shared event/call/error log surfaced by `EventLog.vue`.
 *
 * Every SDK event flows through `pushLog` so the log, the cross-component
 * event bridge (auto-fill) and the toast stack stay in lockstep.
 *
 * All exports are gathered at the bottom of the file for a single, easy-to-scan
 * public surface.
 */

/** A single event/log entry rendered by the EventLog panel. */
interface LogEntry {
  id: number;
  ts: number;
  /** Group slug the entry belongs to, e.g. `live-list`. */
  source: string;
  event: string;
  payload?: unknown;
  /** Role that produced the entry (for color coding across windows). */
  role: string;
  level: 'event' | 'call' | 'error';
}

const MAX_ENTRIES = 500;

const store = reactive<{ items: LogEntry[] }>({ items: [] });

let seq = 0;

function pushLog(
  source: string,
  event: string,
  payload?: unknown,
  role = '',
  level: LogEntry['level'] = 'event',
): void {
  store.items.unshift({ id: ++seq, ts: Date.now(), source, event, payload, role, level });
  if (store.items.length > MAX_ENTRIES) {
    store.items.length = MAX_ENTRIES;
  }
  // Fan out SDK events for cross-component reactions (auto-fill, toasts).
  // `call` / `error` lines are user-driven and don't need fan-out.
  if (level === 'event') {
    emitBridgeEvent(source, event, payload, role);
    pushToast({ title: event, description: summarizePayload(payload), source, role, event });
  }
}

/**
 * Build a short, one-line description for the toast from an event payload.
 *
 * Heuristic: prefer common identity fields (userId / userName) on the payload
 * or its first object child; fall back to a truncated JSON snippet.
 */
function summarizePayload(payload: unknown): string | undefined {
  if (payload == null) {
    return undefined;
  }
  if (typeof payload === 'string') {
    return payload.length > 80 ? `${payload.slice(0, 77)}...` : payload;
  }
  if (typeof payload !== 'object') {
    return String(payload);
  }
  const obj = payload as Record<string, unknown>;
  const direct = findIdentity(obj);
  if (direct) {
    return direct;
  }
  for (const value of Object.values(obj)) {
    if (value && typeof value === 'object') {
      const nested = findIdentity(value as Record<string, unknown>);
      if (nested) {
        return nested;
      }
    }
  }
  try {
    const json = JSON.stringify(obj);
    return json.length > 80 ? `${json.slice(0, 77)}...` : json;
  } catch {
    return undefined;
  }
}

function findIdentity(obj: Record<string, unknown>): string | undefined {
  const id = obj.userId ?? obj.liveId ?? obj.battleId ?? obj.id;
  const name = obj.userName ?? obj.liveName;
  if (typeof id === 'string' && id) {
    return typeof name === 'string' && name ? `${name}(${id})` : id;
  }
  if (typeof name === 'string' && name) {
    return name;
  }
  return undefined;
}

function clearLogs(source?: string): void {
  if (!source) {
    store.items.splice(0, store.items.length);
  } else {
    store.items = store.items.filter(item => item.source !== source);
  }
}

function exportLogs(source?: string): string {
  const data = source ? store.items.filter(i => i.source === source) : store.items;
  return JSON.stringify(data, null, 2);
}

const logStore = store;

// ---------------------------------------------------------------------------
// Public surface (single re-export point per project convention).
// ---------------------------------------------------------------------------

export { clearLogs, exportLogs, logStore, pushLog };
export type { LogEntry };
