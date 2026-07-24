<template>
  <section v-if="intro" class="group-intro">
    <!-- Collapsed header bar: always visible, click to toggle -->
    <button
      type="button"
      class="group-intro__bar"
      :aria-expanded="expanded"
      @click="expanded = !expanded"
    >
      <span class="group-intro__icon" aria-hidden="true">
        <!-- Info / lightbulb icon (inline SVG, no external dependency) -->
        <svg viewBox="0 0 16 16" width="16" height="16" fill="currentColor">
          <path d="M8 0a8 8 0 110 16A8 8 0 018 0zm.75 11.5v1.25h-1.5V11.5h1.5zM8 2a4.5 4.5 0 00-4.5 4.5c0 1.38.66 2.57 1.68 3.36l.32.24v1.15h5v-1.15l.32-.24A4.48 4.48 0 0012.5 6.5 4.5 4.5 0 008 2z" />
        </svg>
      </span>
      <span class="group-intro__label">{{ t('Card.GroupIntroLabel', 'Note') }}</span>
      <span class="group-intro__summary">{{ injectHook(t(introKey('Summary'), intro.summary || '')) }}</span>
      <span class="group-intro__chevron" :class="{ 'group-intro__chevron--open': expanded }" aria-hidden="true">
        <svg viewBox="0 0 16 16" width="12" height="12" fill="currentColor">
          <path d="M4.427 5.427l3.396 3.396a.25.25 0 00.354 0l3.396-3.396A.25.25 0 0011.396 5H4.604a.25.25 0 00-.177.427z" />
        </svg>
      </span>
    </button>

    <!-- Expandable content body -->
    <Transition name="group-intro-fade">
      <div v-show="expanded" class="group-intro__body">
        <div
          v-for="(g, gi) in intro.groups"
          :key="gi"
          :class="['group-intro__group', `group-intro__group--${g.tone}`]"
        >
          <div
            v-if="intro.groups.length > 1 && g.head"
            class="group-intro__group-head"
          >{{ t(introKey(`${gi}Head`), g.head) }}</div>
          <ul class="group-intro__list">
            <li v-for="(item, ii) in g.items" :key="ii">
              <RichText
                :text="injectHook(t(introKey(`${gi}Item${ii}`), item))"
                :card-id="group.state"
                :api-links="true"
                :seen="notesSeen"
              />
            </li>
          </ul>
        </div>
      </div>
    </Transition>
  </section>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import RichText from './RichText.vue';
import { useUIKit } from '@tencentcloud/uikit-base-component-vue3';
import type { ExampleGroup } from '../types';

const props = defineProps<{ group: ExampleGroup }>();

// Reactive locale — used below to reset the link-dedup set on language switch.
const { t, language } = useUIKit();

/**
 * Group-level "about this group" callout. Rendered ONCE per selected group
 * in App.vue (above the single ExampleCard), NOT repeated on every card —
 * the mental model / global prerequisite belongs to the group, so it must
 * not be re-stamped above each API's title.
 *
 * The component is keyed by `group.state` in App.vue, so switching groups
 * remounts it. `notesSeen` is therefore fresh per group AND per locale
 * (see the `watch` below): a link repeated across groups still renders as a
 * link in the new group, while intra-group / intra-language repeats collapse
 * to plain text.
 *
 * Visual design follows GitHub Alerts / Docusaurus Admonitions pattern:
 * - Collapsed by default (progressive disclosure)
 * - Icon + inline label header bar (no heavy badge pill)
 * - Soft background with thin left accent border
 * - Smooth expand/collapse transition
 */
// Shared across every RichText in this group's intro block so a link
// repeated in several items renders only once (first occurrence wins).
// Held in a ref so we can RESET it on language switch: the component is
// keyed by `group.state` and therefore NOT remounted when only the locale
// changes. Without the reset, the set would keep the link keys resolved in
// the previous language; since API names are language-neutral, every link
// would then be treated as "already seen" and downgraded to plain text —
// i.e. the links silently stop working after switching i18n.
const notesSeen = ref<Set<string>>(new Set());

watch(
  () => language.value,
  () => {
    notesSeen.value = new Set();
  },
);

const intro = computed(() => props.group.intro ?? null);

/** Whether the detail body is expanded (default: collapsed). */
const expanded = ref(false);

/**
 * i18n key scheme — MUST match the translated strings in
 * `i18n/cards/*.ts`:
 *   Card.<Group>IntroSummary
 *   Card.<Group>Intro<gi>Head
 *   Card.<Group>Intro<gi>Item<ii>
 * e.g. device group → Card.DeviceIntroSummary / Card.DeviceIntro0Item0.
 */
