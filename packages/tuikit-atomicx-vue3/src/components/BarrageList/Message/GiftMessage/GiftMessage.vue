<script setup lang="ts">
import { computed } from 'vue';
import type { GiftInfo } from '@tencentcloud/tuiroom-engine-js';
import { useUIKit } from '@tencentcloud/uikit-base-component-vue3';
import type { Barrage } from '../../../../types/barrage';

const { t } = useUIKit();

interface GiftMessageData {
  type: string;
  giftInfo: GiftInfo;
  count: number;
}

interface IProps {
  message: Barrage;
}

const props = defineProps<IProps>();

const giftNameColorList = ['#3074FD', '#3CCFA5', '#FF8607', '#F7AF97', '#FF8BB7', '#FC6091'];

const getGiftNameColor = () => {
  const index = Math.floor(Math.random() * 10 * giftNameColorList.length);
  return giftNameColorList[index % giftNameColorList.length];
};

const giftData = computed<GiftMessageData | null>(() => {
  if (!props.message.data) {
    return null;
  }

  try {
    return JSON.parse(props.message.data) as GiftMessageData;
  } catch (error) {
    console.error('[GiftMessage] Failed to parse gift data:', error);
    return null;
  }
});

const giftNameColor = getGiftNameColor(); // Generate color once on component creation
</script>

<template>
  <div v-if="giftData" class="gift-message">
    <span class="gift-message__content">
      <span class="gift-message__sender-name">{{ message.sender.nameCard || message.sender.userName || message.sender.userId }}</span>
      <span class="gift-message__text">{{ ` ${t('BarrageList.SendGift')} ` }}</span>
      <span class="gift-message__gift-name" :style="{ color: giftNameColor }">
        {{ `${giftData.giftInfo.name} ` }}
      </span>
      <img 
        class="gift-message__gift-icon" 
        :src="giftData.giftInfo.iconUrl" 
        :alt="giftData.giftInfo.name"
      >
    </span>
  </div>
</template>

<style lang="scss" scoped>
.gift-message {
  font-size: 12px;
  line-height: 1.5;

  &__content {
    display: inline;
    word-break: break-all;
  }

  &__sender-name {
    color: var(--text-color-link);
  }

  &__text {
    color: var(--text-color-primary);
  }

  &__gift-name {
    font-weight: 500;
  }

  &__gift-icon {
    width: 16px;
    height: 16px;
    vertical-align: middle;
    display: inline-block;
  }
}
</style>
