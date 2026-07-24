<template>
  <!--
    Global Event Log dock — single instance pinned to the bottom of
    the app shell, always reachable regardless of which example card
    is open.

    Rationale (see the parent README / design note):
      - The log store (`eventLog.ts#logStore`) was already a single
        global ring buffer. Rendering it from inside every ExampleCard
        forced the operator to scroll down a tall card just to see
        whether their click produced any SDK activity, and made
        cross-group flows (e.g. host accept → guest receives response)
        invisible because the relevant entries lived under two
        different cards.
      - This dock surfaces the whole stream in one place, keeps it
        out of the way (collapsed by default to a 32px status strip),
        and lets the operator expand it whenever they want a fuller
        view.

    Discoverability features (added after first-customer feedback
    that the collapsed strip was "easy to miss"):
      1. Auto-peek on the very first event of the session. The dock
         briefly expands for ~1.8s the moment any SDK event lands,
         then re-collapses — gives newcomers one "oh, there's a log
         down there" reveal without forcing them to keep it open.
         Suppressed if they've already manually expanded, persisted
         in sessionStorage so it only fires once per tab session.
      2. Live indicator dot on the left of the strip. Green pulse =
         idle / listening; blue pulse = there are unread events.
         A static strip is too easy to mentally tune out; a gentle
         pulse provides a constant "the log is alive" cue.
      3. Heightened strip (32px vs prior 28px) + bumped font size +
         shadow + top hairline tint when unread > 0. None of these
         alone is loud, but combined they push the strip above the
         "is this part of the footer chrome?" perceptual threshold.

    Interactions:
      - Click the header strip to expand / collapse.
      - When collapsed, an unread badge counts the events that arrived
        since the last expansion so the operator knows whether new
        activity has come in without opening the panel.
      - The expanded body delegates to `<EventLog globalMode />` which
        owns the source filter chips, time-ordered list, and export /
        clear actions.
      - Drag the top edge of the expanded panel to resize its height.
        Persisted in localStorage so a refresh keeps the preferred size.
  -->
  <div
    :class="[
      'event-dock',
      {
        'event-dock--expanded': expanded,
        'event-dock--has-unread': !expanded && unreadCount > 0,
        'event-dock--peeking': autoPeeking,
        'event-dock--resizing': isResizing,
      },
    ]"
  >
    <!--
      Resize handle — a thin grab bar pinned to the top edge of the
      expanded panel. Only visible when expanded (dragging a collapsed
      32px strip makes no sense). During an active drag we add a
      body-level class to suppress text selection and pointer events
      on the log content.
    -->
    <div
      v-if="expanded"
      class="event-dock__resizer"
      @mousedown="onResizeStart"
    />
    <button
      type="button"
      class="event-dock__strip"
      :aria-expanded="expanded"
      :title="expanded ? t('EventLog.DockCollapseTitle', '收起 Event Log') : t('EventLog.DockExpandTitle', '点击展开 Event Log · 全局事件日志')"
      @click="toggle"
    >
      <!--
        Live indicator dot. Two modes:
          - Idle (no unread): green, slow breathing pulse. Tells the
            operator the log surface is mounted and listening.
          - Unread > 0: blue, faster pulse matching the unread badge.
            Gives the strip a non-static visual hook so it doesn't
            blend into the bottom chrome at a casual glance.
        Hidden in expanded state — the panel itself is the indicator
        then.
      -->
      <span
        v-if="!expanded"
        :class="['event-dock__live-dot', { 'is-unread': unreadCount > 0 }]"
        aria-hidden="true"
      />
      <span class="event-dock__caret" :class="{ 'is-up': expanded }">▾</span>
      <span class="event-dock__label">Event Log</span>
      <span class="event-dock__total">{{ totalCount }} 条</span>
      <span
        v-if="!expanded && unreadCount > 0"
        class="event-dock__unread"
        :aria-label="t('EventLog.DockUnreadCount', '未读事件数')"
      >+{{ unreadCount }}</span>
      <span v-if="!expanded && lastEvent" class="event-dock__last">
        {{ t('EventLog.DockLatest', '最新：') }}<code>{{ lastEvent.source }}</code> · {{ lastEvent.event }}
      </span>
      <span class="event-dock__hint">{{ expanded ? t('EventLog.DockCollapseHint', '点击收起') : t('EventLog.DockExpandHint', '点击展开 / 查看全部') }}</span>
    </button>

    <!--
      Keep the EventLog instance mounted across collapsed / expanded
      transitions: re-mounting on every toggle would reset the source
      filter chip selection and force a re-render of all entries. We
      hide via CSS (max-height + opacity) instead so the operator's
      filter survives between sessions of opening the dock.
    -->
    <div class="event-dock__body" :style="expanded ? bodyStyle : undefined" :aria-hidden="!expanded">
      <!--
        Inner sizer absorbs `EventLog`'s `min-height: 160px` while the
        outer `__body` uses `height: 0 → Npx` for the slide transition.
        Without this wrapper the min-height would force the collapsed
        body to stay 160px tall (defeating the dock).
        Height is driven by `bodyStyle` (drag-resizable, persisted).
      -->
      <div class="event-dock__body-inner">
        <EventLog global-mode :show-title="false" />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onUnmounted, ref, watch } from 'vue';
