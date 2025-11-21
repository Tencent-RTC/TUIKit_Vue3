<!-- eslint-disable import/extensions -->
<template>
  <div :class="$style.SearchEmpty">
    <IconSearchDefault size="88px" />
    <div :class="$style['SearchEmpty__text']">
      <p :class="$style['SearchEmpty__title']">
        {{ text }}
      </p>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { computed, withDefaults, defineProps } from 'vue';
import { useUIKit, IconSearchDefault } from '@tencentcloud/uikit-base-component-vue3';

interface IEmptyResultProps {
  text?: string;
}

const props = withDefaults(defineProps<IEmptyResultProps>(), {
  text: '',
});

const { t } = useUIKit();

const text = computed(() => props.text || t('Search.status.noContent'));
</script>

<style lang="scss" module>
@use './EmptyResult.scss';
</style>
