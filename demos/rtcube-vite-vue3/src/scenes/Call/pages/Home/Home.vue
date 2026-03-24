<template>
  <HomePC v-if="!isH5" @goCall="goCall" @goGroupCall="goGroupCall" />
  <HomeH5 v-else @goCall="goCall" @goGroupCall="goGroupCall" />
</template>
<script lang="ts" setup>
import { isH5 } from '../../utils';
import HomePC from './PC/Home.vue';
import HomeH5 from './H5/Home.vue';

const emit = defineEmits(['goCall', 'goGroupCall']);

const goCall = () => {
  emit('goCall');
}
const goGroupCall = () => {
  emit('goGroupCall');
}

</script>
