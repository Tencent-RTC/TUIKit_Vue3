<template>
  <Divider
    v-if="shouldShowGroupManagement"
    variant="line"
    data-show="'management'"
  />
  <div
    v-if="shouldShowGroupManagement"
    :class="[
      'group-management-entry',
    ]"
    @click="handleClick"
  >
    <div class="group-management-entry__content">
      <span class="group-management-entry__title">{{ t('ChatSetting.group_management') }}</span>
      <IconArrowStrokeRight class="group-management-entry__arrow" />
    </div>
  </div>
</template>

<script lang="ts" setup>
import { computed, inject } from 'vue';
import { IconArrowStrokeRight, useUIKit } from '@tencentcloud/uikit-base-component-vue3';
import { GroupPermission, hasGroupPermission } from '../../../../types/groupSetting';
import { Divider } from '../../Divider';
import type { GroupInfo } from '@atomicxcore/core';

const emit = defineEmits<{
  click: [];
}>();

const { t } = useUIKit();
const groupInfo = inject<{ value: GroupInfo | undefined }>('groupInfo');

const currentUserRole = computed(() => groupInfo?.value?.selfRole);
const groupType = computed(() => groupInfo?.value?.groupType);

const shouldShowGroupManagement = computed(() => (
  hasGroupPermission(GroupPermission.SET_MEMBER_ROLE, currentUserRole.value, groupType.value)
  || hasGroupPermission(GroupPermission.MUTE_MEMBER, currentUserRole.value, groupType.value)
  || hasGroupPermission(GroupPermission.MUTE_ALL_MEMBERS, currentUserRole.value, groupType.value)
));

const handleClick = () => {
  emit('click');
};
</script>

<style lang="scss" scoped>
.group-management-entry {
  padding: 16.5px 20px 10.5px;
  cursor: pointer;
  transition: background-color 0.2s ease;

  &__content {
    display: flex;
    align-items: center;
    justify-content: space-between;
    width: 100%;
  }

  &__title {
    font-size: 14px;
    color: var(--text-color-primary);
  }

  &__arrow {
    width: 16px;
    height: 16px;
    transition: transform 0.2s ease;
    color: var(--text-color-secondary);
  }

  &:hover &__arrow {
    transform: translateX(2px);
  }
}
</style>
