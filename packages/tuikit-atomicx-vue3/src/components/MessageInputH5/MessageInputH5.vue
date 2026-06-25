<template>
  <div :class="$style['message-input-h5']">
    <slot name="headerToolbar">
      <QuotedMessagePreview />
    </slot>

    <!-- Input Bar Area -->
    <div
      ref="barRef"
      :class="$style['message-input-h5__bar']"
    >
      <div :class="$style['message-input-h5__left-inline']">
        <slot name="leftInline" />
      </div>

      <!-- Textarea -->
      <div :class="$style['message-input-h5__input-wrapper']">
        <div :class="$style['message-input-h5__input-prefix']">
          <slot name="inputPrefix" />
        </div>
        <slot
          name="textEditor"
          :value="inputValue"
          :disabled="disabled"
          :placeholder="computedPlaceholder"
          :max-length="maxLength"
          :input="handleTextareaInput"
        >
          <textarea
            ref="textareaRef"
            v-model="inputValue"
            :class="$style['message-input-h5__textarea']"
            :placeholder="computedPlaceholder"
            :disabled="disabled"
            :maxlength="maxLength"
            rows="1"
            @focus="handleTextareaFocus"
            @blur="handleTextareaBlur"
            @input="handleTextareaInput"
            @mousedown="handleTextareaMousedown"
            @keyup="handleTextareaKeyup"
            @compositionstart="isComposing = true"
            @compositionend="handleCompositionEnd"
          />
        </slot>
        <div :class="$style['message-input-h5__input-suffix']">
          <slot name="inputSuffix" />
        </div>
      </div>

      <div
        v-if="slots.rightInline"
        :class="$style['message-input-h5__right-inline']"
      >
        <slot name="rightInline" />
      </div>

      <!-- Action Buttons -->
      <div :class="$style['message-input-h5__actions']">
        <!-- Emoji Button -->
        <button
          v-if="showEmojiButton"
          type="button"
          :class="[
            $style['message-input-h5__action-btn'],
            mode === 'emoji' && $style['message-input-h5__action-btn--active']
          ]"
          :disabled="disabled"
          @click="handleEmojiClick"
        >
          <IconEmoji :size="26" />
        </button>

        <!-- Plus Button (when empty and panel actions exist) / Send Button (when has value) -->
        <button
          v-if="!hasValue && actionPanelItems.length > 0"
          type="button"
          :class="[
            $style['message-input-h5__action-btn'],
            mode === 'action' && $style['message-input-h5__action-btn--active']
          ]"
          :disabled="disabled"
          @click="handlePlusClick"
        >
          <IconPlus :size="20" />
        </button>

        <TUIButton
          v-else
          type="primary"
          radius="round"
          size="medium"
          :disabled="disabled"
          @click="handleSend"
        >
          {{ t('MessageInput.send') }}
        </TUIButton>
      </div>
    </div>

    <MessageInputPanelH5
      v-model:open="isMentionPanelVisible"
      :anchor-element="barRef"
      size="inset"
      @update:open="handleMentionPanelOpenChange"
    >
      <MentionPanelH5
        :visible="isMentionPanelVisible"
        :query="mentionQuery"
        :channel="channel"
        @select="handleMentionSelect"
        @panel-touch-start="handleMentionPanelTouchStart"
      />
    </MessageInputPanelH5>

    <MessageInputPanelH5
      :open="mode === 'emoji'"
      :anchor-element="barRef"
      size="inset"
      @update:open="handleModePanelOpenChange('emoji', $event)"
    >
      <!-- Emoji Panel -->
      <div
        :class="$style['message-input-h5__emoji-panel']"
        @touchmove.stop
      >
        <div :class="$style['message-input-h5__emoji-list']">
          <button
            v-for="emoji in emojiList"
            :key="emoji"
            type="button"
            :class="$style['message-input-h5__emoji-item']"
            @click="insertEmoji(emoji)"
          >
            {{ emoji }}
          </button>
        </div>
      </div>
    </MessageInputPanelH5>

    <MessageInputPanelH5
      :open="mode === 'action'"
      :anchor-element="barRef"
      size="inset"
      @update:open="handleModePanelOpenChange('action', $event)"
    >
      <div
        :class="$style['message-input-h5__action-panel']"
        @touchmove.stop
      >
        <div :class="$style['message-input-h5__action-grid']">
          <template v-for="item in actionPanelItems" :key="item.id">
            <!-- Builtin action: picker component wraps H5 card -->
            <component
              :is="item.pickerComponent"
              v-if="item.pickerComponent"
              :disabled="disabled"
            >
              <div :class="$style['message-input-h5__action-item']">
                <div :class="$style['message-input-h5__action-icon-wrapper']">
                  <component
                    :is="item.icon"
                    :size="28"
                    :class="$style['message-input-h5__action-icon']"
                  />
                </div>
                <span :class="$style['message-input-h5__action-label']">
                  {{ item.customLabel ?? t(item.labelKey!) }}
                </span>
              </div>
            </component>
            <!-- Custom component: rendered directly -->
            <component
              :is="item.customComponent"
              v-else-if="item.customComponent"
              :disabled="disabled"
              v-bind="item.customProps"
            />
          </template>
        </div>
      </div>
      <!-- Safe Area Bottom Padding -->
      <div :class="$style['message-input-h5__safe-area-bottom']" />
    </MessageInputPanelH5>
    <slot name="footerToolbar" />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, nextTick, watch, provide, onBeforeUnmount, useSlots } from 'vue';
