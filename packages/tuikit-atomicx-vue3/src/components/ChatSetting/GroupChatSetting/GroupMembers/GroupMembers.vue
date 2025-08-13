<script lang="ts" setup>
import { ref, computed, onMounted, onUnmounted } from 'vue';
import { IconArrowStrokeRight, IconMinus, IconAdd, useUIKit } from '@tencentcloud/uikit-base-component-vue3';
import {
  useGroupSettingState,
  GroupPermission,
  GroupMemberRole,
} from '../../../../states/GroupSettingState';
import { Avatar } from '../../../Avatar';
import type { GroupMember } from '../../../../states/GroupSettingState';

interface GroupMembersProps {
  showAddButton: boolean; // Whether to show add button
  showRemoveButton: boolean; // Whether to show remove button
  // Basic configuration
  title?: string; // Title, default "群成员"
  members?: GroupMember[] | undefined; // Member list
  memberCount?: number; // Total member count
  maxDisplayCount?: number; // Mini version display count, default 6

  // Feature toggles
  hiddenMemberCount?: boolean; // Whether to hide member count
  expandable?: boolean; // Whether expandable, default true

  // Event callbacks
  onAddButtonClick?: () => void; // Add member callback
  onRemoveButtonClick?: () => void; // Remove member callback
  onMemberClick?: (member: GroupMember) => void; // Click member callback
  onViewAll?: () => void; // View all callback
  onReachEnd?: () => void; // Reach end callback for pagination

  // Loading states
  loading?: boolean; // Whether loading more data
  hasMore?: boolean; // Whether has more data to load

  // Styling
  className?: string;
}

const props = withDefaults(defineProps<GroupMembersProps>(), {
  title: undefined,
  hiddenMemberCount: false,
  maxDisplayCount: 6,
  showAddButton: true,
  showRemoveButton: true,
  expandable: true,
  loading: false,
  hasMore: true,
});

const { t } = useUIKit();

const getRolePriority = (role: GroupMemberRole): number => {
  switch (role) {
    case GroupMemberRole.OWNER:
      return 100;
    case GroupMemberRole.ADMIN:
      return 80;
    case GroupMemberRole.COMMON:
      return 60;
    default:
      return 0;
  }
};

const isExpanded = ref(false);
const scrollContainerRef = ref<HTMLDivElement>();

const { hasPermission } = useGroupSettingState();

// Use props data or fallback to store data
const members = computed(() => props.members);
const memberCount = computed(() => props.memberCount || members.value?.length);

// Sort members by role priority: Owner > Admin > Common
const sortedMembers = computed(() => {
  if (!members.value || members.value.length === 0) {
    return [];
  }

  return [...members.value].sort((a, b) => {
    const priorityA = getRolePriority(a.role);
    const priorityB = getRolePriority(b.role);
    return priorityB - priorityA;
  });
});

const displayMiniMembers = computed(() =>
  isExpanded.value ? sortedMembers.value : sortedMembers.value.slice(0, props.maxDisplayCount),
);

// Generate skeleton items when members is undefined
const skeletonItems = computed(() => {
  if (members.value !== undefined) {
    return [];
  }
  const skeletonCount = Math.min(props.memberCount || props.maxDisplayCount, props.maxDisplayCount);
  return Array.from({ length: skeletonCount }, (_, index) => index);
});

const shouldShowExpand = computed(() =>
  props.expandable && sortedMembers.value.length > props.maxDisplayCount,
);

const title = computed(() => props.title || t('ChatSetting.group_members'));

const handleScroll = () => {
  // Handle scroll to detect reach end
  if (!isExpanded.value || !props.onReachEnd || !props.hasMore || props.loading) {
    return;
  }

  const container = scrollContainerRef.value;
  if (!container) {
    return;
  }

  const { scrollTop, scrollHeight, clientHeight } = container;
  const threshold = 100; // Trigger when 100px from bottom

  if (scrollHeight - scrollTop - clientHeight < threshold) {
    props.onReachEnd();
  }
};

