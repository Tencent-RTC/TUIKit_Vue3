<!-- eslint-disable import/extensions -->
<template>
  <div :class="$style.SearchUserAdvanced">
    <div :class="$style['SearchUserAdvanced__filter-row']">
      <div
        :class="$style['SearchUserAdvanced__filter-select']"
        @click="isH5 ? toggleFilter() : setIsGenderOpen(!isGenderOpen)"
      >
        <span :class="$style['SearchUserAdvanced__filter-label']"> {{ t('Search.filter.gender') }}： </span>
        <span :class="$style['SearchUserAdvanced__filter-value']">
          {{ getGenderText(userAdvanced?.gender || t('Search.filter.gender.any')) }}
        </span>
        <span :class="[$style.SearchUserAdvanced__arrow, { [$style['SearchUserAdvanced__arrow--up']]: isGenderOpen }]">
          ▼
        </span>
      </div>
      <div v-if="!isH5 && isGenderOpen" :class="$style.SearchUserAdvanced__dropdown" ref="genderRef">
        <div
          v-for="item in genderList"
          :key="item.value"
          :class="$style.SearchUserAdvanced__option"
          @click="handleGenderChange(item.value)"
        >
          {{ item.label }}
        </div>
      </div>
    </div>
    <div :class="$style['SearchUserAdvanced__filter-row']" ref="ageRef">
      <div
        :class="$style['SearchUserAdvanced__filter-select']"
        @click="isH5 ? toggleFilter() : setIsAgeOpen(!isAgeOpen)"
      >
        <span :class="$style['SearchUserAdvanced__filter-label']"> {{ t('Search.filter.age') }}： </span>
        <span :class="$style['SearchUserAdvanced__filter-value']">
          {{ `${minAge || '0'}-${maxAge || '99'} ${t('Search.filter.age.yearsOld')}` }}
        </span>
        <span
          v-if="!isH5"
          :class="[$style.SearchUserAdvanced__arrow, { [$style['SearchUserAdvanced__arrow--up']]: isAgeOpen }]"
        >
          ▼
        </span>
      </div>
      <div v-if="!isH5 && isAgeOpen" :class="$style.SearchUserAdvanced__dropdown">
        <div :class="$style['SearchUserAdvanced__age-inputs']">
          <input
            type="number"
            min="0"
            max="99"
            :value="tempAge.min ?? ''"
            placeholder="0"
            @input="e => handleAgeInputChange('min', (e.target as HTMLInputElement).value)"
            :class="$style['SearchUserAdvanced__age-input']"
          />
          <span>-</span>
          <input
            type="number"
            min="0"
            max="99"
            :value="tempAge.max ?? ''"
            placeholder="99"
            @input="e => handleAgeInputChange('max', (e.target as HTMLInputElement).value)"
            :class="$style['SearchUserAdvanced__age-input']"
          />
          <span>{{ t('Search.filter.age.yearsOld') }}</span>
          <TUIButton :class="$style['SearchUserAdvanced__confirm-button']" @click="handleAgeConfirm">
            {{ t('Search.action.confirm') }}
          </TUIButton>
        </div>
      </div>
    </div>
    <div v-if="isH5" :class="$style['SearchUserAdvanced__filter-row-right']" @click="toggleFilter">
      <IconSetting :class="$style['SearchUserAdvanced__filter-icon']" />
      <span :class="$style['SearchUserAdvanced__filter-text']">{{ t('Search.filter.title') }}</span>
    </div>

    <div v-if="isFilterPage" :class="$style['SearchUserAdvanced__filter-page']">
      <div :class="$style['SearchUserAdvanced__filter-page-header']">
        <div :class="$style['SearchUserAdvanced__back-button']" @click="toggleFilter">
          <IconBack size="24" />
        </div>
        <div :class="$style['SearchUserAdvanced__header-title']">{{ t('Search.filter.title') }}</div>
      </div>

      <div :class="$style['SearchUserAdvanced__filter-page-main']">
        <div
          :class="[$style['SearchUserAdvanced__filter-page-row'], $style['SearchUserAdvanced__bottom-line']]"
          @click="setIsGenderOpen(true)"
        >
          <span :class="$style['SearchUserAdvanced__filter-page-label']">{{ t('Search.filter.gender') }}</span>
          <div :class="$style['SearchUserAdvanced__filter-page-value']">
            <span>{{ getGenderText(tempGender) }}</span>
            <span :class="$style.SearchUserAdvanced__arrow">&gt;</span>
          </div>
        </div>
        <div v-if="isGenderOpen" :class="$style['SearchUserAdvanced__action-sheet-mask']">
          <div :class="$style['SearchUserAdvanced__action-sheet-panel']" ref="genderRef">
            <div
              v-for="item in genderList"
              :key="item.value"
              :class="$style['SearchUserAdvanced__action-sheet-option']"
              @click="handleTempGender(item.value)"
            >
              {{ item.label }}
            </div>
            <div :class="$style['SearchUserAdvanced__action-sheet-cancel']" @click="setIsGenderOpen(false)">
              {{ t('Search.action.cancel') }}
            </div>
          </div>
        </div>
        <div :class="$style['SearchUserAdvanced__filter-page-row']">
          <span :class="$style['SearchUserAdvanced__filter-page-label']">{{ t('Search.filter.age') }}</span>
          <div :class="$style['SearchUserAdvanced__filter-page-value']">
            <span>{{ `${tempAge.min ?? 0}-${tempAge.max ?? 99}` }}</span>
          </div>
        </div>
        <Slider
          :value="[tempAge.min ?? 0, tempAge.max ?? 99]"
          :min="0"
          :max="99"
          @change="val => setTempAge({ min: val[0], max: val[1] })"
        />
      </div>

      <div :class="$style['SearchUserAdvanced__filter-page-footer']">
        <TUIButton :class="$style['SearchUserAdvanced__filter-confirm-button']" @click="handleFilterChange">
          {{ t('Search.action.confirm') }}
        </TUIButton>
      </div>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { ref, watch, onMounted, onUnmounted, computed, defineProps } from 'vue';
