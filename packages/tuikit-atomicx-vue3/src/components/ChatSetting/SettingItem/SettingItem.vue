<script lang="ts" setup>
import { ref, nextTick } from 'vue';
import { IconEditNameCard, TUIButton, useUIKit } from '@tencentcloud/uikit-base-component-vue3';

// Base props shared by all types
interface BaseSettingItemProps {
  label: string;
  disabled?: boolean;
}

// Switch type props
interface SwitchSettingItemProps extends BaseSettingItemProps {
  type: 'switch';
  value: boolean;
}

// Input type props
interface InputSettingItemProps extends BaseSettingItemProps {
  type: 'input';
  value?: string;
  placeholder?: string;
  editable?: boolean;
  validator?: (value: string, originalValue?: string) => string | null;
}

// Textarea type props
interface TextareaSettingItemProps extends BaseSettingItemProps {
  type: 'textarea';
  value?: string;
  placeholder?: string;
  editable?: boolean;
  rows?: number;
  validator?: (value: string, originalValue?: string) => string | null;
}

// Display type props (read-only)
interface DisplaySettingItemProps extends BaseSettingItemProps {
  type: 'display';
  value?: string;
  placeholder?: string;
}

// Union type for all setting item props
type SettingItemProps =
  | SwitchSettingItemProps
  | InputSettingItemProps
  | TextareaSettingItemProps
  | DisplaySettingItemProps;

const props = defineProps(['label', 'type', 'value', 'disabled', 'placeholder', 'editable', 'validator', 'rows']);

const emit = defineEmits(['change', 'confirm']);

const SettingItemType = {
  SWITCH: 'switch',
  INPUT: 'input',
  TEXTAREA: 'textarea',
  DISPLAY: 'display',
} as const;

const { t } = useUIKit();

// Edit state management
const isEditing = ref(false);
const editValue = ref('');
const errorMessage = ref<string | null>(null);
const inputRef = ref<HTMLInputElement>();
const textareaRef = ref<HTMLTextAreaElement>();

// Validate input value
function validateValue(value: string) {
  if (props.type === SettingItemType.INPUT || props.type === SettingItemType.TEXTAREA) {
    const { validator } = props as InputSettingItemProps | TextareaSettingItemProps;
    if (validator) {
      return validator(value, props.value);
    }
  }
  return null;
}

// Handle value change with validation
function handleValueChange(event: Event) {
  const target = event.target as HTMLInputElement | HTMLTextAreaElement;
  const newValue = target.value;
  editValue.value = newValue;
  const error = validateValue(newValue);
  errorMessage.value = error;
}

// Start editing
async function startEdit() {
  if (props.disabled || (props.type !== SettingItemType.INPUT && props.type !== SettingItemType.TEXTAREA)) {
    return;
  }

  const currentValue = (props as InputSettingItemProps | TextareaSettingItemProps).value || '';
  editValue.value = currentValue;
  isEditing.value = true;

  await nextTick();

  if (props.type === SettingItemType.INPUT && inputRef.value) {
    inputRef.value.focus();
    inputRef.value.select();
  } else if (props.type === SettingItemType.TEXTAREA && textareaRef.value) {
    textareaRef.value.focus();
    textareaRef.value.select();
  }
}

// Cancel editing
function cancelEdit() {
  isEditing.value = false;
  editValue.value = '';
  errorMessage.value = null;
}

// Confirm editing
function confirmEdit() {
  if (props.type === SettingItemType.INPUT || props.type === SettingItemType.TEXTAREA) {
    if (!errorMessage.value) {
      emit('confirm', editValue.value);
    }
  }
  isEditing.value = false;
  editValue.value = '';
  errorMessage.value = null;
}

// Handle key press
function handleKeyPress(event: KeyboardEvent) {
  if (event.key === 'Enter' && !event.shiftKey && props.type === SettingItemType.INPUT) {
    event.preventDefault();
    if (!errorMessage.value) {
      confirmEdit();
    }
  } else if (event.key === 'Escape') {
    event.preventDefault();
    cancelEdit();
  }
}