const handleToggleExpand = () => {
  if (isExpanded.value) {
    isExpanded.value = false;
  } else {
    isExpanded.value = true;
    props.onViewAll?.();
  }
};

const handleAddMember = () => {
  props.onAddButtonClick?.();
};

const handleMemberClick = (member: GroupMember) => {
  props.onMemberClick?.(member);
};

// Handle remove member mode
const handleRemoveMember = () => {
  if (props.onRemoveButtonClick) {
    props.onRemoveButtonClick();
  }
};

onMounted(() => {
  if (isExpanded.value && scrollContainerRef.value) {
    scrollContainerRef.value.addEventListener('scroll', handleScroll);
  }
});

onUnmounted(() => {
  if (scrollContainerRef.value) {
    scrollContainerRef.value.removeEventListener('scroll', handleScroll);
  }
});
</script>

<template>
  <div
    v-if="hasPermission(GroupPermission.VIEW_MEMBER_LIST)"
    :class="[
      'group-members',
      className
    ]"
  >
    <!-- Header -->
    <div class="group-members__header">
      <div class="group-members__title">
        {{ title }}
        <span
          v-if="!hiddenMemberCount"
          class="group-members__count"
        >
          ({{ memberCount }})
        </span>
      </div>
      <IconArrowStrokeRight
        v-if="shouldShowExpand"
        :class="[
          'group-members__expand-btn',
          isExpanded && 'group-members__expand-btn--expanded'
        ]"
        size="24px"
        @click="handleToggleExpand"
      />
    </div>

    <!-- Member Grid -->
    <div
      :ref="isExpanded ? el => scrollContainerRef = el : undefined"
      :class="[
        'group-members__grid',
        isExpanded && 'group-members__grid--expanded'
      ]"
    >
      <!-- Skeleton items when loading -->
      <div
        v-for="index in skeletonItems"
        :key="`skeleton-${index}`"
        :class="[
          'group-members__item',
          'group-members__item--skeleton'
        ]"
      >
        <div class="group-members__skeleton-avatar" />
        <div class="group-members__skeleton-name" />
      </div>

      <!-- Member items -->
      <div
        v-for="member in displayMiniMembers"
        v-show="members !== undefined"
        :key="member.userID"
        class="group-members__item"
        @click="handleMemberClick(member)"
      >
        <Avatar
          :src="member.avatar"
          :alt="member.nick || member.userID"
          size="md"
        />
        <div class="group-members__name">
          {{ member.nick || member.userID }}
        </div>
      </div>

      <!-- Add Member Button -->
      <div
        v-if="!isExpanded && showAddButton"
        :class="[
          'group-members__item',
          'group-members__action-btn'
        ]"
        @click="handleAddMember"
      >
        <div class="group-members__action-btn__icon">
          <IconAdd />
        </div>
        <div class="group-members__action-btn__label">
          {{ t('ChatSetting.add') }}
        </div>
      </div>

      <!-- Remove Member Button -->
      <div
        v-if="!isExpanded && showRemoveButton"
        :class="[
          'group-members__item',
          'group-members__action-btn'
        ]"
        @click="handleRemoveMember"
      >
        <div class="group-members__action-btn__icon">
          <IconMinus />
        </div>
        <div class="group-members__action-btn__label">
          {{ t('ChatSetting.remove') }}
        </div>
      </div>

      <!-- Loading indicator -->
      <div
        v-if="isExpanded && loading"
        class="group-members__loading"
      >
        <div class="group-members__loading-text">
          {{ t('ChatSetting.loading') }}
        </div>
      </div>

      <!-- No more data indicator -->
      <div
        v-if="isExpanded && !hasMore && !loading && sortedMembers.length > 0"
        class="group-members__no-more"
      >
        <div class="group-members__no-more-text">
          {{ t('ChatSetting.all_members_shown') }}
        </div>
      </div>
    </div>

    <!-- Collapse Button (Sticky) -->
    <div
      v-if="isExpanded"
      class="group-members__collapse"
    >
      <div
        class="group-members__collapse-btn"
        @click="handleToggleExpand"
      >
        {{ t('ChatSetting.collapse') }}
      </div>
    </div>
  </div>
