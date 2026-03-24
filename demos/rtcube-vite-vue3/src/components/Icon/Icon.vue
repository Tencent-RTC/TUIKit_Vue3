<template>
  <IconCall v-if="props.name === 'call'" :color="props.color" :size="props.size" />
  <IconChat v-if="props.name === 'chat'" :color="props.color" />
  <IconAudio v-if="props.name === 'audio'" :color="props.color" />
  <IconSignal v-if="props.name === 'signal'" :color="props.color" />
</template>

<script lang="ts" setup>
import IconCall from './IconCall.vue';
import IconChat from './IconChat.vue';
import IconAudio from './IconAudio.vue';
import IconSignal from './IconSignal.vue';

interface IconProps {
  /**
   * Icon name
   */
  name?: 'call' | 'chat' | 'audio' | 'signal';
  /**
   * Color
   */
  color?: string;
  /**
   * Size
   */
  size?: string;
}

const props = withDefaults(defineProps<IconProps>(), {
  color: 'currentColor',
});
</script>
