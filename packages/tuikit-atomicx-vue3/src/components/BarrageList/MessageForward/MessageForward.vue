<script lang="ts" setup>
import { ref } from 'vue';
import { useUIKit, IconSearch, IconCloseInput, IconClose } from '@tencentcloud/uikit-base-component-vue3';
import { DialogRoot, DialogPortal, DialogOverlay, DialogContent, DialogClose, DialogTitle } from 'reka-ui';
import { useConversationListState } from '../../../states/ConversationListState';
import { useMessageActionState } from '../../../states/MessageActionState';
import ForwardListItem from './ForwardListItem.vue';
import type { IConversationModel } from '@tencentcloud/chat-uikit-engine';

const { t } = useUIKit();
const { forwardMessageIDList, forwardConversationIDList, isForwardMessageSelectionDone, forwardMessage } =
  useMessageActionState();

const { conversationList } = useConversationListState();

const searchValue = ref('');
const searchedConversationList = ref<IConversationModel[]>([]);

function searchConversation() {
  if (searchValue.value) {
    const results = conversationList.value!.filter(conversation => {
      const name = conversation.getShowName()!.toLowerCase();
      const ID = conversation.conversationID.toLowerCase();
      const searchTerm = searchValue.value.trim().toLowerCase();
      return ID.includes(searchTerm) || name.includes(searchTerm);
    });
    searchedConversationList.value = results;
  } else {
    searchedConversationList.value = [];
  }
}

function handleConversationSelect(conversationID: string) {
  const hasAlreadySelected = forwardConversationIDList.value.includes(conversationID);
  if (hasAlreadySelected) {
    forwardConversationIDList.value = forwardConversationIDList.value.filter(ID => ID !== conversationID);
  } else {
    forwardConversationIDList.value.push(conversationID);
  }
}

const isConversationSelected = (conversationID: string) => forwardConversationIDList.value.includes(conversationID);

function getConversationName(conversationID: string) {
  const conversation = conversationList.value?.find(_conversation => _conversation.conversationID === conversationID);
  return conversation?.getShowName() || conversation?.conversationID || '';
}

function forward() {
  if (!isForwardMessageSelectionDone.value) {
    return;
  }

  if (forwardConversationIDList.value.length > 0) {
    forwardMessage({
      messageIDList: forwardMessageIDList.value,
      conversationIDList: forwardConversationIDList.value,
      isMergeForward: false,
    });
    closeMessageForward();
  }
}

function closeMessageForward() {
  forwardMessageIDList.value = [];
  forwardConversationIDList.value = [];
  isForwardMessageSelectionDone.value = false;
}
</script>

<template>
  <DialogRoot :open="isForwardMessageSelectionDone">
    <DialogPortal>
      <DialogOverlay class="forward-overlay" @click="closeMessageForward" />
      <DialogContent class="forward-container">
        <div class="forward-header">
          <DialogClose class="forward-header__close" @click="closeMessageForward">
            <IconClose size="14" />
          </DialogClose>
          <DialogTitle class="forward-header__title">
            {{ t('TUIChat.Forward') }}
          </DialogTitle>
        </div>

        <div class="forward-search">
          <IconSearch class="forward-search__icon" />
          <input v-model="searchValue" class="forward-search__input" type="text" @input="searchConversation" />
          <IconCloseInput v-if="searchValue" class="forward-search__icon--clear" @click="searchValue = ''" />
        </div>

        <div class="forward-middle">
          <template v-if="searchValue">
            <div class="forward-section-title">
              {{ t('TUIChat.Search Result') }}
            </div>
            <template v-if="searchedConversationList.length > 0">
              <div class="forward-list-container">
                <ForwardListItem
                  v-for="conversation in searchedConversationList"
                  :key="conversation.conversationID"
                  :conversationID="conversation.conversationID"
                  :is-selected="isConversationSelected(conversation.conversationID)"
                  @on-click="handleConversationSelect(conversation.conversationID)"
                />
              </div>
            </template>
            <template v-else>
              <div class="forward-empty">
                {{ t('TUIChat.No Result') }}
              </div>
            </template>
          </template>
          <template v-else>
            <div class="forward-section-title">
              {{ t('TUIChat.Recent Chats') }}
            </div>
            <div v-if="conversationList && conversationList.length > 0" class="forward-list-container">
              <ForwardListItem
                v-for="conversation in conversationList"
                :key="conversation.conversationID"
                :conversationID="conversation.conversationID"
                :is-selected="isConversationSelected(conversation.conversationID)"
                @click="handleConversationSelect(conversation.conversationID)"
              />
            </div>
            <div v-else class="forward-empty">
              {{ t('TUIChat.No Conversation') }}
            </div>
          </template>
        </div>

        <div v-if="forwardConversationIDList.length > 0" class="forward-selected__abstract-list">
          <div v-for="ID in forwardConversationIDList" :key="ID" class="forward-selected__abstract-list__item">
            <div class="forward-selected__abstract-list__item__name">
              {{ getConversationName(ID) }}
            </div>
            <div class="forward-selected__abstract-list__item__remove" @click.stop="handleConversationSelect(ID)">
              <IconCloseInput />
            </div>
          </div>
        </div>

        <div class="forward-footer">
          <button class="forward-footer__button" :disabled="forwardConversationIDList.length === 0" @click="forward">
            {{ t('TUIChat.Forward') }}
          </button>
        </div>
      </DialogContent>
    </DialogPortal>
  </DialogRoot>