</template>

<style lang="scss" scoped>
@use '../../../../styles/mixins' as mixins;

.group-members {
  display: flex;
  flex-direction: column;
  background-color: transparent;

  &__header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    height: 60px;
    padding: 16px 0 12px;
    border-bottom: 0.5px solid var(--stroke-color-module);
  }

  &__title {
    font-size: 14px;
    font-weight: 500;
    display: flex;
    align-items: baseline;
    color: var(--text-color-primary);
  }

  &__count {
    font-size: 14px;
    margin-left: 4px;
    color: var(--text-color-secondary);
  }

  &__expand-btn {
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 4px;
    cursor: pointer;
    border-radius: 4px;
    transition: all 0.2s ease;
    color: var(--text-color-secondary);

    &:hover {
      color: var(--text-color-button);
      background-color: var(--button-color-primary-hover);
    }

    &:active {
      background-color: var(--button-color-primary-active);
    }

    &--expanded {
      transform: rotate(90deg);
    }
  }

  &__grid {
    display: grid;
    padding: 16px 0;
    justify-items: center;
    grid-template-columns: repeat(auto-fill, minmax(50px, 1fr));
    gap: 8px;

    &--expanded {
      max-height: 400px;
      overflow-y: auto;

      @include mixins.scrollbar-thin();
    }
  }

  &__item {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 4px;
    cursor: pointer;
    padding: 4px;
    border-radius: 8px;
    transition: all 0.2s ease;
    width: 100%;
    max-width: 60px;

    &--skeleton {
      cursor: default;
      pointer-events: none;
    }
  }

  &__name {
    font-size: 12px;
    text-align: center;
    max-width: 100%;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    color: var(--text-color-primary);
  }

  &__skeleton-avatar {
    width: 40px;
    height: 40px;
    border-radius: 50%;
    animation: skeleton-pulse 1.5s ease-in-out infinite;
    background-color: rgba(0, 0, 0, 0.08);
  }

  &__skeleton-name {
    width: 40px;
    height: 12px;
    border-radius: 6px;
    animation: skeleton-pulse 1.5s ease-in-out infinite;
    animation-delay: 0.2s;
    background-color: rgba(0, 0, 0, 0.08);
  }

  &__action-btn {
    &__icon {
      display: flex;
      align-items: center;
      justify-content: center;
      width: 40px;
      height: 40px;
      border-radius: 50%;
      transition: all 0.2s ease;
      color: var(--text-color-secondary);
      background-color: var(--bg-color-input);
    }

    &__label {
      font-size: 12px;
      color: var(--text-color-secondary);
    }

    &:hover {
      background-color: rgba(0, 122, 255, 0.05);
    }
  }

  &__loading {
    grid-column: 1 / -1;
    display: flex;
    justify-content: center;
    padding: 20px 0;
  }

  &__loading-text {
    font-size: 14px;
    color: rgba(0, 0, 0, 0.5);
  }

  &__no-more {
    grid-column: 1 / -1;
    display: flex;
    justify-content: center;
    padding: 20px 0;
  }

  &__no-more-text {
    font-size: 12px;
    color: var(--text-color-secondary);
  }

  &__collapse {
    position: sticky;
    bottom: 0;
    left: 0;
    right: 0;
    padding: 16px 0;
    display: flex;
    justify-content: center;
    margin: 0 -20px;
    padding-left: 20px;
    padding-right: 20px;
  }

  &__collapse-btn {
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 8px 24px;
    border-radius: 20px;
    cursor: pointer;
    font-size: 14px;
    font-weight: 500;
    transition: all 0.2s ease;
    color: var(--text-color-secondary);
    background-color: var(--button-color-secondary-default);

    &:hover {
      background-color: var(--button-color-secondary-hover);
      color: var(--text-color-primary);
    }

    &:active {
      background-color: var(--button-color-secondary-active);
    }
  }
}

// Skeleton animation
@keyframes skeleton-pulse {
  0% {
    opacity: 1;
  }

  50% {
    opacity: 0.4;
  }

  100% {
    opacity: 1;
  }
}
</style>