import ChatEngine from '@tencentcloud/chat-uikit-engine';
import { IconBack, IconSetting, TUIButton, useUIKit } from '@tencentcloud/uikit-base-component-vue3';
import { SearchType } from '../../../../types/engine';
import { isH5 } from '../../../../utils';
import { Slider } from '../Slider';

interface IUserAdvancedProps {
  advancedParams?: Map<SearchType, any>;
  onAdvancedParamsChange?: (params: Map<SearchType, any>) => void;
}

const props = defineProps<IUserAdvancedProps>();

const { t } = useUIKit();

// 临时工具函数
const birthdayToAge = (birthday: number) => {
  const today = new Date();
  const birthDate = new Date(Math.floor(birthday / 10000), Math.floor((birthday % 10000) / 100) - 1, birthday % 100);
  let age = today.getFullYear() - birthDate.getFullYear();
  const monthDiff = today.getMonth() - birthDate.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
    age -= 1;
  }
  return age;
};

const ageToBirthday = (age: number | undefined) => {
  if (!age) {
    return undefined;
  }
  const today = new Date();
  const year = today.getFullYear() - age;
  return year * 10000 + (today.getMonth() + 1) * 100 + today.getDate();
};

const userAdvanced = ref<any>({});
const isGenderOpen = ref(false);
const isAgeOpen = ref(false);
const isFilterPage = ref(false);
const tempAge = ref<{ min: number | undefined; max: number | undefined }>({
  min: undefined,
  max: undefined,
});
const tempGender = ref<string>('不限');
const genderRef = ref<HTMLDivElement>();
const ageRef = ref<HTMLDivElement>();

const genderList = [
  {
    value: '不限',
    label: t('Search.filter.gender.any'),
  },
  {
    value: ChatEngine.TYPES.GENDER_MALE,
    label: t('Search.filter.gender.male'),
  },
  {
    value: ChatEngine.TYPES.GENDER_FEMALE,
    label: t('Search.filter.gender.female'),
  },
];

// 点击外部关闭下拉框
const handleClickOutside = (event: MouseEvent) => {
  if (genderRef.value && !genderRef.value.contains(event.target as Node)) {
    isGenderOpen.value = false;
  }
  if (ageRef.value && !ageRef.value.contains(event.target as Node)) {
    isAgeOpen.value = false;
  }
};

onMounted(() => {
  document.addEventListener('mousedown', handleClickOutside);
});

onUnmounted(() => {
  document.removeEventListener('mousedown', handleClickOutside);
});

