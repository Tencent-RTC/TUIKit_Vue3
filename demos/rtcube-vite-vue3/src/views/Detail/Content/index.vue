<template>
  <div class="content" :class="activeScene">
    <!-- Call Scene -->
    <Call v-if="activeScene === 'callkit'" />

    <!-- Chat Scene -->
    <Chat v-else-if="activeScene === 'chatkit'" />

    <!-- RoomKit Scene - Placeholder for now -->
    <div v-else-if="activeScene === 'roomkit'" class="scene-placeholder">
      <h2>RoomKit</h2>
      <p>Meeting room feature coming soon</p>
    </div>

    <!-- Default Placeholder -->
    <div v-else class="scene-placeholder">
      <h2>{{ activeScene }}</h2>
      <p>Scene content will be loaded here</p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { toRefs } from 'vue';
import { Call } from '../../../scenes/Call';
import Chat from '../../../scenes/Chat/Chat.vue';

const props = defineProps(['activeScene', 'isInternational']);
const { activeScene } = toRefs(props);
</script>

<style scoped lang="scss">
.content {
  width: 100%;
  height: 100%;
  box-sizing: border-box;
  min-width: 720px;
  min-height: 650px;
  position: relative;
  display: flex;
  justify-content: center;
  align-items: stretch;
  background: #fff;
  border-radius: 20px;
  overflow: hidden;

  &.chatkit {
    min-width: 900px;
    min-height: 700px;
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
</style>
