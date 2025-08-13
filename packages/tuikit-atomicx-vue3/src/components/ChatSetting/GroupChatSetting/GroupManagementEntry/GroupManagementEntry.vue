<template>
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
import { computed } from 'vue';
import { IconArrowStrokeRight, useUIKit } from '@tencentcloud/uikit-base-component-vue3';
import { useGroupSettingState, GroupPermission } from '../../../../states/GroupSettingState';

const emit = defineEmits<{
  click: [];
}>();

const { t } = useUIKit();
const { hasPermission } = useGroupSettingState();

const shouldShowGroupManagement = computed(() => (
  hasPermission(GroupPermission.SET_MEMBER_ROLE)
  || hasPermission(GroupPermission.MUTE_MEMBER)
  || hasPermission(GroupPermission.MUTE_ALL_MEMBERS)
));

const handleClick = () => {
  emit('click');
};
</script>

<style lang="scss" scoped>
.group-management-entry {
  padding: 16px 0;
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
    font-weight: 500;
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
