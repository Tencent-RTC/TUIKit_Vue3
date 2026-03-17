import { Plugin, PluginKey } from '@tiptap/pm/state';
import { Extension } from '@tiptap/vue-3';
import type { Node as ProseMirrorNode } from '@tiptap/pm/model';

interface CharacterCountOptions {
  limit: number | null | undefined;
  textCounter: (text: string) => number;
  wordCounter: (text: string) => number;
}

interface CharacterCountStorage {
  characters: (options?: { node?: ProseMirrorNode; mode?: 'textSize' | 'nodeSize' }) => number;
  words: (options?: { node?: ProseMirrorNode }) => number;
}

function countGraphemes(text: string): number {
  if (typeof Intl !== 'undefined' && 'Segmenter' in Intl) {
    const segmenter = new (Intl as any).Segmenter('en', { granularity: 'grapheme' });
    return Array.from(segmenter.segment(text)).length;
  }
  return [...text].length;
}

const CharacterCount = Extension.create<CharacterCountOptions, CharacterCountStorage>({
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

      // Count all inline nodes: text nodes (with grapheme counting) + emoji nodes
      let totalCount = 0;

      node.descendants((childNode) => {
        if (childNode.isText && childNode.text) {
          totalCount += countGraphemes(childNode.text);
        } else if (childNode.type.name === 'emoji') {
          // Emoji node: count as 1 character
          totalCount += 1;
        }
        // Images and other inline nodes can be added here if needed
      });

      return totalCount;
    };

    this.storage.words = (options) => {
      const node = options?.node || this.editor.state.doc;
      const text = node.textBetween(0, node.content.size, ' ', ' ');
      return this.options.wordCounter(text);
    };
  },

  addProseMirrorPlugins() {
    let initialEvaluationDone = false;

    return [
      new Plugin({
        key: new PluginKey('characterCount'),
        appendTransaction: (_transactions, _oldState, newState) => {
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
          const isPaste = transaction.getMeta('paste');

          // Allow if within limit
          if (newSize <= limit) {
            return true;
          }

          // Allow deletion when already over limit
          if (oldSize > limit && newSize > limit && newSize <= oldSize) {
            return true;
          }

          // Reject if already over limit and still adding
          if (oldSize > limit && newSize > limit && newSize > oldSize) {
            return false;
          }

          // Handle paste trimming
          if (!isPaste) {
            return false;
          }

          const { pos } = transaction.selection.$head;
          const over = newSize - limit;
          const from = pos - over;
          const to = pos;

          if (from < 0) {
            return false;
          }

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


export {
  CharacterCount,
}
