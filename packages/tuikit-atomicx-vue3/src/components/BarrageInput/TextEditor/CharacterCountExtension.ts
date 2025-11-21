import { Plugin, PluginKey } from '@tiptap/pm/state';
import { Extension } from '@tiptap/vue-3';
import type { Node as ProseMirrorNode } from '@tiptap/pm/model';

export interface CharacterCountOptions {
  limit: number | null | undefined;
  textCounter: (text: string) => number;
  wordCounter: (text: string) => number;
}

export interface CharacterCountStorage {
  characters: (options?: { node?: ProseMirrorNode; mode?: 'textSize' | 'nodeSize' }) => number;
  words: (options?: { node?: ProseMirrorNode }) => number;
}

export const CharacterCount = Extension.create<CharacterCountOptions, CharacterCountStorage>({
  name: 'characterCount',

  addOptions() {
    return {
      limit: null,
      textCounter: text => text.length,
      wordCounter: text => text.split(' ').filter(word => word !== '').length,
    };
  },

  addStorage() {
    return {
      characters: () => 0,
      words: () => 0,
    };
  },

  onBeforeCreate() {
    this.storage.characters = (options) => {
      const node = options?.node || this.editor.state.doc;
      return node.nodeSize;
    };

    this.storage.words = (options) => {
      const node = options?.node || this.editor.state.doc;
      const text = node.textBetween(0, node.content.size, ' ', ' ');
      return this.options.wordCounter(text);

      return node.nodeSize;
    };
  },

  addProseMirrorPlugins() {
    let initialEvaluationDone = false;

    return [
      new Plugin({
        key: new PluginKey('characterCount'),
        appendTransaction: (transactions, oldState, newState) => {
          if (initialEvaluationDone) {
            return;
          }

          const { limit } = this.options;

          if (limit === null || limit === undefined || limit === 0) {
            initialEvaluationDone = true;
            return;
          }

          const initialContentSize = this.storage.characters({ node: newState.doc });

          if (initialContentSize > limit) {
            const over = initialContentSize - limit;
            const from = 0;
            const to = over;

            console.warn(
              `[CharacterCount] Initial content exceeded limit of ${limit} characters. Content was automatically trimmed.`,
            );
            const tr = newState.tr.deleteRange(from, to);

            initialEvaluationDone = true;
            return tr;
          }

          initialEvaluationDone = true;
        },
        filterTransaction: (transaction, state) => {
          const { limit } = this.options;

          if (!transaction.docChanged || limit === 0 || limit === null || limit === undefined) {
            return true;
          }

          const oldSize = this.storage.characters({ node: state.doc });
          const newSize = this.storage.characters({ node: transaction.doc });

          if (newSize <= limit) {
            return true;
          }

          if (oldSize > limit && newSize > limit && newSize <= oldSize) {
            return true;
          }

          if (oldSize > limit && newSize > limit && newSize > oldSize) {
            return false;
          }

          const isPaste = transaction.getMeta('paste');

          if (!isPaste) {
            return false;
          }
          const { pos } = transaction.selection.$head;
          const over = newSize - limit;
          const from = pos - over;
          const to = pos;
          transaction.deleteRange(from, to);

          const updatedSize = this.storage.characters({ node: transaction.doc });

          if (updatedSize > limit) {
            return false;
          }

          return true;
        },
      }),
    ];
  },
});
