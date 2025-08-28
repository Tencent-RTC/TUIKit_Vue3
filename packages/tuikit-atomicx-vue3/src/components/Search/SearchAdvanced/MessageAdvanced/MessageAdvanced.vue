<!-- eslint-disable import/extensions -->
<template>
  <div :class="$style.SearchMessageAdvanced">
    <div
      ref="datePickerRef"
      :class="$style['SearchMessageAdvanced__filter-row']"
    >
      <div
        :class="$style['SearchMessageAdvanced__filter-select']"
        @click="toggleDatePicker"
      >
        <span :class="$style['SearchMessageAdvanced__filter-label']"> {{ t('Search.input.selectTime') }}： </span>
        <span :class="$style['SearchMessageAdvanced__filter-value']">
          {{ getDateRangeText() }}
        </span>
        <span
          :class="[
            $style['SearchMessageAdvanced__arrow'],
            { [$style['SearchMessageAdvanced__arrow--up']]: isDatePickerOpen },
          ]"
        >
          ▼
        </span>
      </div>
      <div :class="$style['SearchMessageAdvanced__quick-options']">
        <TUIButton
          v-for="option in quickOptions"
          :key="option.value"
          type="text"
          :class="[
            $style['SearchMessageAdvanced__quick-option'],
            { [$style['SearchMessageAdvanced__quick-option--active']]: activeQuickOption === option.value },
          ]"
          @click="handleQuickOptionClick(option.value)"
        >
          {{ option.label }}
        </TUIButton>
      </div>
      <div
        v-if="isDatePickerOpen"
        :class="$style['SearchMessageAdvanced__date-picker-dropdown']"
      >
        <DateRangePicker
          :value="dateRange"
          @change="onDateRangeChange"
        />
      </div>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { ref, watch, onMounted, onUnmounted, defineProps } from 'vue';
import { TUIButton, useUIKit } from '@tencentcloud/uikit-base-component-vue3';
import { SearchType } from '../../../../types/engine';
import { DateRangePicker } from '../DateRangePicker';

interface IMessageAdvancedProps {
  advancedParams?: Map<SearchType, any>;
  onAdvancedParamsChange?: (params: Map<SearchType, any>) => void;
}

const props = defineProps<IMessageAdvancedProps>();

const { t } = useUIKit();

const isDatePickerOpen = ref(false);
const dateRange = ref<[Date | null, Date | null]>([null, null]);
const datePickerRef = ref<HTMLDivElement>();
const activeQuickOption = ref<string>('');

const quickOptions = [
  { label: t('Search.timeFilter.today'), value: 'today' },
  { label: t('Search.timeFilter.last3Days'), value: 'last3days' },
  { label: t('Search.timeFilter.last7Days'), value: 'last7days' },
];

const handleClickOutside = (event: MouseEvent) => {
  if (datePickerRef.value && !datePickerRef.value.contains(event.target as Node)) {
    isDatePickerOpen.value = false;
  }
};

onMounted(() => {
  document.addEventListener('mousedown', handleClickOutside);
});

onUnmounted(() => {
  document.removeEventListener('mousedown', handleClickOutside);
});

const setStartOfDay = (date: Date): Date => {
  const newDate = new Date(date);
  newDate.setHours(0, 0, 0, 0);
  return newDate;
};

const setEndOfDay = (date: Date): Date => {
  const newDate = new Date(date);
  newDate.setHours(23, 59, 59, 999);
  return newDate;
};

watch(
  () => props.advancedParams,
  (newParams) => {
    const messageParams = newParams?.get(SearchType.MESSAGE);
    let newDateRange: [Date | null, Date | null] = [null, null];
    if (messageParams?.timePosition && messageParams?.timePeriod) {
      const endTimes = new Date(messageParams.timePosition * 1000);
      const startTimes = new Date((messageParams.timePosition - messageParams.timePeriod) * 1000);
      newDateRange = [startTimes, endTimes];
    }
    dateRange.value = newDateRange;
  },
  { immediate: true },
);

