<template>
  <div :class="classes">
    <div :class="`${prefixCls}__view`" ref="tabViewRef">
      <button :class="`${prefixCls}__btn ${prefixCls}__btn-left`">
        <div :class="`${prefixCls}__arrow-view`" v-if="showArrowLeft">
          <div :class="`${prefixCls}__arrow`" @click="scrollTabs(-1)">
            <i :class="`${prefixCls}__arrow-left`"></i>
          </div>
          <div :class="`${prefixCls}__arrow-left-mask`"></div>
        </div>
      </button>
      <div :class="`${prefixCls}__content`" ref="tabsContainer">
        <TButton
          v-for="(item, index) in tabItems"
          :key="index"
          :class="`${prefixCls}__content-item ${
            props.selectedValue === index
              ? `${prefixCls}__content-item-selected`
              : ''
          }  ${item.hot ? `${prefixCls}__content-item-hot` : ''}`"
          @click="selectTab(index)"
        >
          <Icon v-if="item.icon" :name="item.icon" />
          {{ item.value }}
          <i v-if="item.hot">
            <svg
              width="20"
              height="18"
              viewBox="0 0 20 18"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                fill-rule="evenodd"
                clip-rule="evenodd"
                d="M8 0C3.58172 0 0 3.58172 0 8C0 10.2879 0.960384 12.3514 2.5 13.8095V18L7.71312 15.995C7.80834 15.9983 7.90397 16 8 16H12C16.4183 16 20 12.4183 20 8C20 3.58172 16.4183 0 12 0H8Z"
                fill="#FFECE8"
              />
              <path
                d="M14.0949 8.71732C14.249 10.9211 12.5874 12.8325 10.3837 12.9866C8.17992 13.1407 6.2685 11.4791 6.11439 9.27537C5.98063 7.36239 6.86781 5.71414 8.2944 4.61194C7.40147 6.17804 8.22361 7.51033 8.96757 7.07097C9.93026 6.50243 7.72586 3.64925 11.1127 1.90876C10.8308 3.50179 11.4829 4.47286 12.3544 5.33048C13.4309 6.38987 13.9903 7.22097 14.0949 8.71732Z"
                fill="#FF643D"
              />
            </svg>
          </i>
        </TButton>
      </div>
      <button :class="`${prefixCls}__btn ${prefixCls}__btn-right`">
        <div :class="`${prefixCls}__arrow-view`" v-if="showArrowRight">
          <div :class="`${prefixCls}__arrow`" @click="scrollTabs(1)">
            <i :class="`${prefixCls}__arrow-right`"></i>
          </div>
          <div :class="`${prefixCls}__arrow-right-mask`"></div>
        </div>
      </button>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { usePrefixCls } from '@/utils/tpm';
import {
  ref,
  computed,
  onMounted,
  watch,
  nextTick,
  watchEffect,
  onUnmounted,
} from 'vue';
import { Button as TButton } from 'tdesign-vue-next';
import Icon from '../Icon';

interface TabItem {
  value: string;
  icon?: 'audio' | 'call' | 'chat' | 'signal';
  scene: string;
  hot?: boolean;
}

interface RtcSliderProps {
  tabItems?: TabItem[];
  /**
   * Type
   */
  type?: 'space';
  selectedValue?: number;
}

interface RtcSliderEmit {
  /**
   * Change event
   */
  (e: 'change', val: number): void;
}

const prefixCls = usePrefixCls('rtc-slider');
const classes = computed(() => {
  return {
    [`${prefixCls}`]: prefixCls,
    [`is-${props.type}`]: !!props.type,
  };
});
const tabsContainer = ref<HTMLElement | null>(null);
const showArrowLeft = ref(false);
const showArrowRight = ref(false);
const tabViewRef = ref<HTMLElement | null>(null);
const directionRight = ref(1);
const directionLeft = ref(-1);

const props = withDefaults(defineProps<RtcSliderProps>(), {
  tabItems: () => [],
  selectedValue: 0,
});

const emit = defineEmits<RtcSliderEmit>();

onMounted(() => {
  checkArrowsVisibility();
});

const checkArrowsVisibility = () => {
  if (tabsContainer.value) {
    setTimeout(() => {
      if (isScrolledToLeft() && isScrolledToRight()) {
        showArrowLeft.value = false;
        showArrowRight.value = false;
      }

      if (isScrolledToLeft() && !isScrolledToRight()) {
        showArrowLeft.value = false;
        showArrowRight.value = true;
      }

      if (isScrolledToRight() && !isScrolledToLeft()) {
        showArrowLeft.value = true;
        showArrowRight.value = false;
      }

      if (!isScrolledToRight() && !isScrolledToLeft()) {
        showArrowLeft.value = true;
        showArrowRight.value = true;
      }
    }, 100);
    scrollAuto(props.selectedValue);
  }
};

const scrollAuto = async (direction: number) => {
  await nextTick();
  if (tabsContainer.value) {
    const tabList = tabsContainer.value;
    const tabItem = tabList.children[direction] as HTMLElement;
    if (!tabItem) return;
    const tabListRect = tabList.getBoundingClientRect();
    const tabItemRect = tabItem.getBoundingClientRect();
    if (tabItemRect.left < tabListRect.left) {
      tabList.scrollLeft -= tabListRect.left - tabItemRect.left;
    } else if (tabItemRect.right > tabListRect.right) {
      tabList.scrollLeft += tabItemRect.right - tabListRect.right + 20;
    }
  }
};

watch(() => props.tabItems, checkArrowsVisibility);

watch(
  () => props.selectedValue,
  async (index) => {
    scrollAuto(index);
    setTimeout(() => {
      if (isScrolledToLeft() && isScrolledToRight()) {
        showArrowLeft.value = false;
        showArrowRight.value = false;
      }

      if (isScrolledToLeft() && !isScrolledToRight()) {
        showArrowLeft.value = false;
        showArrowRight.value = true;
      }

      if (isScrolledToRight() && !isScrolledToLeft()) {
        showArrowLeft.value = true;
        showArrowRight.value = false;
      }

      if (!isScrolledToRight() && !isScrolledToLeft()) {
        showArrowLeft.value = true;
        showArrowRight.value = true;
      }
    }, 100);
  }
);

const handleResize = () => {
  checkArrowsVisibility();
};

watchEffect(() => {
  window.addEventListener('resize', handleResize);
});

onUnmounted(() => {
  window.removeEventListener('resize', handleResize);
});

const selectTab = (index: number) => {
  emit('change', index);
};

const scrollTabs = (direction: number) => {
  if (tabsContainer.value) {
    if (direction > 0) {
      smoothScrollLeft(
        directionRight.value * tabsContainer.value.clientWidth,
        500,
        direction
      );
      directionRight.value = direction + directionRight.value;
      directionLeft.value = -1;
    } else {
      smoothScrollLeft(
        directionLeft.value * tabsContainer.value.clientWidth,
        500,
        direction
      );
      directionRight.value = 1;
      directionLeft.value = direction + directionLeft.value;
    }

    setTimeout(() => {
      if (isScrolledToLeft() && isScrolledToRight()) {
        showArrowLeft.value = false;
        showArrowRight.value = false;
      }

      if (isScrolledToLeft() && !isScrolledToRight()) {
        showArrowLeft.value = false;
        showArrowRight.value = true;
      }

      if (isScrolledToRight() && !isScrolledToLeft()) {
        showArrowLeft.value = true;
        showArrowRight.value = false;
      }

      if (!isScrolledToRight() && !isScrolledToLeft()) {
        showArrowLeft.value = true;
        showArrowRight.value = true;
      }
    }, 100);
  }
};

const isScrolledToLeft = () => {
  if (tabsContainer.value) {
    return tabsContainer.value.scrollLeft < 2;
  }
  return false;
};

const isScrolledToRight = () => {
  if (tabsContainer.value) {
    return (
      Math.abs(
        tabsContainer.value.scrollLeft +
          tabsContainer.value.clientWidth -
          tabsContainer.value.scrollWidth
      ) < 2
    );
  }
  return false;
};

const smoothScrollLeft = (targetScrollLeft: number, duration: number, direction: number) => {
  if (!tabsContainer.value) return;
  const startTime = performance.now();
  const startScrollLeft = tabsContainer.value.scrollLeft;
  const scrollDistance = targetScrollLeft - startScrollLeft;
  const tempScrollDistance =
    direction > 0 ? Math.abs(scrollDistance) : scrollDistance;

  const animateScroll = (currentTime: number) => {
    if (!tabsContainer.value) return;
    const elapsedTime = currentTime - startTime;
    const progress = Math.min(elapsedTime / duration, 1);

    tabsContainer.value.scrollLeft =
      startScrollLeft + tempScrollDistance * progress;

    if (progress < 1) {
      window.requestAnimationFrame(animateScroll);
    }
  };

  window.requestAnimationFrame(animateScroll);
};
</script>

<style lang="scss">
@import '@/styles/tpm/mixins';
$prefixCls: getPrefixCls(rtc-slider);

.#{$prefixCls} {
  display: flex;
  align-items: center;
  overflow: hidden;
  background: #fff;
  box-shadow: 0px 4px 12px 0px rgba(230, 236, 245, 0.6);

  &__view {
    box-sizing: border-box;
    padding: 0 160px;
    display: flex;
    align-items: center;
    overflow: hidden;
    margin: 0 auto;
    position: relative;
  }

  &__btn {
    background: none;
    border: none;
    font-size: 18px;
    cursor: pointer;
    display: flex;
    align-items: center;
    position: relative;
    height: 48px;
    flex-shrink: 0;
    width: 50px;

    &-left {
      padding-right: 20px;
    }

    &-right {
      padding-left: 20px;
    }
  }

  &__content {
    display: flex;
    overflow: hidden;
    flex-grow: 1;
    gap: 80px;
    margin: 0 auto;
    transition: all 0.3s;

    &-item {
      padding: 14px 0;
      cursor: pointer;
      flex-shrink: 0;
      color: #8f9ab2;
      font-family: RobotoTRTC, sans-serif;
      font-size: 16px;
      font-style: normal;
      font-weight: 400;
      line-height: 24px;
      display: flex;
      align-items: center;
      gap: 8px;
      transition: all 0.3s;
      position: relative;

      &-hot {
        padding-right: 25px;
      }

      i {
        width: 20px;
        height: 18px;
        position: absolute;
        top: 10px;
        right: 0;
      }

      &-selected {
        color: #1c66e5;
        position: relative;

        &::after {
          position: absolute;
          bottom: 0;
          left: 0;
          width: 100%;
          height: 2px;
          background-color: #1c66e5;
          content: "";
        }
      }

      &:hover {
        color: #1c66e5;
      }
    }

    &-item.t-button {
      background-color: transparent;
      border-color: transparent;
      color: #8f9ab2;
      position: relative;
      box-sizing: content-box;
      height: 24px;
      border: none;
      border-radius: 0px;

      &.#{$prefixCls}__content-item-selected {
        color: #1c66e5;
      }

      &.#{$prefixCls}__content-item-hot {
        padding-right: 25px;
      }

      .t-button__text {
        position: initial;
        gap: 8px;
      }

      &:hover {
        background-color: transparent;
        color: #1c66e5;
      }

      .t-button__text + div {
        display: none;
      }
    }
  }

  &__arrow {
    width: 24px;
    height: 24px;
    border-radius: 24px;
    background-color: #F2F4F7;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: all 0.3s;

    &-view {
      position: relative;
      display: flex;
      align-items: center;
      width: 100%;
      height: 100%;
    }

    &-left {
      display: inline-block;
      width: 12px;
      height: 12px;
      border-left: 2px solid #666;
      border-bottom: 2px solid #666;
      transform: rotate(45deg);
      margin-left: 4px;
    }

    &-right {
      display: inline-block;
      width: 12px;
      height: 12px;
      border-right: 2px solid #666;
      border-top: 2px solid #666;
      transform: rotate(45deg);
      margin-right: 4px;
    }

    &:hover {
      background-color: #1c66e5;

      .#{$prefixCls}__arrow-left {
        border-color: #fff;
      }

      .#{$prefixCls}__arrow-right {
        border-color: #fff;
      }
    }
  }

  &.is-space {
    .#{$prefixCls} {
      &__view {
        padding: 0px;
      }

      &__content {
        gap: 48px;

        &-item {
          &.t-button {
            color: rgba(0, 0, 0, 0.65);
            font-family: RobotoTRTC, sans-serif;
            font-size: 14px;
            font-weight: 400;
            line-height: 22px;

            &.#{$prefixCls}__content-item-selected {
              color: #1c66e5;
            }
          }
        }
      }
    }
  }
}
</style>
