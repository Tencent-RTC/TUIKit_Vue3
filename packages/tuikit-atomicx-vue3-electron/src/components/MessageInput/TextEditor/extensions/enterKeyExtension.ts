/**
 * Enter Key Extension - Handle Enter key for sending message and Mod-Enter for line break
 */
import { Extension } from '@tiptap/vue-3';

export function createEnterKeyExtension(onEnter?: () => void) {
  return Extension.create({
    name: 'enterKey',
    addKeyboardShortcuts() {
      return {
        'Enter': () => {
          onEnter?.();
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
