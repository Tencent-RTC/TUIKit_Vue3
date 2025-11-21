<!-- eslint-disable import/extensions -->
<template>
  <div
    v-if="isH5"
    :class="$style['SearchDateRangePicker__h5-mask']"
    @click="handleH5Cancel"
  >
    <div
      :class="$style['SearchDateRangePicker__h5-panel']"
      @click.stop
    >
      <div :class="$style['SearchDateRangePicker__h5-header']">
        {{ t('DateRangePicker.Time') }}
      </div>
      <div :class="$style.SearchDateRangePicker__calendar">
        <div :class="$style['SearchDateRangePicker__calendar-header']">
          <button
            :class="$style['SearchDateRangePicker__nav-button']"
            @click="handleYearChange(true, false)"
          >
            &lt;&lt;
          </button>
          <button
            :class="$style['SearchDateRangePicker__nav-button']"
            @click="handleMonthChange(true, false)"
          >
            &lt;
          </button>
          <span
            :class="$style['SearchDateRangePicker__current-month-year']"
            @click="handlePickerToggle(true)"
          >
            {{ leftDate.getFullYear() }} {{ MONTH_NAMES[leftDate.getMonth()] }}
          </span>
          <button
            :class="$style['SearchDateRangePicker__nav-button']"
            @click="handleMonthChange(true, true)"
          >
            &gt;
          </button>
          <button
            :class="$style['SearchDateRangePicker__nav-button']"
            @click="handleYearChange(true, true)"
          >
            &gt;&gt;
          </button>
          <div
            v-if="isPickerOpenLeft"
            ref="pickerRefLeft"
            :class="$style['SearchDateRangePicker__picker-dropdown']"
          >
            <div :class="$style['SearchDateRangePicker__picker-header']">
              <button
                :class="$style['SearchDateRangePicker__picker-nav-button']"
                @click="handlePickerYearChange(true, pickerYearLeft - 1)"
              >
                &lt;
              </button>
              <span :class="$style['SearchDateRangePicker__picker-year-text']">{{ pickerYearLeft }}</span>
              <button
                :class="$style['SearchDateRangePicker__picker-nav-button']"
                @click="handlePickerYearChange(true, pickerYearLeft + 1)"
              >
                &gt;
              </button>
            </div>
            <div :class="$style['SearchDateRangePicker__picker-months']">
              <button
                v-for="(monthName, index) in MONTH_NAMES"
                :key="monthName"
                :class="$style['SearchDateRangePicker__picker-month-button']"
                @click="handlePickerMonthSelect(true, index)"
              >
                {{ monthName }}
              </button>
            </div>
          </div>
        </div>
        <div :class="$style['SearchDateRangePicker__week-days']">
          <div
            v-for="day in WEEK_DAYS"
            :key="day"
            :class="$style['SearchDateRangePicker__week-day']"
          >
            {{ day }}
          </div>
        </div>
        <div :class="$style.SearchDateRangePicker__days">
          <div
            v-for="({ date: day, isCurrentMonth }, index) in getMonthData(leftDate)"
            :key="index"
            :class="[
              $style.SearchDateRangePicker__day,
              {
                [$style['SearchDateRangePicker__day--selected']]: isDateSelected(day),
                [$style['SearchDateRangePicker__day--start']]: isStartDate(day) && isCurrentMonth,
                [$style['SearchDateRangePicker__day--end']]: isEndDate(day) && isCurrentMonth,
                [$style['SearchDateRangePicker__day--other-month']]: !isCurrentMonth,
                [$style['SearchDateRangePicker__day--today']]: isToday(day) && isCurrentMonth,
              },
            ]"
            @click="isCurrentMonth && handleDateClick(day)"
          >
            {{ day.getDate() }}
          </div>
        </div>
      </div>
    </div>
  </div>

  <div
    v-else
    :class="[$style.SearchDateRangePicker, className]"
  >
    <div :class="$style.SearchDateRangePicker__calendars">
      <div :class="$style.SearchDateRangePicker__calendar">
        <div :class="$style['SearchDateRangePicker__calendar-header']">
          <button
            :class="$style['SearchDateRangePicker__nav-button']"
            @click="handleYearChange(true, false)"
          >
            &lt;&lt;
          </button>
          <button
            :class="$style['SearchDateRangePicker__nav-button']"
            @click="handleMonthChange(true, false)"
          >
            &lt;
          </button>
          <span
            :class="$style['SearchDateRangePicker__current-month-year']"
            @click="handlePickerToggle(true)"
          >
            {{ leftDate.getFullYear() }} {{ MONTH_NAMES[leftDate.getMonth()] }}
          </span>
          <button
            :class="$style['SearchDateRangePicker__nav-button']"
            @click="handleMonthChange(true, true)"
          >
            &gt;
          </button>
          <button
            :class="$style['SearchDateRangePicker__nav-button']"
            @click="handleYearChange(true, true)"
          >
            &gt;&gt;
          </button>
          <div
            v-if="isPickerOpenLeft"
            ref="pickerRefLeft"
            :class="$style['SearchDateRangePicker__picker-dropdown']"
          >
            <div :class="$style['SearchDateRangePicker__picker-header']">
              <button
                :class="$style['SearchDateRangePicker__picker-nav-button']"
                @click="handlePickerYearChange(true, pickerYearLeft - 1)"
              >
                &lt;
              </button>
              <span :class="$style['SearchDateRangePicker__picker-year-text']">{{ pickerYearLeft }}</span>
              <button
                :class="$style['SearchDateRangePicker__picker-nav-button']"
                @click="handlePickerYearChange(true, pickerYearLeft + 1)"
              >
                &gt;
              </button>
            </div>
            <div :class="$style['SearchDateRangePicker__picker-months']">
              <button
                v-for="(monthName, index) in MONTH_NAMES"
                :key="monthName"
                :class="$style['SearchDateRangePicker__picker-month-button']"
                @click="handlePickerMonthSelect(true, index)"
              >
                {{ monthName }}
              </button>
            </div>
          </div>
        </div>
        <div :class="$style['SearchDateRangePicker__week-days']">
          <div
            v-for="day in WEEK_DAYS"
            :key="day"
            :class="$style['SearchDateRangePicker__week-day']"
          >
            {{ day }}
          </div>
        </div>
        <div :class="$style.SearchDateRangePicker__days">
          <div
            v-for="({ date: day, isCurrentMonth }, index) in getMonthData(leftDate)"
            :key="index"
            :class="[
              $style.SearchDateRangePicker__day,
              {
                [$style['SearchDateRangePicker__day--selected']]: isDateSelected(day),
                [$style['SearchDateRangePicker__day--start']]: isStartDate(day) && isCurrentMonth,
                [$style['SearchDateRangePicker__day--end']]: isEndDate(day) && isCurrentMonth,
                [$style['SearchDateRangePicker__day--other-month']]: !isCurrentMonth,
                [$style['SearchDateRangePicker__day--today']]: isToday(day) && isCurrentMonth,
              },
            ]"
            @click="isCurrentMonth && handleDateClick(day)"
          >
            {{ day.getDate() }}
          </div>
        </div>
      </div>

      <div :class="$style.SearchDateRangePicker__calendar">
        <div :class="$style['SearchDateRangePicker__calendar-header']">
          <button
            :class="$style['SearchDateRangePicker__nav-button']"
            @click="handleYearChange(false, false)"
          >
            &lt;&lt;
          </button>
          <button
            :class="$style['SearchDateRangePicker__nav-button']"
            @click="handleMonthChange(false, false)"
          >
            &lt;
          </button>
          <span
            :class="$style['SearchDateRangePicker__current-month-year']"
            @click="handlePickerToggle(false)"
          >
            {{ rightDate.getFullYear() }} {{ MONTH_NAMES[rightDate.getMonth()] }}
          </span>
          <button
            :class="$style['SearchDateRangePicker__nav-button']"
            @click="handleMonthChange(false, true)"
          >
            &gt;
          </button>
          <button
            :class="$style['SearchDateRangePicker__nav-button']"
            @click="handleYearChange(false, true)"
          >
            &gt;&gt;
          </button>
          <div
            v-if="isPickerOpenRight"
            ref="pickerRefRight"
            :class="$style['SearchDateRangePicker__picker-dropdown']"
          >
            <div :class="$style['SearchDateRangePicker__picker-header']">
              <button
                :class="$style['SearchDateRangePicker__picker-nav-button']"
                @click="handlePickerYearChange(false, pickerYearRight - 1)"
              >
                &lt;
              </button>
              <span :class="$style['SearchDateRangePicker__picker-year-text']">{{ pickerYearRight }}</span>
              <button
                :class="$style['SearchDateRangePicker__picker-nav-button']"
                @click="handlePickerYearChange(false, pickerYearRight + 1)"
              >
                &gt;
              </button>
            </div>
            <div :class="$style['SearchDateRangePicker__picker-months']">
              <button
                v-for="(monthName, index) in MONTH_NAMES"
                :key="monthName"
                :class="$style['SearchDateRangePicker__picker-month-button']"
                @click="handlePickerMonthSelect(false, index)"
              >
                {{ monthName }}
              </button>
            </div>
          </div>
        </div>
        <div :class="$style['SearchDateRangePicker__week-days']">
          <div
            v-for="day in WEEK_DAYS"
            :key="day"
            :class="$style['SearchDateRangePicker__week-day']"
          >
            {{ day }}
          </div>
        </div>
        <div :class="$style.SearchDateRangePicker__days">
          <div
            v-for="({ date: day, isCurrentMonth }, index) in getMonthData(rightDate)"
            :key="index"
            :class="[
              $style.SearchDateRangePicker__day,
              {
                [$style['SearchDateRangePicker__day--selected']]: isDateSelected(day),
                [$style['SearchDateRangePicker__day--start']]: isStartDate(day) && isCurrentMonth,
                [$style['SearchDateRangePicker__day--end']]: isEndDate(day) && isCurrentMonth,
                [$style['SearchDateRangePicker__day--other-month']]: !isCurrentMonth,
                [$style['SearchDateRangePicker__day--today']]: isToday(day) && isCurrentMonth,
              },
            ]"
            @click="isCurrentMonth && handleDateClick(day)"
          >
            {{ day.getDate() }}
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { ref, watch, onMounted, onUnmounted, defineProps } from 'vue';
import { useUIKit } from '@tencentcloud/uikit-base-component-vue3';
import { isH5 } from '../../../../utils';

