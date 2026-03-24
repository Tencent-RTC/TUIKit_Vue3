<template>
  <div class="create-user-tip"> 
    <slot />
    <Link 
      href=""
      target="_blank"
      :underline="false"
      @click="openNewWindow"
    > 
      {{ t('Create immediately') }}
    </Link>
  </div>
</template>

<script lang="ts" setup>
import { getUrl } from '../../utils/index';
import { useLanguage, useAegis } from '../../hooks';
import Link from '../common/Link/Link.vue';

const { t } = useLanguage();
const { reportEvent } = useAegis();

const openNewWindow = () => {
  reportEvent({ apiName: 'openNewWindow.start' });
  window.open(getUrl());
}
</script>

<style lang="scss" scoped>
.create-user-tip {
  display: flex;
  gap: 0 5px;
  font-weight: 400;
  font-size: 14px;
  color: #8F9AB2;
}
</style>
