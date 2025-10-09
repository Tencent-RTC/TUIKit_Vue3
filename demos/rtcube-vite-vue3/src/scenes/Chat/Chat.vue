<script lang="ts" setup>
import { h, ref } from 'vue';
import { TUICallKit } from '@tencentcloud/call-uikit-vue';
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
} from '@tencentcloud/chat-uikit-vue3';
import { TUIDrawer, IconHistory3, useUIKit } from '@tencentcloud/uikit-base-component-vue3';
import { ChatHeader } from './components/ChatHeader';
import { PlaceholderEmpty } from './components/PlaceholderEmpty';
import { TabList } from './components/TabList';
import { useComponentOpenStore } from './stores';

const activeContact = ref();
const activeTab = ref<'conversation' | 'contact'>('conversation');
const { t } = useUIKit();

const {
  isChatSettingOpen,
  setIsChatSettingOpen,
  isSearchOpen,
  setIsSearchOpen,
} = useComponentOpenStore();

const handleTabChange = (tab: 'conversation' | 'contact') => {
  activeTab.value = tab;
};

const enterChat = () => {
  activeTab.value = 'conversation';
};

</script>

<template>
  <div class="all-chat-container">
    <TUICallKit class="floating-window" />
    <div
      :class="{
        'first-screen': true,
      }"
    >
      <TabList
        :activeTab="activeTab"
        @change="handleTabChange"
      />
      <div class="first-screen-content">
        <ConversationList
          v-if="activeTab === 'conversation'"
          enable-create
        />
        <ContactList v-else />
      </div>
    </div>
    <Chat
      v-if="activeTab === 'conversation'"
      :PlaceholderEmpty="() => h(
        PlaceholderEmpty,
        { type: 'chat' })
      "
      style="flex: 1;"
    >
      <ChatHeader />
      <MessageList />
      <MessageInput class="message-input">
        <template #headerToolbar>
          <div class="header-toolbar">
            <div class="header-toolbar-left">
              <EmojiPicker />
              <ImagePicker />
              <FilePicker />
              <VideoPicker />
              <AudioCallPicker />
              <VideoCallPicker />
            </div>
            <div class="header-toolbar-right">
              <IconHistory3 size="20" @click="setIsSearchOpen(true)" />
            </div>
          </div>
        </template>
      </MessageInput>
    </Chat>
    <ContactInfo
      v-else
      :active-contact-item="activeContact"
      :PlaceholderEmpty="() => h(
        PlaceholderEmpty,
        { type: 'contact' })
      "
      @send-message="enterChat"
      @enter-group="enterChat"
    />
    <TUIDrawer
      :model-value="isChatSettingOpen"
      :title="t('chat.Setting')"
      @close="setIsChatSettingOpen(false)"
    >
      <ChatSetting style="flex: 1;" />
    </TUIDrawer>
    <TUIDrawer
      :model-value="isSearchOpen"
      :title="t('chat.Search')"
      @close="setIsSearchOpen(false)"
    >
      <Search
        :variant="VariantType.EMBEDDED"
      />
    </TUIDrawer>
  </div>
</template>

<style lang="scss" scoped>
@use '../../styles/mixins' as mixins;

.all-chat-container {
  flex: 1;
  display: flex;
  flex-direction: row;
  overflow: hidden;
  background-color: var(--bg-color-operate);
  color: var(--text-color-primary);
  box-shadow: 0 4px 24px rgba(0,0,0,0.08), inset 0 -1px 0 rgba(255,255,255,0.05);
  border-radius: 24px;

  @include mixins.tablet {
    margin: 10vh 10vw;
  }

  @include mixins.xl-desktop {
    flex-direction: row;
    margin: 10vh 20vw;
  }
}

.first-screen {
  flex: 1;
  display: flex;
  flex-direction: row;
  height: 100%;
  border-right: 1px solid #F4F5F9;
  max-width: 300px;

  @include mixins.desktop {
    max-width: 350px;
  }
}

.first-screen-content {
  flex: 1;
  overflow-y: auto;
  min-height: 0;
}

.message-input {
  border-top: 1px solid #F4F5F9;
}

.floating-window {
  position: fixed;
  width: 800px;
  height: 600px;
  top: 50%;
  left: 50%;
  z-index: 999;
  transform: translate(-50%, -50%);
}

.header-toolbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.header-toolbar-left {
  display: flex;
  align-items: center;
  gap: 4px;
}
.header-toolbar-right {
  padding: 0 10px;
}
</style>
