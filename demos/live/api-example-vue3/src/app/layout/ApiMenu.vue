<template>
  <nav class="menu" :style="{ width: menuWidth + 'px' }">
    <div class="menu__search">
      <input
        v-model="searchQuery"
        type="text"
        :placeholder="t('Common.Search')"
        class="menu__search-input"
        :aria-label="t('Common.Search')"
        @keydown.escape="searchQuery = ''"
      />
      <span v-if="searchQuery" class="menu__search-count">{{ filteredCount }}</span>
    </div>

    <div
      v-for="group in filteredGroups"
      :key="group.state"
      :class="[
        'menu__group',
        {
          'is-pending': group.pending,
          'is-disabled': !!group.disabledReason,
          'is-collapsed': isCollapsed(group.state),
        },
      ]"
      :title="group.disabledReason || undefined"
    >
      <div class="menu__group-head" @click="toggleGroup(group.state)">
        <div class="menu__group-meta">
          <span class="menu__group-title">
            {{ t(menuKey(group.state), group.title) }}
            <span
              v-for="role in group.roles || []"
              :key="role"
              :class="['menu__role', `role-${role}`]"
            >{{ roleLabelT(role as Role) }}</span>
            <span v-if="group.pending" class="menu__pending">{{ t('Menu.Pending') }}</span>
            <span v-else-if="group.disabledReason" class="menu__disabled">{{ t('Menu.SdkUnavailable') }}</span>
          </span>
          <code class="menu__hook">{{ stateName(group.hook) }}</code>
        </div>
        <span v-if="!group.pending && !group.disabledReason" class="menu__count">{{ filteredExamples(group).length }}</span>
        <span
          v-if="!group.pending && !group.disabledReason"
          class="menu__caret"
          :class="{ 'is-collapsed': isCollapsed(group.state) }"
        >▾</span>
      </div>
      <ul
        v-if="!group.pending"
        class="menu__list"
        :class="{ 'is-collapsed': isCollapsed(group.state) }"
      >
        <li
          v-for="ex in filteredExamples(group)"
          :key="ex.id"
          :class="['menu__item', { active: isActive(group, ex.api) }]"
          :title="t(menuKey(ex.id), ex.title)"
          @click="$emit('select', group.state, ex.api)"
        >
          <span class="menu__api" v-html="highlightMatch(ex.api, searchQuery)" />
          <span
            v-for="role in menuRoles(ex)"
            :key="role"
            :class="['menu__role', `role-${role}`]"
          >{{ roleLabelT(role) }}</span>
        </li>
      </ul>
    </div>
  </nav>
  <div class="menu__resizer" @mousedown="$emit('resize-start', $event)" />
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import { useUIKit } from '@tencentcloud/uikit-base-component-vue3';
import { ALL_ROLES, ROLE_LABEL, Role, roleI18nKey } from '../../lib/types';
import type { ExampleDef, ExampleGroup } from '../../lib/types';

const props = defineProps<{
  groups: ExampleGroup[];
  menuWidth: number;
  activeState: string;
  activeApiId: string;
}>();

defineEmits<{
  'select': [state: string, api: string];
  'resize-start': [event: MouseEvent];
}>();

const { t } = useUIKit();
const searchQuery = ref('');

// Auto-expand the group that owns the active card so the active item is
// visible after a deep-link or programmatic navigation (e.g. the topbar
// login error routing to `login.login`). Without this the target group
// stays collapsed and the operator doesn't see which card is selected.
watch(
  () => props.activeState,
  (state) => {
    if (!state) return;
    ensureCollapsedInit();
    if (collapsedGroups.value!.has(state)) {
      const next = new Set(collapsedGroups.value!);
      next.delete(state);
      collapsedGroups.value = next;
    }
  },
  { immediate: true },
);

// Bilingual role badge: resolve via i18n, fall back to the Chinese literal.
function roleLabelT(role: Role): string {
  return t(roleI18nKey(role), ROLE_LABEL[role]);
}

// Map a group `state` slug or example `id` (kebab-case, e.g. `co-guest`,
// `co-guest.applyForSeat`) to the `Menu.FirstLetterUpper` i18n key
// (`Menu.CoGuest`, `Menu.CoGuestApplyForSeat`) defined per state list in
// `src/i18n/{en-US,zh-CN}/cards/*.ts`, merged in each locale's `index.ts`.
function menuKey(raw: string): string {
  const toPascal = (seg: string): string =>
    seg
      .split('-')
      .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
      .join('');
  return `Menu.${raw.split('.').map(toPascal).join('')}`;
}

// Collapsed state — lazy-init to collapse all groups by default.
const collapsedGroups = ref<Set<string> | null>(null);

function ensureCollapsedInit(): void {
  if (collapsedGroups.value === null) {
    collapsedGroups.value = new Set(props.groups.map(g => g.state));
  }
}

function isCollapsed(state: string): boolean {
  if (searchQuery.value.trim()) return false;
  ensureCollapsedInit();
  return collapsedGroups.value!.has(state);
}

