<template>
  <div
    :class="cs('face-message', {
      'face-message--flow-in': message.flow === 'in',
      'face-message--flow-out': message.flow === 'out',
    })"
  >
    <img
      :src="messageContent.url"
      :alt="messageContent.name"
    >
  </div>
</template>

<script lang="ts" setup>
import cs from 'classnames';
import type { MessageModel } from '../../../../types/engine';

interface FaceMessageProps {
  message: MessageModel;
}

interface FaceMessageContent {
  /** sender show name */
  showName: string;
  /** face image name [yz00@2x] */
  name: string;
  /** face image type[duplicate] */
  type: string;
  /** face image url */
  url: string;
}

const props = withDefaults(defineProps<FaceMessageProps>(), {
  message: () => ({} as MessageModel),
});

const messageContent = {
  url: 'https://web.sdk.qcloud.com/im/assets/face-elem/yz13@2x.png',
  name: 'yz13@2x',
};
</script>

<style lang="scss" scoped>
@use '../bubble-mixins' as bubble;

.face-message {
  @include bubble.bubble-base();
  // Face message styles will be implemented here
  width: 150px;
  height: 150px;
  padding: 10px;
}
</style>
