<template>
  <!--
    Bare host element for CodeMirror. All rendering (gutter, cursor,
    selection, highlight) is done by CM6 itself; this wrapper only
    contributes width / border / rows-approximating min-height so the
    editor lines up visually with sibling <input>/<textarea> fields.
  -->
  <div ref="hostEl" class="json-editor" />
</template>

<script setup lang="ts">
/**
 * JsonEditor — thin Vue3 wrapper around CodeMirror 6 for the
 * api-example demo's JSON input fields.
 *
 * Why CodeMirror 6 (vs. a hand-rolled overlay): CM owns cursor,
 * selection, IME, undo and scroll natively, which sidesteps the
 * "transparent textarea over colored <pre>" alignment/re-entrance
 * bugs we hit before (see git history: "highlight overlay causes
 * page freeze").
 *
 * Scope:
 *   - Two-way binding via `defineModel<string>()`. Vue writes flow
 *     to CM through `view.dispatch({ changes })`; CM writes back
 *     through `updateListener`. Guard against re-entrance by
 *     comparing the incoming string to the current doc first.
 *   - JSON + `//` line comments. We use `@codemirror/lang-javascript`
 *     (superset of JSON that tokenizes `//` comments). `lang-json`
 *     was rejected because it flags `//` as an error, which would
 *     paint the whole field-checklist template red.
 *   - Height controlled by an approximated `rows`-to-`min-height`
 *     mapping (see `computedMinHeight` below).
 *
 * Colors, fonts, and theme live in `codeMirrorSetup.ts` so they stay
 * in sync with the read-only `CodeBlock.vue`.
 */

import { onBeforeUnmount, onMounted, ref, watch } from 'vue';
import { EditorState } from '@codemirror/state';
import {
  EditorView,
  keymap,
  drawSelection,
  highlightActiveLine,
  highlightSpecialChars,
  placeholder as placeholderExt,
} from '@codemirror/view';
import { defaultKeymap, history, historyKeymap } from '@codemirror/commands';
import { bracketMatching, indentOnInput } from '@codemirror/language';
import { javascript } from '@codemirror/lang-javascript';
import { buildCodeTheme, codeSyntaxHighlighting } from '../utils/codeMirrorSetup';

// v-model binding — writes emit `update:modelValue`, mirroring the
// contract a native `<textarea v-model>` would expose, so callers in
// ExampleCard don't need to know they're driving a CM instance.
const model = defineModel<string>({ default: '' });

const props = withDefaults(
  defineProps<{
    /**
     * Approximate visible line count. Translated to a min-height on
     * the CM outer element (see below); CM lines are ~1.5em tall at
     * 12.5px font-size, so N rows ≈ N * 18.75px + padding.
     */
    rows?: number;
    /**
     * Rendered when the doc is empty. CM's placeholder is a real
     * extension (not the native attribute), so the value is captured
     * once at mount time — later changes to this prop are ignored,
     * matching the "field.placeholder is static config" convention
     * elsewhere in ExampleCard.
     */
    placeholder?: string;
  }>(),
  {
    rows: 1,
    placeholder: '',
  },
);

const hostEl = ref<HTMLDivElement | null>(null);
let view: EditorView | null = null;

/**
 * Row-to-pixel translation. CM6 has no `rows` prop — a min-height
 * on the outer element gives us the same "reserve N lines up
 * front" behaviour as `<textarea rows="N">`. Numbers derived from
 * font-size:12.5px * lineHeight:1.5. Update alongside the theme
 * block in codeMirrorSetup.ts if font metrics change.
 */
function computedMinHeight(rows: number): string {
  const lineHeightPx = 12.5 * 1.5;
  const paddingPx = 12; // 6px top + 6px bottom on the content
  const borderPx = 2; // 1px top + 1px bottom on the border
  return `${rows * lineHeightPx + paddingPx + borderPx}px`;
}

onMounted(() => {
  if (!hostEl.value) return;

  const startState = EditorState.create({
    doc: model.value ?? '',
    extensions: [
      // Language: JS grammar handles JSON plus `//` comments.
      javascript(),

      // Editing niceties. Deliberately minimal — we're not building
      // a full IDE, just a nice-looking input control.
      history(),
      drawSelection(),
      highlightSpecialChars(),
      highlightActiveLine(),
      bracketMatching(),
      indentOnInput(),
      codeSyntaxHighlighting(),
      keymap.of([...defaultKeymap, ...historyKeymap]),
      placeholderExt(props.placeholder),

      // Reactive bridge: whenever the doc changes, push the new
      // string into the v-model ref. Guard against re-entrance —
      // the outer `watch` below mirrors external writes back into
      // CM, and we bail if the string is already identical.
      EditorView.updateListener.of((update) => {
        if (!update.docChanged) return;
        const next = update.state.doc.toString();
        if (next !== model.value) {
          model.value = next;
        }
      }),

      buildCodeTheme(),
    ],
  });

  view = new EditorView({
    state: startState,
    parent: hostEl.value,
  });

  // Apply the row-derived min-height AFTER view creation so CM's
  // internal wrapper element exists. Doing this via CSS `--var` on
  // the host lets the wrapper stretch to the value while CM's own
  // content still grows past it for longer docs.
  hostEl.value.style.setProperty('--json-editor-min-h', computedMinHeight(props.rows));
});

/**
 * External model → editor sync. Called when Vue mutates model.value
 * from outside (e.g. programmatic reset, autofill from an event).
 * Compare against the current doc first so we don't fire a pointless
 * dispatch that would collapse the user's selection.
 */
watch(model, (next) => {
  if (!view) return;
  const current = view.state.doc.toString();
  if (next === current) return;
  view.dispatch({
    changes: { from: 0, to: current.length, insert: next ?? '' },
  });
});

onBeforeUnmount(() => {
  view?.destroy();
  view = null;
});
</script>

<style scoped lang="scss">
.json-editor {
  width: 100%;
  min-height: var(--json-editor-min-h, 32px);
  box-sizing: border-box;

  // CM6 renders its own scrollable region. Make sure that inner
  // scroller respects the same min-height we reserve on the host,
  // otherwise a `rows=28` editor collapses to one line height at
  // mount time and only expands after the first keystroke.
  :deep(.cm-editor) {
    min-height: inherit;
    height: 100%;
  }
  :deep(.cm-scroller) {
    min-height: inherit;
    overflow: auto;
  }
}
</style>
