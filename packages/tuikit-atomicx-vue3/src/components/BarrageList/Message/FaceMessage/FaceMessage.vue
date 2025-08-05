<template>
  <div :class="cs('face-message')">
    <img
      :src="messageContent.url"
      :alt="messageContent.name"
    >
  </div>
</template>

<script lang="ts" setup>
import cs from 'classnames';
import type { IMessageModel } from '@tencentcloud/chat-uikit-engine';

interface IFaceMessageProps {
  message: IMessageModel;
}

interface IFaceMessageContent {
  /** sender show name */
  showName: string;
  /** face image name [yz00@2x] */
  name: string;
  /** face image type[duplicate] */
  type: string;
  /** face image url */
  url: string;
}

const props = withDefaults(defineProps<IFaceMessageProps>(), {
  message: () => ({} as IMessageModel),
});

const messageContent = props.message.getMessageContent() as IFaceMessageContent;
</script>

<style lang="scss" scoped>
.face-message {
  // Face message styles will be implemented here
  width: 150px;
  height: 150px;
  padding: 10px;
}
</style>
