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
import type { ComputedRef } from 'vue';
import { watch, computed } from 'vue';
import { TUISelect, TUIOption } from '@tencentcloud/uikit-base-component-vue3';
import { useI18n } from '../../locales';
import { useDeviceState } from '../../states/DeviceState';
import { VideoQuality } from '../../types';

const { t } = useI18n();

const videoQualityList: ComputedRef<
  { label: string; value: VideoQuality }[]
> = computed(() => [
  { label: t('Low Definition'), value: VideoQuality.Quality360P },
  {
    label: t('Standard Definition'),
    value: VideoQuality.Quality540P,
  },
  { label: t('High Definition'), value: VideoQuality.Quality720P },
  {
    label: t('Super Definition'),
    value: VideoQuality.Quality1080P,
  },
]);

const { localVideoQuality, updateVideoQuality } = useDeviceState();

watch(localVideoQuality, (val: VideoQuality) => {
  updateVideoQuality({ quality: val });
});
</script>

<style lang="scss" scoped>
.select {
  width: 100%;
  font-size: 14px;
}
</style>
