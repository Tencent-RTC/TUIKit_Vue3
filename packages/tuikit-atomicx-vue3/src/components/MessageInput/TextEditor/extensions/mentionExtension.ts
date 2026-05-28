/**
 * TipTap Mention Extension Configuration
 * @description Enables @ mention functionality in the editor
 * Data management is handled by MentionSuggestion component via useChatContext.
 */
import Mention from '@tiptap/extension-mention';
import { VueRenderer } from '@tiptap/vue-3';
import { useChatContext } from '../../../../chat-store';
import MentionSuggestion from './MentionSuggestion.vue';
import type { SuggestionKeyDownProps, SuggestionProps } from '@tiptap/suggestion';

interface MentionComponentRef {
  onKeyDown: (props: SuggestionKeyDownProps) => boolean;
}

/**
 * Create Mention extension for @ member functionality.
 * MentionSuggestion receives channel explicitly because VueRenderer mounts outside
 * the normal MessageInput component tree.
 */
export function createMentionExtension(channel = 'default') {
  const { activeConversation } = useChatContext(channel);

  return Mention.configure({
    deleteTriggerWithBackspace: true,
    HTMLAttributes: {
      class: 'uikit-message-input-mention-tag',
    },
    suggestion: {
      char: '@',
      items: () => [],
      render: () => {
        let component: VueRenderer | null = null;
        let element: HTMLElement | null = null;

        const destroy = () => {
          if (element?.parentNode) {
            element.parentNode.removeChild(element);
          }
          component?.destroy();
          component = null;
          element = null;
        };

        return {
          onStart: (props: SuggestionProps) => {
            if (activeConversation.value?.conversationID?.startsWith('GROUP') !== true) {
              return;
            }

            component = new VueRenderer(MentionSuggestion, {
              props: {
                ...props,
                channel,
              },
              editor: props.editor,
            });

            if (component.element) {
              element = component.element as HTMLElement;
              document.body.appendChild(element);
            }
          },

          onUpdate(props: SuggestionProps) {
            component?.updateProps({
              ...props,
              channel,
            });
          },

          onKeyDown(props: SuggestionKeyDownProps) {
            if (props.event.key === 'Escape') {
              destroy();
              return true;
            }
            return (component?.ref as unknown as MentionComponentRef)?.onKeyDown?.(props) || false;
          },

          onExit() {
            destroy();
          },
        };
      },
    },
  });
}
