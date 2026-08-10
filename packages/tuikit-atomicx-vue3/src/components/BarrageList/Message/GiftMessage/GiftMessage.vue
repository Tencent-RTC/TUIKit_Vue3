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

// Combo count. The sender issues one `sendGift({ count: 1 })` per tap, and the
// barrage list folds taps from the same sender+gift into a single bubble whose
// `count` grows live, so we surface it as "×N" to the right of the gift icon.
const giftCount = computed(() => giftData.value?.count ?? 1);
const showCombo = computed(() => giftCount.value > 1);

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
      <span v-if="showCombo" :key="giftCount" class="gift-message__combo">
        <span class="gift-message__combo-x">×</span><span class="gift-message__combo-num">{{ giftCount }}</span>
      </span>
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

  // Combo indicator (×N) for grouped gift sends. Transparent background with a
  // clean warm-gold gradient text fill and a faint stroke, matching the
  // bullet-head style. × and number are separate spans so the gap reads well.
  &__combo {
    display: inline-flex;
    align-items: baseline;
    margin-left: 6px;
    font-style: italic;
    font-weight: 700;
    line-height: 1;
    transform-origin: left center;
    white-space: nowrap;
    animation: gift-message-combo-pop 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
  }

  &__combo-x {
    font-size: 11px;
    margin-right: 2px;
    color: var(--text-color-secondary);
  }

  &__combo-num {
    font-size: 12px;
    color: var(--text-color-secondary);
  }

  &__gift-icon {
    width: 16px;
    height: 16px;
    vertical-align: middle;
    display: inline-block;
  }
}

@keyframes gift-message-combo-pop {
  0% { transform: scale(0.4); opacity: 0; }
  60% { transform: scale(1.2); opacity: 1; }
  100% { transform: scale(1); opacity: 1; }
}
</style>