</template>

<style lang="scss" scoped>
@use '../../../styles/mixins' as mixin;

$animationDuration: 200ms;

.forward-overlay {
  background-color: rgba(0, 0, 0, 0.5);
  position: fixed;
  inset: 0;

  &[data-state='open'] {
    animation: overlayIn $animationDuration ease-out;
  }

  &[data-state='closed'] {
    animation: overlayOut $animationDuration ease-out;
  }
}

.forward-container {
  border-radius: 8px;
  box-shadow:
    0px 10px 38px -10px rgba(22, 23, 24, 0.35),
    0px 10px 20px -15px rgba(22, 23, 24, 0.2);
  position: fixed;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  width: 90vw;
  max-width: 500px;
  max-height: 85vh;
  padding: 16px;
  display: flex;
  flex-direction: column;
  gap: 12px;
  height: 80vh;
  background-color: var(--bg-color-operate);
  color: var(--text-color-primary);

  &[data-state='open'] {
    animation: contentIn $animationDuration ease-out;
  }

  &[data-state='closed'] {
    animation: contentOut $animationDuration ease-out;
  }
}

.forward-header {
  display: flex;
  flex-direction: row;
  align-items: center;

  &__close {
    background: transparent;
    border: none;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    margin-right: 8px;
    color: inherit;
  }

  &__title {
    flex: 1;
    font-size: 18px;
    font-weight: bold;
    text-align: center;
    margin-right: 24px;
  }
}

.forward-search {
  display: flex;
  flex-direction: row;
  gap: 8px;
  align-items: center;
  border-radius: 8px;
  padding: 8px 12px;
  background: var(--bg-color-input);

  &__icon {
    &--clear {
      cursor: pointer;
    }
  }

  &__input {
    flex: 1;
    border: none;
    outline: none;
    font-size: 14px;
    background-color: transparent;
    color: var(--text-color-primary, white);
    caret-color: var(--text-color-primary, white);
  }
}

.forward-middle {
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow-y: auto;
  gap: 8px;
}

.forward-section-title {
  font-size: 14px;
  font-weight: 600;
  color: var(--text-color-primary);
}

.forward-list-container {
  display: flex;
  flex-direction: column;
  gap: 8px;

  @include mixin.scrollbar-base;
}

.forward-empty {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 100px;
  color: var(--text-color-secondary);
  font-size: 14px;
}

.forward-selected__abstract-list {
  display: flex;
  flex-direction: row;
  flex-wrap: wrap;
  max-height: 70px;
  overflow-y: auto;
  gap: 8px;

  @include mixin.scrollbar-base;

  &__item {
    display: flex;
    flex-direction: row;
    align-items: center;
    background-color: var(--bg-color-input);
    border-radius: 16px;
    padding: 4px 8px 4px 4px;

    &__name {
      margin: 0 8px;
      font-size: 12px;
      max-width: 100px;

      @include mixin.text-ellipsis;
    }

    &__remove {
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;

      &:hover {
        color: var(--text-color-error);
      }
    }
  }
}

.forward-footer {
  display: flex;

  &__button {
    background-color: var(--button-color-primary-default);
    color: var(--text-color-button);
    border: none;
    border-radius: 4px;
    padding: 8px 16px;
    font-size: 14px;
    cursor: pointer;

    &:hover:not(:disabled) {
      background-color: var(--button-color-primary-hover);
    }

    &:active:not(:disabled) {
      background-color: var(--button-color-primary-active);
    }

    &:disabled {
      background-color: var(--button-color-primary-disabled);
      cursor: not-allowed;
    }
  }
}

@keyframes overlayIn {
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
}

@keyframes overlayOut {
  from {
    opacity: 1;
  }
  to {
    opacity: 0;
  }
}

@keyframes contentIn {
  from {
    opacity: 0;
    transform: translate(-50%, -46%) scale(0.96);
  }
  to {
    opacity: 1;
    transform: translate(-50%, -50%) scale(1);
  }
}

@keyframes contentOut {
  from {
    opacity: 1;
    transform: translate(-50%, -50%) scale(1);
  }
  to {
    opacity: 0;
    transform: translate(-50%, -46%) scale(0.96);
  }
}
</style>
