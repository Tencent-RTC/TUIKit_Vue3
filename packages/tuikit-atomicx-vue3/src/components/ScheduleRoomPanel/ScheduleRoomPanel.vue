<template>
  <div class="schedule-room-panel">
    <div class="panel-content">
      <form class="form">
        <div class="form-item">
          <label class="label">{{ t('Room Name') }}</label>
          <TUIInput
            v-model="formData.roomName"
            :max-length="25"
            :placeholder="t('please enter the room name')"
          />
        </div>

        <div class="form-item">
          <label class="label">{{ t('Starting time') }}</label>
          <div class="datetime-group">
            <Datepicker v-model="formData.startDate" />
            <Timepicker v-model="formData.startTime" />
          </div>
        </div>

        <div class="form-item">
          <label class="label">{{ t('Room duration') }}</label>
          <DurationSelector v-model="formData.duration" />
        </div>

        <div class="form-item">
          <label class="label">{{ t('Time Zone') }}</label>
          <TimezoneSelector v-model="formData.timezone" />
        </div>

        <div :class="['form-item', { 'flex-start': formData.selectedUserList?.length > 0 }]">
          <label class="label">{{ t('Participants') }}</label>
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
            <div v-if="formData.selectedUserList?.length > 0" class="form-attendees">
              <span
                v-for="user in formData.selectedUserList"
                :key="user.key"
                class="form-attendees-item"
              >
                <Avatar
                  class="form-attendees-item-avatar"
                  :size="20"
                  :src="user.avatarUrl"
                />
                <p class="form-attendees-item-name" :title="user.label">
                  {{ user.label }}
                </p>
                <IconClose1 class="form-attendees-item-remove" @click="removeSelectUser(user)" />
              </span>
              <span class="form-attendees-item form-attendees-count">
                {{ `${formData.selectedUserList?.length || 0} ${t('people')}` }}
              </span>
            </div>
          </div>
          <TUIDialog
            v-model:visible="userPickerVisible"
            :title="t('Contacts')"
            :cancel-text="t('Cancel')"
            :confirm-text="t('Confirm')"
          >
            <UserPicker
              ref="userPickerRef"
              class="room-user-picker"
              :data-source="userPickerData"
              :defaultSelectedItems="formData.selectedUserList"
              display-mode="list"
            />
            <template #footer>
              <div class="user-picker-footer">
                <TUIButton @click="userPickerVisible = false">
                  {{ t('Cancel') }}
                </TUIButton>
                <TUIButton type="primary" @click="handleUserPickerConfirm">
                  {{ t('Confirm') }}
                </TUIButton>
              </div>
            </template>
          </TUIDialog>
        </div>

        <div class="form-item flex-start">
          <label class="label">{{ t('Security') }}</label>
          <div class="security-group">
            <label class="checkbox-item">
              <input v-model="formData.hasPassword" type="checkbox">
              <span>{{ t('Room Password') }}</span>
            </label>
            <TUIInput
              v-if="formData.hasPassword"
              v-model="formData.password"
              :max-length="6"
              type="number"
              showPassword
              :placeholder="t('Enter 6-digit password')"
              class="password-input"
            />
          </div>
        </div>

        <div class="form-item flex-start">
          <label class="label">{{ t('Member management') }}</label>
          <div class="member-group">
            <label class="checkbox-item">
              <input v-model="formData.isMicrophoneDisableForAllUser" type="checkbox">
              <span>{{ t('Disable all audios') }}</span>
            </label>
            <label class="checkbox-item">
              <input v-model="formData.isCameraDisableForAllUser" type="checkbox">
              <span>{{ t('Disable all videos') }}</span>
            </label>
          </div>
        </div>
      </form>
    </div>

    <div class="panel-footer">
      <TUIButton @click="handleCancel">
        {{ t('Cancel') }}
      </TUIButton>
      <TUIButton
        type="primary"
        :loading="isScheduling"
        @click="handleSchedule"
      >
        {{ t('Schedule') }}
      </TUIButton>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted } from 'vue';
import { TUIErrorCode } from '@tencentcloud/tuiroom-engine-js';
import {
  TUIButton,
  TUIInput,
  useUIKit,
  TUIToast,
  IconManageMember,
  TUIDialog,
  IconClose1,
} from '@tencentcloud/uikit-base-component-vue3';
import { useContactListState } from '../../states/ContactListState';
import { useLoginState } from '../../states/LoginState';
import { useRoomState } from '../../states/RoomState';
import { Avatar } from '../Avatar';
import { useRoomModal } from '../UIKitModal';
import { UserPicker } from '../UserPicker';
import Datepicker from './Datepicker.vue';
import DurationSelector from './DurationSelector.vue';
import Timepicker from './Timepicker.vue';
import TimezoneSelector from './TimezoneSelector.vue';
import { getCurrentTimeInTimezone, getNext15MinuteInterval, convertTimezoneToUTC, convertTimeBetweenTimezones } from './utils';
import type { ScheduleRoomOptions } from '../../types/room';
import type { UserPickerRow, UserPickerResultItem } from '../UserPicker/type';

