<template>
  <RtcSlider :tabItems="tabItems" :selectedValue="selectedValue" @change="onChange" />
</template>

<script lang="ts" setup>
import { ref, computed } from 'vue';
import { RtcSlider } from '@/components';
import { useUIKit } from '@tencentcloud/uikit-base-component-vue3';

const { t } = useUIKit();

const props = defineProps<{
  activeScene: string;
}>();
const emit = defineEmits(['change-scene']);

const tabItems = computed(() => [
  {
    value: t('detail.tab.chat'),
    icon: 'chat',
    scene: 'chatkit'
  },
  {
    value: t('detail.tab.call'),
    icon: 'call',
    scene: 'callkit'
  },
  // {
  //   value: t('detail.tab.meeting'),
  //   icon: 'audio',
  //   scene: 'roomkit'
  // },
  // {
  //   value: t('detail.tab.live'),
  //   icon: 'signal',
  //   scene: 'live'
  // }
]);

const findIndex = computed(() => {
  return tabItems.value.findIndex(item => item.scene === props.activeScene);
});

const selectedValue = ref(findIndex.value >= 0 ? findIndex.value : 0);

const onChange = (val: number) => {
  selectedValue.value = val;
  emit('change-scene', tabItems.value[val].scene);
};
</script>
