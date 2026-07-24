<template>
  <div class="inspector">
    <div v-if="view.live !== false" class="inspector__live">
      <span class="inspector__live-dot">●</span>
    </div>

    <!--
      Flattened: every row across all groups renders as
      `variableName : humanizedValue`. Using the raw snapshot key as the
      label keeps the panel language-neutral (no per-field i18n) and makes
      the old "原始 JSON" dump redundant, so it was removed.
    -->
    <div
      v-for="row in rows"
      :key="row.key"
      class="inspector__row"
      :class="{ 'is-flash': flash[row.key] }"
    >
      <span class="inspector__label">{{ row.key }}</span>
      <span class="inspector__value">
        <span
          v-if="cell(row.key).dot !== 'none'"
          class="inspector__dot"
          :class="`inspector__dot--${cell(row.key).dot}`"
        ></span>
        <span class="inspector__text">{{ cell(row.key).text }}</span>
        <span
          v-if="cell(row.key).bar != null"
          class="inspector__bar"
        ><span
          class="inspector__bar-fill"
          :style="{ width: `${cell(row.key).bar}%` }"
        ></span></span>
        <span
          v-if="cell(row.key).previewItems.length"
          class="inspector__preview"
        >
          <span
            v-for="(item, ii) in cell(row.key).previewItems"
            :key="ii"
            class="inspector__chip"
          >{{ previewLabel(item) }}</span>
        </span>
      </span>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onUnmounted, ref, watch } from 'vue';
import { i18next, useUIKit } from '@tencentcloud/uikit-base-component-vue3';
import type { StateFieldDef, StateViewDef } from '../types';
import { ui as enText } from '../../i18n/en-US/ui';
import { ui as zhText } from '../../i18n/zh-CN/ui';

const props = defineProps<{
  /** The live snapshot object produced by the card's `run()` (a ref'd object). */
  model: Record<string, unknown> | null;
  /** Declarative schema describing how to render `model`. */
  view: StateViewDef;
}>();

useUIKit(); // ensures UIKit context is initialized (safe no-op otherwise)

// Force-recompute key: increments on every i18next `languageChanged`
// event. The `cells` computed reads this ref to establish a reactive
// dependency on the language, so the computed re-evaluates when the
// demo's language toggle fires the event.
const langVersion = ref(0);
function onLangChanged(): void {
  langVersion.value++;
}
i18next.on('languageChanged', onLangChanged);
onUnmounted(() => {
  i18next.off('languageChanged', onLangChanged);
});

// Direct lookup that bypasses the SDK's t() function. The SDK's t() is
// routed through a separate i18next instance (i18nextInnerInstance) whose
// language ref is not updated when the demo toggles the language. The
// demo's own i18next instance is the source of truth here.
function tLocal(key: string, defaultValue: string): string {
  const lang = i18next.language || 'en-US';
  const bundle = lang.startsWith('zh') ? zhText : enText;
  return bundle[key] ?? defaultValue;
}

interface Cell {
  text: string;
  dot: 'on' | 'off' | 'none';
  /** 0-100 fill for the volume bar, or null. */
  bar: number | null;
  previewItems: unknown[];
}

/** Read a snapshot key, tolerating an absent model. */
function read(row: StateFieldDef): unknown {
  return props.model ? props.model[row.key] : undefined;
}

/** Map one row's raw value to a humanized cell. */
function renderCell(row: StateFieldDef): Cell {
  const v = read(row);
  switch (row.kind) {
    case 'enum': {
      const name = row.enumRef ? row.enumRef[String(v as string | number)] : undefined;
      // Enum member names (e.g. "LOGINED", "On", "Connected") are English
      // TS identifiers by nature. Localize them via `State.Enum.<Name>`
      // when a translation exists; otherwise fall back to the raw name
      // so untranslated enums still render something meaningful.
      const label = typeof name === 'string'
        ? tLocal(`State.Enum.${name}`, name)
        : v == null ? tLocal('State.Empty', '(empty)') : String(v);
      const on = v === row.onValue;
      return { text: `${label} (${String(v)})`, dot: on ? 'on' : 'off', bar: null, previewItems: [] };
    }
    case 'bool': {
      const on = row.onValue !== undefined ? v === row.onValue : v === true;
      return { text: on ? tLocal('State.On', 'On') : tLocal('State.Off', 'Off'), dot: on ? 'on' : 'off', bar: null, previewItems: [] };
    }
    case 'count': {
      const n = Number(v) || 0;
      return {
        text: tLocal('State.Count', '{{count}}').replace('{{count}}', String(n)),
        dot: n > 0 ? 'on' : 'off',
        bar: null,
        previewItems: [],
      };
    }
    case 'volume': {
      const n = Number(v) || 0;
      return { text: `${n} / 100`, dot: n > 0 ? 'on' : 'off', bar: n, previewItems: [] };
    }
    case 'list': {
      const arr = Array.isArray(v) ? v : [];
      const preview = row.preview ?? 3;
      return {
        text: tLocal('State.Count', '{{count}}').replace('{{count}}', String(arr.length)),
        dot: arr.length > 0 ? 'on' : 'off',
        bar: null,
        previewItems: arr.slice(0, preview),
      };
    }
    case 'text':
      return {
        text: v == null || v === '' ? tLocal('State.Empty', '(empty)') : String(v),
        dot: 'none',
        bar: null,
        previewItems: [],
      };
    case 'custom': {
      // Support the same on/off dot semantics as `enum` when the row
      // declares an `onValue` (e.g. loginStatus overriding `enum` to
      // customize its "not logged in" label while keeping the dot).
      const dot = row.onValue !== undefined ? (v === row.onValue ? 'on' : 'off') : 'none';
      return {
        text: row.format ? row.format(v, tLocal as any) : String(v),
        dot,
        bar: null,
        previewItems: [],
      };
    }
    default:
      return { text: String(v), dot: 'none', bar: null, previewItems: [] };
  }
}