import type { Component } from 'vue';
import { IconCall1, IconFile, IconImage, IconVideo, IconEmoji, IconPlus, IconVideoDefault, IconConference, IconAttach, TUIButton, TUIToast, useUIKit } from '@tencentcloud/uikit-base-component-vue3';
import { useChatContext } from '../../chat-store';
import { useChatUIState } from '../../context/useChatUIState';
import { MessageContentType } from '../../types/messageInput';
import { parseConversationDraftContent, serializeConversationDraftContent } from '../../utils/conversationDraft';
import { deleteLocalConversationDraft, getLocalConversationDraft, setLocalConversationDraft } from '../../utils/conversationDraftStorage';
import { AttachmentPicker, FilePicker, ImagePicker, VideoPicker } from './AttachmentPicker';
import { AudioCallPicker } from './AudioCallPicker';
import { MentionPanelH5 } from './MentionPanelH5';
import { MessageInputPanelH5 } from './MessageInputPanelH5';
import { QuickConferencePicker } from './QuickConferencePicker';
import { QuotedMessagePreview } from './QuotedMessagePreview';
import { VideoCallPicker } from './VideoCallPicker';
import type { CustomAction, MessageInputActions } from './types';
import type { InputContent } from '../../types/messageInput';
import type { SendMessageInputOption } from '@atomicxcore/core';

const { t } = useUIKit();
const slots = useSlots();

// ==================== Types ====================
type InputMode = 'none' | 'text' | 'emoji' | 'action';

interface MentionRecord {
  id: string;
  label: string;
  text: string;
}

interface MentionMember {
  userID: string;
  nickname?: string;
}

interface H5BuiltinConfig {
  component: Component;
  icon: Component;
  labelKey: string;
}

interface H5PanelItem {
  id: string;
  pickerComponent?: Component;
  icon?: Component;
  labelKey?: string;
  customLabel?: string;
  customComponent?: Component;
  customProps?: Record<string, unknown>;
}

interface MessageInputH5Props {
  disabled?: boolean;
  placeholder?: string;
  maxLength?: number;
  channel?: string;
  actions?: MessageInputActions;
}

// ==================== Props ====================
const props = withDefaults(defineProps<MessageInputH5Props>(), {
  disabled: false,
  placeholder: undefined,
  maxLength: 500,
  channel: 'default',
  actions: () => ['EmojiPicker', 'ImagePicker', 'VideoPicker', 'FilePicker', 'AudioCallPicker', 'VideoCallPicker'],
});