interface DateRangePickerProps {
  value?: [Date | null, Date | null];
  onChange?: (dates: [Date | null, Date | null]) => void;
  className?: string;
}

const props = defineProps<DateRangePickerProps>();

const { t } = useUIKit();

const leftDate = ref(new Date());
const rightDate = ref(
  (() => {
    const date = new Date();
    date.setMonth(date.getMonth() + 1);
    return date;
  })(),
);
const internalDates = ref<[Date | null, Date | null]>([null, null]);
const isPickerOpenLeft = ref(false);
const isPickerOpenRight = ref(false);
const pickerYearLeft = ref(leftDate.value.getFullYear());
const pickerYearRight = ref(rightDate.value.getFullYear());
const pickerRefLeft = ref<HTMLDivElement>();
const pickerRefRight = ref<HTMLDivElement>();
const isUpdatingRef = ref(false);

const MONTH_NAMES = [
  t('DateRangePicker.January'),
  t('DateRangePicker.February'),
  t('DateRangePicker.March'),
  t('DateRangePicker.April'),
  t('DateRangePicker.May'),
  t('DateRangePicker.June'),
  t('DateRangePicker.July'),
  t('DateRangePicker.August'),
  t('DateRangePicker.September'),
  t('DateRangePicker.October'),
  t('DateRangePicker.November'),
  t('DateRangePicker.December'),
];

