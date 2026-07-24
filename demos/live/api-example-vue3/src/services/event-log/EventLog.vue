<template>
  <div class="event-log" :class="{ 'event-log--global': globalMode, 'event-log--bare': !showTitle }">
    <!--
      Header: two-row layout.
        Row 1 — title (with live dot + count badge) and action buttons.
        Row 2 — source filter chips (global mode only).
      The filter rail sits on its own line so it can scroll horizontally
      without wrapping or pushing the action buttons off-screen.
      `showTitle=false` hides the title row (used by GlobalEventLogDock
      which already shows its own "Event Log" strip label — rendering it
      twice would be visual noise).
    -->
    <div class="event-log__head">
      <!--
        Two layout shapes:
          - With title: title + actions on row 1, chips on row 2.
          - Without title (dock mode): chips and actions merged into a
            single toolbar row, mirroring the standard console pattern
            (Chrome DevTools, VS Code). Saves a row of vertical space.
        The chip list and action buttons are rendered once via named
        slots to avoid duplicating their markup across both branches.
      -->
      <template v-if="showTitle || !globalMode">
        <div class="event-log__head-top">
          <h3 v-if="showTitle" class="event-log__title">
            <span class="event-log__title-dot" aria-hidden="true" />
            {{ t('EventLog.Title') }}
            <span v-if="allCount > 0" class="event-log__title-count">{{ allCount }}</span>
          </h3>
          <!-- Action buttons slot -->
          <div class="event-log__actions">
            <button
              type="button"
              class="event-log__action"
              :disabled="allCount === 0"
              @click="onExport"
            >{{ t('EventLog.Export') }}</button>
            <button
              type="button"
              class="event-log__action event-log__action--danger"
              :disabled="allCount === 0"
              @click="onClear"
            >{{ t('EventLog.Clear') }}</button>
          </div>
        </div>
        <!-- Chip rail (global mode only, on its own row) -->
        <div v-if="globalMode" class="event-log__filter">
          <button
            v-for="opt in chipOptions"
            :key="opt.key"
            type="button"
            :class="['event-log__chip', { 'is-active': activeSource === opt.key }]"
            @click="activeSource = opt.key"
          >
            {{ opt.label }}
            <span class="event-log__chip-count">{{ opt.count }}</span>
          </button>
        </div>
      </template>

      <div v-else class="event-log__toolbar">
        <!-- Chip rail + actions merged into one row (dock mode) -->
        <div class="event-log__filter">
          <button
            v-for="opt in chipOptions"
            :key="opt.key"
            type="button"
            :class="['event-log__chip', { 'is-active': activeSource === opt.key }]"
            @click="activeSource = opt.key"
          >
            {{ opt.label }}
            <span class="event-log__chip-count">{{ opt.count }}</span>
          </button>
        </div>
        <div class="event-log__actions">
          <button
            type="button"
            class="event-log__action"
            :disabled="allCount === 0"
            @click="onExport"
          >{{ t('EventLog.Export') }}</button>
          <button
            type="button"
            class="event-log__action event-log__action--danger"
            :disabled="allCount === 0"
            @click="onClear"
          >{{ t('EventLog.Clear') }}</button>
        </div>
      </div>
    </div>
    <div class="event-log__body">
      <div v-if="visibleEntries.length === 0" class="event-log__empty">
        <span class="event-log__empty-icon" aria-hidden="true">📭</span>
        <p class="event-log__empty-text">{{ t('EventLog.Empty') }}</p>
      </div>
      <ul v-else class="event-log__list">
        <li
          v-for="entry in visibleEntries"
          :key="entry.id"
          :class="['event-log__item', `is-${entry.level}`]"
        >
          <div class="event-log__item-head">
            <span class="event-log__time">{{ formatTime(entry.ts) }}</span>
            <!--
              In global mode we surface the source slug on every line so
              mixed-source streams stay legible. In legacy per-card mode
              the section title alone already disambiguates.
            -->
            <span v-if="globalMode" class="event-log__source">{{ entry.source }}</span>
            <span v-if="entry.role" :class="['event-log__role', `role-${entry.role}`]">
              {{ entry.role }}
            </span>
            <span class="event-log__event">{{ entry.event }}</span>
          </div>
          <pre v-if="entry.payload !== undefined" class="event-log__payload">{{ stringify(entry.payload) }}</pre>
        </li>
      </ul>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onUnmounted, ref, watch } from 'vue';
import { useUIKit } from '@tencentcloud/uikit-base-component-vue3';
import { logStore, clearLogs, exportLogs } from './store';

const { t } = useUIKit();