// ==================== Emits ====================
const emit = defineEmits<{
  /**
   * Emitted when input area expands (keyboard shows, panel opens, or textarea clicked)
   * Use this to scroll message list to bottom
   */
  (e: 'inputAreaExpand'): void;
}>();

// ==================== Store ====================
const { channel } = props;
provide('channel', channel);
const {
  activeConversation,
  activeConversationID,
  sendMessage,
  setConversationDraft,
} = useChatContext(channel);
const {
  quotedMessage,
  clearQuotedMessage,
  enterTyping,
  leaveTyping,
  pendingInputCommand,
  clearPendingInputCommand,
} = useChatUIState(channel);

// ==================== Refs ====================
const barRef = ref<HTMLElement | null>(null);
const textareaRef = ref<HTMLTextAreaElement | null>(null);

// ==================== State ====================
const inputValue = ref('');
const mode = ref<InputMode>('none');
// Save cursor position before textarea loses focus
const cursorPosition = ref(0);
const mentionRecords = ref<MentionRecord[]>([]);
const mentionTriggerIndex = ref<number | null>(null);
const mentionQuery = ref('');
const isMentionPanelVisible = ref(false);
const isProgrammaticUpdate = ref(false);
const isComposing = ref(false);
const activeConversationDraft = ref<string | undefined>(undefined);
const activeConversationIDSnapshot = ref<string | undefined>(undefined);

// ==================== Computed ====================
const hasValue = computed(() => inputValue.value.trim().length > 0);
const canMention = computed(() => activeConversation.value?.conversationID?.startsWith('GROUP') === true);

// ==================== Actions ====================
const H5_BUILTIN_ACTION_CONFIG: Record<string, H5BuiltinConfig> = {
  ImagePicker: { component: ImagePicker, icon: IconImage, labelKey: 'MessageInput.image' },
  VideoPicker: { component: VideoPicker, icon: IconVideo, labelKey: 'MessageInput.video' },
  FilePicker: { component: FilePicker, icon: IconFile, labelKey: 'MessageInput.file' },
  AttachmentPicker: { component: AttachmentPicker, icon: IconAttach, labelKey: 'MessageInput.file' },
  AudioCallPicker: { component: AudioCallPicker, icon: IconCall1, labelKey: 'MessageInput.audio_call' },
  VideoCallPicker: { component: VideoCallPicker, icon: IconVideoDefault, labelKey: 'MessageInput.video_call' },
  QuickConferencePicker: { component: QuickConferencePicker, icon: IconConference, labelKey: 'MessageInput.conference' },
};

const showEmojiButton = computed(() =>
  props.actions.some(action =>
    typeof action === 'string' ? action === 'EmojiPicker' : action.key === 'EmojiPicker',
  ),
);

const actionPanelItems = computed<H5PanelItem[]>(() =>
  props.actions
    .filter(action => (typeof action === 'string' ? action : action.key) !== 'EmojiPicker')
    .map((action): H5PanelItem | null => {
      if (typeof action === 'string') {
        const config = H5_BUILTIN_ACTION_CONFIG[action];
        if (!config) {
          return null;
        }
        return { id: action, pickerComponent: config.component, icon: config.icon, labelKey: config.labelKey };
      }
      const customAction = action as CustomAction;
      const config = H5_BUILTIN_ACTION_CONFIG[customAction.key];
      if (customAction.component) {
        if (config) {
          return {
            id: customAction.key,
            pickerComponent: customAction.component,
            icon: config.icon,
            labelKey: config.labelKey,
            customLabel: customAction.label,
          };
        }
        return {
          id: customAction.key,
          customComponent: customAction.component,
          customProps: {
            label: customAction.label,
            className: customAction.className,
            style: customAction.style,
            iconSize: customAction.iconSize,
          },
        };
      }
      if (config) {
        return {
          id: customAction.key,
          pickerComponent: config.component,
          icon: config.icon,
          labelKey: config.labelKey,
          customLabel: customAction.label,
        };
      }
      return null;
    })
    .filter((item): item is H5PanelItem => item !== null),
);

