<template>
  <div ref="hostEl" class="code-block" />
</template>

<script setup lang="ts">
/**
 * CodeBlock — read-only CodeMirror 6 surface for rendering the
 * `example.snippet` documentation body (and, later, any other
 * "here's how the call site looks" code sample).
 *
 * Why CM6 rather than a plain `<pre>` + external highlighter:
 *   - Single font/theme source of truth with the editable JsonEditor
 *     (both consume `codeMirrorSetup.ts`), so a color-palette tweak
 *     lands in one place and updates every code surface.
 *   - Uniform behaviour for keyboard selection / copy / scroll —
 *     matches user expectations from any modern docs site.
 *   - We already pay for CM6's bundle for JsonEditor; adding a read-
 *     only view is a rounding-error in kb.
 *
 * The view is created with `EditorState.readOnly.of(true)` +
 * `EditorView.editable.of(false)`, which together disable both
 * doc mutation and typing focus. The block is still scrollable and
 * selectable, but no caret is shown.
 *
 * Language:
 *   - Default is TypeScript-flavoured JavaScript (`javascript({
 *     typescript: true })`). This covers the demo's snippets which
 *     are all TS-ish (`import type`, generic angle brackets, etc.).
 *   - JSON snippets can pass the same content in and still render
 *     acceptably because JS grammar is a superset for our needs.
 */

import { onBeforeUnmount, onMounted, ref, watch } from 'vue';
import { EditorState } from '@codemirror/state';
import { EditorView } from '@codemirror/view';
import { javascript } from '@codemirror/lang-javascript';
import { bracketMatching } from '@codemirror/language';
import { buildCodeTheme, codeSyntaxHighlighting } from '../utils/codeMirrorSetup';

const props = withDefaults(
  defineProps<{
    /** Source code to render. Whitespace / newlines preserved verbatim. */
    code: string;
    /**
     * Language flavour. TypeScript is the safe default for the demo
     * whose snippets mix TS types with JS calls; use `'json'` when
     * the block is a payload example so numbers / strings look
     * uncluttered by keyword coloring.
     */
    lang?: 'typescript' | 'javascript' | 'json';
  }>(),
  {
    lang: 'typescript',
  },
);

const hostEl = ref<HTMLDivElement | null>(null);
let view: EditorView | null = null;

function makeLanguageExtension() {
  // `lang-json` was tried and rejected in JsonEditor because it flags
  // `//` comments as errors; here we don't accept user input, and
  // `snippet` bodies in the demo are TS with imports / statements,
  // so keep the JS grammar path even for `lang: 'json'`. If a caller
  // ever needs strict JSON tokenization (e.g. output pretty-printing),
  // we can wire in `@codemirror/lang-json` behind that branch.
  if (props.lang === 'json') return javascript();
  return javascript({ typescript: props.lang === 'typescript' });
}

function makeState(doc: string): EditorState {
  return EditorState.create({
    doc,
    extensions: [
      makeLanguageExtension(),
      bracketMatching(),
      codeSyntaxHighlighting(),
      buildCodeTheme({ readonly: true }),
      // Read-only both at the state layer (no transactions accepted)
      // and the view layer (no editable focus). Both flags exist for
      // different reasons — state.readOnly is what programmatic
      // dispatches respect, view.editable is what disables the
      // browser's editing chrome (caret, IME).
      EditorState.readOnly.of(true),
      EditorView.editable.of(false),
    ],
  });
}

onMounted(() => {
  if (!hostEl.value) return;
  view = new EditorView({
    state: makeState(props.code ?? ''),
    parent: hostEl.value,
  });
});

/**
 * When the source code prop changes (e.g. the user navigates between
 * cards that reuse the same component), swap the doc in one
 * transaction rather than tearing down and remounting the whole
 * editor — cheaper and preserves scroll position when the two docs
 * share a common prefix.
 */
watch(
  () => props.code,
  (next) => {
    if (!view) return;
    const current = view.state.doc.toString();
    if (next === current) return;
    view.dispatch({
      changes: { from: 0, to: current.length, insert: next ?? '' },
    });
  },
);

onBeforeUnmount(() => {
  view?.destroy();
  view = null;
});
</script>

<style scoped lang="scss">
.code-block {
  width: 100%;
  box-sizing: border-box;

  // Match the `<pre class="card__snippet">` sizing so migrating a card
  // to CM6 doesn't visually reflow the section. Snippets are usually
  // 6–15 lines — no artificial min-height; the editor grows to fit.
  :deep(.cm-editor) {
    height: auto;
  }
  :deep(.cm-scroller) {
    // Horizontal scroll on long lines instead of soft wrap; long
    // import paths / URLs shouldn't fold mid-token.
    overflow: auto;
  }
}
</style>
