import Image from '@tiptap/extension-image';
import Placeholder from '@tiptap/extension-placeholder';
import StarterKit from '@tiptap/starter-kit';
import { Extension, Editor } from '@tiptap/vue-3';
import { MessageContentType } from '../../../states/MessageInputState';
import type { InputContent } from '../../../states/MessageInputState';
import type { JSONContent, EditorOptions as TiptapEditorOptions } from '@tiptap/vue-3';
import './Editor.scss';

function createEmojiExtension() {
  return Image.extend({
    name: MessageContentType.EMOJI,
    inline: true,
    group: 'inline',
    draggable: true,
    addOptions() {
      return {
        ...this.parent?.(),
        HTMLAttributes: {
          class: 'message-emoji',
        },
      };
    },
  });
}

function createImageExtension() {
  return Image.extend({
    addOptions() {
      return {
        ...this.parent?.(),
        HTMLAttributes: {
          class: 'message-image',
        },
      };
    },
    addAttributes() {
      return {
        ...this.parent?.(),
        fileData: {
          default: null,
          parseHTML: element => element.getAttribute('file-data'),
          renderHTML: attributes => attributes.fileData ? { 'file-data': attributes.fileData } : {},
        },
      };
    },
  }).configure({
    inline: true,
  });
}

function createEnterKeyExtension(options?: { onEnter?: (() => void) | undefined }) {
  return Extension.create({
    addKeyboardShortcuts() {
      return {
        'Enter': () => {
          options?.onEnter?.();
          return true;
        },
        'Mod-Enter': ({ editor }) => {
          editor.commands.setHardBreak();
          return true;
        },
      };
    },
  });
}

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
      default:
        return convertEditorContent(child);
    }
  });
}

interface EditorOptions {
  element: Element;
  placeholder?: string;
  autoFocus?: boolean;
  disabled?: boolean;
  isPlaceholderOnlyShowWhenEditable?: boolean;
  onUpdate?: (content: InputContent[]) => void;
  onEnter?: () => void;
  onFocus?: () => void;
  onBlur?: () => void;
}

function createEditor({
  element,
  placeholder = '',
  autoFocus = false,
  disabled = false,
  isPlaceholderOnlyShowWhenEditable = true,
  onUpdate,
  onEnter,
  onFocus,
  onBlur,
}: EditorOptions) {
  const createBaseExtensions = (enterHandler?: () => void) => [
    StarterKit,
    createEnterKeyExtension(enterHandler ? { onEnter: enterHandler } : undefined),
    createEmojiExtension(),
    createImageExtension(),
    Placeholder.configure({
      placeholder,
      showOnlyWhenEditable: isPlaceholderOnlyShowWhenEditable,
    }),
  ];

  const editorConfig: Partial<TiptapEditorOptions> = {
    element,
    autofocus: autoFocus,
    editable: !disabled,
    extensions: createBaseExtensions(onEnter),
    onUpdate: ({ editor }) => {
      const content = convertEditorContent(editor.getJSON());
      onUpdate?.(content);
    },
    onFocus,
    onBlur,
  };

  return new Editor(editorConfig);
}

export {
  createEditor,
};

export type {
  Editor,
};
