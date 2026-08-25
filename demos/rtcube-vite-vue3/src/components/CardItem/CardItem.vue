<template>
  <div :class="cardItemStyle" @click="emit('click')">
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

    <!-- Vertical scenarios section -->
    <div v-if="subScenes && subScenes.length > 1" :class="`${className}__scenarios`">
      <div :class="`${className}__scenarios-divider`">
        <div :class="`${className}__scenarios-divider-line`" />
        <span :class="`${className}__scenarios-divider-text`">{{ t('scenes.verticalScenarios') }}</span>
        <div :class="`${className}__scenarios-divider-line`" />
      </div>
      <button
        v-for="sub in nonDefaultSubScenes"
        :key="sub.id"
        :class="`${className}__scenario-btn`"
        @click.stop="emit('subSceneClick', sub.id)"
      >
        <div :class="`${className}__scenario-btn-left`">
          <div :class="`${className}__scenario-btn-icon`">
            <Stethoscope :size="20" />
          </div>
          <div :class="`${className}__scenario-btn-text`">
            <div :class="`${className}__scenario-btn-title`">{{ sub.label }}</div>
            <div :class="`${className}__scenario-btn-desc`">{{ sub.desc }}</div>
          </div>
        </div>
        <!-- <div :class="`${className}__scenario-btn-arrow`">
          <ArrowRight :size="16" />
        </div> -->
      </button>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { computed } from 'vue';
import { useUIKit } from '@tencentcloud/uikit-base-component-vue3';
import { Stethoscope, ArrowRight } from 'lucide-vue-next';
import { usePrefixCls } from '@/utils/tpm';

interface SubSceneItem {
  id: string;
  label: string;
  desc: string;
  isDefault?: boolean;
}

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
  /**
   * Sub-scene list for scene cards
   */
  subScenes?: SubSceneItem[];
}

const className = usePrefixCls('card-item-renew');
const { t } = useUIKit();

const props = withDefaults(defineProps<CardItemProps>(), {
  class: '',
  shadow: false,
  type: 'renew',
});

const emit = defineEmits<{
  (e: 'click'): void;
  (e: 'subSceneClick', subSceneId: string): void;
}>();

const cardItemStyle = computed(() => {
  return {
    [`${props.class}`]: props.class,
    [`${className}`]: className,
    [`${className}-shadow`]: props.shadow,
  };
});

const nonDefaultSubScenes = computed(() =>
  props.subScenes?.filter(sub => !sub.isDefault) ?? []
);
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

  &__scenarios {
    margin-top: auto;
    padding: 0 20px 20px;

    &-divider {
      display: flex;
      align-items: center;
      gap: 8px;
      margin-bottom: 12px;

      &-line {
        flex: 1;
        height: 1px;
        background: linear-gradient(to right, #e5e7eb, transparent);

        &:last-child {
          background: linear-gradient(to left, #e5e7eb, transparent);
        }
      }

      &-text {
        font-size: 11px;
        font-weight: 600;
        color: #9ca3af;
        letter-spacing: 1.5px;
        text-transform: uppercase;
        white-space: nowrap;
      }
    }
  }

  &__scenario-btn {
    width: 100%;
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 12px 16px;
    background: linear-gradient(to right, #eff6ff, rgba(238, 242, 255, 0.4));
    border: 1px solid rgba(191, 219, 254, 0.8);
    border-radius: 12px;
    cursor: pointer;
    transition: all 0.3s ease;
    box-shadow: 0 1px 3px rgba(59, 130, 246, 0.05);
    outline: none;
    font-family: inherit;

    &:hover {
      box-shadow: 0 4px 12px rgba(59, 130, 246, 0.12);
      border-color: #93c5fd;
      transform: translateY(-1px);
    }

    &-left {
      display: flex;
      align-items: center;
      gap: 12px;
    }

    &-icon {
      display: flex;
      align-items: center;
      justify-content: center;
      width: 40px;
      height: 40px;
      background: #fff;
      border-radius: 10px;
      color: #2563eb;
      box-shadow: 0 1px 3px rgba(0, 0, 0, 0.06);
      border: 1px solid #eff6ff;
      flex-shrink: 0;
      transition: all 0.3s ease;
    }

    &:hover &-icon {
      // background: #2563eb;
      // color: #fff;
    }

    &-text {
      text-align: left;
    }

    &-title {
      font-size: 15px;
      font-weight: 700;
      color: #111827;
      line-height: 1.3;
      transition: color 0.3s ease;
    }

    &:hover &-title {
      color: #1d4ed8;
    }

    &-desc {
      font-size: 12px;
      color: #6b7280;
      margin-top: 2px;
      font-weight: 500;
      line-height: 1.4;
    }

    &-arrow {
      display: flex;
      align-items: center;
      justify-content: center;
      width: 32px;
      height: 32px;
      border-radius: 50%;
      background: #fff;
      color: #3b82f6;
      box-shadow: 0 1px 3px rgba(0, 0, 0, 0.06);
      border: 1px solid #eff6ff;
      flex-shrink: 0;
      transition: all 0.3s ease;
    }

    &:hover &-arrow {
      transform: translateX(2px);
      background: #2563eb;
      color: #fff;
    }
  }

  &-shadow {
    box-shadow: 0px 4px 10px 0px rgba(225, 232, 245, 0.6);
  }
}
</style>
