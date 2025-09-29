<template>
  <ChatHeader>
    <template #ChatHeaderLeft>
      <div v-if="isH5">
        <TUIButton
          type="text"
          size="small"
          :customClasses="[classes.menuButton]"
          @click="setActiveConversation('')"
        >
          <IconArrowStrokeBack />
        </TUIButton>
      </div>
    </template>
    <template #ChatHeaderRight>
      <TUIButton
        type="text"
        size="small"
        :customClasses="[classes.menuButton]"
        @click="setIsSettingOpen(true)"
      >
        <IconMenu />
      </TUIButton>
    </template>
  </ChatHeader>
</template>

<script setup lang="ts">
import { useCssModule } from 'vue';
import { TUIButton, IconArrowStrokeBack, IconMenu } from '@tencentcloud/uikit-base-component-vue3';
import { ChatHeader, useConversationListState } from '@tencentcloud/chat-uikit-vue3';
import { useCoreStore } from '../../stores';

const { setActiveConversation } = useConversationListState();
const { setIsSettingOpen, isH5 } = useCoreStore();
const classes = useCssModule();
</script>

<style lang="scss" module>
.menu-button {
  color: var(--text-color-primary);
}
</style>
