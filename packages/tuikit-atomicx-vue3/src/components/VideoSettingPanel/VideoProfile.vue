<template>
  <TUISelect
    v-model="localVideoQuality"
    placeholder="placeholder"
    class="select"
    :teleported="false"
    :popper-append-to-body="false"
  >
    <TUIOption
      v-for="(item, index) in videoQualityList"
      :key="index"
      :label="item.label"
      :value="item.value"
    />
  </TUISelect>
</template>

<script setup lang="ts">
import { watch, computed } from 'vue';
import type { ComputedRef } from 'vue';
import { TUIVideoQuality } from '@tencentcloud/tuiroom-engine-js';
import { TUISelect, TUIOption, useUIKit } from '@tencentcloud/uikit-base-component-vue3';
import { useDeviceState } from '../../states/DeviceState';

const { t } = useUIKit();

const videoQualityList: ComputedRef<
  { label: string; value: TUIVideoQuality }[]
> = computed(() => [
  { label: t('Low Definition'), value: TUIVideoQuality.kVideoQuality_360p },
  {
    label: t('Standard Definition'),
    value: TUIVideoQuality.kVideoQuality_540p,
  },
  { label: t('High Definition'), value: TUIVideoQuality.kVideoQuality_720p },
  {
    label: t('Super Definition'),
    value: TUIVideoQuality.kVideoQuality_1080p,
  },
]);

const { localVideoQuality, updateVideoQuality } = useDeviceState();

watch(localVideoQuality, (val: TUIVideoQuality) => {
  updateVideoQuality({ quality: val });
});
</script>

<style lang="scss" scoped>
.select {
  width: 100%;
  font-size: 14px;
}
</style>
