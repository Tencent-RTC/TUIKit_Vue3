/**
 * codeMirrorSetup — shared CodeMirror 6 extensions used by both the
 * editable JSON input (`JsonEditor.vue`) and the read-only code block
 * that renders `example.snippet` etc. (`CodeBlock.vue`).
 *
 * Both consumers want the same visual language:
 *   - Same monospace font stack, size, line-height
 *   - Same off-white background, gray border
 *   - Same syntax-color palette (violet keys, red strings, teal
 *     numbers, blue booleans / null, near-black punctuation, muted
 *     italic gray comments)
 *
 * Keeping the tokens and theme in one module means "recolor a token"
 * or "tweak font size" is a one-line change that propagates to every
 * code surface in the demo. If a caller ever needs to override, they
 * still can — the theme is a plain CM6 extension appended alongside
 * the caller's own extension list.
 */

import { HighlightStyle, syntaxHighlighting } from '@codemirror/language';
import { EditorView } from '@codemirror/view';
import type { Extension } from '@codemirror/state';
import { tags as t } from '@lezer/highlight';

/**
 * Highlight tokens. `defaultHighlightStyle` bakes in fairly loud
 * greens for comments which drowned out live-code rows in the
 * demo's field-checklist template. We enumerate the tags we
 * actually see for JSON + TS snippets and let anything else fall
 * back to the editor's default color.
 *
 * Palette is aligned with the VS Code Light+ theme so operators who
 * spend all day in an editor recognise the roles at a glance.
 */
export const codeHighlightStyle = HighlightStyle.define([
  // Comments — soft gray, italic. Deliberately low-contrast so the
  // template's mostly-commented lines register as "hint" instead of
  // as first-class code.
  { tag: t.comment, color: '#9ca3af', fontStyle: 'italic' },
  { tag: t.lineComment, color: '#9ca3af', fontStyle: 'italic' },
  { tag: t.blockComment, color: '#9ca3af', fontStyle: 'italic' },
  { tag: t.docComment, color: '#9ca3af', fontStyle: 'italic' },

  // Object property names (JSON keys and TS object shorthand).
  { tag: t.propertyName, color: '#7c3aed' },
  { tag: t.definition(t.propertyName), color: '#7c3aed' },

  // String literals — dark red, distinctive against the light bg.
  { tag: t.string, color: '#a31515' },
  { tag: t.regexp, color: '#a31515' },

  // Numbers and JSON literals (true / false / null map to bool /
  // null tags in the lezer JS grammar).
  { tag: t.number, color: '#098658' },
  { tag: t.bool, color: '#1c66e5' },
  { tag: t.null, color: '#1c66e5' },

  // TS / JS keywords — the classic blue.
  { tag: t.keyword, color: '#1c66e5' },
  { tag: t.controlKeyword, color: '#1c66e5' },
  { tag: t.definitionKeyword, color: '#1c66e5' },
  { tag: t.modifier, color: '#1c66e5' },
  { tag: t.operatorKeyword, color: '#1c66e5' },

  // Function / method identifiers where the grammar can tell.
  { tag: t.function(t.variableName), color: '#795e26' },
  { tag: t.function(t.definition(t.variableName)), color: '#795e26' },

  // Structural punctuation — near-black so brackets stay legible.
  { tag: t.brace, color: '#111827' },
  { tag: t.bracket, color: '#111827' },
  { tag: t.paren, color: '#111827' },
  { tag: t.punctuation, color: '#111827' },
  { tag: t.separator, color: '#111827' },
]);

/**
 * Base theme options that apply to every code surface. Font-size and
 * line-height are pinned here (not in a per-component style) so the
 * `rows`-to-`min-height` translation used by JsonEditor stays in
 * lockstep with the actual rendered line height.
 *
 * `background` gets a subtle off-white so a code block is visually
 * distinguishable from surrounding prose without a heavy border.
 */
export function buildCodeTheme(options?: {
  /**
   * When true, hide the active-line highlight (useful for read-only
   * blocks where "which line is the caret on" is meaningless).
   */
  hideActiveLine?: boolean;
  /**
   * Read-only content also gets a lighter background — same tone
   * as `<pre>` used before, so the visual shape doesn't shift when
   * a card upgrades its snippet from plain text to CM6.
   */
  readonly?: boolean;
}): Extension {
  const readonly = options?.readonly ?? false;
  const hideActive = options?.hideActiveLine ?? readonly;
  return EditorView.theme({
    '&': {
      fontSize: '12.5px',
      background: readonly ? '#f6f7f9' : '#fbfcfd',
      border: '1px solid #d1d5db',
      borderRadius: '6px',
    },
    '&.cm-focused': readonly
      ? {
          outline: 'none',
          borderColor: '#d1d5db',
          boxShadow: 'none',
        }
      : {
          outline: 'none',
          borderColor: '#1c66e5',
          boxShadow: '0 0 0 3px rgba(28, 102, 229, 0.15)',
        },
    '.cm-scroller': {
      fontFamily:
        "ui-monospace, SFMono-Regular, 'SF Mono', Menlo, Consolas, 'Liberation Mono', monospace",
      lineHeight: '1.5',
    },
    '.cm-content': {
      padding: '6px 0',
      caretColor: '#111827',
    },
    '.cm-gutters': {
      // No line numbers — these blocks are docs / params, not files.
      display: 'none',
    },
    '.cm-activeLine': hideActive
      ? { backgroundColor: 'transparent' }
      : { backgroundColor: 'rgba(28, 102, 229, 0.05)' },
    '.cm-selectionBackground, ::selection': {
      backgroundColor: 'rgba(28, 102, 229, 0.2)',
    },
    '.cm-placeholder': {
      color: '#9ca3af',
      fontStyle: 'normal',
    },
  });
}

/**
 * Convenience helper — returns the `syntaxHighlighting` extension
 * wired to `codeHighlightStyle`. Kept as a function (not a
 * pre-instantiated extension) so callers can compose it into their
 * own extension array without worrying about extension identity.
 */
export function codeSyntaxHighlighting(): Extension {
  return syntaxHighlighting(codeHighlightStyle, { fallback: true });
}
