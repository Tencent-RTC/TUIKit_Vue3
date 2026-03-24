<template>
  <div class="return-container" @click="goBack">
    <Icon :src="ReturnSrc" :size="16" />
    {{ t('Call Back') }}
  </div>
</template>

<script lang='ts' setup>
import ReturnSrc from '../../../assets/common/return.svg';
import { useLanguage } from '../../../hooks';
import Icon from '../Icon/Icon.vue';

const emit = defineEmits(['back']);
const { t } = useLanguage();

const goBack = () => {
  emit('back');
}

</script>

<style lang="scss" scoped>
.return-container {
  display: flex;
  gap: 0 8px;
  align-items: center;
  font-weight: 500;
  font-size: 14px;
  color: #4F586B;
  cursor: pointer;
}
</style>
