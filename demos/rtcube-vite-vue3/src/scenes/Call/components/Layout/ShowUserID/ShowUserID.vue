<template>
  <div 
    class="icon-copy"
    v-show="loginUserInfo?.userId"
    @click="handleCopy"
  >
    userID: 
    <Text :maxWidth="60"> {{ loginUserInfo?.userId }} </Text>
    <Icon :src="CopySrc" />
  </div>
</template>

<script lang="ts" setup>
import { useLoginState } from '@tencentcloud/chat-uikit-vue3';
import Icon from '../../common/Icon/Icon.vue';
import Text from '../../common/Text/Text.vue';
import CopySrc from '../../../assets/Container/copy.svg';

const { loginUserInfo } = useLoginState();

const handleCopy = () => {
  if (loginUserInfo.value?.userId) {
    navigator.clipboard.writeText(loginUserInfo.value.userId);
  }
}
</script>

<style scoped>
.icon-copy {
  display: flex;
  gap: 0 4px;
  align-items: center;
  justify-content: center;
  font-size: 14px;
  cursor: pointer;
}
</style>