import { useUIKit } from '@tencentcloud/uikit-base-component-vue3';
import EventLog from './EventLog.vue';
import { logStore } from './store';

const { t } = useUIKit();

/**
 * Persist the expand/collapse choice so a refresh during active
 * debugging doesn't force the operator to re-open the dock. Survives
 * vite HMR too. Falls back silently in private-mode storage failures.
 */
const STORAGE_KEY = 'apiExample.eventDock.expanded';

function readPersisted(): boolean {
  try {
    return window.localStorage.getItem(STORAGE_KEY) === '1';
  } catch {
    return false;
  }
}

function writePersisted(v: boolean): void {
  try {
    window.localStorage.setItem(STORAGE_KEY, v ? '1' : '0');
  } catch {
    /* ignore */
  }
}

const expanded = ref(readPersisted());

/**
 * Unread counter — number of `logStore.items` that have arrived since
 * the last time the panel was opened.
 *
 * Implementation: an O(1) running tally instead of a per-render
 * linear scan. We watch the newest entry's id (`logStore.items[0]?.id`);
 * a change means at least one entry was pushed since the last tick.
 * We then compute the increment from the previous newest id alone:
 *   - id increased     → that many new entries on top, +increment;
 *   - log was cleared  → items[0] becomes undefined, unread resets;
 *   - log emptied then refilled → newId beats previous undefined,
 *     unread starts from the newest id minus 0 (the seen baseline).
 *
 * Invariants we rely on (documented in `eventLog.ts`):
 *   - The store is unshift-only + tail-trimmed at MAX_ENTRIES=500;
 *     entries never reorder, only prepend / drop tail.
 *   - `pushLog` assigns ids monotonically (`++seq`), never re-uses.
 *   - `clearLogs(undefined)` truncates to 0; partial clears keep the
 *     head intact if the local user only clears another source.
 *
 * The previous implementation was a computed that walked the items
 * array each render. With the 500-entry cap that was still nanosecond
 * range, but logically it was an O(N) re-scan on every Vue tick that
 * touched the store. The watcher-based version below does work only
 * when the data actually changes, which also avoids the chip-rail and
 * unread badge re-rendering on unrelated reactive dependencies.
 */
const unreadCount = ref(0);
/** Newest-entry id observed at the last expansion. Acts as the "seen" baseline. */
const lastSeenId = ref<number>(logStore.items[0]?.id ?? 0);

const totalCount = computed(() => logStore.items.length);

// Track the newest id we've already counted into `unreadCount`. Distinct
// from `lastSeenId` (the "user saw up to here" baseline) — this one
// advances on every push, the baseline advances only on expansion.
let lastObservedNewestId = logStore.items[0]?.id ?? 0;