const props = defineProps<{
  /**
   * Legacy per-card mode: only show entries for this group slug. Used
   * when `EventLog` is rendered inside an ExampleCard (no longer the
   * primary usage — the global dock at the bottom of App now hosts a
   * single shared instance — but kept so isolated usages keep working).
   */
  source?: string;
  /** Optional whitelist of event names. Only consulted in per-card mode. */
  events?: string[];
  /**
   * Switch on multi-source rendering: show every entry across all
   * groups, expose a source filter chip set, and surface the source
   * slug on each row. Used by `GlobalEventLogDock`.
   */
  globalMode?: boolean;
  /**
   * Whether to render the title row ("Event Log" + count badge). The
   * global dock already shows its own strip title, so it passes
   * `false` to avoid rendering the same label twice. Per-card usage
   * keeps the title for clarity.
   */
  showTitle?: boolean;
}>();

/**
 * Active filter for global mode. Empty string means "show all".
 * Kept as plain ref (vs. routing through localStorage) because the
 * dock collapses/expands frequently and persisting the choice across
 * sessions doesn't carry obvious user benefit — the operator usually
 * wants to start each session with the broad view.
 */
const activeSource = ref('');

/**
 * Buckets of `{source -> entryCount}` rendered as chips in global
 * mode.
 *
 * Why debounced state (vs. a plain `computed`):
 *   The underlying scan is cheap (~500 entries, microsecond-range),
 *   so cost was never the issue. The visual problem with re-running
 *   on every push is **chip-rail flicker** when high-frequency
 *   subscriptions arrive in quick succession — the sort order can
 *   shift mid-burst and chips visibly jiggle around. Buffering the
 *   recomputation to a trailing edge (60ms) merges any burst of
 *   pushes into a single chip-rail update without affecting the
 *   list body (which is its own `computed` further down).
 *
 *   60ms was picked to be:
 *     - Long enough to coalesce a typical SDK event burst (10-30
 *       events arriving within a few frames during a stream-state
 *       transition);
 *     - Short enough that a single user-driven click → event chain
 *       still settles within one visual frame after the event lands.
 *
 *   We seed the value synchronously at setup time so the chips
 *   appear on the first paint without waiting for the debounce
 *   window — the lag only kicks in for subsequent updates.
 */
type SourceOption = { source: string; count: number };

function computeSourceOptions(): SourceOption[] {
  if (!props.globalMode) {
    return [];
  }
  const counts = new Map<string, number>();
  for (const entry of logStore.items) {
    counts.set(entry.source, (counts.get(entry.source) || 0) + 1);
  }
  // Sort by count desc so the busiest group appears first — closer to
  // what the operator likely cares about in a fresh session.
  return Array.from(counts.entries())
    .map(([source, count]) => ({ source, count }))
    .sort((a, b) => b.count - a.count);
}

const SOURCE_OPTIONS_DEBOUNCE_MS = 60;

const sourceOptions = ref<SourceOption[]>(computeSourceOptions());
let sourceOptionsTimer: number | null = null;

watch(
  // Re-trigger on any items array change. `length` alone misses
  // clears-followed-by-refill that happen to land at the same
  // length, but those are rare and the trailing edge would still
  // fire on the next push. Using `() => logStore.items[0]?.id`
  // here would similarly miss updates where the head id stays
  // pinned — `length` is the simplest stable signal.
  () => logStore.items.length,
  () => {
    if (sourceOptionsTimer !== null) {
      window.clearTimeout(sourceOptionsTimer);
    }
    sourceOptionsTimer = window.setTimeout(() => {
      sourceOptionsTimer = null;
      sourceOptions.value = computeSourceOptions();
    }, SOURCE_OPTIONS_DEBOUNCE_MS);
  },
);

// When `globalMode` flips at runtime (e.g. someone reuses the
// component in another context), recompute immediately so the chip
// set reflects the new mode without waiting for the next push.
watch(
  () => props.globalMode,
  () => {
    sourceOptions.value = computeSourceOptions();
  },
);

onUnmounted(() => {
  if (sourceOptionsTimer !== null) {
    window.clearTimeout(sourceOptionsTimer);
    sourceOptionsTimer = null;
  }
});

const allCount = computed(() => logStore.items.length);

/**
 * Chip rail entries — always starts with the "All" entry (key = '')
 * followed by per-source buckets. The "All" label is i18n'd; source
 * slugs are passed through as-is (they're API hook names like
 * `live-list` which the operator is already familiar with).
 */
