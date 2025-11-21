<template>
  <TUIDialog
    :visible="true"
    :title="t('Rename')"
    :confirmText="t('保存为新名称')"
    @confirm="handleRename"
    @close="closeMaterialRenameDialog"
    @cancel="closeMaterialRenameDialog"
    :customClasses="['material-rename-dialog']"
  >
    <TUIInput v-model="materialName" />
  </TUIDialog>
</template>

<script lang="ts" setup>
import { TUIDialog, TUIInput, useUIKit } from '@tencentcloud/uikit-base-component-vue3';
import { MediaSource } from '../../types';
import { ref } from 'vue';

const { t } = useUIKit();

const props = defineProps<{
  material: MediaSource;
}>();

const materialName = ref(props.material.name);
const emits = defineEmits(['close', 'rename']);

const handleRename = () => {
  emits('rename', materialName.value);
};

const closeMaterialRenameDialog = () => {
  emits('close');
};
</script>

<style lang="scss" scoped></style>
