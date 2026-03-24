<template>
  <section :class="className">
    <h2 v-if="props.title" :class="classTitle">
      {{ props.title }}
    </h2>
    <div :class="`${prefixClass}__content`">
      <slot />
    </div>
  </section>
</template>

<script lang="ts" setup>
import { computed } from 'vue';
import { usePrefixCls } from '@/utils/tpm';

interface SectionProps {
  class?: string;
  i18n?: boolean;
  title?: string;
  type?: 'default' | 'renew';
  id?: string;
}

const prefixClass = usePrefixCls('section');

const props = withDefaults(defineProps<SectionProps>(), {
  i18n: false,
  type: 'default',
});

const className = computed(() => {
  return {
    [`${prefixClass}`]: prefixClass && !props.i18n,
    [`${props.class}`]: props.class,
    [`${prefixClass}-internation`]: props.i18n,
    [`${prefixClass}-renew`]: props.type === 'renew',
  };
});

const classTitle = computed(() => {
  return {
    [`${prefixClass}__title`]: !props.i18n && props.type !== 'renew',
    [`${prefixClass}-internation__title`]: props.i18n,
    [`${prefixClass}__title-renew`]: props.type === 'renew',
  };
});
</script>

<style lang="scss">
@import '@/styles/tpm/mixins';
$prefixCls: getPrefixCls(section);

.#{$prefixCls} {
  max-width: 1600px;
  min-width: 1180px;
  margin: 0px auto 0;
  display: block;
  background: #ffffff;
  box-shadow:
    0px 4px 20px rgba(195, 214, 243, 0.2),
    inset 0px 0px 10px #ffffff;
  border-radius: 20px;
  box-sizing: border-box;
  padding: 48px 60px 60px;

  &__title {
    font-family: "RobotoTRTC", sans-serif;
    font-style: normal;
    font-weight: 500;
    font-size: 30px;
    line-height: 42px;
    display: flex;
    align-items: center;
    letter-spacing: 0.2px;
    width: fit-content;
    margin: 0 auto;
    padding-bottom: 40px;
    background: linear-gradient(90deg, #0045e7 0%, #0087ff 55.73%, #1cbfff 100%);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
    padding: 0 0 40px;
  }

  &-internation {
    max-width: 1200px;
    margin: 0 auto;

    &__title {
      color: #000;
      font-size: 32px;
      font-family: RobotoTRTC, sans-serif;
      font-weight: 500;
      line-height: 52px;
      padding-bottom: 36px;
    }
  }
}

.#{$prefixCls}-renew {
  min-width: 1320px;
  background: transparent;
  box-shadow: none;
  padding-top: 80px;

  .#{$prefixCls}__title {
    &-renew {
      margin: 0 auto;
      color: #000;
      text-align: center;
      font-family: RobotoTRTC, sans-serif;
      font-size: 28px;
      font-style: normal;
      font-weight: 500;
      line-height: normal;
      letter-spacing: 0.2px;
      background: none;
      padding-bottom: 36px;
    }
  }
}
</style>
