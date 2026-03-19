<template>
  <div class="container">
    <div class="container-header">
      <Segmented v-show="currentPage === 'home'" />
      <Return v-show="isShowReturn" @back="goBack" />
      <ShowUserID />
    </div>
    <div class="container-content">
      <slot />
    </div>
  </div>
</template>

<script lang="ts" setup>
import { computed, toRefs } from 'vue';
import { useUserInfo } from '../../../hooks/index';
import Segmented from '../../common/Segmented/Segmented.vue';
import Return from '../../common/Return/Return.vue';
import ShowUserID from '../ShowUserID/ShowUserID.vue';

const emit = defineEmits(['back']);
const userInfo = toRefs(useUserInfo());
const currentPage = computed(() => userInfo?.currentPage?.value || 'home');

const isShowReturn = computed(() => {
  return currentPage.value === 'call' || currentPage.value === 'groupCall';
});

const goBack = () => {
  emit('back');
}

</script>

<style lang="scss">
.container {
  width: 680px;
  height: 450px;
  margin-top: 35px;
  margin-bottom: 20px;

  background: #FFFFFF;
  box-shadow: 0px 2px 3px rgba(197, 210, 230, 0.3), 0px 8px 30px rgba(197, 210, 229, 0.3);
  border-radius: 24px;

  .container-header {
    height: 64px;
    padding: 0 36px;
    display: flex;
    justify-content: space-between;
    align-items: center;
    border-bottom: 1px solid rgba(228, 232, 238, 0.6);
    border-radius: 24px 24px 0 0;
    background: rgba(240, 244, 250, 0.3);

    .title {
      font-weight: 500;
      font-size: 14px;
      color: #4F586B;
    }
    .icon-copy {
      display: flex;
      gap: 0 4px;
      align-items: center;
      justify-content: center;
      cursor: pointer;
    }
  }

  .container-content {
    display: flex;
    justify-content: center;
  }
}
</style>