/**
 * Placeholder logic:
 * 1. If user provides placeholder (including empty string), always use it
 * 2. If placeholder is undefined and disabled is true, show no placeholder
 * 3. If placeholder is undefined and disabled is false, show default placeholder
 */
const computedPlaceholder = computed(() =>
  props.placeholder ?? (props.disabled ? '' : t('MessageInput.enter_a_message')),
);

function getSendErrorMessage(error: unknown): string {
  const errorCode = (error as { code?: number })?.code;
  switch (errorCode) {
    case 10007:
      return t('MessageInput.you_are_not_in_group');
    case 20009:
      return t('MessageInput.you_are_not_friend');
    default:
      return t('MessageInput.send_failed');
  }
}

function getTextFromInputContent(content: string | InputContent[]): string {
  if (typeof content === 'string') {
    return content;
  }

  return content.map((item) => {
    switch (item.type) {
      case MessageContentType.TEXT:
        return item.content;
      case MessageContentType.EMOJI:
        return item.content.text || item.content.key;
      case MessageContentType.MENTION:
        return `${item.content.mentionSuggestionChar}${item.content.label}`;
      default:
        return '';
    }
  }).join('');
}

// ==================== Watch ====================
watch(() => props.disabled, (newDisabled) => {
  if (newDisabled) {
    inputValue.value = '';
    mentionRecords.value = [];
    mode.value = 'none';
    closeMentionPanel();
    cursorPosition.value = 0;
    leaveTyping().catch(() => {});
    nextTick(() => {
      adjustTextareaHeight();
    });
  }
});

watch(pendingInputCommand, (command) => {
  if (!command) {
    return;
  }

  if (command.type === 'focus') {
    textareaRef.value?.focus();
    clearPendingInputCommand(command.id);
    return;
  }

  if (command.type === 'blur') {
    textareaRef.value?.blur();
    clearPendingInputCommand(command.id);
    return;
  }

  if (command.content === undefined) {
    clearPendingInputCommand(command.id);
    return;
  }

  const commandText = getTextFromInputContent(command.content);
  if (command.type === 'set') {
    inputValue.value = commandText;
    cursorPosition.value = commandText.length;
  } else {
    const cursor = textareaRef.value?.selectionStart ?? cursorPosition.value;
    inputValue.value = `${inputValue.value.slice(0, cursor)}${commandText}${inputValue.value.slice(cursor)}`;
    cursorPosition.value = cursor + commandText.length;
  }

  nextTick(() => {
    adjustTextareaHeight();
    if (command.type === 'insert') {
      textareaRef.value?.setSelectionRange(cursorPosition.value, cursorPosition.value);
    }
    if (command.focus !== false) {
      textareaRef.value?.focus();
    }
  });
  clearPendingInputCommand(command.id);
});

// ==================== Emoji Data ====================
const emojiList = [
  '😀', '😃', '😄', '😁', '😆', '😅', '🤣', '😂',
  '🙂', '🙃', '😉', '😊', '😇', '🥰', '😍', '🤩',
  '😘', '😗', '😚', '😙', '🥲', '😋', '😛', '😜',
  '🤪', '😝', '🤑', '🤗', '🤭', '🤫', '🤔', '🤐',
  '🤨', '😐', '😑', '😶', '😏', '😒', '🙄', '😬',
  '🤥', '😌', '😔', '😪', '🤤', '😴', '😷', '🤒',
  '🤕', '🤢', '🤮', '🤧', '🥵', '🥶', '🥴', '😵',
  '🤯', '🤠', '🥳', '🥸', '😎', '🤓', '🧐', '😕',
  '😟', '🙁', '☹️', '😮', '😯', '😲', '😳', '🥺',
  '😦', '😧', '😨', '😰', '😥', '😢', '😭', '😱',
  '😖', '😣', '😞', '😓', '😩', '😫', '🥱', '😤',
  '😡', '😠', '🤬', '😈', '👿', '💀', '☠️', '💩',
  '👍', '👎', '👏', '🙌', '👐', '🤲', '🤝', '🙏',
  '✌️', '🤞', '🤟', '🤘', '🤙', '👈', '👉', '👆',
  '❤️', '🧡', '💛', '💚', '💙', '💜', '🖤', '🤍',
];

