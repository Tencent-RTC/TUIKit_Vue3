<template>
  <div :class="[styles['attachment-picker'], className]">
    <template v-if="isCollapsed">
      <PopoverRoot>
        <PopoverTrigger as="span">
          <IconPlus
            :class="styles['attachment-picker__icon']"
            size="24"
          />
        </PopoverTrigger>
        <PopoverPortal>
          <PopoverContent
            side="top"
            align="start"
            :side-offset="5"
            class="rounded-lg p-5 w-[260px] bg-white shadow-sm border will-change-[transform,opacity] data-[state=open]:data-[side=top]:animate-slideDownAndFade data-[state=open]:data-[side=right]:animate-slideLeftAndFade data-[state=open]:data-[side=bottom]:animate-slideUpAndFade data-[state=open]:data-[side=left]:animate-slideRightAndFade"
          >
            <div class="flex flex-col gap-2.5">
              <div :class="styles['attachment-picker__popup']">
                <component
                  :is="picker.Component"
                  v-for="(picker, index) in pickerItems"
                  :key="index"
                  v-bind="picker.props"
                />
              </div>
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
  className?: string;
  attachmentPickerMode?: 'collapsed' | 'expanded';
}

const ICON_SIZE = {
  COLLAPSED: 18,
  EXPANDED: 24,
};

const props = withDefaults(defineProps<Props>(), {
  className: '',
  attachmentPickerMode: 'collapsed',
});

const { t } = useUIKit();
const isCollapsed = computed(() => props.attachmentPickerMode === 'collapsed');

const pickerItems = computed(() => [
  { type: 'File', Component: FilePicker },
  { type: 'Image', Component: ImagePicker },
  { type: 'Video', Component: VideoPicker },
].map(({ type, Component }) => ({
  Component,
  props: {
    label: isCollapsed.value ? t(`TUIChat.${type}`) : '',
    iconSize: isCollapsed.value ? ICON_SIZE.COLLAPSED : ICON_SIZE.EXPANDED,
  },
})));
</script>
