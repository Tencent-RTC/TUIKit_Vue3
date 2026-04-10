<script lang="ts" setup>
import { computed, ref, watch } from 'vue';
import {
  ConversationList,
  ContactList,
  ContactInfo,
  Chat,
  MessageList,
  MessageInput,
  MessageType,
  useUIKit,
  ChatHeader,
  useConversationListState,
} from '@tencentcloud/chat-uikit-vue3';
import { IconMenu } from '@tencentcloud/uikit-base-component-vue3';
import { TUICallKit } from '@trtc/calls-uikit-vue';
import ConversationFilterBar from './components/Medical/ConversationFilterBar.vue';
import MedicalChatSetting from './components/Medical/MedicalChatSetting.vue';
import MedicalConversationPreview from './components/Medical/MedicalConversationPreview.vue';
import MedicalMessageRenderer from './components/Medical/MedicalMessageRenderer.vue';
import MedicalAudioCallPicker from './components/Medical/pickers/MedicalAudioCallPicker.vue';
import MedicalEmojiPicker from './components/Medical/pickers/MedicalEmojiPicker.vue';
import MedicalFilePicker from './components/Medical/pickers/MedicalFilePicker.vue';
import MedicalImagePicker from './components/Medical/pickers/MedicalImagePicker.vue';
import MedicalRecordPicker from './components/Medical/pickers/MedicalRecordPicker.vue';
import MedicalVideoCallPicker from './components/Medical/pickers/MedicalVideoCallPicker.vue';
import MedicalVideoPicker from './components/Medical/pickers/MedicalVideoPicker.vue';
import PrescriptionPicker from './components/Medical/pickers/PrescriptionPicker.vue';
import QuickRatePicker from './components/Medical/pickers/QuickRatePicker.vue';
import QuickReplyPicker from './components/Medical/pickers/QuickReplyPicker.vue';
import { SideTab } from './components/SideTab';
import type { FilterType } from './components/Medical/ConversationFilterBar.vue';
import type { ConversationModel } from '@tencentcloud/chat-uikit-vue3';

const medicalRenderers = {
  [MessageType.CUSTOM]: MedicalMessageRenderer,
};

// Hash function to derive mock status from conversationID (same as MedicalConversationTitle)
const getMockStatus = (id: string): string => {
  let hash = 0;
  for (let i = 0; i < id.length; i++) {
    hash = ((hash << 5) - hash) + id.charCodeAt(i);
  }
  const statuses = ['待问诊', '问诊中', '已结束'];
  return statuses[Math.abs(hash) % 3];
};

const statusFilter = ref<FilterType>('all');

const conversationFilter = computed(() => {
  if (statusFilter.value === 'all') {
    return undefined;
  }
  const statusMap: Record<string, string> = {
    pending: '待问诊',
    active: '问诊中',
    done: '已结束',
  };
  const target = statusMap[statusFilter.value];
  return (list: ConversationModel[]) =>
    list.filter(c => getMockStatus(c.conversationID) === target);
});

const handleFilterChange = (filter: FilterType) => {
  statusFilter.value = filter;
};

const activeTab = ref<'conversation' | 'contact'>('conversation');
const activeContact = ref();
const isChatSettingShow = ref(false);

const { t, theme } = useUIKit();
const { activeConversation } = useConversationListState();

watch(() => activeConversation.value?.conversationID, (newVal, oldVal) => {
  if (newVal !== oldVal) {
    isChatSettingShow.value = false;
  }
});

const handleTabChange = (tab: 'conversation' | 'contact') => {
  activeTab.value = tab;
};

const enterChat = () => {
  activeTab.value = 'conversation';
};
</script>

