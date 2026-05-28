<template>
  <div
    :class="cs('face-message', {
      'face-message--flow-in': !message.isSentBySelf,
      'face-message--flow-out': message.isSentBySelf,
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
import type { MessageInfo } from '@atomicxcore/core';

interface FaceMessageProps {
  message: MessageInfo;
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
  message: () => ({} as MessageInfo),
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
