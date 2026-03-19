<template>
  <div :class="classes">
    <div :class="`${prefixCls}__content`">
      <div :class="`${prefixCls}__content-container`">
        <div :class="`${prefixCls}__content-logo`" v-if="props.type === 'renew'">
          <slot name="logo" />
        </div>
        <h1 :class="`${prefixCls}__content-title`">
          {{ props.title }}
        </h1>
        <div :class="`${prefixCls}__content-desc`">
          {{ props.desc }}
        </div>
        <div
          :class="`${prefixCls}__content-btn`"
          v-if="props.btnText"
        >
          <TButton
            size="large"
            theme="primary"
            shape="round"
            variant="base"
          >{{ props.btnText }}</TButton>
        </div>
      </div>
      <div :class="`${prefixCls}__content-bg`" v-if="props.type === 'renew'">
        <slot></slot>
      </div>
      <img
        v-if="props.i18n && props.type !== 'renew'"
        :class="`${prefixCls}__content-bg`"
        src="https://cloudcache.tencent-cloud.com/qcloud/ui/static/static_source_business/b91a4bc7-1496-4ecc-84c7-1009eb54c516.png"
        alt=""
        loading="lazy"
      />
      <img
        v-if="!props.i18n && props.type !== 'renew'"
        :class="`${prefixCls}__content-bg`"
        src="https://cloudcache.tencent-cloud.com/qcloud/ui/static/static_source_business/c016150c-f58e-4767-b0fe-33c14e577b66.png"
        alt=""
        loading="lazy"
      />
    </div>
  </div>
</template>

<script lang="ts" setup>
import { computed } from 'vue';
import { Button as TButton } from 'tdesign-vue-next';
import { usePrefixCls } from '@/utils/tpm';

const prefixCls = usePrefixCls('banner');

interface BannerProps {
  /**
   * Title
   */
  title?: string;
  /**
   * Description
   */
  desc?: string;
  /**
   * Internationalization mode
   */
  i18n?: boolean;
  /**
   * Button text
   */
  btnText?: string;
  /**
   * Custom class name
   */
  class?: string;
  /**
   * Banner type
   */
  type?: 'default' | 'renew';
}

const props = withDefaults(defineProps<BannerProps>(), {
  i18n: false,
  type: 'default',
});

const classes = computed(() => {
  return {
    [`${prefixCls}`]: prefixCls,
    [`${prefixCls}-internation`]: props.i18n,
    [`${props.class}`]: props.class && props.class !== '',
    [`${prefixCls}-renew`]: props.type === 'renew',
  };
});
</script>

<style lang="scss">
@import '@/styles/tpm/mixins';
$prefixCls: getPrefixCls(banner);

.#{$prefixCls} {
  width: 100%;
  height: 100%;
  background-image: url(https://cloudcache.tencent-cloud.com/qcloud/ui/static/static_source_business/e5740a9e-0a77-4bca-b17d-b66ca64fc129.png);
  height: 460px;
  background-size: 100% 100%;
  background-repeat: no-repeat;
  padding: 0 50px;
  position: relative;
  box-sizing: border-box;
  display: flex;
  align-items: center;

  &__content {
    max-width: 1600px;
    width: 100%;
    margin: 0 auto;
    display: flex;
    align-items: center;
    justify-content: space-between;

    &-bg {
      width: 56%;
      display: block;
    }

    &-container {
      max-width: 650px;
      display: flex;
      flex-direction: column;
      gap: 18px;
    }

    &-title {
      font-family: "RobotoTRTC", sans-serif;
      font-style: normal;
      font-weight: 500;
      font-size: 42px;
      line-height: 59px;
      letter-spacing: 0.2px;
      margin: 0;
      padding: 0;
      color: #000000;
    }

    &-desc {
      font-family: "RobotoTRTC", sans-serif;
      font-style: normal;
      font-weight: 400;
      font-size: 20px;
      line-height: 28px;
      letter-spacing: 0.2px;
      color: #6985ab;
    }

    &-btn {
      margin-top: 20px;
    }
  }

  &-internation {
    background-image: linear-gradient(180deg, #e8effc 0%, #dae6fa 100%);
    height: 320px;

    .tav-banner__content {
      width: 1200px;
      min-width: 1200px;
      max-width: 1200px;
      position: relative;
      height: 320px;

      .tav-banner__content-bg {
        width: fit-content;
        height: 320px;
        position: absolute;
        right: 0;
        top: 0;
      }

      &-desc {
        font-style: normal;
        font-weight: 400;
        font-size: 14px;
        line-height: 20px;
        color: #4f586b;
      }
    }
  }

  &-renew {
    width: 100%;
    height: 308px;
    background: linear-gradient(180deg, #e8effc 0%, #dae5fa 100%);

    .#{$prefixCls}__content {
      width: 1200px;
      margin: 0 auto;

      &-container {
        display: block;
      }

      &-logo {
        margin-bottom: 52px;
        width: 305px;

        img {
          width: 100%;
          cursor: pointer;
          display: block;
        }
      }

      &-bg {
        width: 546px;

        img {
          width: 100%;
        }
      }

      &-title {
        color: #000;
        font-family: RobotoTRTC, sans-serif;
        font-size: 42px;
        font-style: normal;
        font-weight: 500;
        line-height: 50px;
        position: relative;
        background: linear-gradient(90deg, #0045e7 0%, #000 55.73%, #000 100%);
        -webkit-background-clip: text;
        -webkit-text-fill-color: transparent;
        background-clip: text;
      }

      &-desc {
        color: #546e94;
        font-family: RobotoTRTC, sans-serif;
        font-size: 20px;
        font-style: normal;
        font-weight: 400;
        line-height: 28px;
        margin-top: 12px;
      }
    }
  }
}
</style>