interface Props {
  visible?: boolean;
  userName?: string;
}

interface Emits {
  (e: 'cancel'): void;
  (e: 'confirm', roomId: string, scheduleOptions: ScheduleRoomOptions): void;
}

const props = withDefaults(defineProps<Props>(), {
  visible: false,
  userName: '',
});

const emit = defineEmits<Emits>();

const { t } = useUIKit();
const { loginUserInfo } = useLoginState();
const { scheduleRoom, getRoomInfo } = useRoomState();
const { friendList } = useContactListState();
const { handleErrorWithModal } = useRoomModal();

const formData = ref({
  roomName: '',
  startDate: 0,
  startTime: 0,
  duration: 1800,
  timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
  hasPassword: false,
  password: '',
  isCameraDisableForAllUser: false,
  isMicrophoneDisableForAllUser: false,
  scheduleAttendees: '',
  selectedUserList: [] as UserPickerRow[],
});

const userPickerRef = ref();
const userPickerVisible = ref(false);
const searchUserId = ref('');
const isScheduling = ref(false);

const userPickerData = computed(() =>
  friendList.value.map(item => ({
    key: item.userID,
    label: item.nick,
    avatarUrl: item.avatar,
    extraData: item,
  })),
);

const scheduleStartTime = computed(() => {
  const dateObj = new Date(formData.value.startDate * 1000);
  const timeObj = new Date(formData.value.startTime * 1000);

  return convertTimezoneToUTC(
    dateObj.getFullYear(),
    dateObj.getMonth(),
    dateObj.getDate(),
    timeObj.getHours(),
    timeObj.getMinutes(),
    formData.value.timezone,
  );
});

const scheduleEndTime = computed(() => scheduleStartTime.value + formData.value.duration);

const validateForm = (): string | null => {
  const { roomName, hasPassword, password } = formData.value;

  if (!roomName.trim()) {
    return t('The room name cannot be empty');
  }

  const now = new Date();
  const currentUtcDate = new Date(Date.UTC(
    now.getUTCFullYear(),
    now.getUTCMonth(),
    now.getUTCDate(),
    now.getUTCHours(),
    now.getUTCMinutes(),
    0,
  ));
  const currentUtcTimestamp = Math.floor(currentUtcDate.getTime() / 1000);

  if (scheduleStartTime.value <= currentUtcTimestamp) {
    return t('The start time cannot be earlier than the current time');
  }

  const MIN_DURATION = 15 * 60;
  const MAX_DURATION = 24 * 3600;
  if (formData.value.duration < MIN_DURATION) {
    return t('Meeting duration must be at least 15 minutes');
  }
  if (formData.value.duration > MAX_DURATION) {
    return t('Meeting duration cannot exceed 24 hours');
  }

  if (hasPassword) {
    if (!password) {
      return t('Password cannot be empty');
    }
    if (!/^\d{6}$/.test(password)) {
      return t('Password must be 6 digits');
    }
  }

  return null;
};

const initializeForm = () => {
  const currentTimezone = formData.value.timezone || Intl.DateTimeFormat().resolvedOptions().timeZone;
  const now = getCurrentTimeInTimezone(currentTimezone);
  const startDate = new Date(now);
  startDate.setHours(0, 0, 0, 0);

  const nextIntervalTime = getNext15MinuteInterval(now);

  formData.value = {
    roomName: `${loginUserInfo.value?.userName}${t('Temporary Meeting')}`,
    startDate: Math.floor(startDate.getTime() / 1000),
    startTime: Math.floor(nextIntervalTime.getTime() / 1000),
    duration: 1800,
    timezone: currentTimezone,
    hasPassword: false,
    password: '',
    isCameraDisableForAllUser: false,
    isMicrophoneDisableForAllUser: false,
    scheduleAttendees: '',
    selectedUserList: [],
  };
};

const checkRoomExist = async (roomId: string) => {
  try {
    await getRoomInfo({ roomId });
  } catch (error: any) {
    if (error.code === TUIErrorCode.ERR_ROOM_ID_NOT_EXIST) {
      return false;
    }
  }
  return true;
};

const generateRoomId = async (): Promise<string> => {
  const roomId = String(Math.floor(Math.random() * 900000) + 100000);
  if (await checkRoomExist(roomId)) {
    return generateRoomId();
  }
  return roomId;
};