<template>
  <div class="medical-chat-layout">
    <TUICallKit class="call-kit" />

    <!-- SideTab Navigation -->
    <SideTab
      :active-tab="activeTab"
      @change="handleTabChange"
    />

    <!-- Conversation/Contact List Panel -->
    <div class="medical-conversation-panel">
      <ConversationFilterBar
        v-show="activeTab === 'conversation'"
        @change="handleFilterChange"
      />
      <ConversationList
        v-show="activeTab === 'conversation'"
        :Preview="MedicalConversationPreview"
        :filter="conversationFilter"
        enable-create
      />
      <ContactList v-show="activeTab === 'contact'" />
    </div>

    <!-- Chat Content Panel (conversation tab) -->
    <div v-if="activeTab === 'conversation'" class="medical-chat-content">
      <Chat class="medical-chat-inner">
        <ChatHeader>
          <template #ChatHeaderRight>
            <button
              class="icon-button"
              :title="t('chat.Setting')"
              @click="isChatSettingShow = !isChatSettingShow"
            >
              <IconMenu size="20" />
            </button>
          </template>
        </ChatHeader>
        <MessageList :messageRenderers="medicalRenderers" />
        <MessageInput class="medical-message-input">
          <template #headerToolbar>
            <div class="medical-toolbar">
              <div class="medical-toolbar-actions">
                <MedicalEmojiPicker />
                <MedicalImagePicker />
                <MedicalFilePicker />
                <MedicalVideoPicker />
                <MedicalAudioCallPicker />
                <MedicalVideoCallPicker />
                <MedicalRecordPicker />
                <PrescriptionPicker />
                <QuickReplyPicker />
                <QuickRatePicker />
              </div>
            </div>
          </template>
        </MessageInput>
      </Chat>

      <!-- Medical Chat Setting Sidebar -->
      <div
        v-show="isChatSettingShow"
        class="medical-sidebar"
        :class="{ dark: theme === 'dark' }"
      >
        <MedicalChatSetting @close="isChatSettingShow = false" />
      </div>
    </div>

    <!-- Contact Detail Panel (contact tab) -->
    <ContactInfo
      v-else
      :active-contact-item="activeContact"
      class="medical-contact-detail"
      @send-message="enterChat"
      @enter-group="enterChat"
    />
  </div>
</template>

<style lang="scss" scoped>
.medical-chat-layout {
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: row;
  overflow: hidden;
  background-color: var(--bg-color-operate);
  color: var(--text-color-primary);
}

.call-kit {
  position: fixed;
  width: 800px;
  height: 600px;
  top: 50%;
  left: 50%;
  z-index: 999;
  transform: translate(-50%, -50%);
}

.medical-conversation-panel {
  width: 298px;
  display: flex;
  flex-direction: column;
  overflow-y: auto;
  min-height: 0;
  border-right: 1px solid var(--stroke-color-primary);
}

.medical-chat-content {
  flex: 1;
  display: flex;
  flex-direction: row;
  overflow: hidden;
  min-width: 0;
  position: relative;
}

.medical-chat-inner {
  display: flex;
  flex: 1;
  min-width: 0;
}

.medical-contact-detail {
  height: auto;
}

.medical-message-input {
  border-top: 1px solid var(--stroke-color-primary);
}

.medical-toolbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.medical-toolbar-actions {
  display: flex;
  align-items: center;
  gap: 4px;
}

.icon-button {
  padding: 4px 6px;
  display: flex;
  align-items: center;
  justify-content: center;
  border: none;
  background: transparent;
  border-radius: 4px;
  font-size: 20px;
  color: var(--text-color-primary);
  cursor: pointer;
  transition: background-color 0.2s;
  outline: none;

  &:focus { outline: none; }
  &:hover { background-color: var(--button-color-secondary-hover); }
  &:active { background-color: var(--button-color-secondary-active); }
}

.medical-sidebar {
  position: absolute;
  right: 0;
  top: 0;
  bottom: 0;
  min-width: 358px;
  max-width: 400px;
  display: flex;
  flex-direction: column;
  background-color: var(--bg-color-operate);
  box-shadow: 0 1px 5px var(--shadow-color), 0 8px 12px var(--shadow-color), 0 12px 26px var(--shadow-color);
  overflow-y: auto;
  overflow-x: hidden;
  z-index: 1000;
  scrollbar-width: none;

  &::-webkit-scrollbar {
    display: none;
  }

  &.dark {
    box-shadow: -4px 0 16px rgba(0, 0, 0, 0.4), -1px 0 0 rgba(255, 255, 255, 0.1);
  }
}
</style>
