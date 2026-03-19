<template>
  <div :class="cardItemStyle">
    <div :class="`${className}__image`">
      <div :class="`${className}__image-container`">
        <img
          :src="props.url"
          :alt="props.alt"
          loading="lazy"
        />
      </div>
      <div :class="`${className}__image-label`" v-if="props.label">
        <div :class="`${className}__image-label-left`"></div>
        <div :class="`${className}__image-label-center`">{{ props.label }}</div>
        <div :class="`${className}__image-label-right`"></div>
      </div>
    </div>
    <div :class="`${className}__container`">
      <div :class="`${className}__container-title`">
        <h3>{{ props.title }}</h3>
        <div v-if="props.title" :class="`${className}__container-title-arrow`"></div>
      </div>
      <div :class="`${className}__container-desc`" v-if="props.desc">
        {{ props.desc }}
      </div>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { computed } from 'vue';
import { usePrefixCls } from '@/utils/tpm';

interface CardItemProps {
  /**
   * Title
   */
  title?: string;
  /**
   * Description
   */
  desc?: string;
  /**
   * Image URL
   */
  url?: string;
  /**
   * Custom class name
   */
  class?: string;
  /**
   * Label content
   */
  label?: string;
  /**
   * Image alt text
   */
  alt?: string;
  /**
   * Show shadow
   */
  shadow?: boolean;
  /**
   * Card type (for compatibility)
   */
  type?: 'default' | 'renew';
}

const className = usePrefixCls('card-item-renew');

const props = withDefaults(defineProps<CardItemProps>(), {
  class: '',
  shadow: false,
  type: 'renew',
});

const cardItemStyle = computed(() => {
  return {
    [`${props.class}`]: props.class,
    [`${className}`]: className,
    [`${className}-shadow`]: props.shadow,
  };
});
</script>

<style lang="scss">
@import '@/styles/tpm/mixins';
$prefixCls: getPrefixCls(card-item-renew);

.#{$prefixCls} {
  width: 100%;
  max-width: 387px;
  border-radius: 12px;
  border: 1px solid #e6ebf3;
  background: #fff;
  cursor: pointer;
  transition: all 0.3s;
  box-sizing: border-box;

  &:hover {
    box-shadow: 0px 8px 32px 0px rgba(202, 212, 229, 0.80), 0px 2px 6px 0px rgba(202, 212, 229, 0.60);
  }

  &__image {
    width: 100%;
    box-sizing: border-box;
    position: relative;

    &-container {
      width: 100%;
      height: 100%;
      box-sizing: border-box;
      display: flex;
      align-items: center;
      justify-content: center;
      overflow: hidden;
      border-radius: 11px 11px 0 0;

      img {
        width: 100%;
        box-sizing: border-box;
        display: block;
      }
    }

    &-label {
      position: absolute;
      width: fit-content;
      right: -2px;
      top: -4px;
      display: flex;
      align-items: flex-start;

      &-right {
        background-image: url(./img/label.svg);
        background-repeat: no-repeat;
        background-size: cover;
        width: 8px;
        height: 38px;
      }

      &-left {
        background-image: url(./img/label3.svg);
        background-repeat: no-repeat;
        background-size: cover;
        width: 8px;
        height: 32px;
      }

      &-center {
        background-image: url(./img/label2.svg);
        background-repeat: no-repeat;
        background-size: cover;
        height: 32px;
        color: #2c4f8a;
        text-align: right;
        font-family: RobotoTRTC, sans-serif;
        font-size: 12px;
        font-style: normal;
        font-weight: 500;
        line-height: 18px;
        display: flex;
        align-items: center;
        padding: 0 4px;
      }
    }
  }

  &__container {
    width: 100%;
    box-sizing: border-box;
    padding: 20px 24px;

    &-title {
      display: flex;
      align-items: center;
      gap: 10px;

      h3 {
        color: #000;
        font-family: RobotoTRTC, sans-serif;
        font-size: 20px;
        font-style: normal;
        font-weight: 500;
        line-height: 28px;
        letter-spacing: 0.2px;
        margin: 0;
        padding: 0;
      }

      &-arrow {
        width: 36px;
        height: 24px;
        background-image: url(./img/arrwo.svg);
        background-repeat: no-repeat;
        background-size: cover;
        cursor: pointer;
      }
    }

    &-desc {
      width: 100%;
      color: #8a96a8;
      font-family: RobotoTRTC, sans-serif;
      font-size: 14px;
      font-style: normal;
      font-weight: 400;
      line-height: 22px;
      letter-spacing: 0.2px;
      margin-top: 8px;
    }
  }

  &-shadow {
    box-shadow: 0px 4px 10px 0px rgba(225, 232, 245, 0.6);
  }
}
</style>