watch(
  () => logStore.items[0]?.id ?? 0,
  (newestId) => {
    // Log was cleared (items[0] undefined → 0). Reset everything to
    // a consistent "no unread" state so a subsequent push resumes
    // counting from a clean baseline.
    if (newestId === 0) {
      unreadCount.value = 0;
      lastObservedNewestId = 0;
      lastSeenId.value = 0;
      return;
    }
    // No-op when the user is currently looking at the dock — items
    // are seen as soon as they land.
    if (expanded.value) {
      lastObservedNewestId = newestId;
      lastSeenId.value = newestId;
      return;
    }
    // New entries arrived while collapsed. Ids are assigned by
    // `pushLog` as `++seq` (a module-level monotone counter that
    // clears never reset), so between two consecutive pushes the
    // ids differ by exactly 1. When several pushes happen between
    // watcher fires, the delta `newestId - lastObservedNewestId`
    // equals the count of new entries that landed on the head.
    // Edge cases that violate that simple equality:
    //   - clearLogs(source) deletes mid-array entries → head id may
    //     drop below `lastObservedNewestId` → delta goes negative;
    //   - clearLogs(undefined) truncates to 0 (handled above by
    //     the `newestId === 0` branch);
    //   - a partial clear that drops the head followed by a refill
    //     where `delta` exceeds the live array's length.
    // The conservative cap `delta <= logStore.items.length` catches
    // those cases and falls back to a one-time head scan — which is
    // still O(N) but happens only at clear/refill boundaries, not
    // in the steady-state per-push hot path.
    const delta = newestId - lastObservedNewestId;
    if (delta > 0 && delta <= logStore.items.length) {
      unreadCount.value += delta;
    } else {
      // Defensive recount — happens at most once per clear/refill
      // boundary, not on the hot path.
      let n = 0;
      for (const it of logStore.items) {
        if (it.id <= lastSeenId.value) break;
        n += 1;
      }
      unreadCount.value = n;
    }
    lastObservedNewestId = newestId;
  },
);

/**
 * Most-recent entry surfaced in the collapsed strip so the operator
 * gets a faint hint of what just happened ("co-guest · onGuestApplicationReceived")
 * without expanding. `undefined` when the log is empty.
 */
const lastEvent = computed(() => logStore.items[0]);

/**
 * Mark all currently-visible entries as seen whenever the panel
 * expands or collapses.
 *
 * Expansion: zero out the unread tally and advance the seen baseline
 * to the newest id, supersede any pending auto-peek timer, and burn
 * the once-per-session peek allowance.
 *
 * Collapse: also consume the peek marker. Without this, a user who
 * was shown the panel via auto-peek but immediately closed it before
 * the timer expired would never have `markPeekConsumed` called (the
 * cancel path in `cancelAutoPeek` doesn't write storage), and the
 * very next event would trigger another auto-peek on the same
 * session — annoying.
 */
watch(expanded, (now) => {
  writePersisted(now);
  if (now) {
    const newestId = logStore.items[0]?.id ?? lastSeenId.value;
    lastSeenId.value = newestId;
    lastObservedNewestId = newestId;
    unreadCount.value = 0;
    // A manual expansion supersedes any pending auto-peek timer and
    // also "uses up" the once-per-session peek allowance so we don't
    // re-peek on every subsequent event after the operator closes it.
    cancelAutoPeek();
    markPeekConsumed();
  } else {
    // Closing also burns the peek allowance — see the doc comment
    // above for why we need this in addition to the timer's own
    // markPeekConsumed call.
    markPeekConsumed();
  }
});

function toggle(): void {
  expanded.value = !expanded.value;
}

// ---------------------------------------------------------------------------
// Resizable panel height
// ---------------------------------------------------------------------------
//
// The expanded body height is driven by `panelHeight` (px). The drag
// handle at the top edge lets the operator pull the panel up or down.
// Persisted in localStorage so a refresh keeps the preferred size.
// Clamped to [120px, 80vh] — 120px is enough for ~5 log entries; 80vh
// leaves room for the topbar and content area above.

const HEIGHT_STORAGE_KEY = 'apiExample.eventDock.height';
const MIN_HEIGHT = 120;
const MAX_HEIGHT_RATIO = 0.8; // 80vh

function readPersistedHeight(): number {
  try {
    const raw = window.localStorage.getItem(HEIGHT_STORAGE_KEY);
    if (!raw) return 0;
    const n = Number(raw);
    return Number.isFinite(n) && n > 0 ? n : 0;
  } catch {
    return 0;
  }
}

// Track viewport height reactively so bodyStyle recomputes when the
// browser window is resized — without this the panel could exceed
// the 80vh clamp after the user shrinks the window.
const viewportHeight = ref(window.innerHeight);
function onViewportResize(): void {
  viewportHeight.value = window.innerHeight;
}
window.addEventListener('resize', onViewportResize);

