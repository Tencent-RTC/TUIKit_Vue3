<script setup lang="ts">
import { ref, computed, watch, onBeforeUnmount, onMounted } from 'vue';
import {
  PopoverRoot,
  PopoverContent,
  PopoverAnchor,
  PopoverPortal,
} from 'reka-ui';
import { throttle } from '../../../../utils/lodash';
import { TUIChatEngine } from '@tencentcloud/chat-uikit-engine';
import { useUIKit } from '@tencentcloud/uikit-base-component-vue3';
import { Avatar } from '../../../Avatar';
import { useGroupSettingState } from '../../../../states/GroupSettingState';
import type { SuggestionProps, SuggestionKeyDownProps } from '@tiptap/suggestion';
import type { GroupMember } from '../../../../states/GroupSettingState';

const props = defineProps<SuggestionProps>();

const { t } = useUIKit();

const selectedIndex = ref(0);
const isOpen = ref(true);
const listboxRef = ref<HTMLDivElement | null>(null);
const sentinelRef = ref<HTMLDivElement | null>(null);
const isLoading = ref(false);
const resizeKey = ref(0); // Trigger virtualElement recalculation on window resize

const { allMembers, currentUserID, groupID, memberCount, getGroupMemberList } = useGroupSettingState();

const availableMembers = computed<Partial<GroupMember>[]>(() => {
  if (!allMembers.value || !currentUserID.value || !memberCount.value) {
    return [];
  }

  const excludeSelfMembers: Partial<GroupMember>[] = allMembers.value.filter(member => member.userID !== currentUserID.value);

  if (memberCount.value && memberCount.value > 2) {
    excludeSelfMembers.unshift({
      userID: TUIChatEngine.TYPES.MSG_AT_ALL,
      nick: t('MessageInput.at_all_members') || 'all',
      avatar: '/at_all_members.png',
    });
  }

  return excludeSelfMembers;
});

const hasMore = computed(() => (allMembers.value?.length || 0) < (memberCount.value || 0));

const filteredItems = computed(() => {
  const normalizedQuery = props.query.toLowerCase().trim();

  if (!normalizedQuery) {
    return availableMembers.value;
  }

  return availableMembers.value.filter(item =>
    item.nick!.toLowerCase().includes(normalizedQuery),
  );
});

const selectedMember = computed(() => filteredItems.value[selectedIndex.value] || null);

const showSentinel = computed(() => hasMore.value || isLoading.value || filteredItems.value.length === 0);

const loadMore = async () => {
  if (isLoading.value || !hasMore.value || !groupID.value) {
    return;
  }

  isLoading.value = true;

  try {
    await getGroupMemberList({
      count: 100,
      offset: allMembers.value?.length || 0,
    });
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('[MentionSuggestion] Failed to load more members:', error);
  } finally {
    isLoading.value = false;
  }
};

// Handle side effects: Open state and Auto-load
watch(
  [() => props.query, filteredItems, hasMore],
  ([query, items, more]) => {
    const normalizedQuery = query.toLowerCase().trim();

    // 1. Control Open State
    if (!normalizedQuery) {
      isOpen.value = true;
    } else if (items.length === 0 && !more) {
      isOpen.value = false;
    } else {
      isOpen.value = true;
    }

    // 2. Auto load if items are few
    if (items.length < 10 && more && !isLoading.value) {
      loadMore();
    }
  },
  { immediate: true }
);

const virtualElement = computed(() => {
  // eslint-disable-next-line @typescript-eslint/no-unused-expressions
  resizeKey.value; // Dependency to trigger recalculation on window resize

  const rect = props.clientRect?.();
  if (!rect) {
    return null;
  }

  return {
    getBoundingClientRect: () => ({
      width: 0,
      height: rect.height,
      x: rect.left,
      y: rect.top,
      top: rect.top,
      left: rect.left,
      right: rect.left,
      bottom: rect.top + rect.height,
    }),
  };
});

