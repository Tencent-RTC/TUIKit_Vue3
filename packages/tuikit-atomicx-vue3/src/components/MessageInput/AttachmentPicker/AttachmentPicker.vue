<template>
  <div :class="[styles['attachment-picker']]">
    <template v-if="isCollapsed">
      <PopoverRoot>
        <PopoverTrigger as="div">
          <slot>
            <IconPlus
              :class="styles['attachment-picker__icon']"
              size="20"
            />
          </slot>
        </PopoverTrigger>
        <PopoverPortal>
          <PopoverContent
            side="top"
            align="start"
            :side-offset="5"
          >
            <div :class="styles['attachment-picker__popup']">
              <component
                :is="picker.Component"
                v-for="(picker, index) in pickerItems"
                :key="index"
                v-bind="picker.props"
              />
            </div>
          </PopoverContent>
        </PopoverPortal>
      </PopoverRoot>
    </template>
    <template v-else>
      <div :class="styles['attachment-picker--expanded']">
        <component
          :is="picker.Component"
          v-for="(picker, index) in pickerItems"
          :key="index"
          v-bind="picker.props"
        />
      </div>
    </template>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { useUIKit, IconPlus } from '@tencentcloud/uikit-base-component-vue3';
import { PopoverContent, PopoverPortal, PopoverRoot, PopoverTrigger } from 'reka-ui';
import styles from './AttachmentPicker.module.scss';
import FilePicker from './FilePicker.vue';
import ImagePicker from './ImagePicker.vue';
import VideoPicker from './VideoPicker.vue';

interface Props {
  attachmentPickerMode?: 'collapsed' | 'expanded';
}

const ICON_SIZE = {
  COLLAPSED: 18,
  EXPANDED: 24,
};

const props = withDefaults(defineProps<Props>(), {
  attachmentPickerMode: 'collapsed',
});

const { t } = useUIKit();
const isCollapsed = computed(() => props.attachmentPickerMode === 'collapsed');

const pickerItems = computed(() => [
  { type: 'file', Component: FilePicker },
  { type: 'image', Component: ImagePicker },
  { type: 'video', Component: VideoPicker },
].map(({ type, Component }) => ({
  Component,
  props: {
    label: isCollapsed.value ? t(`MessageInput.${type}`) : '',
    iconSize: isCollapsed.value ? ICON_SIZE.COLLAPSED : ICON_SIZE.EXPANDED,
  },
})));
</script>
