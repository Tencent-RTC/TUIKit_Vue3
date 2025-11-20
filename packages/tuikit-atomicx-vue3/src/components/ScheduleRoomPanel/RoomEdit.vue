<template>
  <div class="room-edit">
    <div class="edit-form">
      <!-- 房间名称 -->
      <div class="form-item">
        <div class="form-label">
          {{ t('Room Name') }}
        </div>
        <TUIInput
          v-model="internalForm.roomName"
          :placeholder="t('please enter the room name')"
          class="form-input"
        />
      </div>

      <!-- 开始时间 -->
      <div class="form-item">
        <div class="form-label">
          {{ t('Starting time') }}
        </div>
        <div class="datetime-group">
          <Datepicker v-model="internalForm.startDate" />
          <Timepicker v-model="internalForm.startTime" />
        </div>
      </div>

      <!-- 房间时长 -->
      <div class="form-item">
        <div class="form-label">
          {{ t('Room duration') }}
        </div>
        <DurationSelector v-model="internalForm.duration" />
      </div>

      <!-- 时区 -->
      <div class="form-item">
        <div class="form-label">
          {{ t('Time Zone') }}
        </div>
        <TimezoneSelector v-model="internalForm.timezone" />
      </div>

      <!-- 参与成员 -->
      <div :class="['form-item', { 'flex-start': internalForm.selectedUserList?.length > 0 }]">
        <div class="form-label">
          {{ t('Participants') }}
        </div>
        <div class="form-participants">
          <TUIInput
            v-model="searchUserId"
            :search="handleUserSearchChange"
            :select="handleSearchResultItemClick"
            :placeholder="t('Please enter participant names')"
            :emptyText="t('No relevant members found')"
          >
            <template #suffix>
              <IconManageMember @click="userPickerVisible = true" />
            </template>
            <template #searchResultItem="{ data }">
              <div class="search-result-item">
                <Avatar
                  class="search-result-item-avatar"
                  :size="20"
                  :src="data.avatarUrl"
                />
                <p class="search-result-item-name" :title="data.label">
                  {{ data.label }}
                </p>
              </div>
            </template>
          </TUIInput>
          <div v-if="internalForm.selectedUserList?.length > 0" class="form-attendees">
            <span
              v-for="user in internalForm.selectedUserList"
              :key="user.key"
              class="form-attendees-item"
            >
              <Avatar
                class="form-attendees-item-avatar"
                :src="user.avatarUrl"
                :size="20"
              />
              <p class="form-attendees-item-name" :title="user.label">
                {{ user.label }}
              </p>
              <IconClose1 class="form-attendees-item-remove" @click="removeSelectUser(user)" />
            </span>
            <span class="form-attendees-item form-attendees-count">
              {{ `${internalForm.selectedUserList?.length || 0} ${t('people')}` }}
            </span>
          </div>
        </div>
        <TUIDialog
          v-model:visible="userPickerVisible"
          :title="t('Contacts')"
          @confirm="handleUserPickerConfirm"
          @cancel="userPickerVisible = false"
        >
          <UserPicker
            ref="userPickerRef"
            class="room-user-picker"
            :data-source="userPickerData"
            :defaultSelectedItems="internalForm.selectedUserList"
            display-mode="list"
          />
          <template #footer />
        </TUIDialog>
      </div>
    </div>

    <div class="form-actions">
      <TUIButton
        type="default"
        @click="handleCancel"
      >
        {{ t('Cancel') }}
      </TUIButton>
      <TUIButton
        type="primary"
        @click="handleSave"
      >
        {{ t('Save') }}
      </TUIButton>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { ref, watch, computed } from 'vue';
import {
  TUIButton,
  TUIInput,
  TUIToast,
  TUIDialog,
  IconManageMember,
  IconClose1,
} from '@tencentcloud/uikit-base-component-vue3';
import { useI18n } from '../../locales';
import { useContactListState } from '../../states/ContactListState';
import { Avatar } from '../Avatar';
import { UserPicker } from '../UserPicker';
import Datepicker from './Datepicker.vue';
import DurationSelector from './DurationSelector.vue';
import Timepicker from './Timepicker.vue';
import TimezoneSelector from './TimezoneSelector.vue';
import { convertTimezoneToUTC, convertTimeBetweenTimezones } from './utils';
import type { EditFormData } from './type';
import type { RoomInfo } from '../../types';
import type { UserPickerDataSource, UserPickerRow } from '../UserPicker';

