<template>
  <teleport to="body">
    <transition name="fade">
      <div
        v-if="visible"
        class="uikit-modal-mask"
        @click.self="handleConfirm"
      >
        <div class="uikit-modal-default uikit-modal-container">
          <div class="uikit-modal-header">
            <IconSuccessToast
              v-if="type === 'success'"
              class="uikit-modal-type-icon"
            />
            <IconInfoToast
              v-if="type === 'info'"
              class="uikit-modal-type-icon"
            />
            <IconErrorToast
              v-if="type === 'error'"
              class="uikit-modal-type-icon"
            />
            <IconWarningToast
              v-if="type === 'warning'"
              class="uikit-modal-type-icon"
            />
            <span class="uikit-modal-title">{{ title }}</span>
            <IconClose
              v-if="IS_PC"
              class="uikit-modal-close-icon"
              @click="handleCancel"
            />
          </div>
          <div class="uikit-modal-body">
            {{ content }}
          </div>
          <div class="uikit-modal-footer">
            <TUIButton
              type="default"
              style="min-width: 88px"
              @click="handleCancel"
            >
              {{ t('Cancel') }}
            </TUIButton>
            <TUIButton
              type="primary"
              style="min-width: 88px"
              @click="handleConfirm"
            >
              {{ t('Confirm') }}
            </TUIButton>
          </div>
        </div>
      </div>
    </transition>
  </teleport>
</template>

<script lang="ts" setup>
import {
  withDefaults,
  defineProps,
  defineEmits,
} from 'vue';
import {
  TUIButton,
  IconClose,
  IconSuccessToast,
  IconInfoToast,
  IconErrorToast,
  IconWarningToast,
} from '@tencentcloud/uikit-base-component-vue3';
import { getPlatform } from '@tencentcloud/universal-api';
import { useI18n } from '../../locales';
import type { UIKitModalOptions } from './type';

const IS_PC = getPlatform() === 'pc';
const { t } = useI18n();

interface Props extends UIKitModalOptions {
  visible: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  type: 'info',
  title: '',
  content: '',
  visible: false,
});

const emit = defineEmits<{
  (e: 'confirm'): void;
  (e: 'cancel'): void;
}>();

function handleConfirm() {
  props.onConfirm?.();
  emit('confirm');
}

function handleCancel() {
  props.onCancel?.();
  emit('cancel');
}
</script>

<style lang="scss" src="./index.scss"></style>
