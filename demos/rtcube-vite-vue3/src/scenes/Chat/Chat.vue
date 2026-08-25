<script lang="ts" setup>
import { ref, watch } from 'vue';
import { useUIKit } from '@tencentcloud/uikit-base-component-vue3';
import { IndustrySwitcher } from '../../components/IndustrySwitcher';
import GeneralChat from './GeneralChat.vue';
import MedicalChat from './MedicalChat.vue';

const MEDICAL_THEME = { themeStyle: 'light', primaryColor: '#2ba471' };

const { setTheme } = useUIKit();

const props = defineProps<{
  activeSubScene?: string;
}>();

const emit = defineEmits<{
  (e: 'switchScene', scene: string): void;
  (e: 'switchSubScene', subScene: string): void;
}>();

const currentSubScene = ref<string>(props.activeSubScene || 'general');

watch(() => props.activeSubScene, (val) => {
  if (val) {
    currentSubScene.value = val;
  }
});

const handleSubSceneChange = (subScene: string) => {
  currentSubScene.value = subScene;
  emit('switchSubScene', subScene);
};

const handleSwitchScene = (scene: string) => {
  emit('switchScene', scene);
};

// Switch theme when sub-scene changes
watch(currentSubScene, (val) => {
  setTheme(val === 'medical' ? MEDICAL_THEME : 'light');
}, { immediate: true });
</script>

<template>
  <div class="chat-with-switcher">
    <IndustrySwitcher
      :active="currentSubScene"
      @change="handleSubSceneChange"
    />
    <GeneralChat
      v-if="currentSubScene !== 'medical'"
      class="chat-main"
      @switch-scene="handleSwitchScene"
    />
    <MedicalChat
      v-else
      class="chat-main"
      @switch-scene="handleSwitchScene"
    />
  </div>
</template>

<style scoped lang="scss">
.chat-with-switcher {
  flex: 1;
  min-width: 1145px;
  max-height: 1080px;
  display: flex;
  gap: 16px;
  padding: 40px;
  box-sizing: border-box;
}

.chat-main {
  display: flex;
  flex: 1;
  max-width: 1080px;
  box-shadow:
    0 4px 24px rgba(0, 0, 0, 0.08),
    inset 0 -1px 0 rgba(255, 255, 255, 0.05);
  border-radius: 24px;
  overflow: hidden;
}

@media screen and (max-width: 1680px) {
  .chat-main {
    max-width: 100% !important;
  }
}
</style>