const { t } = useI18n();

interface Props {
  roomInfo: RoomInfo | null;
}

interface Emits {
  (e: 'cancel'): void;
  (e: 'save', data: EditFormData): void;
}

const props = defineProps<Props>();
const emit = defineEmits<Emits>();

// 内部表单数据结构
const internalForm = ref({
  roomName: '',
  startDate: 0,
  startTime: 0,
  duration: 1800,
  timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
  selectedUserList: [] as UserPickerDataSource,
});

const { friendList } = useContactListState();
const userPickerRef = ref();
const userPickerVisible = ref(false);
const searchUserId = ref('');

const userPickerData = computed(() =>
  friendList.value.map(item => ({
    key: item.userID,
    label: item.nick,
    avatarUrl: item.avatar,
    extraData: item,
  })),
);

// 计算开始和结束时间戳（转换为标准UTC时间戳）
const scheduleStartTime = computed(() => {
  const dateObj = new Date(internalForm.value.startDate * 1000);
  const timeObj = new Date(internalForm.value.startTime * 1000);

  return convertTimezoneToUTC(
    dateObj.getFullYear(),
    dateObj.getMonth(),
    dateObj.getDate(),
    timeObj.getHours(),
    timeObj.getMinutes(),
    internalForm.value.timezone,
  );
});

const scheduleEndTime = computed(() => scheduleStartTime.value + internalForm.value.duration);

// 初始化表单数据
const initializeForm = () => {
  if (!props.roomInfo) {
    return;
  }

  // 计算时长（秒）
  const duration = props.roomInfo.scheduledEndTime && props.roomInfo.scheduledStartTime
    ? props.roomInfo.scheduledEndTime - props.roomInfo.scheduledStartTime
    : 1800;

  // 转换参与者数据
  const selectedUserList = props.roomInfo.scheduleAttendees?.map(attendee => ({
    key: attendee.userId,
    label: attendee.userName || attendee.userId,
    avatarUrl: attendee.avatarUrl || '',
    extraData: attendee,
  })) || [];

  // 从时间戳计算日期和时间
  const startDateTime = new Date((props.roomInfo.scheduledStartTime || 0) * 1000);
  const startDate = new Date(startDateTime);
  startDate.setHours(0, 0, 0, 0);

  internalForm.value = {
    roomName: props.roomInfo.roomName || '',
    startDate: Math.floor(startDate.getTime() / 1000),
    startTime: Math.floor(startDateTime.getTime() / 1000),
    duration,
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    selectedUserList,
  };
};

// 监听 roomInfo 变化
watch(() => props.roomInfo, () => {
  initializeForm();
}, { immediate: true });

// 监听时区变化，基于当前选择的时间进行时区转换
watch(() => internalForm.value.timezone, (newTimezone, oldTimezone) => {
  if (newTimezone && oldTimezone && newTimezone !== oldTimezone) {
    // 基于用户已选择的时间进行时区转换
    const convertedTime = convertTimeBetweenTimezones(
      internalForm.value.startDate,
      internalForm.value.startTime,
      oldTimezone,
      newTimezone,
    );

    internalForm.value.startDate = convertedTime.startDate;
    internalForm.value.startTime = convertedTime.startTime;
  }
});

// 验证表单
const validateForm = (): boolean => {
  if (!internalForm.value.roomName.trim()) {
    TUIToast.error({ message: t('The room name cannot be empty') });
    return false;
  }

  // 获取当前UTC时间戳
  const currentUtcTimestamp = Math.floor(Date.now() / 1000);

  // 比较UTC时间戳
  if (scheduleStartTime.value <= currentUtcTimestamp) {
    TUIToast.error({ message: t('The start time cannot be earlier than the current time') });
    return false;
  }

  return true;
};

