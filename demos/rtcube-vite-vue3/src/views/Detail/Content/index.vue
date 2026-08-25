<template>
  <div class="content" :class="activeScene">
    <!-- Call Scene - Lazy loaded -->
    <Suspense v-if="activeScene === 'callkit'">
      <template #default>
        <Call />
      </template>
      <template #fallback>
        <div class="scene-loading">
          <t-loading size="large" />
        </div>
      </template>
    </Suspense>

    <!-- Chat Scene - Lazy loaded -->
    <Suspense v-else-if="activeScene === 'chatkit'">
      <template #default>
        <Chat 
          :active-sub-scene="activeSubScene"
          @switch-scene="handleSwitchScene"
          @switch-sub-scene="handleSwitchSubScene"
         />
      </template>
      <template #fallback>
        <div class="scene-loading">
          <t-loading size="large" />
        </div>
      </template>
    </Suspense>

    <!-- RoomKit Scene - Lazy loaded -->
    <Suspense v-else-if="activeScene === 'roomkit'">
      <template #default>
        <Room />
      </template>
      <template #fallback>
        <div class="scene-loading">
          <t-loading size="large" />
        </div>
      </template>
    </Suspense>

    <!-- Live Scene - Lazy loaded -->
    <Suspense v-else-if="activeScene === 'live'">
      <template #default>
        <Live />
      </template>
      <template #fallback>
        <div class="scene-loading">
          <t-loading size="large" />
        </div>
      </template>
    </Suspense>

    <!-- Default Placeholder -->
    <div v-else class="scene-placeholder">
      <h2>{{ activeScene }}</h2>
      <p>Scene content will be loaded here</p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { toRefs, defineAsyncComponent } from 'vue';

// Async components - each scene will be loaded on demand as separate chunks
// This significantly reduces initial bundle size from ~6.7MB to much smaller
const Call = defineAsyncComponent(() => import('../../../scenes/Call/Call.vue'));
const Chat = defineAsyncComponent(() => import('../../../scenes/Chat/Chat.vue'));
const Room = defineAsyncComponent(() => import('../../../scenes/Room/Room.vue'));
const Live = defineAsyncComponent(() => import('../../../scenes/Live/Live.vue'));

const props = defineProps(['activeScene', 'activeSubScene', 'isInternational']);
const { activeScene } = toRefs(props);

const emit = defineEmits<{
  (e: 'switchScene', scene: string): void;
  (e: 'switchSubScene', subScene: string): void;
}>();

const handleSwitchScene = (scene: string) => {
  emit('switchScene', scene);
};

const handleSwitchSubScene = (subScene: string) => {
  emit('switchSubScene', subScene);
};
</script>

<style scoped lang="scss">
.content {
  width: 100%;
  height: 100%;
  box-sizing: border-box;
  position: relative;
  display: flex;
  align-items: stretch;
  background: #fff;
  border-radius: 20px;
  overflow: auto;

  &.chatkit {
  }

  &.live {
    min-width: 800px;
  }
}

.scene-placeholder {
  flex: 1;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  text-align: center;
  color: #666;

  h2 {
    font-size: 24px;
    margin-bottom: 10px;
    text-transform: capitalize;
  }

  p {
    font-size: 14px;
  }
}

.scene-loading {
  flex: 1;
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 400px;
}
</style>
