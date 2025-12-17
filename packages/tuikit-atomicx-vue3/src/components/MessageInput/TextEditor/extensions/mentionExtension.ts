/**
 * TipTap Mention Extension Configuration
 * @description Enables @ mention functionality in the editor
 * Data management is handled by MentionSuggestion component via GroupSettingState
 */
import Mention from '@tiptap/extension-mention';
import { VueRenderer } from '@tiptap/vue-3';
import { useConversationListState } from '../../../../states/ConversationListState';
import { useGroupSettingState, GroupType } from '../../../../states/GroupSettingState';
import { ConversationType } from '../../../../types/engine';
import MentionSuggestion from './MentionSuggestion.vue';
import type { SuggestionKeyDownProps, SuggestionProps } from '@tiptap/suggestion';

interface MentionComponentRef {
  onKeyDown: (props: SuggestionKeyDownProps) => boolean;
}

/**
 * Create Mention extension for @ member functionality
 * @returns Configured Mention extension
 */
export function createMentionExtension() {
  return Mention.configure({
    deleteTriggerWithBackspace: true,
    HTMLAttributes: {
      class: 'uikit-message-input-mention-tag',
    },
    suggestion: {
      char: '@',
      // Items are now managed inside the component via GroupSettingState
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
            const { activeConversation } = useConversationListState();
            const { memberCount, groupType } = useGroupSettingState();
            if (
              activeConversation.value?.type === ConversationType.GROUP
              && memberCount.value
              && memberCount.value > 1
              && groupType.value !== GroupType.AVCHATROOM
            ) {
              component = new VueRenderer(MentionSuggestion, {
                props,
                editor: props.editor,
              });

              if (component.element) {
                element = component.element as HTMLElement;
                document.body.appendChild(element);
              }
            }
          },

          onUpdate(props: SuggestionProps) {
            component?.updateProps(props);
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
