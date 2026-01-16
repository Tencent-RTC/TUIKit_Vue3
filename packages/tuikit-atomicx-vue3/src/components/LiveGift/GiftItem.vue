<template>
  <div class="gift-item" :style="{ width: itemSize }">
    <div
      :class="['gift-interactive', { 'gift-interactive-active': isActive }]"
      @click.stop="handleSendClick"
    >
      <div class="gift-image-wrapper">
        <img :src="gift.iconUrl" :alt="gift.name" :draggable="false" />
      </div>
      <span class="gift-name" :style="{ fontSize: giftNameFontSize }">
        <span v-if="isActive" class="send-text">{{ t("LiveGift.Send") }}</span>
        <span v-else>{{ gift.name }}</span>
      </span>
    </div>
    <span class="gift-price" :style="{ fontSize: giftCoinsFontSize }">{{
      gift.coins
    }}</span>
  </div>
</template>

<script setup lang="ts">
import { computed } from "vue";
import { useUIKit } from "@tencentcloud/uikit-base-component-vue3";
import type { GiftInfo } from "@tencentcloud/tuiroom-engine-js";

interface GiftItemProps {
  gift: GiftInfo;
  isActive: boolean;
  size?: string | number;
  giftNameSize?: string | number;
  giftCoinsSize?: string | number;
}

const props = withDefaults(defineProps<GiftItemProps>(), {
  size: "100%",
  giftNameSize: 14,
  giftCoinsSize: 12,
});

interface GiftItemEmits {
  (e: "interact", giftId: string, currentState: boolean): void;
}

const emit = defineEmits<GiftItemEmits>();

const { t } = useUIKit();

// Convert size to string with px unit if it's a number
const itemSize = computed(() => {
  return typeof props.size === "number" ? `${props.size}px` : props.size;
});

const giftNameFontSize = computed(() =>
  typeof props.giftNameSize === "number"
    ? `${props.giftNameSize}px`
    : props.giftNameSize
);

const giftCoinsFontSize = computed(() =>
  typeof props.giftCoinsSize === "number"
    ? `${props.giftCoinsSize}px`
    : props.giftCoinsSize
);

const handleSendClick = () => {
  emit("interact", props.gift.giftID, props.isActive);
};
</script>

<style scoped lang="scss">
.gift-item {
  display: flex;
  flex-direction: column;
  justify-content: flex-start;
  align-items: center;
  box-sizing: border-box;
  cursor: pointer;
  -webkit-tap-highlight-color: transparent;
  user-select: none;
}

.gift-interactive {
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  flex-shrink: 0;
  width: calc(100% - 6px);
  aspect-ratio: 1 / 1.1;
  border-radius: 10px;
  padding: 2px;
  box-sizing: border-box;
  transition: background-color 0.2s ease;
  -webkit-tap-highlight-color: transparent;
  user-select: none;

  &-active {
    background-color: var(--button-color-primary-default);
  }

  .gift-image-wrapper {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 100%;
    aspect-ratio: 76 / 62;
    border-radius: 10px;
    background-color: var(--bg-color-operate);

    img {
      width: 73.7%;
      aspect-ratio: 1 / 1;
      border-radius: 10px;
      padding: 4px;
      box-sizing: border-box;
    }
  }
}

.gift-name {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  flex: 1 0 auto;
  padding: 2px 0;
  font-size: 14px;
  line-height: 1.3;
  color: var(--text-color-primary);

  span {
    white-space: nowrap;
    overflow: hidden;
    text-align: center;
    text-overflow: ellipsis;
    max-width: 100%;
  }

  .send-text {
    font-weight: 500;
    color: var(--text-color-button);
  }
}

.gift-price {
  display: flex;
  align-items: center;
  justify-content: center;
  flex: 1 0 auto;
  padding: 2px 0;
  font-size: 12px;
  font-weight: 400;
  line-height: 1.3;
  color: var(--text-color-secondary);
}
</style>
