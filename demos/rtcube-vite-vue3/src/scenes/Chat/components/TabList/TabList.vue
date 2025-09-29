<script lang="ts" setup>

type TabKey = 'conversation' | 'contact';

const props = defineProps<{
  activeTab: TabKey;
  labels?: Partial<Record<TabKey, string>>;
}>();

const emit = defineEmits(['update:activeTab', 'change']);

const resolvedLabels = {
  conversation: props.labels?.conversation ?? '会话',
  contact: props.labels?.contact ?? '通讯录',
};

const onClick = (tab: TabKey) => {
  emit('update:activeTab', tab);
  emit('change', tab);
};
</script>

<template>
  <div
    class="tab-navigation"
    role="tablist"
    aria-label="聊天视图切换"
  >
    <button
      class="tab-button"
      :class="{ active: activeTab === 'conversation' }"
      role="tab"
      :aria-selected="activeTab === 'conversation'"
      aria-label="切换到会话"
      @click="onClick('conversation')"
    >
      {{ resolvedLabels.conversation }}
    </button>
    <button
      class="tab-button"
      :class="{ active: activeTab === 'contact' }"
      role="tab"
      :aria-selected="activeTab === 'contact'"
      aria-label="切换到通讯录"
      @click="onClick('contact')"
    >
      {{ resolvedLabels.contact }}
    </button>
  </div>
</template>

<style lang="scss" scoped>
@use '../../../../styles/mixins' as mixins;

.tab-navigation {
  display: flex;
  flex-direction: column;
  border-bottom: 1px solid rgba(0, 0, 0, 0.08);
  background: rgba(0, 0, 0, 0.02);

  @include mixins.mobile-only {
    flex-direction: row;
  }
}

.tab-button {
  padding: 12px 16px;
  border: none;
  border-radius: 0;
  background: transparent;
  cursor: pointer;
  font-size: 14px;
  font-weight: 500;
  color: var(--text-color-primary);
  transition: all 0.2s ease;
  outline: none;
  background-color: var(--list-color-default);

  @include mixins.mobile-only {
    flex: 1;
    text-align: center;
  }
}

.tab-button:hover {
  background-color: var(--list-color-hover);
  color: var(--text-color-secondary);
}

.tab-button.active {
  background: var(--list-color-focused);
  color: var(--text-color-link);
}
</style>
