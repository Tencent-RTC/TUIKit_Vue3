<template>
  <div class="live-monitor">
    <Header />
    <LiveList />
    <Pagination class="live-pagination" />
  </div>
</template>

<script setup lang="ts">
import { useLiveMonitorState } from 'tuikit-atomicx-vue3';
import { createBasicAccount } from '../config';
import Header from '../components/Header.vue';
import LiveList from '../components/LiveList.vue';
import Pagination from '../components/Pagination.vue';

const account = createBasicAccount();
const { init } = useLiveMonitorState();

if (account) {
  init({
    baseUrl: '',
    account: {
      sdkAppId: account.sdkAppId,
      userId: account.userId,
      password: account.userSig,
    },
  });
}
</script>

<style scoped lang="scss">
.live-monitor {
  position: relative;
  width: 100vw;
  height: 100vh;
  background: var(--bg-color-topbar, rgba(19, 20, 23, 1));
  overflow: hidden;

  .live-pagination {
    position: absolute;
    right: 48px;
    bottom: 16px;
  }
}
</style>