// ==================== Constants ====================
const MAX_TEXTAREA_HEIGHT = 100;
// Min height = line-height (16 * 1.4 = 22.4) + padding (8 * 2 = 16) + border (2) ≈ 40px
const MIN_TEXTAREA_HEIGHT = 40;
// Delay for keyboard to hide before showing panel (in ms)
const KEYBOARD_HIDE_DELAY = 300;

function adjustTextareaHeight(): void {
  const textarea = textareaRef.value;
  if (!textarea) {
    return;
  }

  // Temporarily set height to min to get accurate scrollHeight
  textarea.style.height = `${MIN_TEXTAREA_HEIGHT}px`;

  // Calculate new height, respecting min and max
  const { scrollHeight } = textarea;
  const newHeight = Math.max(MIN_TEXTAREA_HEIGHT, Math.min(scrollHeight, MAX_TEXTAREA_HEIGHT));
  textarea.style.height = `${newHeight}px`;

  // Toggle overflow based on content
  textarea.style.overflowY = scrollHeight > MAX_TEXTAREA_HEIGHT ? 'auto' : 'hidden';
}

// ==================== Mode Handlers ====================
function saveCursorPosition(): void {
  const textarea = textareaRef.value;
  if (textarea) {
    cursorPosition.value = textarea.selectionStart ?? inputValue.value.length;
  }
}

function handleTextareaFocus(): void {
  mode.value = 'text';
  updateMentionPanel();
  emit('inputAreaExpand');
}

function handleTextareaBlur(): void {
  saveCursorPosition();
  leaveTyping().catch(() => {});
}

/**
 * Prevent textarea from gaining focus when panel is open.
 * This avoids Safari's viewport jump when keyboard appears while panel is visible.
 */
function handleTextareaMousedown(e: MouseEvent): void {
  if (mode.value === 'emoji' || mode.value === 'action') {
    // Prevent focus when panel is open to avoid keyboard + panel conflict
    e.preventDefault();
    // Close the panel instead
    mode.value = 'none';
  }
}

function handleTextareaInput(): void {
  saveCursorPosition();
  adjustTextareaHeight();
  if (!isProgrammaticUpdate.value && !isComposing.value && inputValue.value.trim().length > 0) {
    enterTyping().catch(() => {});
  }
  updateMentionPanel();
}

function handleTextareaKeyup(): void {
  saveCursorPosition();
  updateMentionPanel();
}

function handleCompositionEnd(): void {
  isComposing.value = false;
  handleTextareaInput();
}

function handleEmojiClick(): void {
  if (mode.value === 'emoji') {
    // If already in emoji mode, just close panel (don't focus textarea)
    mode.value = 'none';
  } else {
    const wasInTextMode = mode.value === 'text';
    // Blur textarea first to hide keyboard
    blurTextarea();

    if (wasInTextMode) {
      // Delay showing panel to wait for keyboard to hide
      setTimeout(() => {
        mode.value = 'emoji';
        emit('inputAreaExpand');
      }, KEYBOARD_HIDE_DELAY);
    } else {
      mode.value = 'emoji';
      emit('inputAreaExpand');
    }
  }
}

function handlePlusClick(): void {
  if (mode.value === 'action') {
    // If already in action mode, just close panel (don't focus textarea)
    mode.value = 'none';
  } else {
    const wasInTextMode = mode.value === 'text';
    // Blur textarea first to hide keyboard
    blurTextarea();

    if (wasInTextMode) {
      // Delay showing panel to wait for keyboard to hide
      setTimeout(() => {
        mode.value = 'action';
        emit('inputAreaExpand');
      }, KEYBOARD_HIDE_DELAY);
    } else {
      mode.value = 'action';
      emit('inputAreaExpand');
    }
  }
}

