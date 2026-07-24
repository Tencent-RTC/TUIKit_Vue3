<template>
  <div v-if="group?.pending" class="placeholder">
    <h2>{{ group.title }}</h2>
    <p>该分组（<code>{{ group.hook }}</code>）示例规划中，将在后续里程碑补齐。</p>
  </div>
  <div v-else-if="group?.disabledReason" class="placeholder placeholder--disabled">
    <h2>{{ group.title }} · 在当前 SDK 版本不可用</h2>
    <p>
      分组 <code>{{ group.hook }}</code> 的示例工厂在当前激活的 SDK 版本下构造失败。
    </p>
    <p v-if="group.disabledMissingNames?.length">
      <strong>缺失导出</strong>：
      <code v-for="n in group.disabledMissingNames" :key="n" class="placeholder__missing">{{ n }}</code>
    </p>
    <pre class="placeholder__reason">{{ group.disabledReason }}</pre>
    <p>请从右上角 SDK 选择器换到包含上述导出的版本（通常是更新的版本或 workspace 源码）。</p>
  </div>
  <div v-else class="placeholder">
    <h2>{{ t('Placeholder.Title') }}</h2>
    <p>{{ t('Placeholder.Intro') }}</p>
    <p>{{ t('Placeholder.Hint1') }}</p>
    <p>{{ t('Placeholder.Hint2') }}</p>
  </div>
</template>

<script setup lang="ts">
import { useUIKit } from '@tencentcloud/uikit-base-component-vue3';
import type { ExampleGroup } from '../../lib/types';

defineProps<{
  group?: ExampleGroup;
}>();

const { t } = useUIKit();
</script>

<style lang="scss">
.placeholder {
  max-width: 720px;
  padding: 32px;
  color: #6b7280;

  h2 { color: #1f2937; }

  &--disabled {
    h2 { color: #b45309; }

    code {
      padding: 1px 6px;
      font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
      font-size: 12px;
      background: #fef3c7;
      border-radius: 4px;
    }
  }

  &__missing {
    margin-right: 6px;
  }

  &__reason {
    padding: 12px;
    margin: 8px 0;
    font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
    font-size: 12px;
    color: #991b1b;
    background: #fef2f2;
    border: 1px solid #fecaca;
    border-radius: 6px;
    white-space: pre-wrap;
    word-break: break-word;
  }
}
</style>
