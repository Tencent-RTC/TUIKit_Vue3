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
import { TUISelect, TUIOption, useUIKit } from '@tencentcloud/uikit-base-component-vue3';
import { useDeviceState } from '../../states/DeviceState';
import { VideoQuality } from '../../types';

const { t } = useUIKit();

const videoQualityList: ComputedRef<
  { label: string; value: VideoQuality }[]
> = computed(() => [
  { label: t('VideoSetting.LowDefinition'), value: VideoQuality.Quality360P },
  {
    label: t('VideoSetting.StandardDefinition'),
    value: VideoQuality.Quality540P,
  },
  { label: t('VideoSetting.HighDefinition'), value: VideoQuality.Quality720P },
  {
    label: t('VideoSetting.SuperDefinition'),
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