function blurTextarea(): void {
  textareaRef.value?.blur();
}

function handleModePanelOpenChange(panelMode: Extract<InputMode, 'emoji' | 'action'>, open: boolean): void {
  if (!open && mode.value === panelMode) {
    mode.value = 'none';
  }
}

// ==================== Send Handler ====================
async function handleSend(): Promise<void> {
  const text = inputValue.value.trim();
  if (!text || props.disabled) {
    return;
  }

  const atUserList = getValidMentionRecords().map(record => record.id);
  const sendOption: SendMessageInputOption = {};
  if (atUserList.length > 0) {
    sendOption.atUserList = [...new Set(atUserList)];
  }
  if (quotedMessage.value) {
    sendOption.quotedMessage = quotedMessage.value;
  }

  inputValue.value = '';
  mentionRecords.value = [];
  closeMentionPanel();
  nextTick(() => {
    adjustTextareaHeight();
  });

  try {
    await sendMessage(
      { type: 'textMessage', text },
      Object.keys(sendOption).length > 0 ? sendOption : undefined,
    );

    const sendingConversationID = activeConversation.value?.conversationID;
    if (sendingConversationID) {
      deleteLocalConversationDraft(sendingConversationID).catch(() => {});
      setConversationDraft(sendingConversationID, '').catch(() => {});
    }
    clearQuotedMessage();
    leaveTyping().catch(() => {});
  } catch (error) {
    TUIToast.error({
      message: getSendErrorMessage(error),
    });
  }
}

// ==================== Emoji Handler ====================
function insertEmoji(emoji: string): void {
  // Use saved cursor position since textarea is blurred
  const pos = cursorPosition.value;
  const before = inputValue.value.substring(0, pos);
  const after = inputValue.value.substring(pos);

  inputValue.value = before + emoji + after;

  // Update saved cursor position
  cursorPosition.value = pos + emoji.length;

  nextTick(() => {
    adjustTextareaHeight();
  });
}

// ==================== Mention Handler ====================
function closeMentionPanel(): void {
  isMentionPanelVisible.value = false;
  mentionTriggerIndex.value = null;
  mentionQuery.value = '';
}

function handleMentionPanelOpenChange(open: boolean): void {
  if (!open) {
    closeMentionPanel();
  }
}

function handleMentionPanelTouchStart(): void {
  saveCursorPosition();
  blurTextarea();
}

function updateMentionPanel(): void {
  if (!canMention.value || props.disabled) {
    closeMentionPanel();
    return;
  }

  const cursor = cursorPosition.value;
  const textBeforeCursor = inputValue.value.slice(0, cursor);
  const atIndex = textBeforeCursor.lastIndexOf('@');
  if (atIndex < 0) {
    closeMentionPanel();
    return;
  }

  const query = textBeforeCursor.slice(atIndex + 1);
  if (/\s/.test(query)) {
    closeMentionPanel();
    return;
  }

  mentionTriggerIndex.value = atIndex;
  mentionQuery.value = query;
  isMentionPanelVisible.value = true;
}

function handleMentionSelect(member: MentionMember): void {
  const textarea = textareaRef.value;
  const cursor = textarea?.selectionStart ?? cursorPosition.value;
  const start = mentionTriggerIndex.value ?? cursor;
  const label = member.nickname || member.userID;
  const mentionText = `@${label}`;
  const insertText = `${mentionText} `;

  inputValue.value = `${inputValue.value.slice(0, start)}${insertText}${inputValue.value.slice(cursor)}`;
  mentionRecords.value.push({
    id: member.userID,
    label,
    text: mentionText,
  });

  cursorPosition.value = start + insertText.length;
  closeMentionPanel();
  nextTick(() => {
    adjustTextareaHeight();
    textareaRef.value?.focus();
    textareaRef.value?.setSelectionRange(cursorPosition.value, cursorPosition.value);
  });
}