function getMaxHeight(): number {
  return Math.round(viewportHeight.value * MAX_HEIGHT_RATIO);
}

// 0 = "not set yet" → fall back to 38vh at render time.
const panelHeight = ref(readPersistedHeight());
const isResizing = ref(false);

const bodyStyle = computed(() => {
  const maxH = getMaxHeight();
  // On first render (panelHeight=0) fall back to 38vh.
  const h = panelHeight.value || Math.round(viewportHeight.value * 0.38);
  const clamped = Math.max(MIN_HEIGHT, Math.min(maxH, h));
  return { height: `${clamped}px` };
});

function onResizeStart(e: MouseEvent): void {
  e.preventDefault();
  e.stopPropagation();
  isResizing.value = true;
  document.body.classList.add('is-resizing-event-dock');

  const startY = e.clientY;
  const startHeight = panelHeight.value || Math.round(viewportHeight.value * 0.38);
  const maxH = getMaxHeight();

  const onMove = (ev: MouseEvent): void => {
    // Drag UP = taller panel. Mouse delta is negative when moving up.
    const next = Math.max(MIN_HEIGHT, Math.min(maxH, startHeight + (startY - ev.clientY)));
    panelHeight.value = next;
  };
  const onUp = (): void => {
    isResizing.value = false;
    document.body.classList.remove('is-resizing-event-dock');
    document.removeEventListener('mousemove', onMove);
    document.removeEventListener('mouseup', onUp);
    try {
      window.localStorage.setItem(HEIGHT_STORAGE_KEY, String(panelHeight.value));
    } catch {
      /* storage may be unavailable */
    }
  };
  document.addEventListener('mousemove', onMove);
  document.addEventListener('mouseup', onUp);
}

// ---------------------------------------------------------------------------
// First-event auto-peek
// ---------------------------------------------------------------------------
//
// The dock is collapsed by default. New operators (especially
// customers reading the example site for the first time) often miss
// the existence of the log entirely, because the strip looks like
// part of the bottom chrome. To gently surface it, we watch for the
// first event of the session: when it arrives, briefly expand the
// dock so the panel "peeks" into view, then auto-collapse after a
// short window.
//
// Design notes:
//   - One-shot per tab session. Persisted in sessionStorage (not
//     localStorage) so a fresh tab gets the reveal again — what we
//     want to suppress is "user already saw the reveal in this
//     session", not "user has ever seen it".
//   - Cancelled the moment the operator manually expands. If they're
//     already looking at the log, we don't need to peek.
//   - Cancelled if the operator's persisted preference is already
//     "expanded" — they explicitly want it open.
//   - Uses `autoPeeking` flag (separate from `expanded`) to keep the
//     header label hint sensible — toggle() still treats us as "in
//     collapsed state" during the peek so a click closes it cleanly.

const PEEK_SESSION_KEY = 'apiExample.eventDock.peekedAt';
const PEEK_DURATION_MS = 1800;

function hasPeekedThisSession(): boolean {
  try {
    return !!window.sessionStorage.getItem(PEEK_SESSION_KEY);
  } catch {
    // If session storage is blocked, fall back to "treat as peeked"
    // so we never accidentally peek on every event in a session.
    return true;
  }
}

function markPeekConsumed(): void {
  try {
    window.sessionStorage.setItem(PEEK_SESSION_KEY, String(Date.now()));
  } catch {
    /* ignore */
  }
}

const autoPeeking = ref(false);
let peekTimer: number | null = null;

function cancelAutoPeek(): void {
  if (peekTimer !== null) {
    window.clearTimeout(peekTimer);
    peekTimer = null;
  }
  if (autoPeeking.value) {
    autoPeeking.value = false;
    expanded.value = false;
  }
}

/**
 * Watch the first incoming event. The trigger is `logStore.items.length`
 * crossing from 0 to >0 — this fires exactly once per page-load even
 * if more events arrive immediately after.
 */
