import { MessageContentType } from '../types/messageInput';
import type { InputContent } from '../types/messageInput';
import type { JSONContent } from '@tiptap/vue-3';

async function blobUrlToFile(blobUrl: string, fileName = 'image.png', fileType = 'image/png'): Promise<File | null> {
  try {
    const response = await fetch(blobUrl);
    const blobData = await response.blob();
    return new File([blobData], fileName, { type: fileType, lastModified: Date.now() });
  } catch {
    return null;
  }
}

function convertInputContentToEditorNode(item: InputContent) {
  switch (item.type) {
    case MessageContentType.TEXT:
      return {
        type: 'text',
        text: item.content,
      };
    case MessageContentType.IMAGE: {
      if (typeof item.content === 'string') {
        return {
          type: MessageContentType.IMAGE,
          attrs: {
            src: item.content,
          },
        };
      }

      return {
        type: MessageContentType.IMAGE,
        attrs: {
          src: URL.createObjectURL(item.content),
          alt: item.content?.name,
          fileData: item.content,
          title: item.content?.name,
        },
      };
    }
    case MessageContentType.EMOJI: {
      const emoticonContent = item.content;
      return {
        type: MessageContentType.EMOJI,
        attrs: {
          src: emoticonContent.url,
          alt: emoticonContent.key,
          title: emoticonContent.text,
        },
      };
    }
    case MessageContentType.MENTION: {
      const mentionContent = item.content;
      return {
        type: MessageContentType.MENTION,
        attrs: {
          id: mentionContent.id,
          label: mentionContent.label,
          mentionSuggestionChar: mentionContent.mentionSuggestionChar,
        },
      };
    }
    default:
      return {
        type: 'text',
        text: String(item.content),
      };
  }
}

function trimInputContent(content: InputContent[]): InputContent[] {
  if (content.length === 0) {
    return [];
  }

  let firstNonEmptyIndex = -1;
  let lastNonEmptyIndex = -1;

  for (let i = 0; i < content.length; i += 1) {
    const item = content[i];
    const isNonEmpty = item.type !== MessageContentType.TEXT
      || item.content.trim().length > 0;

    if (isNonEmpty) {
      if (firstNonEmptyIndex === -1) {
        firstNonEmptyIndex = i;
      }
      lastNonEmptyIndex = i;
    }
  }

  if (firstNonEmptyIndex === -1) {
    return [];
  }

  return content
    .slice(firstNonEmptyIndex, lastNonEmptyIndex + 1)
    .map((item, index, array) => {
      if (item.type === MessageContentType.TEXT) {
        let textContent = item.content;
        if (index === 0) {
          textContent = textContent.trimStart();
        }
        if (index === array.length - 1) {
          textContent = textContent.trimEnd();
        }
        return {
          ...item,
          content: textContent,
        };
      }
      return item;
    })
    .filter((item) => {
      if (item.type === MessageContentType.TEXT) {
        return item.content.length > 0;
      }
      return true;
    });
}

function convertEditorContent(node: JSONContent): InputContent[] {
  if (!node?.content) {
    return [];
  }

  return node.content.flatMap((child: JSONContent, index) => {
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
          content: child.attrs?.src,
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

      default: {
        const result = convertEditorContent(child);
        if (child.type === 'paragraph' && index > 0) {
          return [{ type: MessageContentType.TEXT, content: '\n' }, ...result];
        }
        return result;
      }
    }
  });
}

export {
  blobUrlToFile,
  trimInputContent,
  convertInputContentToEditorNode,
  convertEditorContent,
};
