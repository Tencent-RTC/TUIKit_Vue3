<template>
  <div class="home-h5">
    <div class="btn-panel">
      <div class="home-btn" @click="goCall">
        <Icon :src="CallSrc" />
        {{ t('1v1 Call') }}
      </div>
      <div class="home-btn" @click="goGroupCall">
        <Icon :src="GroupCallSrc" />
        {{ t('Group Call') }}
      </div>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { useLanguage } from '../../../hooks';
import Icon from '../../../components/common/Icon/Icon.vue';
import CallSrc from '../../../assets/Home/h5-call.svg';
import GroupCallSrc from '../../../assets/Home/h5-groupcall.svg';

const { t } = useLanguage();

const emit = defineEmits(['goCall', 'goGroupCall']);

const goCall = () => {
  emit('goCall');
}
const goGroupCall = () => {
  emit('goGroupCall');
}

</script>


<style lang="scss" scoped>
.home-h5 {
  display: flex;
  flex-direction: column;
  align-items: center;

  .btn-panel {
    margin-top: 50px;
    display: flex;
    gap: 20px 0;
    flex-direction: column;
    align-items: center;
    justify-content: center;

    .home-btn {
      width: 320px;
      height: 60px;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 8px;
      background: linear-gradient(315deg, #006EFF 0%, #0C59F2 98.81%);
      box-shadow: 0px 2px 4px rgba(0, 0, 0, 0.2);
      border-radius: 8px;
      color: #FFFFFF;
      font-weight: 500;
      font-size: 16px;
      cursor: pointer;
    }
  }
}
</style>