function introKey(suffix: string): string {
  return `Card.${toPascal(props.group.state)}Intro${suffix}`;
}

/**
 * Replace the `{hook}` token in an i18n-resolved string with the actual
 * state hook of the current group (e.g. useLoginState). This keeps the
 * group intro mentioning the real hook name in BOTH locales without
 * duplicating it: the source literal (`zh-CN` fallback) and the `en-US`
 * translation both author the text as `{hook}()`, and the component fills
 * it at render time from `group.hook`.
 */
function injectHook(text: string): string {
  return text.replace(/\{hook\}/g, props.group.hook);
}

const toPascal = (seg: string): string =>
  seg.split(/[-_]/).map((w) => w.charAt(0).toUpperCase() + w.slice(1)).join('');
</script>

<style scoped lang="scss">
/* ── Design tokens (inspired by GitHub Alerts) ──────────────────── */

$bg: #f6f8fa;
$border: #d8dee4;
$accent: #0969da;
$text: #24292f;
$text-secondary: #57606a;
$radius: 10px;

// Tone-specific left-border colors (subtle, not saturated)
$tone-must: #d29922;     // warm amber
$tone-env: #8250df;       // cool indigo

.group-intro {
  margin-bottom: 12px;
  border-radius: $radius;
  overflow: hidden;
  background: $bg;
  border: 1px solid $border;
  border-left: 3px solid $accent;

  /* ── Header bar (always visible) ────────────────────────────── */

  &__bar {
    display: flex;
    align-items: center;
    gap: 7px;
    width: 100%;
    padding: 10px 14px;
    border: none;
    background: transparent;
    cursor: pointer;
    color: inherit;
    font-family: inherit;
    text-align: left;
    transition: background-color 0.15s ease;

    &:hover {
      background-color: rgba(9, 105, 218, 0.04);
    }

    &:focus-visible {
      outline: 2px solid $accent;
      outline-offset: -2px;
      border-radius: $radius $radius 0 0;
    }
  }

  &__icon {
    flex-shrink: 0;
    display: flex;
    align-items: center;
    justify-content: center;
    color: $accent;
    opacity: 0.85;
  }

  &__label {
    flex-shrink: 0;
    font-size: 12.5px;
    font-weight: 600;
    color: $accent;
    letter-spacing: 0.02em;
  }

  &__summary {
    flex: 1 1 auto;
    font-size: 13px;
    line-height: 1.4;
    color: $text;
    // Truncate long summaries gracefully
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    min-width: 0;
  }

  &__chevron {
    flex-shrink: 0;
    display: flex;
    align-items: center;
    color: $text-secondary;
    transition: transform 0.2s ease;

    &--open {
      transform: rotate(180deg);
    }
  }

  /* ── Expandable body ────────────────────────────────────────── */

  &__body {
    padding: 0 14px 12px 14px;
    border-top: 1px solid rgba(0, 0, 0, 0.06);
  }

  /* ── Content groups (must / env) ───────────────────────────── */

  &__group {
    padding-left: 2px;

    &:not(:first-child) {
      margin-top: 10px;
    }

    // Subtle tone indicator via left border on group container
    &--must { border-left: 2px solid $tone-must; padding-left: 10px; }
    &--env { border-left: 2px solid $tone-env; padding-left: 10px; }
  }

  &__group-head {
    margin-bottom: 5px;
    font-size: 12px;
    font-weight: 600;
    color: $text-secondary;
    // Normal case (not uppercase) — softer than ALL CAPS
  }

  &__list {
    margin: 0;
    padding-left: 18px;

    li {
      margin: 5px 0;
      font-size: 13px;
      line-height: 1.65;
      color: $text-secondary;
    }

    code {
      padding: 1px 5px;
      font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
      font-size: 12.2px;
      color: $text;
      background: rgba(175, 184, 193, 0.2);
      border-radius: 4px;
    }
  }
}

/* ── Expand/collapse transition ───────────────────────────────── */

.group-intro-fade-enter-active,
.group-intro-fade-leave-active {
  transition: all 0.22s ease;
  overflow: hidden;
}

.group-intro-fade-enter-from,
.group-intro-fade-leave-to {
  opacity: 0;
  max-height: 0;
  padding-top: 0;
  padding-bottom: 0;
}

.group-intro-fade-enter-to,
.group-intro-fade-leave-from {
  opacity: 1;
  max-height: 500px; // generous upper bound for smooth animation
}
</style>
