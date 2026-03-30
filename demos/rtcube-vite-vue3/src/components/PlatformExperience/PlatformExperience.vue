<template>
  <div :class="classes">
    <div :class="`${prefixCls}__description`">
      {{ t('platform.sectionDesc') }}
    </div>
    <div :class="`${prefixCls}__grid`">
      <div
        v-for="platform in platforms"
        :key="platform.id"
        :class="`${prefixCls}__item`"
        @mouseenter="handlePlatformView(platform.id, platform.name)"
      >
        <div :class="`${prefixCls}__qrcode-wrapper`">
          <img 
            :src="platform.qrCode" 
            :alt="platform.name"
            :class="`${prefixCls}__qrcode-image`"
          />
        </div>
        <div :class="`${prefixCls}__content`">
          <div :class="`${prefixCls}__icon-name`">
            <component :is="platform.icon" :class="`${prefixCls}__icon`" />
            <span :class="`${prefixCls}__name`">{{ platform.name }}</span>
          </div>
          <div :class="`${prefixCls}__tip`">{{ t('platform.scanToExperience') }}</div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, markRaw, type Component } from 'vue';
import { useUIKit } from '@tencentcloud/uikit-base-component-vue3';
import { PLATFORM_EXPERIENCE_DATA, PLATFORM_IDS } from '@/constants';
import { IconApple, IconAndroid, IconMiniProgram } from '@/components/Icon';
// Aegis data reporting (remove for GitHub demo)
import { reportDiversionClick } from '@/utils/aegis';

const { t } = useUIKit();

/**
 * Report platform QR code view event
 */
const handlePlatformView = (platformId: string, platformName: string) => {
  reportDiversionClick('platform_qrcode_view', platformId, platformName);
};

interface Platform {
  id: string;
  name: string;
  icon: Component;
  qrCode: string;
}

// Platform icon mapping
const platformIconMap: Record<string, Component> = {
  [PLATFORM_IDS.android]: markRaw(IconAndroid),
  [PLATFORM_IDS.ios]: markRaw(IconApple),
  [PLATFORM_IDS.miniprogram]: markRaw(IconMiniProgram),
};

const prefixCls = 'rtc-platform-experience';
const classes = computed(() => [prefixCls]);

const platforms = computed<Platform[]>(() =>
  PLATFORM_EXPERIENCE_DATA.map((item) => ({
    id: item.id,
    name: item.nameKey ? t(item.nameKey) : item.name,
    icon: platformIconMap[item.id],
    qrCode: item.qrCode,
  }))
);
</script>

<style lang="scss">
.rtc-platform-experience {
  width: 100%;

  &__description {
    font-size: 14px;
    color: var(--text-color-secondary);
    margin-bottom: 16px;
    text-align: center;
  }

  &__grid {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 20px;

    @media (max-width: 1200px) {
      grid-template-columns: repeat(2, 1fr);
    }
  }

  &__item {
    display: flex;
    flex-direction: column;
    align-items: center;
    padding: 24px 16px 20px;
    background: var(--bg-color-dialog);
    border-radius: 12px;
    border: 1px solid var(--stroke-color-primary);
    transition: all 0.3s ease;

    &:hover {
      border-color: var(--uikit-color-theme-6);
      box-shadow: 0 4px 16px var(--biz-blue-glow-shadow);
    }
  }

  &__qrcode-wrapper {
    width: 120px;
    height: 120px;
    display: flex;
    align-items: center;
    justify-content: center;
    background: var(--bg-color-dialog);
    border-radius: 8px;
    margin-bottom: 16px;
    overflow: hidden;
  }

  &__qrcode-image {
    width: 100%;
    height: 100%;
    object-fit: contain;
  }

  &__content {
    text-align: center;
    width: 100%;
  }

  &__icon-name {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 8px;
    margin-bottom: 8px;
  }

  &__icon {
    width: 20px;
    height: 20px;
    color: var(--uikit-color-theme-5);
  }

  &__name {
    font-size: 15px;
    font-weight: 600;
    color: var(--text-color-primary);
  }

  &__tip {
    font-size: 12px;
    color: var(--text-color-tertiary);
  }
}
</style>