watch(
  () => logStore.items.length,
  (now, before) => {
    if (now <= (before ?? 0)) {
      return;
    }
    if (expanded.value || autoPeeking.value) {
      return;
    }
    if (hasPeekedThisSession()) {
      return;
    }
    // Brief reveal: expand, then collapse after PEEK_DURATION_MS.
    autoPeeking.value = true;
    expanded.value = true;
    // Don't mark "consumed" here — wait until the peek actually
    // collapses or the user takes over. If the page tears down
    // mid-peek (e.g. SDK reload), we'd rather give them another
    // chance on the next session.
    peekTimer = window.setTimeout(() => {
      peekTimer = null;
      // The user may have taken over (clicked to keep it expanded);
      // only revert if WE'RE still the one holding it open.
      if (autoPeeking.value) {
        autoPeeking.value = false;
        expanded.value = false;
      }
      markPeekConsumed();
    }, PEEK_DURATION_MS);
  },
  // Don't use `immediate: true` — at setup time the items array may
  // be empty or already populated by a prior session's hot reload;
  // either way we want to wait for the next ARRIVAL.
);

onUnmounted(() => {
  if (peekTimer !== null) {
    window.clearTimeout(peekTimer);
    peekTimer = null;
  }
  window.removeEventListener('resize', onViewportResize);
});
</script>