const WEEK_DAYS = [
  t('DateRangePicker.Monday'),
  t('DateRangePicker.Tuesday'),
  t('DateRangePicker.Wednesday'),
  t('DateRangePicker.Thursday'),
  t('DateRangePicker.Friday'),
  t('DateRangePicker.Saturday'),
  t('DateRangePicker.Sunday'),
];

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
  () => props.value,
  (newValue) => {
    internalDates.value = newValue || [null, null];
  },
  { immediate: true },
);

const handleClickOutside = (event: MouseEvent) => {
  if (pickerRefLeft.value && !pickerRefLeft.value.contains(event.target as Node)) {
    isPickerOpenLeft.value = false;
  }
  if (pickerRefRight.value && !pickerRefRight.value.contains(event.target as Node)) {
    isPickerOpenRight.value = false;
  }
};

onMounted(() => {
  document.addEventListener('mousedown', handleClickOutside);
});

onUnmounted(() => {
  document.removeEventListener('mousedown', handleClickOutside);
});

const getMonthData = (date: Date) => {
  const year = date.getFullYear();
  const month = date.getMonth();
  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);
  const days = [];

  const firstDayWeek = firstDay.getDay() === 0 ? 6 : firstDay.getDay() - 1;
  for (let i = firstDayWeek; i > 0; i -= 1) {
    const prevDate = new Date(year, month, 1 - i);
    days.push({ date: prevDate, isCurrentMonth: false });
  }

  for (let i = 1; i <= lastDay.getDate(); i += 1) {
    days.push({ date: new Date(year, month, i), isCurrentMonth: true });
  }

  for (let i = 1; days.length < 42; i += 1) {
    const nextDate = new Date(year, month + 1, i);
    days.push({ date: nextDate, isCurrentMonth: false });
  }

  return days;
};

