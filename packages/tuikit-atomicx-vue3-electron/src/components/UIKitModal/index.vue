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
          <div
            class="uikit-modal-body"
            v-html="processedContent"
          />
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
  computed,
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
  (_e: 'confirm'): void;
  (_e: 'cancel'): void;
}>();

const URL_REGEX = /^(https?:\/\/)?([\da-z.-]+)\.([a-z.]{2,6})([/\w .-]*)*\/?$/i;
const FULL_URL_REGEX = /(https?:\/\/[^\s]+)/g;

const processedContent = computed(() => {
  const { content } = props;

  if (!content || typeof content !== 'string') {
    return content;
  }

  if (URL_REGEX.test(content.trim())) {
    const url = content.trim();
    const href = url.startsWith('http') ? url : `https://${url}`;
    return `<a href="${escapeHtml(href)}" target="_blank" rel="noopener noreferrer" class="uikit-modal-link">${escapeHtml(url)}</a>`;
  }

  if (content.includes('<a ') || content.includes('<a>')) {
    return processAnchorTags(content);
  }

  if (FULL_URL_REGEX.test(content)) {
    return escapeHtml(content).replace(FULL_URL_REGEX, url => `<a href="${url}" target="_blank" rel="noopener noreferrer" class="uikit-modal-link">${url}</a>`);
  }

  return escapeHtml(content);
});

function escapeHtml(text: string): string {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

function processAnchorTags(content: string): string {
  const parser = new DOMParser();
  const doc = parser.parseFromString(content, 'text/html');
  const anchors = doc.querySelectorAll('a');
  anchors.forEach((anchor) => {
    const href = anchor.getAttribute('href');
    if (href) {
      anchor.setAttribute('target', '_blank');
      anchor.setAttribute('rel', 'noopener noreferrer');
      anchor.classList.add('uikit-modal-link');
      const originalText = anchor.textContent || '';
      anchor.innerHTML = `<span style="padding: 0 0.2em; display: inline-block; color: var(--text-color-link)">${originalText}</span>`;
    }
  });

  return doc.body.innerHTML;
}

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
