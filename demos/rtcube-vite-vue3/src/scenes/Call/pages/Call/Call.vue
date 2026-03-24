<template>
  <CallPC v-if="!isH5" @back="goBack" />
  <CallH5 v-else @back="goBack" />
</template>

<script lang="ts" setup>
import { isH5 } from '../../utils';
import CallPC from './PC/Call.vue';
import CallH5 from './H5/Call.vue';

const emit = defineEmits(['back']);

const goBack = () => {
  emit('back');
}
</script>
