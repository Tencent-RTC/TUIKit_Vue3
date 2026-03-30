<script lang="ts" setup>
import { h, ref, watch, onMounted, onUnmounted } from 'vue';
import {
  ConversationList,
  Chat,
  MessageList,
  MessageInput,
  ContactList,
  ContactInfo,
  ChatSetting,
  Search,
  VariantType,
  EmojiPicker,
  ImagePicker,
  FilePicker,
  VideoPicker,
  AudioCallPicker,
  VideoCallPicker,
  useUIKit,
  ChatHeader,
  useConversationListState,
} from '@tencentcloud/chat-uikit-vue3';
import { IconMenu, IconHistory3 } from '@tencentcloud/uikit-base-component-vue3';
import { TUICallKit } from '@trtc/calls-uikit-vue';
import { PlaceholderEmpty } from './components/PlaceholderEmpty';
import { SideTab } from './components/SideTab';
import { CapabilityRecommend } from './components/CapabilityRecommend';
import { ToolbarQuickCall } from './components/ToolbarQuickCall';
import { ToolbarQuickRoom } from './components/ToolbarQuickRoom';
// Aegis data reporting (remove for GitHub demo)
import { createSceneDurationTracker } from '@/utils/aegis';

const emit = defineEmits<{
  (e: 'switchScene', scene: string): void;
}>();

const activeContact = ref();
const activeTab = ref<'conversation' | 'contact'>('conversation');
const isChatSettingShow = ref(false);
const isSearchInChatShow = ref(false);

const { t, theme } = useUIKit();
const { activeConversation } = useConversationListState();

// Scene duration tracking (remove for GitHub demo)
let durationTracker: { cleanup: () => void } | null = null;

onMounted(() => {
  durationTracker = createSceneDurationTracker('chat');
});

onUnmounted(() => {
  durationTracker?.cleanup();
});

watch(() => activeConversation.value?.conversationID, (newVal, oldVal) => {
  if (newVal !== oldVal) {
    isChatSettingShow.value = false;
    isSearchInChatShow.value = false;
  }
});

const handleTabChange = (tab: 'conversation' | 'contact') => {
  activeTab.value = tab;
};

const enterChat = () => {
  activeTab.value = 'conversation';
};

// Handle scene switch from capability recommend cards
const handleSwitchScene = (scene: string) => {
  emit('switchScene', scene);
};

// Handle quick call entry
const handleQuickCall = () => {
  emit('switchScene', 'callkit');
};

// Handle quick room entry
const handleQuickRoom = () => {
  emit('switchScene', 'roomkit');
};

</script>

<template>
  <div class="chat-layout">
    <TUICallKit class="call-kit" />

    <!-- SideTab Navigation -->
    <SideTab
      :active-tab="activeTab"
      @change="handleTabChange"
    />

    <!-- Conversation/Contact List Panel -->
    <div class="conversation-list-panel">
      <ConversationList
        v-show="activeTab === 'conversation'"
        enable-create
      />
      <ContactList v-show="activeTab === 'contact'" />
    </div>

    <!-- Chat Content Panel + Search Panel Container -->
    <div
      v-if="activeTab === 'conversation'"
      class="chat-with-search"
    >
      <Chat
        :PlaceholderEmpty="() => h(
          CapabilityRecommend,
          { onSwitchScene: handleSwitchScene })
        "
        class="chat-content-panel"
      >
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
        <MessageList />
        <MessageInput class="message-input-container">
          <template #headerToolbar>
            <div class="message-toolbar">
              <div class="message-toolbar-actions">
                <EmojiPicker />
                <ImagePicker />
                <FilePicker />
                <VideoPicker />
                <AudioCallPicker />
                <VideoCallPicker />
                <ToolbarQuickRoom @click="handleQuickRoom" />
              </div>
              <button
                class="icon-button"
                :title="t('chat.Search')"
                @click="isSearchInChatShow = !isSearchInChatShow"
              >
                <IconHistory3 size="20" />
              </button>
            </div>
          </template>
        </MessageInput>
      </Chat>

      <!-- Search in Chat Panel (side-by-side with chat, not overlapping) -->
      <div
        v-show="isSearchInChatShow"
        class="search-panel"
        :class="{ dark: theme === 'dark' }"
      >
        <div class="search-panel-header">
          <span class="search-panel-title">{{ t('chat.Search') }}</span>
          <button
            class="icon-button"
            @click="isSearchInChatShow = false"
          >
            ✕
          </button>
        </div>
        <Search :variant="VariantType.EMBEDDED" />
      </div>

      <!-- Chat Setting Sidebar (overlay on the entire chat-with-search area) -->
      <div
        v-show="isChatSettingShow"
        class="chat-sidebar"
        :class="{ dark: theme === 'dark' }"
      >
        <ChatSetting
          @close="isChatSettingShow = false"
        />
      </div>
    </div>

    <!-- Contact Detail Panel -->
    <ContactInfo
      v-else
      :active-contact-item="activeContact"
      :PlaceholderEmpty="() => h(
        CapabilityRecommend,
        { onSwitchScene: handleSwitchScene })
      "
      class="contact-detail-panel"
      @send-message="enterChat"
      @enter-group="enterChat"
    />
  </div>
</template>

<style lang="scss" scoped>
@use '../../styles/mixins' as mixins;

.chat-layout {
  max-width: 900px;
  max-height: 640px;
  margin: auto;
  flex: 1;
  display: flex;
  flex-direction: row;
  overflow: hidden;
  min-height: 0;
  background-color: var(--bg-color-operate);
  color: var(--text-color-primary);
  box-shadow: 0 4px 24px rgba(0,0,0,0.08), inset 0 -1px 0 rgba(255,255,255,0.05);
  border-radius: 24px;
}

.conversation-list-panel {
  width: 255px;
  display: flex;
  flex-direction: column;
  overflow-y: auto;
  min-height: 0;
  border-right: 1px solid var(--stroke-color-primary);
}

.chat-with-search {
  flex: 1;
  display: flex;
  flex-direction: row;
  overflow: hidden;
  min-width: 0;
  position: relative;
}

.chat-content-panel {
  display: flex;
  flex: 1;
  min-width: 0;
}

.contact-detail-panel {
  height: auto;
}

.message-input-container {
  border-top: 1px solid var(--stroke-color-primary);
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

.message-toolbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.message-toolbar-actions {
  display: flex;
  align-items: center;
  gap: 4px;
}

.toolbar-divider {
  width: 1px;
  height: 16px;
  background-color: var(--stroke-color-primary);
  margin: 0 4px;
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

  &:focus {
    outline: none;
  }

  &:hover {
    background-color: var(--button-color-secondary-hover);
  }

  &:active {
    background-color: var(--button-color-secondary-active);
  }
}

.chat-sidebar {
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
  overflow: auto;
  z-index: 1000;

  &.dark {
    box-shadow: -4px 0 16px rgba(0, 0, 0, 0.4), -1px 0 0 rgba(255, 255, 255, 0.1);
  }
}

.search-panel {
  width: 358px;
  flex-shrink: 0;
  display: flex;
  flex-direction: column;
  background-color: var(--bg-color-operate);
  border-left: 1px solid var(--stroke-color-primary);
  overflow: auto;

  &.dark {
    border-left-color: rgba(255, 255, 255, 0.1);
  }
}

.search-panel-header {
  position: sticky;
  top: 0;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 16px;
  background-color: var(--bg-color-operate);
  border-bottom: 1px solid var(--stroke-color-primary);
  z-index: 10;
}

.search-panel-title {
  font-size: 16px;
  font-weight: 500;
  color: var(--text-color-primary);
}
</style>