const chipOptions = computed(() => [
  { key: '', label: t('EventLog.All'), count: allCount.value },
  ...sourceOptions.value.map((opt) => ({ key: opt.source, label: opt.source, count: opt.count })),
]);

const visibleEntries = computed(() => {
  if (props.globalMode) {
    if (!activeSource.value) {
      return logStore.items;
    }
    return logStore.items.filter(e => e.source === activeSource.value);
  }
  // Per-card legacy filter.
  return logStore.items.filter((entry) => {
    if (entry.source !== props.source) {
      return false;
    }
    if (props.events && props.events.length > 0 && entry.level === 'event') {
      return props.events.includes(entry.event);
    }
    return true;
  });
});

function formatTime(ts: number): string {
  const d = new Date(ts);
  return d.toLocaleTimeString('zh-CN', { hour12: false }) + '.' + String(d.getMilliseconds()).padStart(3, '0');
}

function stringify(payload: unknown): string {
  try {
    return JSON.stringify(payload, null, 2);
  } catch {
    return String(payload);
  }
}

/**
 * Clear semantics differ by mode:
 *   - Per-card: scope the clear to the card's source so other groups'
 *     logs stay intact (matches the original card-bound expectation).
 *   - Global: clear whatever the operator is currently looking at —
 *     either the active source filter or the whole log if no filter.
 */
function onClear(): void {
  if (props.globalMode) {
    clearLogs(activeSource.value || undefined);
  } else {
    clearLogs(props.source);
  }
}

