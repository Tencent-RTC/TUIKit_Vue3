<template>
  <TUIDialog
    v-model:visible="dialogVisible"
    :title="t('Anchor battle settings')"
    :custom-classes="['co-host-dialog']"
    @cancel="cancel"
    @confirm="confirm"
  >
    <div class="setting-panel">
      <div class="setting-item">
        <div class="setting-item-label">
          {{ t('Connection Layout') }}
        </div>
        <div class="template-options">
          <div class="options-grid">
            <template
              v-for="template in layoutOptions"
              :key="template.id"
            >
              <div
                class="option-card"
                :class="{ active: templateForm.coHostLayoutTemplate === template.templateId }"
                @click="selectTemplate(template.templateId)"
              >
                <div class="option-info">
                  <component
                    :is="template.icon"
                    v-if="template.icon"
                    class="option-icon"
                  />
                  <h4>{{ template.label }}</h4>
                </div>
              </div>
            </template>
          </div>
        </div>
      </div>
      <div class="setting-item">
        <div class="setting-item-label">
          {{ t('Battle duration') }}
        </div>
        <div class="setting-item-value">
          <div class="layout-template-options">
            <template v-for="item in minutes" :key="item">
              <label
                class="layout-template-option"
              >
                <input
                  :value="item.value"
                  type="radio"
                  name="coHostLayoutTemplate"
                  class="layout-template-radio"
                  :checked="item.value === form.battleDuration"
                  @input="handleDurationChange"
                >
                <span class="layout-template-label">{{ item.label }}</span>
              </label>
            </template>
          </div>
        </div>
      </div>
    </div>
  </TUIDialog>
</template>

<script setup lang="ts">
import { defineProps, defineEmits, ref, watch, computed } from 'vue';
import { useUIKit, TUIDialog, IconDynamic1v6Layout, IconDynamicGridLayout } from '@tencentcloud/uikit-base-component-vue3';
import { CoHostLayoutTemplate } from '../../types';

const { t } = useUIKit();
const props = defineProps<{
  visible: boolean;
  form: {
    coHostLayoutTemplate: CoHostLayoutTemplate;
    battleDuration: number;
  };
}>();
const emit = defineEmits(['update:visible', 'cancel', 'confirm']);

const dialogVisible = ref(props.visible);
const minutes = [
  { label: t('Number minutes', { number: 1 }), value: 1 * 60 },
  { label: t('Number minutes', { number: 2 }), value: 2 * 60 },
  { label: t('Number minutes', { number: 3 }), value: 3 * 60 },
  { label: t('Number minutes', { number: 5 }), value: 5 * 60 },
];

const templateForm = ref({
  coHostLayoutTemplate: props.form.coHostLayoutTemplate,
  battleDuration: props.form.battleDuration,
});

function selectTemplate(template: CoHostLayoutTemplate) {
  templateForm.value.coHostLayoutTemplate = template;
}

const cancel = () => {
  emit('update:visible', false);
  emit('cancel');
};

const confirm = () => {
  emit('update:visible', false);
  emit('confirm', { ...templateForm.value });
};

const handleDurationChange = (event: any) => {
  templateForm.value.battleDuration = Number(event.target.value);
};

watch(() => props.visible, (newVal) => {
  dialogVisible.value = newVal;
});
watch(dialogVisible, (newVal) => {
  emit('update:visible', newVal);
});

const layoutOptions = computed(() => [
  {
    id: 'PortraitDynamic_Grid9',
    icon: IconDynamicGridLayout,
    templateId: CoHostLayoutTemplate.HostDynamicGrid,
    label: t('Dynamic Grid9 Layout'),
  },
]);
</script>

<style lang="scss" scoped>
.setting-panel {
  .setting-item {
    display: flex;
    align-items: center;
    flex-direction: column;
    justify-content: flex-start;
    gap: 6px;
    margin-bottom: 20px;
    .setting-item-label {
      width: 100%;
      color: var(--text-color-secondary);
      font-size: 14px;
      font-weight: 400;
      line-height: 24px;
    }
    .setting-item-value {
      display: flex;
      width: 100%;
    }
  }
}

.template-options {
  width: 100%;
  height: 100%;
  overflow: auto;

  .options-grid {
    display: flex;
    flex-wrap: wrap;
    gap: 16px;
    justify-content: flex-start;

    .option-card {
      box-sizing: border-box;
      padding: 12px 13px;
      width: 208px;
      background: #3a3a3a;
      border: 2px solid transparent;
      border-radius: 12px;
      cursor: pointer;
      transition: all 0.2s ease;
      text-align: center;

      &:hover {
        background: #4a4a4a;
        border-color: #5a5a5a;
      }

      &.active {
        border: 2px solid var(--text-color-link-hover, #2B6AD6);
        background: var(--list-color-focused, #243047);

        .option-info h4 {
          color: #ffffff;
        }
      }

      .option-info {
        display: flex;
        align-items: center;
        justify-content: flex-start;
        gap: 8px;
        .option-icon {
          width: 24px;
          height: 24px;
        }
        h4 {
          margin: 0;
          font-size: 14px;
          font-weight: 600;
          color: #ffffff;
          transition: color 0.2s ease;
        }
      }
    }
  }
}

.layout-template-options {
  display: flex;
  flex-direction: row;
  gap: 24px;
}

.layout-template-option {
  display: flex;
  align-items: center;
  border: 2px solid var(--border-color);
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s ease;
  background: var(--background-color-primary);
  gap: 8px;

  &:hover {
    border-color: var(--primary-color);
    background: var(--background-color-hover);
  }

  &.active {
    border-color: var(--primary-color);
    background: var(--primary-color-light);

    .layout-template-label {
      color: var(--primary-color);
      font-weight: 600;
    }

    .layout-template-count {
      color: var(--primary-color);
    }
  }
}
.layout-template-radio {
  width: 18px;
  height: 18px;
  margin: 0;
  accent-color: var(--primary-color);
  cursor: pointer;
}
.layout-template-label {
  flex: 1;
  font-size: 14px;
  color: var(--text-color-primary);
  font-weight: 500;
  cursor: pointer;
}
</style>