// Reset selection when filtered items change (but not when loading more)
watch(filteredItems, (newItems, oldItems) => {
  // Only reset if it's a filter change (length decreased or query changed)
  // Don't reset if it's loading more (length increased)
  if (!oldItems || newItems.length < oldItems.length || newItems.length === 0) {
    selectedIndex.value = 0;
  } else if (newItems.length > oldItems.length) {
    // If loading more, keep the current selection valid
    // Ensure selectedIndex is still within bounds
    if (selectedIndex.value >= newItems.length) {
      selectedIndex.value = newItems.length - 1;
    }
  }
}, { immediate: true });

let observer: IntersectionObserver | null = null;

const setupObserver = () => {
  if (observer) {
    observer.disconnect();
    observer = null;
  }

  if (!listboxRef.value || !sentinelRef.value) {
    return;
  }

  observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          loadMore();
        }
      });
    },
    {
      root: listboxRef.value,
      rootMargin: '0px',
      threshold: 0.1,
    },
  );

  observer.observe(sentinelRef.value);
};

// Watch for sentinel element and setup observer
// Added filteredItems and isLoading to dependencies to ensure robust observer setup during search/load
watch([listboxRef, sentinelRef, showSentinel], () => {
  if (showSentinel.value && listboxRef.value && sentinelRef.value) {
    setTimeout(setupObserver, 0);
  }
}, { flush: 'post' });

onMounted(() => {
  window.addEventListener('resize', throttle(handleWindowResize, 30));
});

onBeforeUnmount(() => {
  if (observer) {
    observer.disconnect();
    observer = null;
  }
  window.removeEventListener('resize', handleWindowResize);
});

const handleWindowResize = () => {
  resizeKey.value += 1;
};

const handleSelectMember = (index: number) => {
  const member = filteredItems.value[index];
  if (member) {
    props.command({ id: member.userID, label: member.nick, mentionSuggestionChar: '@' });
  }
};

const scrollToSelected = () => {
  if (!listboxRef.value) {
    return;
  }

  const selectedItem = listboxRef.value.children[selectedIndex.value] as HTMLElement;
  if (!selectedItem) {
    return;
  }

  // 1. Ensure the selected member is visible
  selectedItem.scrollIntoView({ block: 'nearest' });

  // 2. If it's the last item and there's more data, ensure the loading indicator (sentinel) is also visible
  // This provides visual feedback that more items are being loaded
  if (selectedIndex.value === filteredItems.value.length - 1 && hasMore.value && sentinelRef.value) {
    sentinelRef.value.scrollIntoView({ block: 'nearest' });
  }
};

const onKeyDown = (keyDownProps: SuggestionKeyDownProps): boolean => {
  const { event } = keyDownProps;

  if (event.key === 'ArrowDown') {
    event.preventDefault();
    const nextIndex = Math.min(selectedIndex.value + 1, filteredItems.value.length - 1);
    selectedIndex.value = nextIndex;
    scrollToSelected();

    // If reached the last item and has more data to load, trigger load
    if (nextIndex === filteredItems.value.length - 1 && hasMore.value && !isLoading.value) {
      loadMore();
    }

    return true;
  }

  if (event.key === 'ArrowUp') {
    event.preventDefault();
    selectedIndex.value = Math.max(selectedIndex.value - 1, 0);
    scrollToSelected();
    return true;
  }

  if (event.key === 'Enter') {
    event.preventDefault();
    if (selectedMember.value) {
      handleSelectMember(selectedIndex.value);
      return true;
    }
  }

  if (event.key === 'Escape') {
    return true;
  }

  return false;
};

const handleOpenAutoFocus = (event: Event) => {
  event.preventDefault();
};

defineExpose({
  onKeyDown,
});
</script>