<style scoped lang="scss">
.event-dock {
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  z-index: 50;
  display: flex;
  flex-direction: column;
  background: #0f1115;
  // Slightly stronger separator than a plain 1px border — gives the
  // strip a faint upward "lifted" feel so it reads as an active
  // surface rather than a passive footer line. Tuned to be visible
  // on both white-ish and grey body backgrounds.
  border-top: 1px solid #1c1f27;
  box-shadow: 0 -1px 0 rgba(28, 102, 229, 0.06), 0 -6px 16px rgba(15, 17, 21, 0.06);
  flex-shrink: 0;
  // CSS transition for body height. The strip itself does not move;
  // only the body slides into / out of view.
  transition: height 0.18s ease;

  &--expanded {
    .event-dock__body {
      opacity: 1;
      pointer-events: auto;
    }
  }

  // Suppress body transitions during drag — otherwise the panel
  // "chases" the cursor with a 0.22s lag, making the resize feel
  // laggy and imprecise.
  &--resizing {
    .event-dock__body {
      transition: none;
    }
  }

  // When unread > 0 we paint a blue hairline along the top edge of
  // the dock. Subtle enough that it doesn't shout, distinctive enough
  // that peripheral vision picks it up — fixing the "easy to miss"
  // complaint without making the strip look like a notification bar.
  &--has-unread {
    box-shadow: inset 0 2px 0 0 #1c66e5, 0 -6px 16px rgba(28, 102, 229, 0.12);
  }

  // While the auto-peek is running we briefly raise the strip with a
  // soft drop shadow so newcomers' attention lands on the panel that
  // just slid into view.
  &--peeking {
    box-shadow: inset 0 2px 0 0 #1c66e5, 0 -8px 24px rgba(28, 102, 229, 0.2);
  }

  &__strip {
    display: flex;
    align-items: center;
    gap: 10px;
    width: 100%;
    height: 32px;
    padding: 0 16px;
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
    font-size: 13px;
    color: #c5cbd6;
    cursor: pointer;
    background: #1a1d24;
    border: none;
    text-align: left;
    transition: background-color 0.12s ease;

    &:hover { background: #20242d; }

    // Dark scrollbar (rarely visible — strip content usually fits —
    // but kept consistent with the EventLog panel so any future
    // overflow doesn't pop in with a light bar).
    scrollbar-width: thin;
    scrollbar-color: #2a2e38 transparent;
    overflow-x: auto;
    &::-webkit-scrollbar { height: 6px; }
    &::-webkit-scrollbar-track { background: transparent; }
    &::-webkit-scrollbar-thumb {
      background: #2a2e38;
      border-radius: 3px;
    }
  }

  // Live indicator dot — a small ring with a filled core, breathing
  // in and out. Two colour states: green (idle, "log is listening")
  // and blue (unread, matches the unread badge). The ring is drawn
  // with `box-shadow` so we don't need an extra DOM node.
  &__live-dot {
    flex-shrink: 0;
    width: 8px;
    height: 8px;
    background: #16a34a;
    border-radius: 50%;
    // Idle pulse keyframe uses a green expanding ring. The unread
    // variant swaps both the dot fill and the keyframe so the ring
    // colour stays consistent with the dot through the full breath
    // cycle (a single keyframe with hard-coded colour would briefly
    // flash green even in unread state).
    animation: event-dock-live-idle 2.2s ease-in-out infinite;

    &.is-unread {
      background: #1c66e5;
      animation: event-dock-live-unread 1.4s ease-in-out infinite;
    }
  }

  &__caret {
    display: inline-block;
    font-size: 10px;
    color: #9aa1ad;
    transition: transform 0.15s ease;

    &.is-up { transform: rotate(180deg); }
  }

  &__label {
    font-weight: 600;
    color: #e6e9ef;
  }

  &__total {
    padding: 0 6px;
    font-size: 10px;
    font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
    color: #9aa1ad;
    background: #2a2e38;
    border-radius: 8px;
  }

  // Unread badge — visually prominent so the operator notices new
  // events even when focused on a card. Pulses briefly on appearance
  // so a single isolated event doesn't go unnoticed.
  &__unread {
    padding: 0 7px;
    font-size: 10px;
    font-weight: 700;
    color: #fff;
    background: #1c66e5;
    border-radius: 999px;
    animation: event-dock-pulse 0.4s ease-out;
  }

  &__last {
    flex: 1;
    min-width: 0;
    overflow: hidden;
    white-space: nowrap;
    text-overflow: ellipsis;
    font-size: 11px;
    color: #9aa1ad;

    code {
      padding: 0 4px;
      font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
      font-size: 10px;
      color: #cdd3df;
      background: #2a2e38;
      border-radius: 3px;
    }
  }

  &__hint {
    flex-shrink: 0;
    margin-left: auto;
    font-size: 11px;
    color: #c5cbd6;
    transition: color 0.12s ease;
  }

  &__body {
    height: 0;
    opacity: 0;
    overflow: hidden;
    pointer-events: none;
    transition: height 0.22s ease, opacity 0.15s ease;
    // The inner EventLog provides its own dark surface; we don't add
    // extra background here.
    background: transparent;
  }

  // Inner sizer — fills the parent body so EventLog's own `height: 100%`
  // works. No fixed height here; the body element gets its height from
  // the inline style (drag-resizable).
  &__body-inner {
    height: 100%;
  }

  // Resize handle — thin grab bar at the very top edge of the dock
  // (above the strip when expanded). Wider hit area on hover so the
  // operator doesn't need pixel-precision to grab it.
  &__resizer {
    position: absolute;
    top: -3px;
    left: 0;
    right: 0;
    height: 6px;
    cursor: row-resize;
    z-index: 10;
    // Invisible by default — the dock's top border already serves as
    // a visual hint. On hover we show a subtle blue line so the
    // operator knows where the grab zone is.
    background: transparent;

    &:hover {
      background: rgba(28, 102, 229, 0.4);
    }

    // During active drag, keep the blue line visible.
    .event-dock--resizing & {
      background: rgba(28, 102, 229, 0.6);
    }
  }
}

// Global cursor override during drag — applied via body class.
:global(body.is-resizing-event-dock) {
  user-select: none;
  cursor: row-resize !important;
}

@keyframes event-dock-pulse {
  0% { transform: scale(0.6); opacity: 0.3; }
  60% { transform: scale(1.1); opacity: 1; }
  100% { transform: scale(1); opacity: 1; }
}

// Breathing pulse for the live indicator dot. Two keyframes — one
// green (idle, "log is listening") and one blue (unread, matches the
// unread badge) — so the expanding ring colour stays in sync with
// the dot fill across the full breath cycle. Slow when idle (2.2s)
// to read as calm background; faster when unread (1.4s, set on the
// element itself) to pull a bit more attention.
@keyframes event-dock-live-idle {
  0%   { box-shadow: 0 0 0 0 rgba(22, 163, 74, 0.45); }
  70%  { box-shadow: 0 0 0 8px rgba(22, 163, 74, 0); }
  100% { box-shadow: 0 0 0 0 rgba(22, 163, 74, 0); }
}

@keyframes event-dock-live-unread {
  0%   { box-shadow: 0 0 0 0 rgba(28, 102, 229, 0.55); }
  70%  { box-shadow: 0 0 0 10px rgba(28, 102, 229, 0); }
  100% { box-shadow: 0 0 0 0 rgba(28, 102, 229, 0); }
}
</style>
