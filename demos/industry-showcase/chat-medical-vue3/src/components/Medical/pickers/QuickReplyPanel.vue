<script setup lang="ts">
import { ref } from 'vue';
import { useMessageInputState } from '@tencentcloud/chat-uikit-vue3';
import { Zap, Send } from 'lucide-vue-next';

const emit = defineEmits<{
  close: [];
}>();

const { sendMessage, setContent } = useMessageInputState();

const quickReplies = [
  { id: 'greeting', text: '您好，请问有什么可以帮您的？' },
  { id: 'wait', text: '请稍等，我正在查看您的病历资料。' },
  { id: 'confirm', text: '好的，我已了解您的情况。' },
  { id: 'advice', text: '根据您的症状，建议您进行以下检查：' },
  { id: 'followup', text: '请按时复诊，如有不适及时联系。' },
  { id: 'prescription', text: '我已为您开具处方，请查看。' },
];

const hoveredId = ref<string | null>(null);

const handleSelect = (text: string) => {
  setContent(text);
  emit('close');
};

const handleSend = (text: string) => {
  sendMessage(text);
  emit('close');
};
</script>

<template>
  <div class="qr-panel">
    <!-- Header -->
    <div class="qr-panel__header">
      <div class="qr-panel__title">
        <Zap :size="16" class="qr-panel__title-icon" />
        <span>快捷回复</span>
      </div>
      <button class="qr-panel__close" @click="emit('close')">
        ✕
      </button>
    </div>

    <!-- Body -->
    <div class="qr-panel__body">
      <div
        v-for="reply in quickReplies"
        :key="reply.id"
        class="qr-item"
        :class="{ 'qr-item--hovered': hoveredId === reply.id }"
        @mouseenter="hoveredId = reply.id"
        @mouseleave="hoveredId = null"
        @click="handleSelect(reply.text)"
      >
        <div class="qr-item__text">
          {{ reply.text }}
        </div>
        <button
          class="qr-item__send"
          @click.stop="handleSend(reply.text)"
        >
          <span>发送</span>
          <Send :size="12" />
        </button>
      </div>
    </div>
  </div>
</template>

<style scoped>
.qr-panel {
  width: 360px;
  max-height: 400px;
  background: #fff;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.qr-panel__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 10px 6px;
  border-bottom: 1px solid #e5e7eb;
  flex-shrink: 0;
}

.qr-panel__title {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 13px;
  font-weight: 500;
  color: #111827;
}

.qr-panel__title-icon {
  color: #0ABF77;
}

.qr-panel__close {
  width: 24px;
  height: 24px;
  display: flex;
  align-items: center;
  justify-content: center;
  border: none;
  background: transparent;
  border-radius: 4px;
  color: #6b7280;
  cursor: pointer;
  font-size: 12px;
}

.qr-panel__close:hover {
  background: #f3f4f6;
}

.qr-panel__body {
  flex: 1;
  overflow-y: auto;
  padding: 10px 6px;
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.qr-item {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px 12px;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.15s ease;
  background: #fff;
}

.qr-item--hovered {
  background: #f9fafb;
}

.qr-item__text {
  flex: 1;
  font-size: 13px;
  color: #374151;
  line-height: 1.4;
}

.qr-item__send {
  flex-shrink: 0;
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 4px 8px;
  border: none;
  border-radius: 4px;
  font-size: 12px;
  cursor: pointer;
  transition: all 0.15s ease;
  background: #f3f4f6;
  color: #6b7280;

  &:hover {
    background: #0ABF77;
    color: #fff;
  }
}
</style>
