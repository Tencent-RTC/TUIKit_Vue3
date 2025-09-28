<template>
  <div
    :class="[styles['message-input']]"
  >
    <slot name="headerToolbar">
      <div :class="styles['message-input__toolbar']">
        <component
          :is="action.Component"
          v-for="(action, index) in actionList"
          :key="index"
          v-bind="{ ...action.props, ...(action.Component === AttachmentPicker ? { attachmentPickerMode } : {}) }"
        />
      </div>
    </slot>
    <div :class="styles['message-input__wrapper']">
      <QuotedMessagePreview />
      <div :class="styles['message-input__leftInline']">
        <slot name="leftInline" />
      </div>
      <slot name="textEditor">
        <DefaultTextEditor
          :key="disabled ? 'disabled-editor' : 'enabled-editor'"
          :autoFocus="autoFocus"
          :disabled="disabled"
          :placeholder="placeholder"
        >
          <template #inputPrefix>
            <slot name="inputPrefix" />
          </template>
          <template #inputSuffix>
            <slot name="inputSuffix" />
          </template>
        </DefaultTextEditor>
      </slot>
      <div :class="styles['message-input__rightInline']">
        <slot name="rightInline" />
      </div>
    </div>
    <slot name="footerToolbar">
      <div :class="styles['message-input__footerToolbar']">
        <SendButton
          v-if="!hideSendButton"
          :class="styles['message-input__send-button']"
          :disabled="props.disabled"
          @click="sendInputMessage"
        />
      </div>
    </slot>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { useMessageInputState } from '../../states/MessageInputState';
import { AttachmentPicker, FilePicker, ImagePicker, VideoPicker } from './AttachmentPicker';
import { AudioCallPicker } from './AudioCallPicker';
import { EmojiPicker } from './EmojiPicker';
import styles from './MessageInput.module.scss';
import { QuotedMessagePreview } from './QuotedMessagePreview';
import { SendButton } from './SendButton';
import { TextEditor as DefaultTextEditor } from './TextEditor';
import { VideoCallPicker } from './VideoCallPicker';
import type { CustomAction, MessageInputProps } from './types';

const DEFAULT_ACTIONS = [
  { key: 'EmojiPicker', component: EmojiPicker },
  { key: 'AttachmentPicker', component: AttachmentPicker },
  { key: 'FilePicker', component: FilePicker },
  { key: 'ImagePicker', component: ImagePicker },
  { key: 'VideoPicker', component: VideoPicker },
  { key: 'AudioCallPicker', component: AudioCallPicker },
  { key: 'VideoCallPicker', component: VideoCallPicker },
];

const props = withDefaults(defineProps<MessageInputProps>(), {
  autoFocus: true,
  disabled: false,
  hideSendButton: false,
  placeholder: '',
  attachmentPickerMode: 'collapsed',
  actions: () => ['EmojiPicker', 'ImagePicker', 'FilePicker', 'VideoPicker'],
});

const { inputRawValue, setContent, sendMessage } = useMessageInputState();

const pickProps = <T extends object, K extends keyof T>(
  sourceObject: T,
  propertyKeys: K[],
): Pick<T, K> =>
  Object.fromEntries(
    propertyKeys
      .map(key => [key, sourceObject[key]])
      .filter(([, value]) => value !== undefined),
  ) as Pick<T, K>;

const resolveStringAction = (actionKey: string) => {
  const { component = () => null } = DEFAULT_ACTIONS.find(({ key }) => key === actionKey) ?? {};
  return { Component: component, props: { disabled: props.disabled } };
};

const resolveObjectAction = (action: CustomAction) => {
  const { key: actionKey, component, ...restProps } = action;
  const defaultComponent = DEFAULT_ACTIONS.find(({ key }) => key === actionKey)?.component ?? (() => null);
  return {
    Component: component ?? defaultComponent,
    props: pickProps(restProps, ['label', 'className', 'style', 'iconSize']),
  };
};

const actionList = computed(() =>
  props.actions
    .map(action => typeof action === 'string'
      ? resolveStringAction(action)
      : resolveObjectAction(action as CustomAction))
    .filter(({ Component }) => Component !== null),
);

const sendInputMessage = () => {
  if (inputRawValue.value) {
    sendMessage();
    setContent('');
  }
};
</script>
