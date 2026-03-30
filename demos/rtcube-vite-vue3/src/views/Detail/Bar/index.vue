<template>
  <RtcSlider :tabItems="tabItems" :selectedValue="selectedValue" @change="onChange" />
</template>

<script lang="ts" setup>
import { ref, computed, watch } from 'vue';
import { RtcSlider } from '@/components';
import { useUIKit } from '@tencentcloud/uikit-base-component-vue3';
// Unified scene configuration
import { getEnabledScenes, type SceneConfig } from '@/constants';
// Aegis data reporting (remove for GitHub demo)
import { reportSceneSelect } from '@/utils/aegis';

const { t } = useUIKit();

const props = defineProps<{
  activeScene: string;
}>();
const emit = defineEmits(['change-scene']);

// i18n key mapping for tab labels (different from scene labels)
const tabLabelKeyMap: Record<string, string> = {
  chatkit: 'detail.tab.chat',
  callkit: 'detail.tab.call',
  roomkit: 'detail.tab.meeting',
  live: 'detail.tab.live',
};

// Get enabled scenes from unified configuration
const tabItems = computed(() => 
  getEnabledScenes().map((config: SceneConfig) => ({
    value: t(tabLabelKeyMap[config.scene] || config.labelKey),
    icon: config.icon,
    scene: config.scene,
  }))
);

const findIndex = computed(() => {
  return tabItems.value.findIndex(item => item.scene === props.activeScene);
});

const selectedValue = ref(findIndex.value >= 0 ? findIndex.value : 0);

// Watch for external activeScene changes and sync selectedValue
watch(() => props.activeScene, () => {
  const newIndex = findIndex.value;
  if (newIndex >= 0 && newIndex !== selectedValue.value) {
    selectedValue.value = newIndex;
  }
});

const onChange = (val: number) => {
  selectedValue.value = val;
  const scene = tabItems.value[val].scene;
  emit('change-scene', scene);
};
</script>