// Handle switch change
function handleSwitchChange(event: Event) {
  if (props.type === SettingItemType.SWITCH) {
    const target = event.target as HTMLInputElement;
    emit('change', target.checked);
  }
}
</script>

<template>
  <div
    :class="[
      'setting-item',
      {
        [`setting-item--${type}`]: !!type,
        'setting-item--disabled': disabled,
        'setting-item--editing': isEditing,
        'setting-item--error': !!errorMessage,
      }
    ]"
  >
    <div class="setting-item__label">
      {{ label }}
    </div>
    <div class="setting-item__content-wrapper">
      <!-- Switch type content -->
      <label
        v-if="type === SettingItemType.SWITCH"
        class="setting-item__switch"
      >
        <input
          class="setting-item__switch-input"
          type="checkbox"
          :checked="value"
          :disabled="disabled"
          @change="handleSwitchChange"
        >
        <span class="setting-item__switch-slider" />
      </label>

      <!-- Input type content -->
      <template v-else-if="type === SettingItemType.INPUT">
        <div
          v-if="isEditing && editable"
          class="setting-item__edit-container"
        >
          <div>
            <input
              ref="inputRef"
              :class="[
                'setting-item__input',
                { 'setting-item__input--error': !!errorMessage }
              ]"
              type="text"
              :value="editValue"
              :placeholder="placeholder"
              :disabled="disabled"
              @input="handleValueChange"
              @keydown="handleKeyPress"
            >
            <div
              v-if="errorMessage"
              class="setting-item__error"
            >
              {{ errorMessage }}
            </div>
          </div>
          <div class="setting-item__actions">
            <TUIButton
              class="setting-item__btn--cancel"
              color="gray"
              radius="rect"
              :disabled="disabled"
              @click="cancelEdit"
            >
              {{ t('ChatSetting.cancel') }}
            </TUIButton>
            <TUIButton
              class="setting-item__btn--confirm"
              color="blue"
              radius="rect"
              :disabled="disabled || !!errorMessage || props.value === editValue"
              @click="confirmEdit"
            >
              {{ t('ChatSetting.confirm') }}
            </TUIButton>
          </div>
        </div>
        <div
          v-else
          class="setting-item__content"
        >
          <span class="setting-item__value">
            {{ value || placeholder || t('ChatSetting.not_set') }}
          </span>
          <IconEditNameCard
            v-if="editable"
            class="setting-item__edit-btn unique-icon-btn"
            :style="{ cursor: disabled ? 'not-allowed' : 'pointer' }"
            @click="startEdit"
          />
        </div>
      </template>

      <!-- Textarea type content -->
      <template v-else-if="type === SettingItemType.TEXTAREA">
        <div
          v-if="isEditing && editable"
          class="setting-item__edit-container"
        >
          <div>
            <textarea
              ref="textareaRef"
              :class="[
                'setting-item__textarea',
                { 'setting-item__textarea--error': !!errorMessage }
              ]"
              :value="editValue"
              :rows="rows || 3"
              :placeholder="placeholder"
              :disabled="disabled"
              @input="handleValueChange"
              @keydown="handleKeyPress"
            />
            <div
              v-if="errorMessage"
              class="setting-item__error"
            >
              {{ errorMessage }}
            </div>
          </div>
          <div class="setting-item__actions">
            <TUIButton
              class="setting-item__btn--cancel"
              color="gray"
              radius="rect"
              :disabled="disabled"
              @click="cancelEdit"
            >
              {{ t('ChatSetting.cancel') }}
            </TUIButton>
            <TUIButton
              class="setting-item__btn--confirm"
              color="blue"
              radius="rect"
              :disabled="disabled || !!errorMessage || props.value === editValue"
              @click="confirmEdit"
            >
              {{ t('ChatSetting.confirm') }}
            </TUIButton>
          </div>
        </div>
        <div
          v-else
          class="setting-item__content"
        >
          <span class="setting-item__value">
            {{ value || placeholder || t('ChatSetting.not_set') }}
          </span>
          <IconEditNameCard
            v-if="editable"
            class="setting-item__edit-btn unique-icon-btn"
            :style="{ cursor: disabled ? 'not-allowed' : 'pointer' }"
            @click="startEdit"
          />
        </div>
      </template>

      <!-- Display type content -->
      <span
        v-else-if="type === SettingItemType.DISPLAY"
        class="setting-item__value"
      >
        {{ value || placeholder || t('ChatSetting.not_set') }}
      </span>
    </div>
  </div>