function onExport(): void {
  const scope = props.globalMode ? (activeSource.value || undefined) : props.source;
  const blob = new Blob([exportLogs(scope)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${scope || 'all'}-events.json`;
  a.click();
  URL.revokeObjectURL(url);
}
</script>

<style scoped lang="scss">
.event-log {
  display: flex;
  flex-direction: column;
  height: 100%;
  min-height: 160px;
  background: #0f1115;
  border-radius: 8px;
  overflow: hidden;

  &__head {
    display: flex;
    flex-direction: column;
    gap: 10px;
    padding: 12px 14px;
    background: #15181f;
    border-bottom: 1px solid #1c1f27;
  }

  // Merged toolbar row (dock mode): filter rail + actions share a line.
  // The filter takes the remaining space and scrolls, actions anchor
  // to the right. Reduces the header from 2 rows to 1.
  &__toolbar {
    display: flex;
    align-items: center;
    gap: 10px;
    min-width: 0;
  }

  &__head-top {
    display: flex;
    align-items: center;
    gap: 12px;
  }

  &__title {
    display: flex;
    align-items: center;
    gap: 8px;
    margin: 0;
    font-size: 13px;
    font-weight: 600;
    color: #e6e9ef;
    letter-spacing: 0.01em;
  }

  &__title-dot {
    width: 6px;
    height: 6px;
    background: #16a34a;
    border-radius: 50%;
    box-shadow: 0 0 0 3px rgba(22, 163, 74, 0.18);
    flex-shrink: 0;
  }

  &__title-count {
    padding: 1px 7px;
    font-size: 10px;
    font-weight: 600;
    font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
    color: #9aa1ad;
    background: #2a2e38;
    border-radius: 8px;
  }

  // Filter chip rail. In global mode this is the primary navigation
  // surface — sits on its own row below the title so it can scroll
  // horizontally without wrapping or pushing the action buttons.
  &__filter {
    display: flex;
    flex: 1;
    gap: 5px;
    overflow-x: auto;
    scrollbar-width: none;
    min-width: 0;

    &::-webkit-scrollbar { display: none; }
  }

  &__chip {
    display: inline-flex;
    align-items: center;
    gap: 5px;
    flex-shrink: 0;
    padding: 3px 10px;
    font-size: 11px;
    font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
    line-height: 1.5;
    color: #c5cbd6;
    cursor: pointer;
    background: #2a2e38;
    border: 1px solid transparent;
    border-radius: 999px;
    transition: background-color 0.12s ease, color 0.12s ease, border-color 0.12s ease;

    &:hover {
      color: #fff;
      background: #353a47;
    }

    &.is-active {
      color: #fff;
      background: #1c66e5;
      border-color: #1c66e5;
    }
  }

  &__chip-count {
    padding: 0 5px;
    font-size: 10px;
    font-weight: 600;
    color: inherit;
    background: rgba(255, 255, 255, 0.16);
    border-radius: 8px;
  }

  &__actions {
    display: flex;
    gap: 6px;
    margin-left: auto;
    flex-shrink: 0;
  }

  // Action buttons — pill-shaped with a subtle hover lift. Disabled
  // state is fully de-emphasised so the buttons don't look interactive
  // when the log is empty.
  &__action {
    height: 26px;
    padding: 0 10px;
    font-size: 11px;
    font-weight: 500;
    color: #c5cbd6;
    cursor: pointer;
    background: #2a2e38;
    border: 1px solid transparent;
    border-radius: 6px;
    transition: background-color 0.12s ease, color 0.12s ease, border-color 0.12s ease;

    &:hover:not(:disabled) {
      color: #fff;
      background: #353a47;
    }

    &:focus-visible {
      outline: 2px solid #1c66e5;
      outline-offset: 2px;
    }

    &:disabled {
      color: #6b7280;
      cursor: not-allowed;
      background: #1f2230;
    }

    &--danger {
      &:hover:not(:disabled) {
        color: #ffb4b4;
        background: #3a1f24;
        border-color: rgba(248, 113, 113, 0.3);
      }
    }
  }

  &__body {
    flex: 1;
    padding: 8px 14px;
    overflow: auto;
    // Dark-themed scrollbar to match the panel — the default light
    // bar would clash with the dark chrome and draw the eye away
    // from the log content. `thin` keeps it unobtrusive; the thumb
    // uses the same surface elevation as our buttons so it sits in
    // the same visual hierarchy.
    scrollbar-width: thin;
    scrollbar-color: #2a2e38 transparent;

    &::-webkit-scrollbar {
      width: 8px;
      height: 8px;
    }
    &::-webkit-scrollbar-track {
      background: transparent;
    }
    &::-webkit-scrollbar-thumb {
      background: #2a2e38;
      border-radius: 4px;
      // Padding via a transparent border so the thumb doesn't touch
      // the edge of the track — matches the look of native macOS
      // "overlay" scrollbars and keeps the grip visually centred.
      border: 2px solid transparent;
      background-clip: padding-box;

      &:hover { background: #3a3f4d; background-clip: padding-box; }
    }
    &::-webkit-scrollbar-corner { background: transparent; }
  }

  // Empty state — centred icon + text so the panel doesn't look
  // broken when there's nothing to show yet.
  &__empty {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 8px;
    height: 100%;
    min-height: 80px;
    color: #4b5563;
  }

  &__empty-icon {
    font-size: 28px;
    opacity: 0.5;
  }

  &__empty-text {
    margin: 0;
    font-size: 12px;
    text-align: center;
  }

  &__list {
    margin: 0;
    padding: 0;
    list-style: none;
  }

  // Each log entry — a card-like row with its own background and
  // border so entries are visually separable even when payloads are
  // absent (single-line entries would otherwise merge into a wall of
  // text with just bottom borders).
  &__item {
    padding: 8px 10px;
    margin-bottom: 4px;
    font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
    font-size: 12px;
    line-height: 1.5;
    color: #cdd3df;
    background: #15181f;
    border: 1px solid #1c1f27;
    border-radius: 6px;
    transition: border-color 0.12s ease;

    &:hover {
      border-color: #2a2e38;
    }

    &.is-error {
      border-left: 3px solid #ef4444;
      .event-log__event { color: #ff7a7a; }
    }

    &.is-call {
      border-left: 3px solid #3b82f6;
      .event-log__event { color: #7ab8ff; }
    }

    &.is-event {
      border-left: 3px solid #1c1f27;
    }
  }

  &__item-head {
    display: flex;
    align-items: center;
    gap: 6px;
    flex-wrap: wrap;
  }

  &__time {
    color: #6b7280;
    font-size: 11px;
    flex-shrink: 0;
  }

  // Source slug pill (global mode only). Visually subdued so the role
  // pill remains the most eye-catching mark on each row.
  &__source {
    flex-shrink: 0;
    padding: 1px 6px;
    font-size: 10px;
    color: #9aa1ad;
    background: #1f2230;
    border-radius: 4px;
  }

  &__role {
    flex-shrink: 0;
    padding: 1px 6px;
    font-size: 10px;
    border-radius: 4px;

    &.role-host { background: #5b3bdb; color: #fff; }
    &.role-audience { background: #2563eb; color: #fff; }
    &.role-admin { background: #d97706; color: #fff; }
  }

  &__event {
    font-weight: 600;
    color: #e6e9ef;
  }

  &__payload {
    margin: 6px 0 0;
    padding: 8px 10px;
    font-size: 11px;
    line-height: 1.5;
    color: #9aa4b2;
    white-space: pre-wrap;
    word-break: break-all;
    background: #0f1115;
    border: 1px solid #1c1f27;
    border-radius: 4px;
  }
}
</style>