const dateRangeMatch = (startTime: number | undefined, endTime: number | undefined, daysAgo: number): boolean => {
  if (!startTime || !endTime) {
    return false;
  }
  const today = new Date();
  const endOfToday = setEndOfDay(today).getTime();
  const date = new Date();
  date.setDate(date.getDate() - (daysAgo - 1));
  const startOfDaysAgo = setStartOfDay(date).getTime();
  return endTime === endOfToday && startTime === startOfDaysAgo;
};

function matchQuickOptionByDateRange([start, end]: [Date | null, Date | null]): string {
  const startTimes = start?.getTime();
  const endTimes = end?.getTime();
  const quickOptionMatches = [
    { option: 'today', days: 1 },
    { option: 'last3days', days: 3 },
    { option: 'last7days', days: 7 },
  ];
  const matchedOption = quickOptionMatches.find(({ days }) => dateRangeMatch(startTimes, endTimes, days));
  return matchedOption?.option || '';
}

watch(
  dateRange,
  (newDateRange) => {
    if (!activeQuickOption.value) {
      const startTimes = newDateRange[0]?.getTime();
      const endTimes = newDateRange[1]?.getTime();

      const quickOptionMatches = [
        { option: 'today', days: 1 },
        { option: 'last3days', days: 3 },
        { option: 'last7days', days: 7 },
      ];

      const matchedOption = quickOptionMatches.find(({ days }) => dateRangeMatch(startTimes, endTimes, days));

      activeQuickOption.value = matchedOption?.option || '';
    }
  },
  { immediate: true },
);

const getDateRangeText = () => {
  const [start, end] = dateRange.value;
  if (!start || !end) {
    return t('Search.timeFilter.allTime');
  }
  return `${start.toLocaleDateString()} - ${end.toLocaleDateString()}`;
};

const toggleDatePicker = () => {
  isDatePickerOpen.value = !isDatePickerOpen.value;
};

const handleDateRange = (dates: [Date | null, Date | null], quickOption?: string) => {
  const [startDate, endDate] = dates;
  const options = {
    timePosition: 0,
    timePeriod: 0,
  };

  if (startDate && endDate) {
    const startTimestamp = Math.floor(startDate.getTime() / 1000);
    options.timePosition = Math.floor(endDate.getTime() / 1000);
    options.timePeriod = options.timePosition - startTimestamp;
  }

  if (quickOption !== undefined) {
    activeQuickOption.value = quickOption;
  }

  if (props.onAdvancedParamsChange) {
    const newParams = new Map(props.advancedParams || []);
    newParams.set(SearchType.MESSAGE, {
      ...newParams.get(SearchType.MESSAGE),
      ...options,
    });
    props.onAdvancedParamsChange(newParams);
  }
};

const onDateRangeChange = (dates: [Date | null, Date | null]) => {
  const [startDate, endDate] = dates;
  if (!startDate && !endDate) {
    isDatePickerOpen.value = false;
  }
  if (!startDate || !endDate) {
    return;
  }
  isDatePickerOpen.value = false;
  const isSameStart = startDate?.getTime() === dateRange.value[0]?.getTime();
  const isSameEnd = endDate?.getTime() === dateRange.value[1]?.getTime();

  if (isSameStart && isSameEnd) {
    return;
  }

  handleDateRange(dates);
  activeQuickOption.value = matchQuickOptionByDateRange(dates);
};

const handleQuickOptionClick = (option: string) => {
  const activeOption = option === activeQuickOption.value ? '' : option;
  const today = new Date();
  let start: Date | null = null;
  let end: Date | null = null;

  if (option !== activeQuickOption.value) {
    switch (option) {
      case 'today':
        start = setStartOfDay(today);
        end = setEndOfDay(today);
        break;
      case 'last3days': {
        const startDate = new Date(today);
        startDate.setDate(today.getDate() - 2);
        start = setStartOfDay(startDate);
        end = setEndOfDay(today);
        break;
      }
      case 'last7days': {
        const startDate = new Date(today);
        startDate.setDate(today.getDate() - 6);
        start = setStartOfDay(startDate);
        end = setEndOfDay(today);
        break;
      }
      default:
        start = null;
        end = null;
        break;
    }
  }

  const dates: [Date | null, Date | null] = [start, end];
  handleDateRange(dates, activeOption);
};
</script>

<style lang="scss" module>
@import './MessageAdvanced.scss';
</style>
