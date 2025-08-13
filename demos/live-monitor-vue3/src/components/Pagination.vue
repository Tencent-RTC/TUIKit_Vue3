<template>
  <div class="live-pagination">
    <div :class="['first-page', 'button', { disabled: currentPage <= 1 }]" @click="switchPage(1)">
      {{ t('First Page') }}
    </div>
    <div :class="['last-page', 'button', { disabled: currentPage <= 1 }]" @click="switchPage(currentPage - 1)">
      {{ t('Last Page') }}
    </div>
    <div :class="['next-page', 'button', { disabled: !hasMoreData }]" @click="switchPage(currentPage + 1)">
      {{ t('Next Page') }}
    </div>
  </div>
</template>

<script setup lang="ts">
import { onMounted, ref } from 'vue';
import { useLiveMonitorState } from 'tuikit-atomicx-vue3';
import { useUIKit } from '@tencentcloud/uikit-base-component-vue3';
import router from '../router';
import { ErrorCode } from '../types';

const { t } = useUIKit();
const { getLiveList, startPlay, stopPlay } = useLiveMonitorState();
const currentPage = ref(1);
const hasMoreData = ref(true);
const pageSize = 10;
let currentPageLiveList: any[] = [];

const switchPage = async (page: number) => {
  if (page < 1) return;
  if (page > currentPage.value && !hasMoreData.value) return;

  currentPage.value = page;
  stopCurrentPageLive();
  await loadAndPlayNewPage();
};

const stopCurrentPageLive = async () => {
  currentPageLiveList.forEach((item: any) => {
    stopPlay(item.liveId);
  });
};

const loadAndPlayNewPage = async () => {
  currentPageLiveList = await getLiveList(currentPage.value, pageSize);
  hasMoreData.value = currentPageLiveList.length >= pageSize;
  for (const item of currentPageLiveList) {
    startPlay(item.liveId, `live_monitor_view_${item.liveId}`).catch((error: any) => {
      if (error === ErrorCode.LOGIN_TIMEOUT) {
        localStorage.removeItem('tuiLiveMonitor-userInfo');
        router.push('/login');
      }
    });
  }
};

onMounted(() => {
  loadAndPlayNewPage();
});
</script>

<style scoped lang="scss">
.live-pagination {
  display: flex;
  justify-content: space-between;
  width: 400px;
  height: 30px;

  .button {
    display: flex;
    justify-content: center;
    align-items: center;
    width: 30%;
    border-radius: 8px;
    color: var(--text-color-primary);
    background-color: var(--text-color-link);
    font-size: 500;
    cursor: pointer;
    transition: opacity 0.2s ease;

    &.disabled {
      opacity: 0.5;
      cursor: not-allowed;
    }

    &:not(.disabled):hover {
      opacity: 0.8;
    }
  }
}
</style>