function getValidMentionRecords(): MentionRecord[] {
  return mentionRecords.value.filter(record => inputValue.value.includes(record.text));
}

function createInputContentFromState(): InputContent[] {
  const content: InputContent[] = [];
  const validRecords = getValidMentionRecords()
    .map(record => ({ ...record, index: inputValue.value.indexOf(record.text) }))
    .filter(record => record.index >= 0)
    .sort((a, b) => a.index - b.index);

  let cursor = 0;
  validRecords.forEach((record) => {
    if (record.index < cursor) {
      return;
    }
    const before = inputValue.value.slice(cursor, record.index);
    if (before) {
      content.push({ type: MessageContentType.TEXT, content: before });
    }
    content.push({
      type: MessageContentType.MENTION,
      content: {
        id: record.id,
        label: record.label,
        mentionSuggestionChar: '@',
      },
    });
    cursor = record.index + record.text.length;
  });

  const after = inputValue.value.slice(cursor);
  if (after) {
    content.push({ type: MessageContentType.TEXT, content: after });
  }

  return content;
}

function setDraftContent(content: string | InputContent[] | undefined): void {
  isProgrammaticUpdate.value = true;
  try {
    mentionRecords.value = [];
    if (typeof content === 'string' || content === undefined) {
      inputValue.value = content ?? '';
      return;
    }

    const textParts: string[] = [];
    content.forEach((item) => {
      if (item.type === MessageContentType.TEXT) {
        textParts.push(item.content);
      } else if (item.type === MessageContentType.MENTION) {
        const mentionText = `${item.content.mentionSuggestionChar}${item.content.label}`;
        mentionRecords.value.push({
          id: item.content.id,
          label: item.content.label,
          text: mentionText,
        });
        textParts.push(mentionText);
      } else if (item.type === MessageContentType.EMOJI) {
        textParts.push(item.content.text || item.content.key);
      }
    });
    inputValue.value = textParts.join('');
  } finally {
    isProgrammaticUpdate.value = false;
  }
}

function saveCurrentDraft(conversationID: string): void {
  const draft = serializeConversationDraftContent(createInputContentFromState());
  setLocalConversationDraft(conversationID, draft).catch(() => {});
  setConversationDraft(conversationID, draft).catch(() => {});
}

function restoreDraft(draft: string | undefined, conversationID: string | undefined): void {
  if (!conversationID) {
    setDraftContent('');
    return;
  }

  getLocalConversationDraft(conversationID).then((localDraft) => {
    if (activeConversationIDSnapshot.value !== conversationID) {
      return;
    }
    setDraftContent(parseConversationDraftContent(localDraft ?? draft));
    nextTick(() => {
      adjustTextareaHeight();
    });
  });
}

watch(() => activeConversation.value?.draft, (draft) => {
  activeConversationDraft.value = draft;
}, { immediate: true });

watch(activeConversationID, (conversationID) => {
  activeConversationIDSnapshot.value = conversationID;
}, { immediate: true });

watch(activeConversationID, (newConversationID, oldConversationID) => {
  if (oldConversationID) {
    saveCurrentDraft(oldConversationID);
  }
  restoreDraft(activeConversationDraft.value, newConversationID);
}, { immediate: true });

onBeforeUnmount(() => {
  if (activeConversationID.value) {
    saveCurrentDraft(activeConversationID.value);
  }
  leaveTyping().catch(() => {});
});

// ==================== Public Methods ====================
/**
 * Collapse the panel (emoji/action) if open
 * Call this when user taps outside the input area
 */
function collapsePanel(): void {
  if (mode.value === 'emoji' || mode.value === 'action') {
    mode.value = 'none';
  }
}

/**
 * Check if panel is currently open
 */
