<template>
  <GroupCallPC v-if="!isH5" @back="goBack" />
  <GroupCallH5 v-else @back="goBack" />
</template>

<script lang="ts" setup>
import { isH5 } from '../../utils';
import GroupCallPC from './PC/GroupCall.vue';
import GroupCallH5 from './H5/GroupCall.vue';

const emit = defineEmits(['back']);

const goBack = () => {
  emit('back');
}
</script>
