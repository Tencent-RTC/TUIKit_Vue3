<template>
  <!--
    Custom dropdown for `type: 'pretty-select'` fields.

    Why this component exists (see FieldDef.type in types.ts):
      1. Native <select> on macOS Chrome/Safari flips the popup
         UPWARD when downward space is tight, and the current
         option ends up overlaying the anchor. Uncontrollable
         via CSS — see the "dropdown covers its own box"
         screenshot that motivated this component.
      2. Native <option> can only carry a single text run, so
         enums with useful subtitles (seatTemplate: enum name
         + "竖屏 · 9 麦位") have to smash both into one line.
      3. `rich-select` is always-open (a persistent grid) and
         wants an iconUrl per option, which is overkill for
         text-only enums.

    Behaviour contract:
      - Collapsed state renders as an input-shaped button that
        shows the currently selected option's label.
      - Clicking the button toggles a popup panel positioned
        BELOW the button (`position: absolute; top: 100%`).
        The panel never overlays the anchor.
      - Panel items render `opt.label` on the top line and
        `opt.meta` on a lighter second line (optional).
      - ESC closes the panel; ↑/↓ move the highlight; Enter
        commits the highlighted option; clicking outside the
        component closes without changing the value.
      - Emits `update:modelValue` on selection so a parent
        can `v-model` it uniformly with the other field
        renderers.
  -->
  <div
    ref="rootRef"
    class="pretty-select"
    :class="{ 'is-open': open }"
    @keydown.esc.stop.prevent="close"
    @keydown.down.prevent="onArrow(1)"
    @keydown.up.prevent="onArrow(-1)"
    @keydown.enter.prevent="commitHighlight"
  >
    <button
      ref="anchorRef"
      type="button"
      class="pretty-select__anchor"
      :aria-haspopup="'listbox'"
      :aria-expanded="open"
      :aria-label="ariaLabel"
      @click.stop.prevent="toggle"
    >
      <span class="pretty-select__anchor-text">{{ selectedLabel || placeholderText }}</span>
      <span class="pretty-select__caret" aria-hidden="true">▾</span>
    </button>

    <!--
      Popup panel is a sibling of the anchor, absolutely positioned
      below it. `v-show` (not `v-if`) keeps the DOM warm so we can
      focus / scroll into view synchronously the first time the
      user opens it.
    -->
    <ul
      v-show="open"
      ref="listRef"
      class="pretty-select__panel"
      role="listbox"
      :aria-label="ariaLabel"
    >
      <li
        v-for="(opt, idx) in options"
        :key="String(opt.value)"
        role="option"
        :aria-selected="opt.value === modelValue"
        :class="[
          'pretty-select__item',
          {
            'is-active': opt.value === modelValue,
            'is-highlight': idx === highlightIdx,
          },
        ]"
        @mousedown.prevent="onPick(opt)"
        @mouseenter="highlightIdx = idx"
      >
        <span class="pretty-select__item-label">{{ optLabel(opt) }}</span>
        <span v-if="optMeta(opt)" class="pretty-select__item-meta">{{ optMeta(opt) }}</span>
      </li>
    </ul>
  </div>
</template>

<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue';
import { useUIKit } from '@tencentcloud/uikit-base-component-vue3';
import type { FieldOption } from '../types';

const { t } = useUIKit();

const props = defineProps<{
  modelValue: unknown;
  options: FieldOption[];
  /** For screen readers — usually the field label ("seatTemplate"). */
  ariaLabel?: string;
  /** Fallback text when nothing is selected. */
  placeholder?: string;
  /**
   * i18n key prefix for per-option label + meta. When provided, an
   * option's label is resolved via `t(`${keyPrefix}Opt${opt.value}`, opt.label)`
   * and its meta via `t(`${keyPrefix}Opt${opt.value}Meta`, opt.meta)`, so enum
   * choices can be localized (each falls back to its static string when the key
   * is absent). Mirrors how `rich-select` already resolves option label/meta
   * via `cardKey(..., \`Field${key}Opt${value}[Meta]\`)`. Omit to render
   * `opt.label` / `opt.meta` verbatim.
   *
   * Note: an empty-string option `value` yields the bare
   * `${keyPrefix}Opt` key (no number suffix) — use that for a single
   * placeholder option (e.g. the "waiting for resolutionList" hint).
   */
  keyPrefix?: string;
}>();

/** Resolve an option's label: localized if a key prefix was given, else the static string. */
function optLabel(opt: FieldOption): string {
  if (props.keyPrefix) {
    return t(`${props.keyPrefix}Opt${String(opt.value)}`, opt.label ?? '');
  }
  return opt.label ?? '';
}

/** Resolve an option's meta line: localized if a key prefix was given, else the static string. */
function optMeta(opt: FieldOption): string {
  if (props.keyPrefix) {
    return t(`${props.keyPrefix}Opt${String(opt.value)}Meta`, opt.meta ?? '');
  }
  return opt.meta ?? '';
}

const emit = defineEmits<{
  (e: 'update:modelValue', value: unknown): void;
}>();

const rootRef = ref<HTMLElement | null>(null);
const anchorRef = ref<HTMLButtonElement | null>(null);
const listRef = ref<HTMLUListElement | null>(null);
const open = ref(false);
const highlightIdx = ref(-1);

