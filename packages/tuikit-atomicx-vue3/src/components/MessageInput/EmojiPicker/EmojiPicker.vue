<template>
  <View>
    <PopoverRoot
      :open="isOpen"
      @update:open="handleOpenChange"
    >
      <PopoverTrigger
        as="div"
        :disabled="props.disabled"
      >
        <div
          data-test="test"
          :class="cs(
            styles['emoji-picker__button'],
            {
              [styles['disabled']]: props.disabled,
            }
          )"
          v-bind="$attrs"
        >
          <slot>
            <IconEmoji :class="styles['emoji-picker__icon']" :size="props.iconSize" />
          </slot>
        </div>
      </PopoverTrigger>
      <PopoverPortal>
        <PopoverContent
          side="top"
          align="start"
          :side-offset="5"
        >
          <div>
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
                >
              </div>
            </div>
          </div>
        </PopoverContent>
      </PopoverPortal>
    </PopoverRoot>
  </View>
</template>

<script setup lang="ts">
import { onMounted, defineProps, useCssModule, ref } from 'vue';
import { useUIKit, IconEmoji } from '@tencentcloud/uikit-base-component-vue3';
import cs from 'classnames';
import { PopoverContent, PopoverPortal, PopoverRoot, PopoverTrigger } from 'reka-ui';
import { View } from '../../../baseComp/View';
import { emojiUrlMap, emojiBaseUrl } from '../../../constants/emoji';
import { useMessageInputState, MessageContentType } from '../../../states/MessageInputState';
import { transformTextWithEmojiKeyToName } from '../../../utils/emoji';

defineOptions({
  name: 'EmojiPicker',
  inheritAttrs: false,
});

interface EmojiPickerProps {
  label?: string;
  iconSize?: number;
  disabled?: boolean;
}

const props = withDefaults(defineProps<EmojiPickerProps>(), {
  label: '',
  iconSize: 20,
  disabled: false,
});

const isOpen = ref(false);

const styles = useCssModule();
const { t } = useUIKit();
const { insertContent } = useMessageInputState();

// Image preload
onMounted(() => {
  Object.values(emojiUrlMap).forEach((url) => {
    const img = new Image();
    img.src = emojiBaseUrl + url;
  });
});

const handleOpenChange = (open: boolean) => {
  // only allow to change the state when the component is not disabled
  if (!props.disabled) {
    isOpen.value = open;
  }
};

function insertEmojiToInput(emojiKey: string) {
  if (emojiKey) {
    insertContent([
      {
        type: MessageContentType.EMOJI,
        content: {
          url: emojiBaseUrl + emojiUrlMap[emojiKey],
          key: emojiKey,
          text: transformTextWithEmojiKeyToName(emojiKey),
        },
      },
    ]);
  }
}
</script>

<style lang="scss" module>
.emoji-picker {
  &__button {
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    padding: 4px 6px;
    transition: background-color 0.5s ease;
    border-radius: 4px;

    &:hover {
      background-color: var(--button-color-secondary-hover);
    }

    &:active {
      background-color: var(--button-color-secondary-active);
    }

    &.disabled {
      opacity: 0.5;
      cursor: not-allowed;
      user-select: none;
      pointer-events: none;
    }
  }

  &__icon {
    color: var(--text-color-primary);
  }

  &__list {
    display: flex;
    flex-flow: row wrap;
    gap: 8px;
    width: 310px;
    border-radius: 16px;
    padding: 16px;
    margin-bottom: 10px;
    background-color: var(--dropdown-color-default);
    box-shadow: 0 0 10px 0 var(--shadow-color);

    &-item {
      display: flex;
      align-items: center;
      justify-content: center;
      width: 20px;
      height: 20px;
      cursor: pointer;
    }
  }
}
</style>
