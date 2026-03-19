<template>
  <div class="call-h5">
    <div class="header">
      <Icon :src="LeftArrowSrc" @click="goBack"/>
      <p> {{ t('1v1 Call') }} </p>
    </div>
    <div class="content">
      <Input
        class="call-input"
        v-model="calleeUserID"
        :placeholder="placeholderText"
        @input="handleCallUserID"
        @keyup="handleCall"
      >
        <template #prepend> userID </template>
      </Input>
      <div
        class="call-btn"
        @click="handleCall"
      > 
        {{ t('Initiate Call') }}
      </div>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { ref, computed } from 'vue';
import { useLanguage } from '../../../hooks';
import useCall from '../useCall';
import { trim } from '../../../utils';
import Icon from '../../../components/common/Icon/Icon.vue';
import Input from '../../../components/common/Input/Input.vue';
import LeftArrowSrc from '../../../assets/Call/left-arrow.svg';

const { t } = useLanguage();
const { call } = useCall();
const calleeUserID = ref('');

const emit = defineEmits(['back']);

const placeholderText = computed(() => {
  return t('input the userID to Call');
})

const handleCall = async () => {
  await call(calleeUserID);
}

const handleCallUserID = () => {
  calleeUserID.value = trim(calleeUserID.value);
}

const goBack = () => {
  emit('back');
}

</script>

<style lang="scss" scoped>
.call-h5 {
  width: 100%;
  height: 100%;
  background: #f8f9fb;

  .header {
    box-sizing: border-box;
    width: 100%;
    height: 54px;
    padding: 0 16px;
    background: #FFFFFF;
    display: flex;
    align-items: center;

    img {
      cursor: pointer;
    }

    p {
      margin: 0 auto;
      font-weight: 600;
      font-size: 16px;
    }
  }

  .content {
    display: flex;
    flex-direction: column;
    align-items: center;
  }
  .call-input {
    width: 343px;
    height: 62px;
    margin: 19px auto;
    background: #FFFFFF;
    border-radius: 6px;
  }

  .call-btn {
    width: 347px;
    height: 46px;
    margin: 0 auto;
    background: linear-gradient(315deg, #006EFF 0%, #0C59F2 98.81%);
    box-shadow: 0px 2px 4px rgba(0, 0, 0, 0.1);
    border-radius: 10px;
    font-weight: 500;
    font-size: 16px;
    line-height: 46px;
    text-align: center;
    color: #FFFFFF;
    cursor: pointer;
  }
}
</style>