// 处理用户搜索
const handleUserSearchChange = (value: string) => userPickerData.value
  .filter((item) => {
    // Filter by search value
    if (!item.label.includes(value)) {
      return false;
    }
    // Filter out already selected users
    return !internalForm.value.selectedUserList.some(selected => selected.key === item.key);
  })
  .map(item => ({
    label: item.label,
    value: item.key,
    avatarUrl: item.extraData.avatar,
    extraData: item.extraData,
  }));

// 处理搜索结果项点击
const handleSearchResultItemClick = (data: { label?: string; value: string | number; [key: string]: unknown }) => {
  // Type guard to ensure required properties exist
  const avatarUrl = data.avatarUrl as string | undefined;
  const extraData = data.extraData as unknown;
  if (!data.label || !data.value || !extraData) {
    return;
  }

  const userRow: UserPickerRow = {
    key: String(data.value),
    label: data.label,
    avatarUrl,
    extraData,
  };

  if (internalForm.value.selectedUserList.some(item => item.key === userRow.key)) {
    return;
  }

  internalForm.value.selectedUserList = [...internalForm.value.selectedUserList, userRow];
  searchUserId.value = '';
};

// 处理用户选择确认
const handleUserPickerConfirm = () => {
  internalForm.value.selectedUserList = userPickerRef.value.getSelectedItems();
  userPickerVisible.value = false;
};

// 移除选中用户
const removeSelectUser = (user: UserPickerRow) => {
  internalForm.value.selectedUserList = internalForm.value.selectedUserList.filter(item => item.key !== user.key);
};

const handleCancel = () => {
  emit('cancel');
};

const handleSave = () => {
  if (!validateForm()) {
    return;
  }

  // 构造符合 EditFormData 接口的保存数据
  const saveData: EditFormData = {
    roomId: props.roomInfo?.roomId || '',
    roomName: internalForm.value.roomName,
    scheduleStartTime: scheduleStartTime.value,
    scheduleEndTime: scheduleEndTime.value,
    scheduleAttendees: internalForm.value.selectedUserList.map(user => user.key),
  };

  emit('save', saveData);
};
</script>

<style lang="scss" scoped>
.room-edit {
    width: 100%;

  .edit-form {
    .form-item {
      display: flex;
      align-items: center;
      margin-bottom: 20px;

      .form-label {
        min-width: 80px;
        color: var(--text-color-secondary);
        font-size: 14px;
        margin-right: 16px;
      }

      .form-input,
      .form-select {
        width: 100%;
        flex: 1;
      }

      .datetime-group {
        display: flex;
        gap: 8px;
        width: 100%;
        flex: 1;
      }

      &.flex-start {
        align-items: flex-start;
      }
    }
  }

  .form-actions {
    display: flex;
    justify-content: flex-end;
    gap: 12px;
    margin-top: 32px;
    padding-top: 20px;
    border-top: 1px solid var(--border-color-light);
  }
}

.room-user-picker {
  height: 400px;
  width: 600px;
}

.form-participants {
  display: flex;
  flex-direction: column;
  width: 100%;
}

.search-result-item {
  display: flex;
  align-items: center;
  gap: 8px;

  &-avatar {
    width: 20px;
    height: 20px;
    flex-shrink: 0;
  }

  &-name {
    flex: 1;
    margin: 0;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
}

.form-attendees {
  display: flex;
  flex-wrap: wrap;
  gap: 2px;
  max-height: 100px;
  margin-top: 6px;
  overflow: hidden;

  &:hover {
    overflow: auto;
  }

  &-item {
    box-sizing: border-box;
    display: flex;
    flex-basis: calc(33.3333% - 2px);
    align-items: center;
    padding: 2px 8px;
    overflow: hidden;
    background-color: var(--bg-color-bubble-own);
    border-radius: 4px;

    &-avatar {
      width: 20px;
      height: 20px;
      margin-right: 6px;
      flex-shrink: 0;
    }

    &-name {
      flex: 1;
      margin: 0;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }

    &-remove {
      margin-left: auto;
      color: var(--uikit-color-gray-7);
      cursor: pointer;
      flex-shrink: 0;
    }
  }

  &-count {
    flex-basis: content;
  }
}
</style>
