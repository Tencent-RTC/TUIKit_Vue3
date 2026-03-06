/**
 * EditorCore - Pure functional utilities for Tiptap editor
 * Provides extension configuration and content conversion
 */
import Placeholder from '@tiptap/extension-placeholder';
import StarterKit from '@tiptap/starter-kit';
import {
  CharacterCount,
  createEmojiExtension,
  createEnterKeyExtension,
  createImageExtension,
  createMentionExtension,
} from './extensions';
import type { Extensions } from '@tiptap/vue-3';
import './Editor.scss';

// ============================================================================
// Extension Configuration
// ============================================================================

interface ExtensionOptions {
  placeholder?: string;
  maxLength?: number;
  showPlaceholderOnlyWhenEditable?: boolean;
  onEnter?: () => void;
}

/**
 * Create all editor extensions with given options
 */
function createExtensions(options: ExtensionOptions = {}): Extensions {
  const {
    placeholder = '',
    maxLength,
    showPlaceholderOnlyWhenEditable = true,
    onEnter,
  } = options;

  return [
    StarterKit.configure({
      // Disable all Markdown block nodes
      heading: false,
      blockquote: false,
      codeBlock: false,
      bulletList: false,
      orderedList: false,
      listItem: false,
      horizontalRule: false,
      // Disable all Markdown inline marks
      bold: false,
      italic: false,
      strike: false,
      code: false,
    }),
    CharacterCount.configure({
      limit: maxLength,
    }),
    createEnterKeyExtension(onEnter),
    createEmojiExtension(),
    createImageExtension(),
    createMentionExtension(),
    Placeholder.configure({
      placeholder,
      showOnlyWhenEditable: showPlaceholderOnlyWhenEditable,
    }),
  ];
}

export {
  createExtensions,
};
