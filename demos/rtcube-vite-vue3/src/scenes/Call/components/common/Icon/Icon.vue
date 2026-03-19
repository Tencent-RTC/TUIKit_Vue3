<template>
  <img :src="src" :width="computedWidth" :height="computedHeight"/>
</template>

<script lang="ts" setup>
import { computed } from 'vue';

const props = defineProps({
  src: {
    type: String
  },
  size: {
    type: Number,
  },
  width: {
    type: [Number, String],
  },
  height: {
    type: [Number, String],
  }
});

const computedWidth = computed(() => props.width || props.size);
const computedHeight = computed(() => props.height || props.size);
</script>