// 监听高级参数变化
watch(
  () => props.advancedParams,
  newParams => {
    const userParams = newParams?.get(SearchType.USER) || {};
    userAdvanced.value = {
      ...userAdvanced.value,
      ...userParams,
    };
    tempGender.value = userParams?.gender || '不限';
    tempAge.value = {
      min: userParams?.maxBirthday ? birthdayToAge(userParams?.maxBirthday) : undefined,
      max: userParams?.miniBirthday ? birthdayToAge(userParams?.miniBirthday) : undefined,
    };
  },
  { immediate: true }
);

const handleGenderChange = (gender: string) => {
  if (props.onAdvancedParamsChange) {
    const newParams = new Map(props.advancedParams || []);
    newParams.set(SearchType.USER, {
      ...userAdvanced.value,
      gender: gender === '不限' ? undefined : gender,
    });
    props.onAdvancedParamsChange(newParams);
  }
  isGenderOpen.value = false;
};

const handleAgeChange = (age: { min: number | undefined; max: number | undefined }) => {
  if (props.onAdvancedParamsChange) {
    const newParams = new Map(props.advancedParams || []);
    newParams.set(SearchType.USER, {
      ...userAdvanced.value,
      miniBirthday: ageToBirthday(age.max),
      maxBirthday: ageToBirthday(age.min),
    });
    props.onAdvancedParamsChange(newParams);
  }
  isAgeOpen.value = false;
};

const handleAgeInputChange = (type: 'min' | 'max', value: string) => {
  if (value === '') {
    tempAge.value = {
      ...tempAge.value,
      [type]: undefined,
    };
  } else {
    const numValue = Math.max(0, Math.min(99, parseInt(value, 10) || 0));
    tempAge.value = {
      ...tempAge.value,
      [type]: numValue,
    };
  }
};

const toggleFilter = () => {
  isFilterPage.value = !isFilterPage.value;
};

const handleAgeConfirm = () => {
  const { min, max } = tempAge.value;
  handleAgeChange({ min, max });
};

const handleFilterChange = () => {
  toggleFilter();
  const isSameGender = userAdvanced.value?.gender === tempGender.value;
  const isSameMiniBirthday = userAdvanced.value?.miniBirthday === ageToBirthday(tempAge.value.max);
  const isSameMaxBirthday = userAdvanced.value?.maxBirthday === ageToBirthday(tempAge.value.min);
  if (isSameGender && isSameMiniBirthday && isSameMaxBirthday) {
    return;
  }
  if (props.onAdvancedParamsChange) {
    const newParams = new Map(props.advancedParams || []);
    newParams.set(SearchType.USER, {
      ...userAdvanced.value,
      gender: tempGender.value === '不限' ? undefined : tempGender.value,
      miniBirthday: tempAge.value.max !== 99 ? ageToBirthday(tempAge.value.max) : undefined,
      maxBirthday: tempAge.value.min !== 0 ? ageToBirthday(tempAge.value.min) : undefined,
    });
    props.onAdvancedParamsChange(newParams);
  }
};

const handleTempGender = (value: string) => {
  tempGender.value = value;
  isGenderOpen.value = false;
};

const setIsGenderOpen = (value: boolean) => {
  isGenderOpen.value = value;
  if (value) {
    isAgeOpen.value = false;
  }
};

const setIsAgeOpen = (value: boolean) => {
  isAgeOpen.value = value;
  if (value) {
    isGenderOpen.value = false;
  }
};

const setTempAge = (value: { min: number | undefined; max: number | undefined }) => {
  tempAge.value = value;
};

const minAge = computed(() =>
  userAdvanced.value?.maxBirthday ? birthdayToAge(userAdvanced.value.maxBirthday) : undefined
);
const maxAge = computed(() =>
  userAdvanced.value?.miniBirthday ? birthdayToAge(userAdvanced.value.miniBirthday) : undefined
);

const getGenderText = (gender: string) => {
  switch (gender) {
    case ChatEngine.TYPES.GENDER_MALE:
      return t('Search.filter.gender.male');
    case ChatEngine.TYPES.GENDER_FEMALE:
      return t('Search.filter.gender.female');
    default:
      return t('Search.filter.gender.any');
  }
};
</script>

<style lang="scss" module>
@import './UserAdvanced.scss';
</style>