const handleSchedule = async () => {
  const validationError = validateForm();
  if (validationError) {
    TUIToast.error({ message: validationError });
    return;
  }

  isScheduling.value = true;

  try {
    const roomId = await generateRoomId();
    const scheduleOptions: ScheduleRoomOptions = {
      roomName: formData.value.roomName,
      scheduleStartTime: scheduleStartTime.value,
      scheduleEndTime: scheduleEndTime.value,
      scheduleAttendees: formData.value.selectedUserList.map(item => item.key),
      password: formData.value.hasPassword ? formData.value.password : '',
      isAllMicrophoneDisabled: formData.value.isMicrophoneDisableForAllUser,
      isAllCameraDisabled: formData.value.isCameraDisableForAllUser,
    };

    await scheduleRoom({ roomId, options: scheduleOptions });
    emit('confirm', roomId, scheduleOptions);
  } catch (error: any) {
    console.error('Schedule meeting failed:', error);
    handleErrorWithModal(error);
    TUIToast.error({ message: t('Schedule meeting failed') });
  } finally {
    isScheduling.value = false;
  }
};

const handleCancel = () => emit('cancel');

const handleUserSearchChange = (value: string) => userPickerData.value
  .filter((item) => {
    // Filter by search value
    if (!item.label.includes(value)) {
      return false;
    }
    // Filter out already selected users
    return !formData.value.selectedUserList.some(selected => selected.key === item.key);
  })
  .map(item => ({
    label: item.label,
    value: item.key,
    avatarUrl: item.extraData.avatar,
    extraData: item.extraData,
  }));

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

  if (formData.value.selectedUserList.some(item => item.key === userRow.key)) {
    return;
  }

  formData.value.selectedUserList = [...formData.value.selectedUserList, userRow];
  searchUserId.value = '';
};

const handleUserPickerConfirm = () => {
  const selectedItems: UserPickerResultItem[] = userPickerRef.value.getSelectedItems();
  // Convert UserPickerResultItem[] to UserPickerRow[]
  formData.value.selectedUserList = selectedItems.map((item): UserPickerRow => ({
    key: item.key,
    label: item.label,
    avatarUrl: item.avatarUrl,
    extraData: item.extraData,
  }));
  userPickerVisible.value = false;
};

const removeSelectUser = (user: UserPickerRow) => {
  formData.value.selectedUserList = formData.value.selectedUserList.filter(item => item.key !== user.key);
};

// Generate 6-digit random password when hasPassword is checked
const generateRandomPassword = (): string => Math.floor(100000 + Math.random() * 900000).toString();

watch(() => formData.value.hasPassword, (newValue) => {
  if (newValue) {
    if (!formData.value.password) {
      formData.value.password = generateRandomPassword();
    }
  } else {
    formData.value.password = '';
  }
});

watch(() => formData.value.timezone, (newTimezone, oldTimezone) => {
  if (newTimezone && oldTimezone && newTimezone !== oldTimezone) {
    const convertedTime = convertTimeBetweenTimezones(
      formData.value.startDate,
      formData.value.startTime,
      oldTimezone,
      newTimezone,
    );

    formData.value.startDate = convertedTime.startDate;
    formData.value.startTime = convertedTime.startTime;
  }
});

onMounted(initializeForm);
watch(() => props.visible, (visible) => {
  if (visible) {
    initializeForm();
  }
});
</script>

<style lang="scss" scoped>
.schedule-room-panel {
  display: flex;
  flex-direction: column;
  width: 100%;
  max-width: 600px;
  height: 100%;
}

.panel-content {
  flex: 1;
}

.form {
  display: flex;
  flex-direction: column;
  gap: 24px;
}

.form-item {
  display: flex;
  align-items: center;
  gap: 12px;
  color: var(--text-color-secondary);

  .label {
    width: 100px;
    min-width: 100px;
    font-size: 14px;
    font-weight: 400;
  }

  &.flex-start {
    align-items: flex-start;
  }
}

.datetime-group {
  display: flex;
  gap: 8px;
  width: 100%;
}

.security-group,
.member-group {
  display: flex;
  flex-direction: column;
  gap: 12px;
  width: 100%;
}

.checkbox-item {
  display: flex;
  align-items: center;
  gap: 8px;
  cursor: pointer;

  input[type="checkbox"] {
    margin: 0;
  }

  span {
    font-size: 14px;
  }
}

.password-input {
  margin-top: 8px;
}

.room-user-picker {
  height: 400px;
  width: 600px;
}

.user-picker-footer {
  display: flex;
  justify-content: center;
  gap: 12px;
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
    color: var(--text-color-secondary);

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
      cursor: pointer;
      flex-shrink: 0;
    }
  }

  &-count {
    flex-basis: content;
  }
}

.panel-footer {
  display: flex;
  justify-content: center;
  gap: 12px;
  margin-top: 30px;
  padding: 20px 24px;

  button {
    min-width: 88px;
  }
}
</style>
