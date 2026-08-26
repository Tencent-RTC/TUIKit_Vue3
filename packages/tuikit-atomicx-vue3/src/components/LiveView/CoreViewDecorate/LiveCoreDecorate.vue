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
}, { immediate: true });

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
  // Keep PK decorations above both .live-core-ui (z-index: 1) and the local
  // mixer preview. The local user's own seat carries an inline z-index of
  // SELF_SEAT_Z_INDEX (100, set in LiveView/index.vue for pointer hit-testing);
  // in stream-mixer mode that z-index is forwarded onto the .local-mixer-container
  // via the `localVideo` slot, which is a sibling of this decorate layer under
  // .live-core-view. A z-index of 2 would let that mixer preview (100) cover the
  // PK score bars, so we raise the decorate layer above 100.
  z-index: 101;
}
</style>