function isPanelOpen(): boolean {
  return mode.value === 'emoji' || mode.value === 'action';
}

defineExpose({
  collapsePanel,
  isPanelOpen,
});
</script>

<style lang="scss" module>
.message-input-h5 {
  position: relative;
  background-color: var(--bg-color-operate);
  // Disable tap highlight on mobile webkit browsers
  -webkit-tap-highlight-color: transparent;
  border-top: 1px solid var(--stroke-color-secondary);

  // Input Bar
  &__bar {
    display: flex;
    align-items: flex-end;
    padding: 12px 12px;
    gap: 8px;
  }

  &__input-wrapper {
    display: flex;
    align-items: center;
    flex: 1;
    min-width: 0;
    border-radius: 16px;
    background-color: var(--bg-color-input);
  }

  &__left-inline,
  &__right-inline,
  &__input-prefix,
  &__input-suffix {
    display: flex;
    align-items: center;
    flex-shrink: 0;
  }

  &__textarea {
    width: 100%;
    min-height: 40px;
    max-height: 100px;
    padding: 8px 12px;
    border-radius: 16px;
    background-color: transparent;
    color: var(--text-color-primary);
    font-size: 16px;
    line-height: 1.4;
    resize: none;
    outline: none;
    box-sizing: border-box;
    overflow-y: hidden;
    border: none;

    &::placeholder {
      color: var(--text-color-secondary);
    }

    &:focus {
      // border-color: var(--text-color-link, #007aff);
    }

    &:disabled {
      background-color: var(--bg-color-bubble-reciprocal);
      cursor: not-allowed;
    }
  }

  // Action Buttons
  &__actions {
    display: flex;
    align-items: center;
    gap: 4px;
    flex-shrink: 0;
    padding-bottom: 4px;
  }

  &__action-btn {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 32px;
    height: 32px;
    padding: 0;
    border: none;
    border-radius: 50%;
    background-color: transparent;
    color: var(--text-color-secondary);
    cursor: pointer;
    transition: background-color 0.2s, color 0.2s;

    &:active {
      background-color: var(--bg-color-hover);
    }

    &:disabled {
      opacity: 0.5;
      cursor: not-allowed;
    }

    &--active {
      color: var(--text-color-link);
    }
  }

  // Emoji Panel - with scroll lock for iOS
  &__emoji-panel {
    height: 220px;
    overflow-y: auto;
    -webkit-overflow-scrolling: touch;
    // Prevent iOS scroll chaining (bounce effect propagating to parent)
    overscroll-behavior-y: contain;
  }

  &__emoji-list {
    display: flex;
    flex-wrap: wrap;
    padding: 12px;
    gap: 4px;
  }

  &__emoji-item {
    display: flex;
    align-items: center;
    justify-content: center;
    width: calc((100% - 28px) / 8);
    aspect-ratio: 1;
    padding: 0;
    border: none;
    border-radius: 8px;
    background-color: transparent;
    font-size: 24px;
    cursor: pointer;
    transition: background-color 0.2s;

    &:active {
      background-color: var(--bg-color-hover);
    }
  }

  // Action Panel - with scroll lock for iOS
  &__action-panel {
    height: 220px;
    padding: 20px;
    box-sizing: border-box;
    overflow-y: auto;
    // Prevent iOS scroll chaining
    overscroll-behavior-y: contain;
  }

  &__action-grid {
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    gap: 20px;
  }

  &__action-item {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 8px;
  }

  &__action-icon-wrapper {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 56px;
    height: 56px;
    border-radius: 12px;
    background-color: var(--bg-color-input);
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  }

  &__action-icon {
    width: 28px;
    height: 28px;
    color: var(--icon-color-primary);
  }

  &__action-label {
    font-size: 12px;
    color: var(--text-color-secondary);
  }

  // Safe Area Bottom - for iPhone home indicator
  &__safe-area-bottom {
    height: env(safe-area-inset-bottom, 0);
    background-color: var(--bg-color-operate);
  }
}
</style>
