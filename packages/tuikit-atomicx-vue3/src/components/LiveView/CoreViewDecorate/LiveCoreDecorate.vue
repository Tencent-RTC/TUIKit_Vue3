<template>
  <div class="live-core-decorate" v-if="showLiveCoreDecorate">
    <BattleUserDecorate :seatListWithRealSize="seatListWithRealSize" />
  </div>
  <div
    class="live-core-decorate-cover-stream" v-if="showLiveCoreDecorate"
    :style="{ top: `${minTop}px`, height: `${maxHeight}px`, left: `${minLeft}px`, width: `${maxWidth}px` }"
  >
    <BattleDecorate />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue';
import BattleDecorate from './BattleDecorate.vue';
import BattleUserDecorate from './BattleUserDecorate.vue';
import { SeatUserInfo } from '../../../types';

const props = defineProps<{
  seatListWithRealSize: Array<{ userInfo: SeatUserInfo; region: {
    left: string;
    top: string;
    width: string;
    height: string;
    zIndex: number;
  }}>;
}>();

const showLiveCoreDecorate = ref(false);
watch(() => props.seatListWithRealSize, (val) => {
  if (val.length > 0) {
    showLiveCoreDecorate.value = true;
  }
});

const minTop = computed(() => {
  return props.seatListWithRealSize.reduce((min, item) => {
    return Math.min(min, parseInt(item.region.top));
  }, Infinity);
});

const minLeft = computed(() => {
  return props.seatListWithRealSize.reduce((min, item) => {
    return Math.min(min, parseInt(item.region.left));
  }, Infinity);
});

const maxHeight = computed(() => {
  return props.seatListWithRealSize.reduce((max, item) => {
    return Math.max(max, parseInt(item.region.top) + parseInt(item.region.height) - minTop.value);
  }, 0);
});

const maxWidth = computed(() => {
  return props.seatListWithRealSize.reduce((max, item) => {
    return Math.max(max, parseInt(item.region.left) + parseInt(item.region.width) - minLeft.value);
  }, 0);
});
</script>

<style scoped lang="scss">
.live-core-decorate, .live-core-decorate-cover-stream {
  width: 100%;
  height: 100%;
  position: absolute;
  top: 0;
  left: 0;
  pointer-events: none;
}
</style>
