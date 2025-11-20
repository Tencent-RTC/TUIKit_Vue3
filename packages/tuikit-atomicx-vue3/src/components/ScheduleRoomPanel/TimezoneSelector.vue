<template>
  <TUISelect :model-value="modelValue" @update:model-value="handleUpdate">
    <TUIOption
      v-for="option in timezoneOptions"
      :key="option.value"
      :value="option.value"
      :label="option.label"
    />
  </TUISelect>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { TUISelect, TUIOption, useUIKit } from '@tencentcloud/uikit-base-component-vue3';

interface Props {
  modelValue: string;
}

interface Emits {
  (e: 'update:modelValue', value: string): void;
}

defineProps<Props>();
const emit = defineEmits<Emits>();

const { t } = useUIKit();

// 时区数据结构
const timezoneData = [
  // 常用时区优先显示
  { offset: 'UTC+08:00', cityKey: 'Beijing', cityEn: 'Beijing', value: 'Asia/Shanghai' },
  { offset: 'UTC+09:00', cityKey: 'Tokyo', cityEn: 'Tokyo', value: 'Asia/Tokyo' },
  { offset: 'UTC+00:00', cityKey: 'London', cityEn: 'London', value: 'Europe/London' },
  { offset: 'UTC-05:00', cityKey: 'New York', cityEn: 'New York', value: 'America/New_York' },
  { offset: 'UTC-08:00', cityKey: 'Los Angeles', cityEn: 'Los Angeles', value: 'America/Los_Angeles' },

  // 其他时区按时差排序
  { offset: 'UTC-12:00', cityKey: 'Baker Island', cityEn: 'Baker Island', value: 'Etc/GMT+12' },
  { offset: 'UTC-11:00', cityKey: 'Samoa', cityEn: 'Samoa', value: 'Pacific/Samoa' },
  { offset: 'UTC-10:00', cityKey: 'Hawaii', cityEn: 'Hawaii', value: 'Pacific/Honolulu' },
  { offset: 'UTC-09:00', cityKey: 'Alaska', cityEn: 'Alaska', value: 'America/Anchorage' },
  { offset: 'UTC-07:00', cityKey: 'Denver', cityEn: 'Denver', value: 'America/Denver' },
  { offset: 'UTC-06:00', cityKey: 'Chicago', cityEn: 'Chicago', value: 'America/Chicago' },
  { offset: 'UTC-04:00', cityKey: 'Halifax', cityEn: 'Halifax', value: 'America/Halifax' },
  { offset: 'UTC-03:00', cityKey: 'Buenos Aires', cityEn: 'Buenos Aires', value: 'America/Argentina/Buenos_Aires' },
  { offset: 'UTC-02:00', cityKey: 'Mid-Atlantic', cityEn: 'Mid-Atlantic', value: 'Etc/GMT+2' },
  { offset: 'UTC-01:00', cityKey: 'Azores', cityEn: 'Azores', value: 'Atlantic/Azores' },
  { offset: 'UTC+01:00', cityKey: 'Berlin', cityEn: 'Berlin', value: 'Europe/Berlin' },
  { offset: 'UTC+02:00', cityKey: 'Cairo', cityEn: 'Cairo', value: 'Africa/Cairo' },
  { offset: 'UTC+03:00', cityKey: 'Moscow', cityEn: 'Moscow', value: 'Europe/Moscow' },
  { offset: 'UTC+04:00', cityKey: 'Dubai', cityEn: 'Dubai', value: 'Asia/Dubai' },
  { offset: 'UTC+05:00', cityKey: 'Karachi', cityEn: 'Karachi', value: 'Asia/Karachi' },
  { offset: 'UTC+05:30', cityKey: 'Mumbai', cityEn: 'Mumbai', value: 'Asia/Kolkata' },
  { offset: 'UTC+06:00', cityKey: 'Dhaka', cityEn: 'Dhaka', value: 'Asia/Dhaka' },
  { offset: 'UTC+07:00', cityKey: 'Bangkok', cityEn: 'Bangkok', value: 'Asia/Bangkok' },
  { offset: 'UTC+10:00', cityKey: 'Sydney', cityEn: 'Sydney', value: 'Australia/Sydney' },
  { offset: 'UTC+11:00', cityKey: 'Solomon Islands', cityEn: 'Solomon Islands', value: 'Pacific/Guadalcanal' },
  { offset: 'UTC+12:00', cityKey: 'Auckland', cityEn: 'Auckland', value: 'Pacific/Auckland' },
];

// 动态生成时区选项，支持中英文显示
const timezoneOptions = computed(() =>
  timezoneData.map(tz => ({
    label: `${tz.offset} (${t(tz.cityKey)})`,
    value: tz.value,
  })),
);

const handleUpdate = (value: string) => {
  emit('update:modelValue', value);
};
</script>
