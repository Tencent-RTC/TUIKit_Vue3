<template>
  <button
    class="play-button"
    :class="{ 'play-button--playing': isPlaying }"
    @click="onClick"
  >
    <svg
      v-if="isPlaying"
      xmlns="http://www.w3.org/2000/svg"
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      stroke-width="2"
      stroke-linecap="round"
      stroke-linejoin="round"
    >
      <rect x="6" y="4" width="4" height="16" />
      <rect x="14" y="4" width="4" height="16" />
    </svg>
    <svg
      v-else
      xmlns="http://www.w3.org/2000/svg"
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      stroke-width="2"
      stroke-linecap="round"
      stroke-linejoin="round"
      class="play-button__play-icon"
    >
      <polygon points="5 3 19 12 5 21 5 3" />
    </svg>
  </button>
</template>

<script lang="ts" setup>
defineProps<{
  isPlaying: boolean | undefined;
}>();

const emit = defineEmits<{
  (e: 'click'): void;
}>();

const onClick = () => {
  emit('click');
};
</script>

<style lang="scss" scoped>
.play-button {
  flex-shrink: 0;
  width: 40px;
  height: 40px;
  border-radius: 50%;
  border: none;
  background-color: #4080ff;
  color: white;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: background-color 0.2s ease;

  &:hover {
    background-color: #3070ee;
  }

  &__play-icon {
    margin-left: 2px;
  }

  &--playing {
    svg {
      margin-left: 0;
    }
  }
}
</style>
