<template>
  <div :class="classes">
    <div :class="`${prefixCls}__grid`">
      <div
        v-for="product in products"
        :key="product.id"
        :class="`${prefixCls}__card`"
      >
        <div :class="`${prefixCls}__card-header`">
          <div :class="`${prefixCls}__icon-wrapper`">
            <component :is="product.icon" :class="`${prefixCls}__icon`" />
          </div>
          <div :class="`${prefixCls}__product-info`">
            <div :class="`${prefixCls}__product-name`">{{ product.name }}</div>
            <div :class="`${prefixCls}__product-desc`">{{ product.desc }}</div>
          </div>
        </div>
        <div :class="`${prefixCls}__links`">
          <a
            v-for="link in product.links"
            :key="link.platform"
            :href="link.url"
            :class="`${prefixCls}__link`"
            target="_blank"
            rel="noopener noreferrer"
            @click="handleLinkClick(product.id, link.platformKey, link.url)"
          >
            <component :is="link.icon" :class="`${prefixCls}__link-icon`" />
            <span :class="`${prefixCls}__link-text`">{{ link.platform }}</span>
            <IconExternalLink :class="`${prefixCls}__external-icon`" />
          </a>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, markRaw, type Component } from 'vue';
import { useUIKit } from '@tencentcloud/uikit-base-component-vue3';
import { QUICK_ACCESS_PRODUCTS_DATA, PRODUCT_IDS } from '@/constants';
import {
  IconChat,
  IconCall,
  IconAudio as IconRoom,
  IconSignal as IconLive,
  IconWeb,
  IconAndroid,
  IconApple,
  IconMiniProgram,
  IconExternalLink,
} from '@/components/Icon';
// Aegis data reporting (remove for GitHub demo)
import { reportDiversionClick } from '@/utils/aegis';

const { t } = useUIKit();

/**
 * Report quick access link click event
 */
const handleLinkClick = (productId: string, platform: string, url: string) => {
  reportDiversionClick('quick_access_click', `${productId}_${platform}`, url);
};

interface DocLink {
  platform: string;
  platformKey: string; // Original platform key for reporting
  icon: Component;
  url: string;
}

interface Product {
  id: string;
  name: string;
  desc: string;
  icon: Component;
  links: DocLink[];
}

// Product icon mapping
const productIconMap: Record<string, Component> = {
  [PRODUCT_IDS.chat]: markRaw(IconChat),
  [PRODUCT_IDS.call]: markRaw(IconCall),
  [PRODUCT_IDS.room]: markRaw(IconRoom),
  [PRODUCT_IDS.live]: markRaw(IconLive),
};

// Platform icon mapping for links
const getPlatformIcon = (platform: string): Component => {
  const iconMap: Record<string, Component> = {
    Web: markRaw(IconWeb),
    Android: markRaw(IconAndroid),
    iOS: markRaw(IconApple),
  };
  // Return miniprogram icon for any platform key containing 'miniProgram'
  if (platform.includes('miniProgram')) {
    return markRaw(IconMiniProgram);
  }
  return iconMap[platform] || markRaw(IconWeb);
};

const prefixCls = 'rtc-quick-access';
const classes = computed(() => [prefixCls]);

const products = computed<Product[]>(() =>
  QUICK_ACCESS_PRODUCTS_DATA.map((product) => ({
    id: product.id,
    name: t(product.nameKey),
    desc: t(product.descKey),
    icon: productIconMap[product.id],
    links: product.links.map((link) => ({
      platform: link.platformKey ? t(link.platformKey) : link.platform,
      platformKey: link.platform, // Keep original platform key for reporting
      icon: getPlatformIcon(link.platform),
      url: link.url,
    })),
  }))
);
</script>

<style lang="scss">
.rtc-quick-access {
  width: 100%;

  &__grid {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: 20px;

    @media (max-width: 992px) {
      grid-template-columns: 1fr;
    }
  }

  &__card {
    background: var(--bg-color-dialog);
    border-radius: 12px;
    border: 1px solid var(--stroke-color-primary);
    padding: 24px;
    transition: all 0.3s ease;

    &:hover {
      border-color: var(--uikit-color-theme-6);
      box-shadow: 0 4px 16px var(--biz-blue-glow-shadow);
    }
  }

  &__card-header {
    display: flex;
    align-items: center;
    gap: 16px;
    margin-bottom: 20px;
    padding-bottom: 16px;
    border-bottom: 1px solid var(--stroke-color-secondary);
  }

  &__icon-wrapper {
    width: 48px;
    height: 48px;
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: 10px;
    flex-shrink: 0;
  }

  &__icon {
    width: 28px;
    height: 28px;
  }

  &__product-info {
    flex: 1;
    min-width: 0;
  }

  &__product-name {
    font-size: 18px;
    font-weight: 600;
    color: var(--text-color-primary);
    margin-bottom: 4px;
  }

  &__product-desc {
    font-size: 13px;
    color: var(--text-color-tertiary);
    line-height: 1.4;
  }

  &__links {
    display: flex;
    flex-wrap: wrap;
    gap: 10px;
  }

  &__link {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    padding: 8px 14px;
    background: var(--bg-color-default);
    border-radius: 8px;
    text-decoration: none;
    color: var(--text-color-secondary);
    font-size: 13px;
    transition: all 0.2s ease;

    &:hover {
      background: var(--uikit-color-theme-1);
      color: var(--uikit-color-theme-6);

      .rtc-quick-access__external-icon {
        opacity: 1;
      }
    }
  }

  &__link-icon {
    width: 16px;
    height: 16px;
    flex-shrink: 0;
  }

  &__link-text {
    font-weight: 500;
  }

  &__external-icon {
    width: 12px;
    height: 12px;
    opacity: 0;
    transition: opacity 0.2s ease;
  }
}
</style>
