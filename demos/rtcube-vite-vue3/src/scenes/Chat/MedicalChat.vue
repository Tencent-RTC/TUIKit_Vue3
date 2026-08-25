<script lang="ts" setup>
import { computed, onUnmounted, ref, watch } from 'vue';
import {
  ConversationList,
  ContactList,
  ContactInfo,
  Chat,
  MessageList,
  MessageInput,
  MessageType,
  ChatHeader,
  useChatContext,
} from '@tencentcloud/chat-uikit-vue3';
import { IconMenu, useUIKit } from '@tencentcloud/uikit-base-component-vue3';
import { TUICallKit } from '@trtc/calls-uikit-vue';
import { reportMedicalShowroomClick } from '@/utils/aegis';
import { useWelcomeMessage } from './hooks/useWelcomeMessage';
import { AEGIS_SUB_SCENES } from '@/constants/aegis';
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
// Aegis data reporting (remove for GitHub demo)
import type { FilterType } from './components/Medical/ConversationFilterBar.vue';
import type { ConversationInfo } from '@tencentcloud/chat-uikit-vue3';

const medicalRenderers = {
  [MessageType.Custom]: MedicalMessageRenderer,
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
  return (list: ConversationInfo[]) =>
    list.filter(c => getMockStatus(c.conversationID) === target);
});

const handleFilterChange = (filter: FilterType) => {
  statusFilter.value = filter;
};

const emit = defineEmits<{
  (e: 'switchScene', scene: string): void;
}>();

const activeTab = ref<'conversation' | 'contact'>('conversation');
const activeContact = ref();
const isChatSettingShow = ref(false);

const { t, theme, setTheme } = useUIKit();
const { activeConversation } = useChatContext();

// Send the welcome message once when the default conversation opens
useWelcomeMessage(AEGIS_SUB_SCENES.MEDICAL);

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

const goToMedicalShowroom = () => {
  // Report medical showroom click event (remove for GitHub demo)
  reportMedicalShowroomClick();
  window.open('https://github.com/Tencent-RTC/TUIKit_Vue3', '_blank');
};

onUnmounted(() => {
  setTheme('light');
});
</script>

<template>
  <div class="medical-chat-layout">
    <TUICallKit class="call-kit" />

    <!-- SideTab Navigation (reuse existing) -->
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
      <Chat conversationID="C2Cadministrator" class="medical-chat-inner">
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
        <MessageList :message-renderers="medicalRenderers" />
        <MessageInput class="medical-message-input">
          <template #headerToolbar>
            <div class="medical-toolbar">
              <div class="medical-toolbar-actions">
                <MedicalEmojiPicker />
                <MedicalImagePicker />
                <MedicalVideoPicker />
                <MedicalFilePicker />
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

    <!-- Bottom Action -->
    <button class="medical-showroom-btn" @click="goToMedicalShowroom">
      {{ t('scenes.chat.subScenes.medical.showroomDownload') }} →
    </button>
  </div>
</template>

<style lang="scss" scoped>
.medical-chat-layout {
  // max-width: 900px;
  // max-height: 640px;
  // margin: auto;
  // flex: 1;
  // display: flex;
  // flex-direction: row;
  // overflow: hidden;
  // min-height: 0;
  // background-color: var(--bg-color-operate);
  // color: var(--text-color-primary);
  // box-shadow: 0 4px 24px rgba(0, 0, 0, 0.08), inset 0 -1px 0 rgba(255, 255, 255, 0.05);
  // border-radius: 24px;
  position: relative;
}

.medical-showroom-btn {
  position: absolute;
  bottom: 12px;
  right: 16px;
  padding: 6px 16px;
  font-size: 13px;
  font-weight: 500;
  color: #0ABF77;
  background: transparent;
  border: none;
  cursor: pointer;
  border-radius: 6px;
  transition: all 0.2s;
  z-index: 10;

  &:hover {
    background: rgba(10, 191, 119, 0.08);
  }

  &:active {
    background: rgba(10, 191, 119, 0.15);
  }
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

.medical-conversation-header {
  padding: 12px 16px;
  border-bottom: 1px solid var(--stroke-color-primary);
  flex-shrink: 0;
}

.medical-badge {
  display: inline-flex;
  align-items: center;
  padding: 4px 10px;
  font-size: 12px;
  font-weight: 500;
  border-radius: 10px;
  background: rgba(10, 191, 119, 0.1);
  color: #0ABF77;
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