const selectedLabel = computed(() => {
  const match = props.options.find(o => o.value === props.modelValue);
  return match ? optLabel(match) : '';
});

const placeholderText = computed(() => props.placeholder || t('Card.PleaseSelect', '请选择'));

function toggle(): void {
  open.value ? close() : openPanel();
}

function openPanel(): void {
  open.value = true;
  // Highlight the currently-selected option (or the first) so
  // ↑/↓/Enter operate from a sensible anchor. -1 fallback keeps
  // "nothing highlighted" a valid state when the model doesn't
  // match any option (e.g. an empty default before hydration).
  const idx = props.options.findIndex(o => o.value === props.modelValue);
  highlightIdx.value = idx >= 0 ? idx : 0;
}

function close(): void {
  if (!open.value) {
    return;
  }
  open.value = false;
  // Return focus to the anchor so tab order stays intact after ESC.
  anchorRef.value?.focus();
}

function onPick(opt: FieldOption): void {
  emit('update:modelValue', opt.value);
  close();
}

function onArrow(delta: number): void {
  if (!open.value) {
    openPanel();
    return;
  }
  const n = props.options.length;
  if (n === 0) {
    return;
  }
  // Wrap around at both ends so keyboard traversal has no dead
  // stop — matches native <select>'s behaviour once the popup is
  // open. `(x + n) % n` handles negative delta cleanly.
  highlightIdx.value = (highlightIdx.value + delta + n) % n;
}

function commitHighlight(): void {
  if (!open.value) {
    openPanel();
    return;
  }
  const opt = props.options[highlightIdx.value];
  if (opt) {
    onPick(opt);
  }
}

/**
 * Close the panel when the user clicks anywhere outside the
 * component. Bound at document capture phase so nested handlers
 * (e.g. a card-level click) don't swallow it first.
 */
function onDocMouseDown(e: MouseEvent): void {
  if (!open.value) {
    return;
  }
  const root = rootRef.value;
  if (root && e.target instanceof Node && !root.contains(e.target)) {
    open.value = false;
  }
}

onMounted(() => {
  document.addEventListener('mousedown', onDocMouseDown, true);
});
onBeforeUnmount(() => {
  document.removeEventListener('mousedown', onDocMouseDown, true);
});

/**
 * When the panel opens, ensure the highlighted option is in view.
 * Also resets highlight when the option list changes (thunk-form
 * options that repopulate at runtime, e.g. resolutionList).
 */
watch(open, (isOpen) => {
  if (!isOpen) {
    return;
  }
  // Defer to next frame so the panel has actually rendered.
  requestAnimationFrame(() => {
    const list = listRef.value;
    if (!list) {
      return;
    }
    const el = list.children[highlightIdx.value] as HTMLElement | undefined;
    el?.scrollIntoView({ block: 'nearest' });
  });
});
</script>

<style scoped lang="scss">
.pretty-select {
  position: relative;

  &__anchor {
    // Deliberately mirror the .field <input> styling so a
    // pretty-select field visually reads as a normal input.
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 6px;
    width: 100%;
    height: 32px;
    padding: 0 8px;
    font-size: 13px;
    color: #1f2937;
    text-align: left;
    background: #fff;
    border: 1px solid #d1d5db;
    border-radius: 6px;
    cursor: pointer;
    transition: border-color 0.15s ease, box-shadow 0.15s ease;

    &:hover { border-color: #9ca3af; }

    &:focus,
    &:focus-visible {
      outline: none;
      border-color: #1c66e5;
      box-shadow: 0 0 0 3px rgba(28, 102, 229, 0.15);
    }
  }

  &__anchor-text {
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    flex: 1 1 auto;
  }

  &__caret {
    flex: 0 0 auto;
    font-size: 10px;
    color: #6b7280;
    transition: transform 0.15s ease;
  }

  &.is-open &__caret {
    transform: rotate(180deg);
  }

  &__panel {
    // Absolutely positioned right below the anchor so it never
    // overlays the anchor itself. `z-index` is nominal — cards
    // are on a plain white surface with no other overlays at
    // this depth, but keep it explicit to future-proof against
    // sticky headers or floating action bars.
    position: absolute;
    top: calc(100% + 4px);
    left: 0;
    right: 0;
    z-index: 20;
    max-height: 260px;
    overflow-y: auto;
    padding: 4px;
    margin: 0;
    list-style: none;
    background: #fff;
    border: 1px solid #e5e7eb;
    border-radius: 8px;
    box-shadow: 0 10px 24px rgba(15, 23, 42, 0.1),
                0 2px 6px rgba(15, 23, 42, 0.06);
  }

  &__item {
    display: flex;
    flex-direction: column;
    gap: 2px;
    padding: 8px 10px;
    border-radius: 6px;
    cursor: pointer;
    transition: background-color 0.1s ease;

    &.is-highlight { background: #f3f4f6; }

    &.is-active {
      background: #eef4ff;
      // Slightly stronger tone when the option is BOTH the current
      // model value AND keyboard-highlighted, so users see where
      // they are without losing the "this is what's selected" cue.
      &.is-highlight { background: #e0eaff; }
    }
  }

  &__item-label {
    font-size: 13px;
    color: #111827;
    line-height: 1.35;
  }

  &__item-meta {
    font-size: 11px;
    color: #6b7280;
    line-height: 1.4;
  }
}
</style>