/** All rows flattened across groups, in declaration order. */
const rows = computed<StateFieldDef[]>(() =>
  props.view.groups.reduce<StateFieldDef[]>((acc, g) => acc.concat(g.rows), []),
);

const cells = computed<Record<string, Cell>>(() => {
  // Establish a reactive dependency on langVersion so the computed
  // re-runs every time the demo's language toggle fires `languageChanged`.
  void langVersion.value;
  const map: Record<string, Cell> = {};
  for (const r of rows.value) {
    map[r.key] = renderCell(r);
  }
  return map;
});

/** Template helper: safe lookup that never returns undefined. */
function cell(key: string): Cell {
  return cells.value[key] ?? { text: tLocal('State.Empty', '(empty)'), dot: 'none', bar: null, previewItems: [] };
}

/** One-line label for a list item (user / live / label field, else JSON). */
function previewLabel(item: unknown): string {
  if (item && typeof item === 'object') {
    const o = item as Record<string, unknown>;
    // `sender` covers barrage items (a display name); `text` is the final
    // fallback for any message-like shape without an explicit id.
    return String(
      o.userName ?? o.sender ?? o.userId ?? o.liveId ?? o.label ?? o.name ?? o.text ?? JSON.stringify(item),
    );
  }
  return String(item);
}

/**
 * Change-flash: when a rendered value changes between watchEffect ticks,
 * briefly highlight its row so the operator can SEE the state is live,
 * not a frozen snapshot. Compares the previous vs current `cells` map
 * (text form) and flashes only the rows whose text actually moved.
 */
const flash = ref<Record<string, number>>({});
let prevSig = '';
watch(
  cells,
  (now) => {
    const sig = JSON.stringify(now);
    if (!prevSig) {
      prevSig = sig;
      return;
    }
    if (sig === prevSig) {
      return;
    }
    const prev = JSON.parse(prevSig) as Record<string, Cell>;
    for (const k of Object.keys(now)) {
      if (prev[k] && prev[k].text !== now[k].text) {
        flash.value = { ...flash.value, [k]: Date.now() };
        const key = k;
        setTimeout(() => {
          const next = { ...flash.value };
          delete next[key];
          flash.value = next;
        }, 800);
      }
    }
    prevSig = sig;
  },
  { deep: false },
);
</script>

<style scoped lang="scss">
.inspector {
  display: flex;
  flex-direction: column;
  gap: 12px;
  font-size: 13px;

  &__live {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    align-self: flex-start;
    padding: 2px 10px;
    font-size: 11px;
    font-weight: 600;
    color: #047857;
    background: #ecfdf5;
    border: 1px solid #a7f3d0;
    border-radius: 10px;
  }

  &__live-dot {
    font-size: 9px;
    color: #10b981;
    animation: state-pulse 1.6s ease-in-out infinite;
  }

  &__row {
    display: flex;
    align-items: center;
    gap: 10px;
    padding: 7px 12px;
    border-bottom: 1px solid #f3f4f6;

    &:last-child {
      border-bottom: none;
    }

    // Reuse the amber flash already used by form auto-fill so a "value
    // just changed" cue reads consistently across the card.
    &.is-flash {
      background-color: #fef9c3;
      transition: background-color 0.1s ease;
    }
  }

  &__label {
    flex: 0 0 120px;
    min-width: 0;
    overflow-wrap: anywhere;
    color: #6b7280;
  }

  &__value {
    display: flex;
    align-items: center;
    flex-wrap: wrap;
    gap: 8px;
    min-width: 0;
    color: #1f2937;
    font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
  }

  &__dot {
    flex-shrink: 0;
    width: 8px;
    height: 8px;
    border-radius: 50%;
    background: #9ca3af;

    &--on {
      background: #10b981;
      box-shadow: 0 0 0 3px rgba(16, 185, 129, 0.18);
    }

    &--off {
      background: #d1d5db;
    }
  }

  &__bar {
    flex: 0 0 80px;
    height: 6px;
    background: #eceef1;
    border-radius: 3px;
    overflow: hidden;
  }

  &__bar-fill {
    display: block;
    height: 100%;
    background: #1c66e5;
  }

  &__preview {
    display: inline-flex;
    flex-wrap: wrap;
    gap: 4px;
  }

  &__chip {
    padding: 0 6px;
    font-size: 11px;
    color: #374151;
    background: #f3f4f6;
    border-radius: 4px;
  }

}

@keyframes state-pulse {
  0%,
  100% {
    opacity: 1;
  }
  50% {
    opacity: 0.4;
  }
}
</style>
