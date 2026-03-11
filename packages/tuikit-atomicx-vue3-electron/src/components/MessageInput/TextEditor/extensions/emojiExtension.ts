/**
 * Emoji Extension - Display inline emojis as images
 */
import Image from '@tiptap/extension-image';
import { MessageContentType } from '../../../../states/MessageInputState';

export function createEmojiExtension() {
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