function toggleGroup(state: string): void {
  ensureCollapsedInit();
  const next = new Set(collapsedGroups.value!);
  if (next.has(state)) next.delete(state);
  else next.add(state);
  collapsedGroups.value = next;
}

function stateName(hook: string): string {
  return hook.replace(/^use/, '');
}

function isActive(group: ExampleGroup, api: string): boolean {
  return props.activeState === group.state && props.activeApiId === api;
}

function matchesSearch(text: string, query: string): boolean {
  if (!query.trim()) return true;
  const q = query.toLowerCase();
  const tx = text.toLowerCase();
  let qIdx = 0;
  for (let i = 0; i < tx.length && qIdx < q.length; i++) {
    if (tx[i] === q[qIdx]) qIdx++;
  }
  return qIdx === q.length;
}

function filteredExamples(group: ExampleGroup): typeof group.examples {
  // Hide deprecated cards entirely from the menu (the user shouldn't be
  // steered toward deprecated APIs); only non-deprecated cards remain.
  const visible = group.examples.filter(ex => !ex.deprecated);
  if (!searchQuery.value.trim()) return visible;
  return visible.filter(ex => matchesSearch(ex.api, searchQuery.value));
}

function menuRoles(ex: ExampleDef): Role[] {
  if (ex.roles.length === ALL_ROLES.length) return [];
  return ex.roles;
}

const filteredGroups = computed(() => {
  if (!searchQuery.value.trim()) return props.groups;
  return props.groups.filter(g => {
    if (g.pending) return true;
    return filteredExamples(g).length > 0;
  });
});

const filteredCount = computed(() => {
  return filteredGroups.value.reduce(
    (sum, group) => sum + filteredExamples(group).length, 0,
  );
});

function highlightMatch(text: string, query: string): string {
  if (!query.trim()) return text;
  const q = query.toLowerCase();
  const tx = text.toLowerCase();
  const chars = text.split('');
  let qIdx = 0;
  for (let i = 0; i < tx.length && qIdx < q.length; i++) {
    if (tx[i] === q[qIdx]) {
      chars[i] = `<mark>${chars[i]}</mark>`;
      qIdx++;
    }
  }
  return chars.join('');
}
</script>

