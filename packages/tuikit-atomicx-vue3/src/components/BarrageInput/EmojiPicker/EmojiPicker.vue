<template>
  <div>
    <PopoverRoot>
      <PopoverTrigger as="span" :style="triggerStyle" :class="[props.disabled && 'disabled']">
        <IconEmoji :class="styles['emoji-picker__icon']" size="24" />
      </PopoverTrigger>
      <PopoverPortal>
        <PopoverContent side="top" align="center" :side-offset="8" style="box-sizing: border-box; z-index: 1000">
          <div class="flex flex-col gap-2.5" tabindex="-1" style="outline: none;">
            <div :class="styles['emoji-picker__list']">
              <div
                v-for="emojiKey in Object.keys(emojiUrlMap)"
                :key="emojiKey"
                :class="styles['emoji-picker__list-item']"
                @click="insertEmojiToInput(emojiKey)"
              >
                <img
                  :class="styles['emoji-picker__list-item']"
                  :src="emojiBaseUrl + emojiUrlMap[emojiKey]"
                  :alt="t(`Emoji.${emojiKey}`)"
                />
              </div>
            </div>
          </div>
        </PopoverContent>
      </PopoverPortal>
    </PopoverRoot>
  </div>
</template>

<script setup lang="ts">
import { onMounted, defineProps } from 'vue';
import { useUIKit, IconEmoji } from '@tencentcloud/uikit-base-component-vue3';
import { PopoverContent, PopoverPortal, PopoverRoot, PopoverTrigger } from 'reka-ui';
import { emojiUrlMap, emojiBaseUrl } from '../../../constants/emoji';
import { transformTextWithEmojiKeyToName } from '../../../utils/emoji';
import { useMessageInputState, MessageContentType } from '../../../states/MessageInputState';
import styles from './EmojiPicker.module.scss';

const props = defineProps<{
  triggerStyle?: Record<string, any>;
  disabled?: boolean;
}>();
const { t } = useUIKit();
const { insertContent } = useMessageInputState();

// Image preload
onMounted(() => {
  Object.values(emojiUrlMap).forEach(url => {
    const img = new Image();
    img.src = emojiBaseUrl + url;
  });
});

function insertEmojiToInput(emojiKey: string) {
  if (emojiKey) {
    insertContent(
      [
        {
          type: MessageContentType.EMOJI,
          content: {
            url: emojiBaseUrl + emojiUrlMap[emojiKey],
            key: emojiKey,
            text: transformTextWithEmojiKeyToName(emojiKey),
          },
        },
      ],
      false
    );
  }
}
</script>

<style lang="scss" scoped>
.disabled {
  cursor: not-allowed;
  user-select: none;
  pointer-events: none;
}
</style>