const handleDateClick = (date: Date) => {
  let newDates: [Date | null, Date | null];

  if (!internalDates.value[0] || (internalDates.value[0] && internalDates.value[1])) {
    newDates = [setStartOfDay(date), null];
  } else {
    const [start] = internalDates.value;
    if (start && date < start) {
      newDates = [setStartOfDay(date), setEndOfDay(start)];
    } else {
      newDates = [setStartOfDay(start), setEndOfDay(date)];
    }
  }

  isUpdatingRef.value = true;
  internalDates.value = newDates;
  props.onChange?.(newDates);
  isUpdatingRef.value = false;
};

const updateDate = (newDate: Date, isLeft: boolean) => {
  const otherDate = isLeft ? rightDate.value : leftDate.value;

  // Normalize time to avoid issues with exact comparison
  const normalizedNewDate = new Date(newDate.getFullYear(), newDate.getMonth(), 1);
  const normalizedOtherDate = new Date(otherDate.getFullYear(), otherDate.getMonth(), 1);

  // Ensure left < right month
  if (isLeft && normalizedNewDate >= normalizedOtherDate) {
    return; // Prevent left month from being >= right month
  }
  if (!isLeft && normalizedNewDate <= normalizedOtherDate) {
    return; // Prevent right month from being <= left month
  }

  if (isLeft) {
    leftDate.value = newDate;
  } else {
    rightDate.value = newDate;
  }
};

const handleMonthChange = (isLeft: boolean, increment: boolean) => {
  const currentDate = isLeft ? leftDate.value : rightDate.value;
  const newDate = new Date(currentDate);
  newDate.setMonth(newDate.getMonth() + (increment ? 1 : -1));
  updateDate(newDate, isLeft);
};

const handleYearChange = (isLeft: boolean, increment: boolean) => {
  const currentDate = isLeft ? leftDate.value : rightDate.value;
  const newDate = new Date(currentDate);
  newDate.setFullYear(newDate.getFullYear() + (increment ? 1 : -1));
  updateDate(newDate, isLeft);
};

const handlePickerToggle = (isLeft: boolean) => {
  if (isLeft) {
    pickerYearLeft.value = leftDate.value.getFullYear();
    isPickerOpenLeft.value = !isPickerOpenLeft.value;
    isPickerOpenRight.value = false; // Close other picker
  } else {
    pickerYearRight.value = rightDate.value.getFullYear();
    isPickerOpenRight.value = !isPickerOpenRight.value;
    isPickerOpenLeft.value = false; // Close other picker
  }
};

const handlePickerYearChange = (isLeft: boolean, year: number) => {
  if (isLeft) {
    pickerYearLeft.value = year;
  } else {
    pickerYearRight.value = year;
  }
};

const handlePickerMonthSelect = (isLeft: boolean, month: number) => {
  const currentYear = isLeft ? pickerYearLeft.value : pickerYearRight.value;
  const newDate = new Date(currentYear, month, 1);
  updateDate(newDate, isLeft);
  if (isLeft) {
    isPickerOpenLeft.value = false;
  } else {
    isPickerOpenRight.value = false;
  }
};

const isDateSelected = (date: Date): boolean => {
  const [start, end] = internalDates.value;
  if (!start || !end) {
    return false;
  }
  const dayTime = date.setHours(0, 0, 0, 0);
  const startTime = new Date(start).setHours(0, 0, 0, 0);
  const endTime = new Date(end).setHours(0, 0, 0, 0);
  return dayTime >= startTime && dayTime <= endTime;
};

const isStartDate = (date: Date): boolean => {
  const [start] = internalDates.value;
  if (!start) {
    return false;
  }
  const dayTime = date.setHours(0, 0, 0, 0);
  const startTime = new Date(start).setHours(0, 0, 0, 0);
  return startTime === dayTime;
};

const isEndDate = (date: Date): boolean => {
  const [, end] = internalDates.value;
  if (!end) {
    return false;
  }
  const dayTime = date.setHours(0, 0, 0, 0);
  const endTime = new Date(end).setHours(0, 0, 0, 0);
  return endTime === dayTime;
};

const isToday = (date: Date): boolean => {
  const today = new Date();
  const dayTime = date.setHours(0, 0, 0, 0);
  const todayTime = today.setHours(0, 0, 0, 0);
  return dayTime === todayTime;
};

const handleH5Cancel = () => {
  props.onChange?.([null, null]);
};
</script>

<style lang="scss" module>
@use './DateRangePicker.scss';
</style>
