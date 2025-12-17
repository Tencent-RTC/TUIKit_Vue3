/**
 * EditorCore - Pure functional utilities for Tiptap editor
 * Provides extension configuration and content conversion
 */
import Placeholder from '@tiptap/extension-placeholder';
import StarterKit from '@tiptap/starter-kit';
import { MessageContentType } from '../../../states/MessageInputState';
import {
  CharacterCount,
  createEmojiExtension,
  createEnterKeyExtension,
  createImageExtension,
  createMentionExtension,
} from './extensions';
import type { InputContent } from '../../../states/MessageInputState';
import type { JSONContent, Extensions } from '@tiptap/vue-3';
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

// ============================================================================
// Content Conversion
// ============================================================================

/**
 * Convert Tiptap JSON content to business InputContent array
 * Uses simple switch-case for clarity (no over-engineered registry pattern)
 */
function convertEditorContent(node: JSONContent): InputContent[] {
  if (!node?.content) {
    return [];
  }

  return node.content.flatMap((child: JSONContent) => {
    switch (child.type) {
      case 'text':
        return child.text
          ? [{
            type: MessageContentType.TEXT,
            content: child.text,
          }]
          : [];

      case 'image':
        return [{
          type: MessageContentType.IMAGE,
          content: child.attrs?.fileData,
        }];

      case 'emoji':
        return [{
          type: MessageContentType.EMOJI,
          content: {
            url: child.attrs?.src,
            key: child.attrs?.alt,
            text: child.attrs?.title,
          },
        }];

      case 'hardBreak':
        return [{
          type: MessageContentType.TEXT,
          content: '\n',
        }];

      case 'mention':
        return [{
          type: MessageContentType.MENTION,
          content: {
            id: child.attrs?.id,
            label: child.attrs?.label,
            mentionSuggestionChar: child.attrs?.mentionSuggestionChar,
          },
        }];

      default:
        // Recursively handle nested content (e.g., paragraph nodes)
        return convertEditorContent(child);
    }
  });
}

// ============================================================================
// Exports
// ============================================================================

export {
  createExtensions,
  convertEditorContent,
};