<style lang="scss">
.menu {
  // Width is driven by `menuWidth` ref (inline style); CSS just
  // sets the flex-shrink so the content area absorbs the remainder.
  flex-shrink: 0;
  padding: 0;
  overflow: auto;
  // Reserve scrollbar gutter so the vertical scrollbar appearing /
  // disappearing (when groups collapse/expand) doesn't cause layout
  // shift in the menu's content width.
  scrollbar-gutter: stable;
  // Unified scrollbar style across Chrome / Safari / Firefox.
  // - `scrollbar-width` + `scrollbar-color` cover Firefox + modern
  //   Safari (which respects the standard properties since 18.4+).
  // - The `::-webkit-scrollbar-*` pseudo-elements cover Chromium /
  //   older Safari, which still default to the OS chrome and look
  //   noticeably different from each other without these rules.
  scrollbar-width: thin;
  scrollbar-color: #c8ccd3 transparent;
  &::-webkit-scrollbar { width: 6px; }
  &::-webkit-scrollbar-track { background: transparent; }
  &::-webkit-scrollbar-thumb {
    background: #c8ccd3;
    border-radius: 3px;
  }
  &::-webkit-scrollbar-thumb:hover { background: #a8aeb8; }
  background: #f7f8fa;
  border-right: 1px solid #e8eaee;
  display: flex;
  flex-direction: column;

  &__search {
    position: sticky;
    top: 0;
    padding: 14px 12px 14px;
    display: flex;
    align-items: center;
    background: #f7f8fa;
    // Bottom border separates the sticky search area from the scrollable
    // results below. Without it, the group headers (which share the same
    // 12px left indent as the input) appear glued to the input edge,
    // especially in Chrome where the sticky layer has no other visual
    // break from the list underneath.
    border-bottom: 1px solid #e8eaee;
    z-index: 10;
    flex-shrink: 0;
  }

  &__search-input {
    width: 100%;
    padding: 8px 12px;
    // Reserve room on the right for the result-count badge so long
    // queries don't flow under it.
    padding-right: 44px;
    font-size: 13px;
    border: 1px solid #d1d5db;
    border-radius: 6px;
    background: #fff;
    transition: border-color 0.2s ease;

    &:focus {
      outline: none;
      border-color: #1c66e5;
      box-shadow: 0 0 0 2px rgba(28, 102, 229, 0.1);
    }

    &::placeholder {
      color: #9ca3af;
    }
  }

  &__search-count {
    position: absolute;
    // Sit comfortably inside the input's right padding zone so it
    // doesn't touch the input border. The input's right padding
    // (44px) reserves the slot; 20px from the container right edge
    // leaves a small visible gap to the input's right border.
    right: 20px;
    font-size: 12px;
    color: #9ca3af;
    pointer-events: none;
  }

  > div:last-of-type {
    padding-bottom: 24px;
  }

  &__group {
    margin-bottom: 10px;
    padding: 0 12px;

    &.is-pending {
      opacity: 0.55;
    }
  }

  &__group-head {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 8px 10px;
    margin-bottom: 4px;
    cursor: pointer;
    border-radius: 6px;
    user-select: none;
    transition: background-color 0.12s ease;

    &:hover { background: #edf1f7; }
  }

  &__group-meta {
    display: flex;
    flex-direction: column;
    gap: 1px;
    min-width: 0;
    flex: 1;
  }

  &__group-title {
    // Inline-flex so the title text and any role badges flow with a
    // consistent gap between them, matching the spacing rhythm on
    // API card headers.
    display: inline-flex;
    align-items: center;
    gap: 6px;
    font-size: 13px;
    font-weight: 600;
    color: #1f2937;
  }

  &__hook {
    font-size: 11px;
    font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
    color: #9aa1ad;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  &__count {
    flex-shrink: 0;
    min-width: 18px;
    height: 18px;
    padding: 0 5px;
    font-size: 11px;
    line-height: 18px;
    color: #6b7280;
    text-align: center;
    background: #eceef1;
    border-radius: 9px;
  }

  &__caret {
    flex-shrink: 0;
    width: 18px;
    font-size: 14px;
    color: #9ca3af;
    text-align: center;
    transition: transform 0.2s ease;

    &.is-collapsed {
      transform: rotate(-90deg);
    }
  }

  &__pending {
    margin-left: 6px;
    padding: 1px 7px;
    font-size: 10px;
    font-weight: 500;
    color: #6b7280;
    background: #e7e9ed;
    border-radius: 8px;
  }

  &__disabled {
    margin-left: 6px;
    padding: 1px 7px;
    font-size: 10px;
    font-weight: 500;
    color: #b45309;
    background: #fef3c7;
    border-radius: 8px;
  }

  &__group.is-disabled {
    opacity: 0.7;
  }

  &__list {
    margin: 0;
    padding: 0;
    list-style: none;
    overflow: hidden;
    // No hard cap on height: large groups (e.g. live-seat with 17 APIs,
    // live-player with 19 APIs) need to render all items at once, and
    // the outer `.menu` already owns the only scrollable area via
    // `overflow: auto`. A previous fixed 500px cap silently truncated
    // these groups, making the last APIs unreachable without resizing
    // the window first. The collapse/expand transition is still driven
    // by `max-height` so the open/close animation remains smooth; we
    // just let it grow as large as the content needs.
    max-height: none;
    transition: max-height 0.22s ease;

    &.is-collapsed {
      max-height: 0;
    }
  }

  &__item {
    display: flex;
    align-items: center;
    gap: 6px;
    padding: 7px 12px 7px 14px;
    margin: 2px 0 2px 18px;
    font-size: 13px;
    color: #4b5563;
    cursor: pointer;
    border-radius: 7px;
    border-left: 2px solid transparent;
    transition: background-color 0.12s ease, color 0.12s ease;

    &:hover {
      color: #1f2937;
      background: #edf1f7;
    }

    &.active {
      color: #1c66e5;
      font-weight: 600;
      background: #e1ecff;
      border-left-color: #1c66e5;
    }
  }

  &__api {
    flex: 1;
    font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;

    mark {
      background: transparent;
      color: #1c66e5;
      font-weight: 600;
    }
  }

  // Role badges — share the same dimensions and rounded-pill style
  // as ExampleCard's `card__badge` so the visual language is
  // consistent whether the tag appears on a group title or an API
  // card header.
  &__role {
    flex-shrink: 0;
    padding: 1px 8px;
    font-size: 11px;
    font-weight: 500;
    border-radius: 10px;

    &.role-host { color: #fff; background: #5b3bdb; }
    &.role-audience { color: #fff; background: #2563eb; }
    &.role-admin { color: #fff; background: #d97706; }
  }

  &__dep {
    flex-shrink: 0;
    padding: 0 5px;
    font-size: 9px;
    color: #b91c1c;
    background: #fde8e8;
    border-radius: 6px;
  }
}

// Profile hover card transition
.user-card-enter-active,
.user-card-leave-active {
  transition: opacity 0.15s ease, transform 0.15s ease;
}
.user-card-enter-from,
.user-card-leave-to {
  opacity: 0;
  transform: translateY(-4px);
}

.menu__resizer {
  flex-shrink: 0;
  width: 4px;
  cursor: col-resize;
  background: transparent;
  transition: background 0.15s ease;

  &:hover {
    background: #1c66e5;
  }
}

// While dragging, suppress text selection globally so the drag doesn't
// highlight menu items / content text accidentally.
:global(body.is-resizing-menu) {
  user-select: none;
  cursor: col-resize !important;
}
</style>
