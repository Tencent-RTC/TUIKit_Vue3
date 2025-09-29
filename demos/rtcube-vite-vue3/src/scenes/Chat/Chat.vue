<script lang="ts" setup>
import { ref, watch } from 'vue';
import { getPlatform } from '@tencentcloud/universal-api';
import {
  ConversationList,
  Chat,
  MessageList,
  MessageInput,
  ContactList,
  ContactInfo,
  useConversationListState,
  ChatSetting,
} from '@tencentcloud/chat-uikit-vue3';
import { ChatHeader } from './components/ChatHeader';
import { Drawer } from './components/Drawer';
import { TabList } from './components/TabList';
import { useCoreStore } from './stores';

const activeContact = ref();
const enableFirstScreen = ref(true);
const isH5 = ref(getPlatform() === 'h5');
const activeTab = ref<'conversation' | 'contact'>('conversation');

const { activeConversation } = useConversationListState();
const { isChatSettingOpen, setIsSettingOpen } = useCoreStore();

watch(activeConversation, (conversation) => {
  enableFirstScreen.value = (isH5.value && !conversation) || !isH5.value;
});

const handleTabChange = (tab: 'conversation' | 'contact') => {
  activeTab.value = tab;
};

const enterChat = () => {
  activeTab.value = 'conversation';
  enableFirstScreen.value = false;
};

const handleContactItem = () => {
  if (isH5.value) {
    enableFirstScreen.value = false;
  }
};

</script>

<template>
  <div class="all-chat-container">
    <div
      v-if="enableFirstScreen"
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
        <ContactList v-else @contact-item-click="handleContactItem" />
      </div>
    </div>
    <Chat v-if="activeTab === 'conversation'" class="inner-chat-container">
      <ChatHeader />
      <MessageList />
      <MessageInput class="message-input" />
    </Chat>
    <div v-else class="inner-chat-container">
      <ContactInfo
        :active-contact-item="activeContact"
        @send-message="enterChat"
        @enter-group="enterChat"
        @close="enableFirstScreen = true"
      />
    </div>
    <Drawer
      :open="isChatSettingOpen"
      @close="setIsSettingOpen(false)"
    >
      <ChatSetting style="flex: 1;" />
    </Drawer>
  </div>
</template>

<style lang="scss" scoped>
@use '../../styles/mixins' as mixins;

.all-chat-container {
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  background-color: var(--bg-color-operate);
  color: var(--text-color-primary);

  @include mixins.tablet {
    margin: 10vh 20vw;
    flex-direction: row;
    box-shadow: 0 4px 24px rgba(0,0,0,0.08), inset 0 -1px 0 rgba(255,255,255,0.05);
    border-radius: 16px;
  }
}

.inner-chat-container {
  flex: 1;
  min-height: 0;
}

.first-screen {
  flex: 1;
  display: flex;
  flex-direction: column;
  height: 100%;
  border-right: 1px solid rgba(0, 0, 0, 0.08);

  @include mixins.tablet {
    max-width: 300px;
    flex-direction: row;
  }

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
  border-top: 1px solid rgba(0, 0, 0, 0.08);
}
</style>