</template>

<style lang="scss" scoped>
.setting-item {
  display: flex;
  flex: 1;
  flex-direction: column;
  padding: 10px 0;
  color: var(--text-color-primary);
  border-bottom: 0.5px solid var(--stroke-color-module);
  gap: 8px;

  &:last-child {
    border-bottom: none;
  }

  &--disabled {
    color: var(--text-color-disabled);

    pointer-events: none;

    .setting-item__switch-slider {
      background-color: var(--fill-color-disabled);
    }
  }

  &--switch {
    gap: 16px;
    flex-direction: row;
    justify-content: space-between;
  }

  &__label {
    font-size: 14px;
    font-weight: 500;
    color: var(--text-color-primary);
  }

  &__content-wrapper {
    display: flex;
    align-items: center;
    justify-content: space-between;
    min-height: 24px;
  }

  &__content {
    display: flex;
    align-items: center;
    justify-content: space-between;
    flex: 1;
    gap: 8px;
  }

  &__value {
    flex: 1;
    font-size: 14px;
    word-break: break-word;

    color: var(--text-color-secondary);
  }

  &__placeholder {
    color: var(--text-color-placeholder);
  }

  // Switch styles
  &__switch {
    position: relative;
    display: inline-block;
    width: 40px;
    height: 20px;
    cursor: pointer;
  }

  &__switch-input {
    opacity: 0;
    width: 0;
    height: 0;

    &:checked + .setting-item__switch-slider {
      background-color: var(--switch-color-on);

      &:before {
        transform: translateX(20px);
      }
    }

    &:disabled + .setting-item__switch-slider {
      cursor: not-allowed;

      background-color: var(--fill-color-disabled);
    }
  }

  &__switch-slider {
    position: absolute;
    cursor: pointer;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    border-radius: 20px;
    transition: 0.2s;

    background-color: var(--switch-color-off);

    &:before {
      position: absolute;
      content: "";
      height: 16px;
      width: 16px;
      left: 2px;
      bottom: 2px;
      border-radius: 50%;
      transition: 0.2s;

      background-color: white;
    }
  }

  // Edit container styles
  &__edit-container {
    display: flex;
    flex-direction: column;
    gap: 12px;
    width: 100%;
  }

  &__input,
  &__textarea {
    width: 100%;
    padding: 8px 12px;
    border-radius: 4px;
    font-size: 14px;
    transition: border-color 0.2s;

    background-color: var(--fill-color-primary);
    border: 1px solid var(--stroke-color-module);
    color: var(--text-color-primary);

    &:focus {
      outline: none;

      border-color: var(--primary-color);
    }

    &::placeholder {
      color: var(--text-color-placeholder);
    }

    &--error {
      border-color: var(--error-color);
    }
  }

  &__textarea {
    resize: vertical;
    min-height: 60px;
  }

  &__error {
    font-size: 12px;
    margin-top: 4px;

    color: var(--error-color);
  }

  &__actions {
    display: flex;
    gap: 8px;
    justify-content: flex-end;
  }

  &__btn--cancel,
  &__btn--confirm {
    min-width: 60px;
    height: 32px;
    font-size: 12px;
  }
}
</style>

<style lang="scss">
.unique-icon-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 4px;
  width: 24px;
  height: 24px;
  cursor: pointer;
  border-radius: 6px;
  transition: all 0.2s ease;
  flex-shrink: 0;

  color: var(--text-color-secondary);
  &:hover {
    color: var(--text-color-button);
    background-color: var(--button-color-primary-hover);
  }
  &:active {
    background-color: var(--button-color-primary-active);
  }
}
</style>