<template>
  <PopoverRoot v-model:open="isOpen" :modal="false">
    <!-- Virtual anchor for cursor positioning -->
    <PopoverAnchor v-if="virtualElement" :reference="virtualElement" />

    <PopoverPortal>
      <PopoverContent
        class="mention-suggestion__content"
        side="top"
        align="start"
        :side-offset="8"
        :collision-padding="8"
        :avoid-collisions="false"
        @open-auto-focus="handleOpenAutoFocus"
      >
        <!-- Member list with manual keyboard navigation -->
        <div ref="listboxRef" class="mention-suggestion__listbox">
          <!-- Member items -->
          <div
            v-for="(item, index) in filteredItems"
            :key="item.userID"
            class="mention-suggestion__item"
            :class="{ 'mention-suggestion__item--selected': index === selectedIndex }"
            @click="handleSelectMember(index)"
            @mouseenter="selectedIndex = index"
          >
            <Avatar
              v-if="item.avatar !== '/at_all_members.png'"
              class="mention-suggestion__avatar"
              :src="item.avatar"
            />
            <span class="mention-suggestion__name">{{ item.nick || item.userID }}</span>
          </div>

          <!-- Sentinel element for loading more / showing states -->
          <div
            v-if="showSentinel"
            ref="sentinelRef"
            class="mention-suggestion__sentinel"
          >
            <!-- Loading state -->
            <div v-if="hasMore" class="mention-suggestion__loading">
              <div class="mention-suggestion__spinner" />
              <span>{{ t('MessageInput.loading') }}</span>
            </div>

            <!-- No results after search -->
            <div
              v-else-if="filteredItems.length === 0 && !hasMore"
              class="mention-suggestion__empty"
            >
              {{ t('MessageInput.no_matching_members') }}
            </div>
          </div>
        </div>
      </PopoverContent>
    </PopoverPortal>
  </PopoverRoot>
</template>

<style scoped lang="scss">
@use '../../../../styles/mixins/index.scss' as mixins;

:deep(.mention-suggestion__content) {
  width: 160px;
  background: var(--dropdown-color-default);
  border-radius: 8px;
  box-shadow: 0 4px 12px var(--shadow-color);
  overflow: hidden;
  z-index: 9999;
}

:deep(.mention-suggestion__listbox) {
  max-height: 200px;
  overflow-y: auto;
  overflow-x: hidden;
  padding: 4px 0;

  @include mixins.scrollbar-default();
}

:deep(.mention-suggestion__item) {
  display: flex;
  align-items: center;
  height: 40px;
  width: 100%;
  box-sizing: border-box;
  padding: 8px 12px;
  cursor: pointer;
  transition: background-color 0.15s;
  outline: none;
}

:deep(.mention-suggestion__item--selected) {
  background-color: var(--dropdown-color-active);
}

:deep(.mention-suggestion__item:hover) {
  background-color: var(--dropdown-color-hover);
}

:deep(.mention-suggestion__sentinel) {
  display: flex;
  align-items: center;
  justify-content: center;
}

:deep(.mention-suggestion__loading) {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 4px;
  color: var(--text-color-primary);
  font-size: 13px;
  width: 100%;
  justify-content: center;
}

:deep(.mention-suggestion__spinner) {
  width: 16px;
  height: 16px;
  border: 2px solid rgba(0, 122, 255, 0.2);
  border-top-color: rgba(0, 122, 255, 0.8);
  border-radius: 50%;
  animation: spin 0.6s linear infinite;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

:deep(.mention-suggestion__load-trigger) {
  height: 20px;
  width: 100%;
  background: transparent;
  display: flex;
  align-items: center;
  justify-content: center;
}

:deep(.mention-suggestion__load-hint) {
  font-size: 12px;
  color: var(--text-color-primary);
  padding: 6px 0;
  user-select: none;
}

:deep(.mention-suggestion__empty) {
  padding: 4px 0px;
  text-align: center;
  color: var(--text-color-primary);
  font-size: 14px;
}

:deep(.mention-suggestion__avatar) {
  width: 20px;
  height: 20px;
  border-radius: 50%;
  margin-right: 12px;
  flex-shrink: 0;
  object-fit: cover;
}

:deep(.mention-suggestion__name) {
  font-size: 14px;
  color: var(--text-color-primary);
  font-weight: 500;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
</style>
